"""Logique métier de À table."""

from __future__ import annotations

import json
import logging
import re
from datetime import datetime, timedelta
from typing import Any
from uuid import uuid4

from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.util import dt as dt_util

from .const import PLACEMENTS, STATUS_ACTIVE, STATUS_COOKED
from .store import ATableStore

logger = logging.getLogger(__name__)

DEFAULT_AI_TASK_ENTITY_ID = "ai_task.google_ai_task"

RECIPE_QUALITY_GUIDELINES = (
    "EXIGENCES DE QUALITÉ :\n"
    "- Le titre doit être descriptif et citer les ingrédients ou la technique principale "
    "(ex. \"Curry de pois chiches, courgettes et tomates au riz\"), jamais un titre vague "
    "comme \"Plat du mardi\" ou \"Recette rapide\".\n"
    "- Les étapes doivent être suffisamment détaillées (temps de cuisson, quantités, "
    "températures quand pertinent) pour qu'un débutant puisse suivre sans ambiguïté : "
    "au moins 4 à 6 étapes selon la complexité du plat, jamais une seule phrase vague."
)

# Miroir exact de OBJECTIVE_OPTIONS dans frontend/a-table.js — garder synchronisé.
OBJECTIVE_LABELS = {
    "reduce_mental_load": "Diminuer la charge mentale",
    "eat_balanced": "Manger plus équilibré",
    "eat_seasonal": "Manger de saison",
    "discover_new_recipes": "Découvrir de nouvelles recettes",
    "eat_less_meat": "Manger moins de viande",
    "reduce_grocery_budget": "Réduire le budget des courses",
    "reduce_food_waste": "Réduire le gaspillage alimentaire",
    "quick_meals": "Préparer des repas rapides",
    "reduce_ultra_processed": "Réduire les aliments ultra-transformés",
}

# Miroir exact de APPETITE_MULTIPLIERS dans frontend/a-table.js — garder synchronisé.
APPETITE_MULTIPLIERS = {"low": 0.8, "normal": 1.0, "high": 1.25}


class ATableCoordinator:
    """Centralise les opérations sur recettes, planning et historique."""

    def __init__(self, hass: HomeAssistant, store: ATableStore) -> None:
        """Initialise le coordinateur."""
        self.hass = hass
        self.store = store

    def get_data(self) -> dict[str, Any]:
        """Retourne les données de l'application."""
        return self.store.data

    def _ai_task_entity_id(self, prefs: dict[str, Any]) -> str:
        """Retourne l'entité ai_task configurée, ou la valeur par défaut."""
        return prefs.get("ai_task_entity_id") or DEFAULT_AI_TASK_ENTITY_ID

    def _stove_level_instruction(self, prefs: dict[str, Any]) -> str:
        """Retourne une consigne sur les niveaux de la plaque de cuisson, si configurés."""
        levels = prefs.get("stove_levels")
        if not levels:
            return ""
        return (
            f"\n- Plaque de cuisson : {levels} niveaux de puissance. Pour toute étape "
            f"utilisant la plaque de cuisson, précise le niveau à utiliser (1 à {levels}), "
            f"ex. \"Faites revenir à feu vif — niveau {levels}/{levels}\"."
        )

    def _match_temp_ingredient_ids(
        self,
        ingredients: list[dict[str, Any]],
        temp_ings: list[dict[str, Any]],
    ) -> set[str]:
        """Retourne les identifiants d'aliments temporaires utilisés par ces ingrédients."""
        ing_names = {(i.get("name", "") or "").lower() for i in ingredients if isinstance(i, dict)}
        matched = set()
        for t in temp_ings:
            t_name = (t.get("name", "") or "").lower()
            if t_name and any(t_name in n for n in ing_names):
                matched.add(t.get("id"))
        return matched

    async def async_add_recipe(
        self,
        title: str,
        servings: int = 2,
        cooking_minutes: int | None = None,
        tags: list[str] | None = None,
        ingredients: list[dict[str, Any]] | None = None,
        steps: list[str] | None = None,
        notes: str = "",
        nutrition: dict[str, Any] | None = None,
        price_per_serving: float | None = None,
    ) -> dict[str, Any]:
        """Ajoute une recette (saisie manuelle, minimale ou complète) et une carte dans À cuisiner."""
        now = dt_util.now().isoformat()
        recipe_id = f"recipe_{uuid4().hex}"
        meal_card_id = f"meal_{uuid4().hex}"

        recipe = {
            "id": recipe_id,
            "title": title.strip(),
            "source": {"kind": "personal_manual"},
            "is_favorite": False,
            "is_archived": False,
            "servings": servings,
            "cooking_minutes": cooking_minutes,
            "tags": tags or [],
            "ingredients": ingredients or [],
            "steps": steps or [],
            "notes": notes,
            "nutrition": nutrition or {},
            "image_url": None,
            "image_alt": "",
            "image_status": "missing",
            "image_reference": None,
            "price_per_serving": price_per_serving,
            "last_cooked_at": None,
            "times_cooked": 0,
            "ratings": [],
            "created_at": now,
            "updated_at": now,
        }

        meal_card = {
            "id": meal_card_id,
            "recipe_id": recipe_id,
            "status": STATUS_ACTIVE,
            "placement": "backlog",
            "position": self._next_position("backlog"),
            "servings": servings,
            "created_at": now,
            "updated_at": now,
        }

        self.store.data["recipes"][recipe_id] = recipe
        self.store.data["meal_cards"][meal_card_id] = meal_card
        await self.store.async_save()

        return meal_card

    async def async_move_meal_card(
        self,
        meal_card_id: str,
        placement: str,
        position: int | None = None,
    ) -> dict[str, Any]:
        """Déplace une carte vers la réserve ou un jour."""
        if placement not in PLACEMENTS:
            raise ValueError(f"Placement invalide : {placement}")

        card = self.store.data["meal_cards"].get(meal_card_id)
        if card is None:
            raise ValueError("Carte repas introuvable")

        if card["status"] != STATUS_ACTIVE:
            raise ValueError("Seule une carte active peut être déplacée")

        card["placement"] = placement
        card["position"] = (
            position if position is not None else self._next_position(placement)
        )
        card["updated_at"] = dt_util.now().isoformat()

        await self.store.async_save()
        return card

    async def async_cook_meal_card(self, meal_card_id: str) -> dict[str, Any]:
        """Marque une carte comme cuisinée et ajoute l'historique."""
        card = self.store.data["meal_cards"].get(meal_card_id)
        if card is None:
            raise ValueError("Carte repas introuvable")

        if card["status"] != STATUS_ACTIVE:
            raise ValueError("Cette carte n'est plus active")

        recipe = self.store.data["recipes"].get(card["recipe_id"])
        if recipe is None:
            raise ValueError("Recette introuvable")

        cooked_at = dt_util.now().isoformat()
        card["status"] = STATUS_COOKED
        card["updated_at"] = cooked_at

        recipe["last_cooked_at"] = cooked_at
        recipe["times_cooked"] += 1
        recipe["updated_at"] = cooked_at

        history_item = {
            "id": f"history_{uuid4().hex}",
            "meal_card_id": meal_card_id,
            "recipe_id": card["recipe_id"],
            "cooked_at": cooked_at,
            "servings": card["servings"],
        }
        self.store.data["history"].append(history_item)

        await self.store.async_save()
        return history_item

    async def async_generate_draft(
        self,
        count: int = 6,
    ) -> dict[str, Any]:
        """Génère un brouillon de propositions de repas via ai_task."""
        prefs = self.store.data.get("preferences", {})
        rules = self.store.data.get("generation_rules", {})
        temp_ings = self.store.data.get("temporary_ingredients", [])
        recipes = self.store.data.get("recipes", {})
        history = self.store.data.get("history", [])

        count = min(count, 7)  # max 7

        context = self._build_prompt_context(count, prefs, rules, temp_ings, recipes, history)

        instructions = (
            "Tu es un assistant de planification de repas. "
            "Propose des recettes réalistes, appétissantes, cohérentes et adaptées au foyer. "
            "Écris de manière naturelle, comme un vrai humain qui cuisine.\n\n"
            "CONTEXTE UTILISATEUR (à respecter strictement) :\n"
            f"{context}\n\n"
            f"{RECIPE_QUALITY_GUIDELINES}\n\n"
            "RÉSULTAT ATTENDU :\n"
            "Retourne UNIQUEMENT un JSON valide, sans texte avant ni après, exactement au format :\n"
            "{\n"
            '  "proposals": [\n'
            "    {\n"
            '      "title": "Nom du plat",\n'
            '      "servings": 2,\n'
            '      "cooking_minutes": 25,\n'
            '      "ingredients": [\n'
            '        {"name": "pâtes", "quantity": 200, "unit": "g"}\n'
            "      ],\n"
            '      "steps": ["Étape 1...", "Étape 2..."],\n'
            '      "notes": "...",\n'
            '      "nutrition": {\n'
            '        "kcal": 420,\n'
            '        "protein_g": 12,\n'
            '        "carb_g": 55,\n'
            '        "fat_g": 14,\n'
            '        "fiber_g": 8\n'
            "      },\n"
            '      "tags": ["rapide", "végétarien"],\n'
            '      "price_per_serving": 3.5\n'
            "    }\n"
            "  ]\n"
            "}\n\n"
            f"Propose {count} idées de repas conformes au contexte ci-dessus."
        )

        response = await self.hass.services.async_call(
            "ai_task",
            "generate_data",
            {
                "task_name": "Génération de propositions de repas",
                "entity_id": self._ai_task_entity_id(prefs),
                "instructions": instructions,
            },
            blocking=True,
            return_response=True,
        )

        response_text = response.get("data") or response.get("response") or response.get("result") or ""

        logger.info(f"Réponse brute de Gemini : {response_text[:1000]}")

        json_match = re.search(r"\{[\s\S]*\}", response_text)
        if json_match:
            response_text = json_match.group(0)

        try:
            parsed = json.loads(response_text)
            proposals = parsed.get("proposals", [])
        except Exception as e:
            logger.error(f"Erreur de parsing JSON : {e}")
            proposals = []

        pexels_key = prefs.get("pexels_api_key")
        if pexels_key:
            for proposal in proposals:
                try:
                    proposal["image_url"] = await self._pexels_search_image(proposal.get("title", ""), pexels_key)
                    proposal["image_status"] = "found"
                except Exception as e:
                    logger.debug(f"Illustration ignorée pour '{proposal.get('title', '')}' : {e}")

        draft_id = f"draft_{datetime.now().strftime('%Y-%m-%d_%H-%M')}_{uuid4().hex[:8]}"
        draft = {
            "created_at": dt_util.now().isoformat(),
            "proposals": proposals,
        }

        self.store.data["drafts"][draft_id] = draft
        await self.store.async_save()

        return {"draft_id": draft_id}

    async def async_analyze_tastes(self) -> dict[str, Any]:
        """Analyse l'historique récent via l'IA pour suggérer des goûts, sans rien enregistrer."""
        prefs = self.store.data.get("preferences", {})
        recipes = self.store.data.get("recipes", {})
        history = self.store.data.get("history", [])

        history_days = prefs.get("history_days_for_generation", 20)
        cutoff = (dt_util.now() - timedelta(days=history_days)).isoformat()
        recent_history = [h for h in history if h.get("cooked_at", "") >= cutoff]

        if not recent_history:
            return {"liked_suggestions": [], "disliked_suggestions": []}

        lines = []
        for h in recent_history[-30:]:
            recipe = recipes.get(h.get("recipe_id", ""), {})
            title = recipe.get("title", "")
            if not title:
                continue
            entry = f"- {title}"
            for rating in recipe.get("ratings", [])[-1:]:
                entry += " (aimé)" if rating.get("liked") else " (pas aimé)"
                if rating.get("comment"):
                    entry += f" : {rating['comment']}"
            lines.append(entry)

        if not lines:
            return {"liked_suggestions": [], "disliked_suggestions": []}

        liked_existing = set(x.lower() for x in prefs.get("liked_ingredients", []))
        disliked_existing = set(x.lower() for x in prefs.get("disliked_ingredients", []))

        instructions = (
            "Tu analyses les habitudes culinaires récentes d'un foyer à partir de la liste de repas "
            "cuisinés ci-dessous (avec avis 👍/👎 et commentaires quand disponibles).\n\n"
            "REPAS RÉCENTS :\n" + "\n".join(lines) + "\n\n"
            "Déduis des tendances de goûts explicites (ingrédients, styles de cuisine, méthodes de "
            "cuisson) — pas des titres de plats complets, des éléments réutilisables comme "
            "\"gingembre\", \"cuisine méditerranéenne\", \"plats mijotés\".\n\n"
            "Retourne UNIQUEMENT un JSON valide, sans texte avant ni après, au format :\n"
            "{\n"
            '  "liked_suggestions": ["ingrédient ou style apprécié", "..."],\n'
            '  "disliked_suggestions": ["ingrédient ou style à éviter", "..."]\n'
            "}\n\n"
            "Maximum 5 éléments par liste. Si aucune tendance claire ne se dégage, renvoie des listes vides."
        )

        response = await self.hass.services.async_call(
            "ai_task",
            "generate_data",
            {
                "task_name": "Analyse des habitudes culinaires",
                "entity_id": self._ai_task_entity_id(prefs),
                "instructions": instructions,
            },
            blocking=True,
            return_response=True,
        )

        response_text = response.get("data") or response.get("response") or response.get("result") or ""

        json_match = re.search(r"\{[\s\S]*\}", response_text)
        if json_match:
            response_text = json_match.group(0)

        try:
            parsed = json.loads(response_text)
            liked_suggestions = [s for s in parsed.get("liked_suggestions", []) if isinstance(s, str)]
            disliked_suggestions = [s for s in parsed.get("disliked_suggestions", []) if isinstance(s, str)]
        except Exception as e:
            logger.error(f"Erreur de parsing JSON (analyse des goûts) : {e}")
            liked_suggestions = []
            disliked_suggestions = []

        liked_suggestions = [s for s in liked_suggestions if s.lower() not in liked_existing][:5]
        disliked_suggestions = [s for s in disliked_suggestions if s.lower() not in disliked_existing][:5]

        return {"liked_suggestions": liked_suggestions, "disliked_suggestions": disliked_suggestions}

    def _build_prompt_context(
        self,
        count: int,
        prefs: dict[str, Any],
        rules: dict[str, Any],
        temp_ings: list[dict[str, Any]],
        recipes: dict[str, Any],
        history: list[dict[str, Any]],
    ) -> str:
        """Construit le contexte structuré à envoyer à l'IA."""
        lines = []

        lines.append(f"- Nous sommes le {dt_util.now().strftime('%d/%m/%Y')}.")

        servings = prefs.get("default_servings", 2)
        appetite = prefs.get("appetite", "normal")
        appetite_multiplier = APPETITE_MULTIPLIERS.get(appetite, 1.0)
        lines.append(
            f"- Foyer : {servings} personnes, appétit {appetite} (facteur ×{appetite_multiplier} "
            "sur les quantités par rapport à un appétit normal) — calcule les quantités "
            "d'ingrédients en conséquence."
        )

        diets = prefs.get("diets", [])
        if "other" in diets:
            diet_other = prefs.get("diet_other_text", "")
            lines.append(f"- Régimes : {', '.join(diets)} (autre : {diet_other}).")
        else:
            lines.append(f"- Régimes : {', '.join(diets) if diets else 'aucun'}.")

        allergies = prefs.get("allergies", [])
        if "other" in allergies:
            allergy_other = prefs.get("allergies_other_text", "")
            lines.append(f"- Allergies/intolérances : {', '.join(allergies)} (autre : {allergy_other}).")
        else:
            lines.append(f"- Allergies/intolérances : {', '.join(allergies) if allergies else 'aucune'}.")

        liked = prefs.get("liked_ingredients", [])
        disliked = prefs.get("disliked_ingredients", [])
        if liked or disliked:
            lines.append(f"- Goûts : adore {', '.join(liked) if liked else 'rien de spécifique'}; n'aime pas {', '.join(disliked) if disliked else 'rien de spécifique'}.")

        available = prefs.get("available_equipment", [])
        preferred = prefs.get("preferred_equipment")
        lines.append(f"- Équipements disponibles : {', '.join(available) if available else 'non spécifiés'}.")
        if preferred:
            lines.append(f"- Équipement à privilégier : {preferred}.")

        objectives = prefs.get("objectives", [])
        objective_labels = [OBJECTIVE_LABELS.get(o, o) for o in objectives]
        lines.append(f"- Objectifs : {', '.join(objective_labels) if objective_labels else 'aucun objectif spécifique'}.")
        if "eat_seasonal" in objectives:
            lines.append(
                "- Précision sur \"Manger de saison\" : cela concerne les fruits et légumes de "
                "saison, pas l'exclusion de plats conviviaux comme la raclette, le couscous ou "
                "le croque-monsieur, qui restent bienvenus toute l'année."
            )

        budget = prefs.get("budget_per_serving")
        grocery = prefs.get("grocery_store", "")
        budget_str = f"{budget} €" if budget is not None else "non spécifié"
        if grocery:
            budget_str += f" (courses : {grocery})"
        lines.append(f"- Budget par portion : {budget_str}.")

        time_profile = prefs.get("time_profile", "normal")
        if time_profile == "quick":
            time_str = "max 20 min"
        elif time_profile == "chill":
            time_str = "plus de 60 min"
        else:
            time_str = "max 60 min"
        lines.append(f"- Temps de cuisson : {time_str}.")

        complexity = prefs.get("complexity", "free")
        lines.append(f"- Complexité : {complexity}.")

        macros = prefs.get("macro_ratios", {})
        p = macros.get("protein_pct", 30)
        c = macros.get("carb_pct", 45)
        f = macros.get("fat_pct", 25)
        lines.append(f"- Répartition cible : {p}% protéines, {c}% glucides, {f}% lipides.")

        target_kcal = prefs.get("target_kcal_per_serving")
        if target_kcal:
            lines.append(f"- Objectif calorique par portion : {target_kcal} kcal (à respecter approximativement, ±10%).")

        if temp_ings:
            temp_lines = []
            for ing in temp_ings:
                note = ing.get("note", "")
                date = ing.get("date_limit", "")
                extra = f" ({note})" if note else ""
                date_extra = f" à utiliser avant {date}" if date else ""
                temp_lines.append(f"- {ing.get('quantity', '')} {ing.get('unit', '')} {ing.get('name', '')}{extra}{date_extra}")
            lines.append("- Aliments à utiliser en priorité :\n" + "\n".join(temp_lines))
            lines.append(f"- Au moins 1 recette doit utiliser ces aliments.")
        else:
            lines.append("- Aucun aliment temporaire à utiliser en priorité.")

        history_days = prefs.get("history_days_for_generation", 20)
        cutoff = (dt_util.now() - timedelta(days=history_days)).isoformat()
        recent_history = [h for h in history if h.get("cooked_at", "") >= cutoff]
        if recent_history:
            hist_lines = []
            for h in recent_history[-15:]:
                recipe = recipes.get(h.get("recipe_id", ""), {})
                title = recipe.get("title", "Recette inconnue")
                date = h.get("cooked_at", "")[:10]
                hist_lines.append(f"- {date} : {title}")
            lines.append(f"- Historique récent :\n" + "\n".join(hist_lines))
        else:
            lines.append("- Historique récent : aucun repas cuisiné sur cette période.")

        favorite_titles = [r.get("title", "") for r in recipes.values() if r.get("is_favorite") and r.get("title")]
        liked_ratings = []
        disliked_ratings = []
        for r in recipes.values():
            title = r.get("title", "")
            if not title:
                continue
            for rating in r.get("ratings", [])[-3:]:
                if rating.get("liked"):
                    liked_ratings.append(title)
                else:
                    disliked_ratings.append(title)
        if favorite_titles or liked_ratings or disliked_ratings:
            fav_lines = []
            if favorite_titles:
                fav_lines.append("- Recettes favorites : " + ", ".join(sorted(set(favorite_titles))[:15]) + ".")
            if liked_ratings:
                fav_lines.append("- Recettes appréciées (👍), à pouvoir refaire occasionnellement : " + ", ".join(sorted(set(liked_ratings))[:15]) + ".")
            if disliked_ratings:
                fav_lines.append("- Recettes à éviter (👎) : " + ", ".join(sorted(set(disliked_ratings))[:15]) + ".")
            lines.append("- Favoris et retours :\n" + "\n".join(fav_lines))

        if prefs.get("include_personal_recipes_in_context", True):
            titles = [r.get("title", "") for r in recipes.values() if r.get("title")]
            if titles:
                lines.append(f"- Bibliothèque personnelle (titres) :\n" + "\n".join(f"- {t}" for t in titles[:60]))
            else:
                lines.append("- Bibliothèque personnelle : aucune recette enregistrée.")
        else:
            lines.append("- Bibliothèque personnelle : non incluse dans le contexte.")

        sources = prefs.get("recipe_sources", {})
        if sources.get("enabled", True):
            domains = sources.get("allowed_domains", [])
            use_insp = sources.get("use_as_inspiration", True)
            lines.append(f"- Sources culinaires autorisées : {', '.join(domains) if domains else 'aucune'}.")
            lines.append(f"- Utiliser comme inspiration : {use_insp}.")
        else:
            lines.append("- Sources culinaires : désactivées.")

        custom = prefs.get("custom_context", "")
        if custom:
            lines.append(f"- Autre consigne utilisateur : {custom}.")

        max_fav = rules.get("max_favorites", 2)
        max_rec = rules.get("max_recurrence", 1)
        min_new_pct = rules.get("min_new_recipes_pct", 90)
        max_protein = rules.get("max_repeat_protein", 2)
        max_starch = rules.get("max_repeat_starch", 2)
        max_vegetable = rules.get("max_repeat_vegetable", 2)

        stove_note = self._stove_level_instruction(prefs)
        if stove_note:
            lines.append(stove_note.lstrip("\n"))

        lines.append(
            "- QUOTAS DE DIVERSITÉ À RESPECTER STRICTEMENT :\n"
            f"- Au maximum {max_fav} proposition(s) parmi les recettes favorites ou évaluées positivement (👍) ci-dessus.\n"
            f"- Au maximum {max_rec} répétition(s) d'un plat identique ou très similaire à l'historique récent.\n"
            f"- Au moins {min_new_pct}% des propositions doivent être de nouvelles recettes, absentes de la bibliothèque personnelle listée ci-dessus.\n"
            f"- Au maximum {max_protein} proposition(s) partageant la même protéine principale (ex. poulet, boeuf, tofu).\n"
            f"- Au maximum {max_starch} proposition(s) partageant le même féculent principal (ex. riz, pâtes, pommes de terre).\n"
            f"- Au maximum {max_vegetable} proposition(s) partageant le même légume principal."
        )

        return "\n".join(lines)

    async def async_validate_draft(
        self,
        draft_id: str,
        selected_indices: list[int] | None = None,
        modifications: dict[str, Any] | None = None,
        discard: bool = False,
    ) -> dict[str, Any]:
        """Valide un brouillon ou le supprime si discard=True."""
        modifications = modifications or {}

        drafts = self.store.data.get("drafts", {})
        if draft_id not in drafts:
            raise ValueError(f"Brouillon {draft_id} introuvable")

        if discard:
            drafts.pop(draft_id, None)
            await self.store.async_save()
            return {"discarded": True}

        draft = drafts[draft_id]
        proposals = draft.get("proposals", [])

        if selected_indices is None:
            selected_indices = list(range(len(proposals)))

        recipes = self.store.data["recipes"]
        meal_cards = self.store.data["meal_cards"]
        temp_ings = self.store.data.get("temporary_ingredients", [])

        new_recipe_ids = []
        new_card_ids = []
        used_temp_names = set()

        for idx in selected_indices:
            if idx < 0 or idx >= len(proposals):
                continue

            proposal = proposals[idx]
            mod = modifications.get(str(idx), {})

            recipe_id = f"recipe_{uuid4().hex}"
            title = mod.get("title", proposal.get("title", "Recette sans titre"))

            ingredients = mod.get("ingredients", proposal.get("ingredients", []))
            used_temp_names |= self._match_temp_ingredient_ids(ingredients, temp_ings)

            recipe = {
                "id": recipe_id,
                "title": title,
                "servings": mod.get("servings", proposal.get("servings", 2)),
                "cooking_minutes": mod.get("cooking_minutes", proposal.get("cooking_minutes", 30)),
                "ingredients": ingredients,
                "steps": mod.get("steps", proposal.get("steps", [])),
                "notes": mod.get("notes", proposal.get("notes", "")),
                "nutrition": mod.get("nutrition", proposal.get("nutrition", {})),
                "tags": mod.get("tags", proposal.get("tags", [])),
                "source": {"kind": "ai_generated"},
                "is_favorite": False,
                "is_archived": False,
                "image_url": None,
                "image_alt": "",
                "image_status": "missing",
                "image_reference": None,
                "price_per_serving": proposal.get("price_per_serving"),
                "last_cooked_at": None,
                "times_cooked": 0,
                "ratings": [],
                "created_at": dt_util.now().isoformat(),
                "updated_at": dt_util.now().isoformat(),
            }

            recipes[recipe_id] = recipe
            new_recipe_ids.append(recipe_id)

            card_id = f"meal_{uuid4().hex}"
            card = {
                "id": card_id,
                "recipe_id": recipe_id,
                "placement": "backlog",
                "position": self._next_position("backlog"),
                "status": STATUS_ACTIVE,
                "servings": recipe["servings"],
                "created_at": dt_util.now().isoformat(),
                "updated_at": dt_util.now().isoformat(),
            }

            meal_cards[card_id] = card
            new_card_ids.append(card_id)

        if used_temp_names:
            self.store.data["temporary_ingredients"] = [
                t for t in temp_ings if t.get("id") not in used_temp_names
            ]

        drafts.pop(draft_id, None)
        await self.store.async_save()

        return {
            "recipe_ids": new_recipe_ids,
            "card_ids": new_card_ids,
        }

    async def async_regenerate_proposal(self, draft_id: str, index: int) -> dict[str, Any]:
        """Remplace une seule proposition d'un brouillon par une nouvelle, via l'IA."""
        drafts = self.store.data.get("drafts", {})
        draft = drafts.get(draft_id)
        if draft is None:
            raise ValueError(f"Brouillon {draft_id} introuvable")

        proposals = draft.get("proposals", [])
        if index < 0 or index >= len(proposals):
            raise ValueError("Proposition introuvable dans ce brouillon")

        old_proposal = proposals[index]
        prefs = self.store.data.get("preferences", {})
        rules = self.store.data.get("generation_rules", {})
        temp_ings = self.store.data.get("temporary_ingredients", [])
        recipes = self.store.data.get("recipes", {})
        history = self.store.data.get("history", [])

        context = self._build_prompt_context(1, prefs, rules, temp_ings, recipes, history)

        required_temp_ids = self._match_temp_ingredient_ids(old_proposal.get("ingredients", []), temp_ings)
        required_temp_names = [t.get("name", "") for t in temp_ings if t.get("id") in required_temp_ids]
        replacement_note = (
            f"\n\nCONSIGNE DE REMPLACEMENT : la proposition précédente (\"{old_proposal.get('title', '')}\") "
            "ne convient pas et doit être remplacée par une AUTRE idée, cohérente avec le contexte ci-dessus."
        )
        if required_temp_names:
            replacement_note += (
                " La proposition précédente utilisait les aliments à utiliser en priorité suivants : "
                f"{', '.join(required_temp_names)}. La nouvelle proposition DOIT aussi les utiliser."
            )

        instructions = (
            "Tu es un assistant de planification de repas. "
            "Propose une recette réaliste, appétissante, cohérente et adaptée au foyer. "
            "Écris de manière naturelle, comme un vrai humain qui cuisine.\n\n"
            "CONTEXTE UTILISATEUR (à respecter strictement) :\n"
            f"{context}"
            f"{replacement_note}\n\n"
            f"{RECIPE_QUALITY_GUIDELINES}\n\n"
            "RÉSULTAT ATTENDU :\n"
            "Retourne UNIQUEMENT un JSON valide, sans texte avant ni après, exactement au format :\n"
            "{\n"
            '  "title": "Nom du plat",\n'
            '  "servings": 2,\n'
            '  "cooking_minutes": 25,\n'
            '  "ingredients": [\n'
            '    {"name": "pâtes", "quantity": 200, "unit": "g"}\n'
            "  ],\n"
            '  "steps": ["Étape 1...", "Étape 2..."],\n'
            '  "notes": "...",\n'
            '  "nutrition": {"kcal": 420, "protein_g": 12, "carb_g": 55, "fat_g": 14, "fiber_g": 8},\n'
            '  "tags": ["rapide", "végétarien"],\n'
            '  "price_per_serving": 3.5\n'
            "}"
        )

        response = await self.hass.services.async_call(
            "ai_task",
            "generate_data",
            {
                "task_name": "Remplacement d'une proposition de repas",
                "entity_id": self._ai_task_entity_id(prefs),
                "instructions": instructions,
            },
            blocking=True,
            return_response=True,
        )

        response_text = response.get("data") or response.get("response") or response.get("result") or ""

        json_match = re.search(r"\{[\s\S]*\}", response_text)
        if json_match:
            response_text = json_match.group(0)

        try:
            new_proposal = json.loads(response_text)
            if not isinstance(new_proposal, dict) or not new_proposal.get("title"):
                raise ValueError("Réponse IA invalide")
        except Exception as e:
            logger.error(f"Erreur de parsing JSON (remplacement de proposition) : {e}")
            raise ValueError("L'IA n'a pas pu générer de remplacement. Réessaie.") from e

        proposals[index] = new_proposal
        await self.store.async_save()

        return new_proposal

    def _build_refine_instructions(self, current_recipe: dict[str, Any], user_message: str) -> str:
        """Construit le prompt de modification ciblée d'une recette/proposition existante."""
        payload = {
            "title": current_recipe.get("title"),
            "servings": current_recipe.get("servings"),
            "cooking_minutes": current_recipe.get("cooking_minutes"),
            "ingredients": current_recipe.get("ingredients", []),
            "steps": current_recipe.get("steps", []),
            "notes": current_recipe.get("notes", ""),
            "nutrition": current_recipe.get("nutrition", {}),
            "tags": current_recipe.get("tags", []),
            "price_per_serving": current_recipe.get("price_per_serving"),
        }
        composed_note = ""
        if "items" in current_recipe:
            payload = {"title": current_recipe.get("title"), "notes": current_recipe.get("notes", ""), "items": current_recipe.get("items", [])}
            composed_note = (
                " Ce plat est un assortiment de plusieurs variantes (champ \"items\") : garde cette "
                "structure de liste, modifie uniquement la ou les variantes concernées par la demande."
            )
        current_json = json.dumps(payload, ensure_ascii=False)

        return (
            "Tu es un assistant culinaire. Voici une recette actuelle et une demande de "
            "modification de l'utilisateur.\n\n"
            f"RECETTE ACTUELLE (JSON) :\n{current_json}\n\n"
            f"DEMANDE UTILISATEUR : {user_message}\n\n"
            "CONSIGNE : si la demande change un ingrédient ou une contrainte (ex. remplacer "
            "une protéine), mets à jour ingredients/steps/nutrition/tags en conséquence. Si "
            "c'est un simple conseil de cuisson ou une précision, AJOUTE-la uniquement aux "
            "steps ou notes sans changer le reste. Ne modifie que ce qui est nécessaire pour "
            "répondre à la demande, garde tout le reste identique à la recette actuelle."
            f"{composed_note}\n\n"
            f"{RECIPE_QUALITY_GUIDELINES}\n\n"
            "RÉSULTAT ATTENDU : Retourne UNIQUEMENT un JSON valide, sans texte avant ni après, "
            "reprenant exactement la même structure que la recette actuelle ci-dessus, avec les "
            "champs modifiés selon la demande."
        )

    async def _call_refine_ai(self, prefs: dict[str, Any], task_name: str, instructions: str) -> dict[str, Any]:
        """Appelle ai_task.generate_data et parse la recette JSON renvoyée."""
        response = await self.hass.services.async_call(
            "ai_task",
            "generate_data",
            {
                "task_name": task_name,
                "entity_id": self._ai_task_entity_id(prefs),
                "instructions": instructions,
            },
            blocking=True,
            return_response=True,
        )

        response_text = response.get("data") or response.get("response") or response.get("result") or ""

        json_match = re.search(r"\{[\s\S]*\}", response_text)
        if json_match:
            response_text = json_match.group(0)

        try:
            parsed = json.loads(response_text)
            if not isinstance(parsed, dict) or not parsed.get("title"):
                raise ValueError("Réponse IA invalide")
        except Exception as e:
            logger.error(f"Erreur de parsing JSON (modification via IA) : {e}")
            raise ValueError("L'IA n'a pas pu appliquer cette modification. Réessaie.") from e

        return parsed

    async def async_refine_recipe(self, recipe_id: str, user_message: str) -> dict[str, Any]:
        """Modifie une recette enregistrée via une consigne libre, en dialogue avec l'IA."""
        recipe = self.store.data["recipes"].get(recipe_id)
        if recipe is None:
            raise ValueError("Recette introuvable")

        prefs = self.store.data.get("preferences", {})
        instructions = self._build_refine_instructions(recipe, user_message)
        parsed = await self._call_refine_ai(prefs, "Modification d'une recette", instructions)

        recipe.update(parsed)
        recipe["updated_at"] = dt_util.now().isoformat()
        await self.store.async_save()

        return recipe

    async def async_refine_proposal(self, draft_id: str, index: int, user_message: str) -> dict[str, Any]:
        """Modifie une proposition d'un brouillon via une consigne libre, en dialogue avec l'IA."""
        drafts = self.store.data.get("drafts", {})
        draft = drafts.get(draft_id)
        if draft is None:
            raise ValueError(f"Brouillon {draft_id} introuvable")

        proposals = draft.get("proposals", [])
        if index < 0 or index >= len(proposals):
            raise ValueError("Proposition introuvable dans ce brouillon")

        prefs = self.store.data.get("preferences", {})
        instructions = self._build_refine_instructions(proposals[index], user_message)
        parsed = await self._call_refine_ai(prefs, "Modification d'une proposition de repas", instructions)

        proposals[index] = {**proposals[index], **parsed}
        await self.store.async_save()

        return proposals[index]

    def _next_position(self, placement: str) -> int:
        """Calcule la prochaine position libre d'un emplacement."""
        positions = [
            card["position"]
            for card in self.store.data["meal_cards"].values()
            if card["status"] == STATUS_ACTIVE and card["placement"] == placement
        ]
        return max(positions, default=-1) + 1

    async def async_toggle_favorite(self, recipe_id: str) -> dict[str, Any]:
        """Bascule le statut favori d'une recette."""
        recipe = self.store.data["recipes"].get(recipe_id)
        if recipe is None:
            raise ValueError("Recette introuvable")

        recipe["is_favorite"] = not recipe.get("is_favorite", False)
        recipe["updated_at"] = dt_util.now().isoformat()

        await self.store.async_save()
        return recipe

    async def async_rate_recipe(
        self,
        recipe_id: str,
        liked: bool,
        comment: str = "",
    ) -> dict[str, Any]:
        """Ajoute un retour (aimé/pas aimé + commentaire) à une recette."""
        recipe = self.store.data["recipes"].get(recipe_id)
        if recipe is None:
            raise ValueError("Recette introuvable")

        rating = {
            "date": dt_util.now().isoformat(),
            "liked": liked,
            "comment": comment,
        }
        recipe.setdefault("ratings", []).append(rating)
        recipe["updated_at"] = dt_util.now().isoformat()

        await self.store.async_save()
        return recipe

    async def async_add_recipe_to_backlog(
        self,
        recipe_id: str,
        servings: int | None = None,
    ) -> dict[str, Any]:
        """Ajoute une carte dans À cuisiner à partir d'une recette existante."""
        recipe = self.store.data["recipes"].get(recipe_id)
        if recipe is None:
            raise ValueError("Recette introuvable")

        now = dt_util.now().isoformat()
        card_id = f"meal_{uuid4().hex}"
        card = {
            "id": card_id,
            "recipe_id": recipe_id,
            "status": STATUS_ACTIVE,
            "placement": "backlog",
            "position": self._next_position("backlog"),
            "servings": servings or recipe.get("servings", 2),
            "created_at": now,
            "updated_at": now,
        }

        self.store.data["meal_cards"][card_id] = card
        await self.store.async_save()

        return card

    async def async_update_preferences(self, preferences: dict[str, Any]) -> None:
        """Met à jour les préférences de manière non destructive."""
        current = self.store.data.setdefault("preferences", {})
        for key, value in preferences.items():
            if isinstance(value, dict) and key in current and isinstance(current[key], dict):
                current[key].update(value)
            else:
                current[key] = value
        await self.store.async_save()

    async def async_update_generation_rules(self, rules: dict[str, Any]) -> None:
        """Met à jour les règles de génération."""
        current = self.store.data.setdefault("generation_rules", {})
        current.update(rules)
        await self.store.async_save()

    async def async_add_temporary_ingredient(self, ingredient: dict[str, Any]) -> None:
        """Ajoute un aliment temporaire."""
        ingredient["id"] = f"temp_{uuid4().hex}"
        ingredient["status"] = "active"
        self.store.data.setdefault("temporary_ingredients", []).append(ingredient)
        await self.store.async_save()

    async def async_update_temporary_ingredient(self, ingredient_id: str, updates: dict[str, Any]) -> None:
        """Met à jour un aliment temporaire."""
        for ing in self.store.data.get("temporary_ingredients", []):
            if ing.get("id") == ingredient_id:
                ing.update(updates)
                break
        await self.store.async_save()

    async def async_remove_temporary_ingredient(self, ingredient_id: str) -> None:
        """Supprime un aliment temporaire."""
        self.store.data["temporary_ingredients"] = [
            ing for ing in self.store.data.get("temporary_ingredients", [])
            if ing.get("id") != ingredient_id
        ]
        await self.store.async_save()

    async def async_remove_meal_card(self, meal_card_id: str) -> None:
        """Supprime définitivement une carte repas (backlog ou jour)."""
        self.store.data["meal_cards"].pop(meal_card_id, None)
        await self.store.async_save()

    async def async_archive_recipe(self, recipe_id: str) -> dict[str, Any]:
        """Archive une recette (ne disparaît plus de nulle part, juste masquée de la bibliothèque)."""
        recipe = self.store.data["recipes"].get(recipe_id)
        if recipe is None:
            raise ValueError("Recette introuvable")
        recipe["is_archived"] = True
        recipe["updated_at"] = dt_util.now().isoformat()
        await self.store.async_save()
        return recipe

    async def async_unarchive_recipe(self, recipe_id: str) -> dict[str, Any]:
        """Désarchive une recette (annule un archivage)."""
        recipe = self.store.data["recipes"].get(recipe_id)
        if recipe is None:
            raise ValueError("Recette introuvable")
        recipe["is_archived"] = False
        recipe["updated_at"] = dt_util.now().isoformat()
        await self.store.async_save()
        return recipe

    async def async_remove_history_entry(self, history_id: str) -> None:
        """Supprime une entrée d'historique."""
        self.store.data["history"] = [
            h for h in self.store.data.get("history", []) if h.get("id") != history_id
        ]
        await self.store.async_save()

    async def async_restore_history_entry(self, entry: dict[str, Any]) -> None:
        """Réinsère une entrée d'historique précédemment supprimée (annulation)."""
        history = self.store.data.setdefault("history", [])
        if not any(h.get("id") == entry.get("id") for h in history):
            history.append(entry)
        await self.store.async_save()

    async def _pexels_search_image(self, title: str, api_key: str) -> str:
        """Cherche une image via l'API Pexels et retourne son URL, ou lève ValueError."""
        session = async_get_clientsession(self.hass)
        params = {
            "query": title,
            "per_page": 1,
            "orientation": "landscape",
        }
        try:
            async with session.get(
                "https://api.pexels.com/v1/search",
                params=params,
                headers={"Authorization": api_key},
            ) as resp:
                body = await resp.json(content_type=None)
                if resp.status != 200:
                    detail = body.get("error") if isinstance(body, dict) else None
                    raise ValueError(f"Recherche d'image impossible (Pexels, code {resp.status}) : {detail or 'erreur inconnue'}.")
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Erreur de recherche d'image : {e}")
            raise ValueError("Recherche d'image impossible. Réessaie.") from e

        photos = body.get("photos") or []
        if not photos or not photos[0].get("src", {}).get("large"):
            raise ValueError("Aucune image trouvée pour ce plat.")

        return photos[0]["src"]["large"]

    async def async_fetch_recipe_image(self, recipe_id: str) -> dict[str, Any]:
        """Cherche une illustration pour une recette via l'API Pexels."""
        recipe = self.store.data["recipes"].get(recipe_id)
        if recipe is None:
            raise ValueError("Recette introuvable")

        prefs = self.store.data.get("preferences", {})
        api_key = prefs.get("pexels_api_key")
        if not api_key:
            raise ValueError("Configure ta clé Pexels dans Paramètres → Intégrations.")

        recipe["image_url"] = await self._pexels_search_image(recipe.get("title", ""), api_key)
        recipe["image_status"] = "found"
        recipe["updated_at"] = dt_util.now().isoformat()
        await self.store.async_save()

        return recipe

    async def async_clear_cards_and_history(self) -> None:
        """Vide toutes les cartes, recettes, brouillons et historique, mais garde les préférences."""
        self.store.data["recipes"] = {}
        self.store.data["meal_cards"] = {}
        self.store.data["history"] = []
        self.store.data["drafts"] = {}
        await self.store.async_save()

    async def async_toggle_shopping_item(self, key: str) -> dict[str, Any]:
        """Bascule l'état coché d'un article de la liste de courses."""
        checked = self.store.data.setdefault("shopping_list_checked", {})
        checked[key] = not checked.get(key, False)
        await self.store.async_save()
        return checked

    async def async_clear_shopping_checked(self) -> None:
        """Recommence la liste de courses : vide les cases cochées et les recettes déjà exportées."""
        self.store.data["shopping_list_checked"] = {}
        self.store.data["shopping_list_exported_recipe_ids"] = []
        await self.store.async_save()

    async def async_export_shopping_list(self, recipe_ids: list[str]) -> None:
        """Marque des recettes comme déjà exportées vers la liste de tâches."""
        exported = set(self.store.data.setdefault("shopping_list_exported_recipe_ids", []))
        exported.update(recipe_ids)
        self.store.data["shopping_list_exported_recipe_ids"] = list(exported)
        await self.store.async_save()

    async def async_import_recipe(
        self,
        text: str | None = None,
        media_content_id: str | None = None,
        media_content_type: str | None = None,
    ) -> dict[str, Any]:
        """Structure une recette (texte et/ou photo) via l'IA et l'ajoute au backlog."""
        if not text and not media_content_id:
            raise ValueError("Fournis un texte ou une photo de recette")

        prefs = self.store.data.get("preferences", {})

        instructions = (
            "Voici une recette fournie par l'utilisateur (texte et/ou photo en pièce jointe). "
            "Structure-la au format JSON exact ci-dessous, en français. Estime raisonnablement "
            "les valeurs manquantes plutôt que de les laisser vides quand c'est possible "
            "(temps de cuisson, portions par défaut 2, tags pertinents, nutrition approximative). "
            "Ne modifie pas le fond de la recette : reste fidèle à ce qui est fourni.\n\n"
            f"{RECIPE_QUALITY_GUIDELINES}\n\n"
        )
        if text:
            instructions += f"TEXTE FOURNI :\n{text}\n\n"

        instructions += (
            "RÉSULTAT ATTENDU : Retourne UNIQUEMENT un JSON valide, sans texte avant ni après, "
            "exactement au format :\n"
            "{\n"
            '  "title": "Nom du plat",\n'
            '  "servings": 2,\n'
            '  "cooking_minutes": 25,\n'
            '  "ingredients": [{"name": "pâtes", "quantity": 200, "unit": "g"}],\n'
            '  "steps": ["Étape 1...", "Étape 2..."],\n'
            '  "notes": "...",\n'
            '  "nutrition": {"kcal": 420, "protein_g": 12, "carb_g": 55, "fat_g": 14, "fiber_g": 8},\n'
            '  "tags": ["rapide", "végétarien"],\n'
            '  "price_per_serving": 3.5\n'
            "}"
        )

        service_data: dict[str, Any] = {
            "task_name": "Import d'une recette",
            "entity_id": self._ai_task_entity_id(prefs),
            "instructions": instructions,
        }
        if media_content_id:
            service_data["attachments"] = [
                {
                    "media_content_id": media_content_id,
                    "media_content_type": media_content_type or "image/jpeg",
                    "metadata": {"title": "Photo de recette", "media_class": "image"},
                }
            ]

        response = await self.hass.services.async_call(
            "ai_task",
            "generate_data",
            service_data,
            blocking=True,
            return_response=True,
        )

        response_text = response.get("data") or response.get("response") or response.get("result") or ""

        json_match = re.search(r"\{[\s\S]*\}", response_text)
        if json_match:
            response_text = json_match.group(0)

        try:
            parsed = json.loads(response_text)
            if not isinstance(parsed, dict) or not parsed.get("title"):
                raise ValueError("Réponse IA invalide")
        except Exception as e:
            logger.error(f"Erreur de parsing JSON (import de recette) : {e}")
            raise ValueError(
                "L'IA n'a pas pu structurer cette recette. Réessaie avec un texte plus complet."
            ) from e

        now = dt_util.now().isoformat()
        recipe_id = f"recipe_{uuid4().hex}"
        servings = parsed.get("servings") or 2

        recipe = {
            "id": recipe_id,
            "title": parsed.get("title", "Recette importée"),
            "source": {"kind": "personal_manual"},
            "is_favorite": False,
            "is_archived": False,
            "servings": servings,
            "cooking_minutes": parsed.get("cooking_minutes"),
            "tags": parsed.get("tags") or [],
            "ingredients": parsed.get("ingredients") or [],
            "steps": parsed.get("steps") or [],
            "notes": parsed.get("notes", ""),
            "nutrition": parsed.get("nutrition") or {},
            "image_url": None,
            "image_alt": "",
            "image_status": "missing",
            "image_reference": None,
            "price_per_serving": parsed.get("price_per_serving"),
            "last_cooked_at": None,
            "times_cooked": 0,
            "ratings": [],
            "created_at": now,
            "updated_at": now,
        }

        meal_card_id = f"meal_{uuid4().hex}"
        meal_card = {
            "id": meal_card_id,
            "recipe_id": recipe_id,
            "status": STATUS_ACTIVE,
            "placement": "backlog",
            "position": self._next_position("backlog"),
            "servings": servings,
            "created_at": now,
            "updated_at": now,
        }

        self.store.data["recipes"][recipe_id] = recipe
        self.store.data["meal_cards"][meal_card_id] = meal_card
        await self.store.async_save()

        return meal_card

    GUEST_COURSE_KEYS = ("aperitif", "entree", "plat", "dessert")
    GUEST_COURSE_LABELS = {
        "aperitif": "Apéritif",
        "entree": "Entrée",
        "plat": "Plat",
        "dessert": "Dessert",
    }

    def _guest_menu_context(self, prefs: dict[str, Any], temp_ings: list[dict[str, Any]], notes: str) -> str:
        """Construit le contexte commun (régimes/allergies/goûts/stock) pour le module Invité."""
        lines = []
        diets = prefs.get("diets", [])
        lines.append(f"- Régimes du foyer : {', '.join(diets) if diets else 'aucun'}.")
        allergies = prefs.get("allergies", [])
        lines.append(f"- Allergies/intolérances : {', '.join(allergies) if allergies else 'aucune'}.")
        liked = prefs.get("liked_ingredients", [])
        disliked = prefs.get("disliked_ingredients", [])
        if liked or disliked:
            lines.append(f"- Goûts : adore {', '.join(liked) if liked else 'rien de spécifique'}; n'aime pas {', '.join(disliked) if disliked else 'rien de spécifique'}.")
        if temp_ings:
            temp_lines = [f"- {t.get('quantity', '')} {t.get('unit', '')} {t.get('name', '')}" for t in temp_ings]
            lines.append("- Aliments déjà disponibles à utiliser en priorité :\n" + "\n".join(temp_lines))
        if notes:
            lines.append(f"- Occasion / contraintes précisées par l'utilisateur : {notes}")
        stove_note = self._stove_level_instruction(prefs)
        if stove_note:
            lines.append(stove_note.lstrip("\n"))
        return "\n".join(lines)

    _NUTRITION_SKELETON = '{"kcal": 420, "protein_g": 12, "carb_g": 55, "fat_g": 14, "fiber_g": 8}'

    def _guest_course_json_skeleton(self, key: str, composed: bool) -> str:
        if composed:
            return (
                f'    "{key}": {{"title": "...", "notes": "...", "items": [{{"title": "...", '
                f'"ingredients": [{{"name": "...", "quantity": 1, "unit": "..."}}], "steps": ["..."], '
                f'"nutrition": {self._NUTRITION_SKELETON}}}]}}'
            )
        return (
            f'    "{key}": {{"title": "...", "ingredients": [{{"name": "...", "quantity": 1, "unit": "..."}}], '
            f'"steps": ["..."], "notes": "...", "nutrition": {self._NUTRITION_SKELETON}}}'
        )

    WINE_INSTRUCTION = (
        "Propose 2 à 4 suggestions d'accord mets-vins sous forme d'appellations ou dénominations "
        "réelles et courantes (AOC/AOP, ex. \"Côtes du Rhône rouge\", \"Chablis\", \"Beaujolais-"
        "Villages\", \"Sancerre blanc\") avec une courte justification liée au menu. En plus de "
        "l'appellation, si tu es raisonnablement confiant qu'il s'agit d'une grande maison largement "
        "distribuée en grande surface (ex. \"Guigal\", \"Georges Duboeuf\"), tu peux citer 1 à 2 "
        "maisons dans le champ \"producers\" — jamais un domaine confidentiel ou incertain, liste "
        "vide si aucune ne te vient naturellement avec confiance."
    )
    WINE_RESULT_SKELETON = '{"wine_pairings": [{"style": "...", "description": "...", "producers": []}]}'

    async def async_generate_guest_menu(
        self,
        guests: int,
        notes: str = "",
        course_keys: list[str] | None = None,
        composed_keys: list[str] | None = None,
        composed_counts: dict[str, int] | None = None,
    ) -> dict[str, Any]:
        """Génère un menu invité complet + accords mets-vins, en un seul appel IA."""
        selected = [k for k in (course_keys or list(self.GUEST_COURSE_KEYS)) if k in self.GUEST_COURSE_KEYS]
        if not selected:
            raise ValueError("Choisis au moins un service pour le menu.")
        composed = set(composed_keys or []) & set(selected)
        counts = {
            k: max(2, min(6, int((composed_counts or {}).get(k, 3))))
            for k in composed
        }

        prefs = self.store.data.get("preferences", {})
        temp_ings = self.store.data.get("temporary_ingredients", [])
        context = self._guest_menu_context(prefs, temp_ings, notes)

        course_labels = ", ".join(self.GUEST_COURSE_LABELS[k].lower() for k in selected)
        composed_note = ""
        if composed:
            composed_parts = ", ".join(
                f"{self.GUEST_COURSE_LABELS[k].lower()} ({counts[k]} variantes)" for k in composed
            )
            composed_note = (
                f" Pour {composed_parts}, propose un assortiment de variantes distinctes "
                "(champ \"items\", exactement le nombre de variantes indiqué, une entrée par "
                "variante) plutôt qu'un plat unique."
            )
        json_skeleton = ",\n".join(self._guest_course_json_skeleton(k, k in composed) for k in selected)

        instructions = (
            "Tu es un assistant culinaire qui compose un repas complet pour recevoir des invités. "
            f"Le repas est prévu pour {guests} convives.\n\n"
            "CONTEXTE :\n"
            f"{context}\n\n"
            f"{RECIPE_QUALITY_GUIDELINES}\n\n"
            f"Compose les services suivants, cohérents entre eux (pas de répétition d'ingrédients "
            f"ou de techniques d'un plat à l'autre) : {course_labels}. Adapte-toi aux régimes/"
            "allergies du foyer, en utilisant en priorité les aliments déjà disponibles si "
            f"pertinent.{composed_note} {self.WINE_INSTRUCTION}\n\n"
            "RÉSULTAT ATTENDU : Retourne UNIQUEMENT un JSON valide, sans texte avant ni après, "
            "exactement au format :\n"
            "{\n"
            '  "courses": {\n'
            f"{json_skeleton}\n"
            "  },\n"
            '  "wine_pairings": [{"style": "...", "description": "...", "producers": []}]\n'
            "}"
        )

        response = await self.hass.services.async_call(
            "ai_task",
            "generate_data",
            {
                "task_name": "Génération d'un menu invité",
                "entity_id": self._ai_task_entity_id(prefs),
                "instructions": instructions,
            },
            blocking=True,
            return_response=True,
        )

        response_text = response.get("data") or response.get("response") or response.get("result") or ""

        json_match = re.search(r"\{[\s\S]*\}", response_text)
        if json_match:
            response_text = json_match.group(0)

        try:
            parsed = json.loads(response_text)
            courses = parsed.get("courses")
            if not isinstance(courses, dict) or not all(k in courses for k in selected):
                raise ValueError("Réponse IA invalide")
        except Exception as e:
            logger.error(f"Erreur de parsing JSON (menu invité) : {e}")
            raise ValueError("L'IA n'a pas pu générer ce menu. Réessaie.") from e

        pexels_key = prefs.get("pexels_api_key")
        if pexels_key:
            for key in selected:
                course = courses.get(key)
                if not isinstance(course, dict):
                    continue
                if isinstance(course.get("items"), list):
                    for item in course["items"]:
                        if not isinstance(item, dict):
                            continue
                        try:
                            item["image_url"] = await self._pexels_search_image(item.get("title", ""), pexels_key)
                            item["image_status"] = "found"
                        except Exception as e:
                            logger.debug(f"Illustration ignorée pour '{item.get('title', '')}' : {e}")
                else:
                    try:
                        course["image_url"] = await self._pexels_search_image(course.get("title", ""), pexels_key)
                        course["image_status"] = "found"
                    except Exception as e:
                        logger.debug(f"Illustration ignorée pour '{course.get('title', '')}' : {e}")

        now = dt_util.now().isoformat()
        menu_id = f"guest_{uuid4().hex}"
        menu = {
            "id": menu_id,
            "created_at": now,
            "guests": guests,
            "notes": notes,
            "course_keys": selected,
            "composed_keys": list(composed),
            "composed_counts": counts,
            "courses": {key: courses.get(key, {}) for key in selected},
            "wine_pairings": [p for p in (parsed.get("wine_pairings") or []) if isinstance(p, dict)],
        }

        self.store.data["guest_menus"][menu_id] = menu
        await self.store.async_save()

        return menu

    def _get_guest_menu(self, menu_id: str) -> dict[str, Any]:
        menu = self.store.data.get("guest_menus", {}).get(menu_id)
        if menu is None:
            raise ValueError("Menu invité introuvable")
        return menu

    async def async_regenerate_guest_course(
        self, menu_id: str, course_key: str, item_index: int | None = None
    ) -> dict[str, Any]:
        """Régénère un plat (ou une seule variante d'un assortiment) d'un menu invité."""
        menu = self._get_guest_menu(menu_id)
        course_keys = menu.get("course_keys") or list(self.GUEST_COURSE_KEYS)
        if course_key not in course_keys:
            raise ValueError("Type de plat invalide")
        is_composed = course_key in (menu.get("composed_keys") or [])
        target_item = None
        if item_index is not None:
            if not is_composed:
                raise ValueError("Ce service n'est pas un assortiment.")
            items = menu["courses"].get(course_key, {}).get("items", [])
            if item_index < 0 or item_index >= len(items):
                raise ValueError("Variante introuvable.")
            target_item = items[item_index]

        prefs = self.store.data.get("preferences", {})
        temp_ings = self.store.data.get("temporary_ingredients", [])
        context = self._guest_menu_context(prefs, temp_ings, menu.get("notes", ""))

        other_courses = [
            f"- {self.GUEST_COURSE_LABELS[k]} : {menu['courses'][k].get('title', '')}"
            for k in course_keys
            if k != course_key and menu["courses"].get(k)
        ]

        if target_item is not None:
            items = menu["courses"][course_key].get("items", [])
            other_items = [f"- {it.get('title', '')}" for i, it in enumerate(items) if i != item_index]
            instructions = (
                f"Tu composes UNE variante d'un assortiment ({self.GUEST_COURSE_LABELS[course_key].lower()}) "
                f"d'un repas invités pour {menu.get('guests', 2)} convives. Les autres variantes déjà "
                "choisies dans ce même assortiment sont :\n"
                + ("\n".join(other_items) if other_items else "aucune autre variante")
                + "\nLes autres plats déjà choisis pour ce repas sont :\n"
                + ("\n".join(other_courses) if other_courses else "aucun autre plat encore choisi")
                + f"\n\nCONTEXTE :\n{context}\n\n{RECIPE_QUALITY_GUIDELINES}\n\n"
                "Propose une idée différente de la précédente pour cette seule variante, cohérente "
                "avec les autres variantes et les autres plats du menu (pas de répétition "
                "d'ingrédients/techniques).\n\n"
                "RÉSULTAT ATTENDU : Retourne UNIQUEMENT un JSON valide, sans texte avant ni après, "
                'exactement au format : {"title": "...", "ingredients": [{"name": "...", "quantity": 1, '
                f'"unit": "..."}}], "steps": ["..."], "nutrition": {self._NUTRITION_SKELETON}}}'
            )
        else:
            composed_note = (
                f" Réponds avec un assortiment de {menu.get('composed_counts', {}).get(course_key, 3)} "
                "variantes distinctes (champ \"items\") plutôt qu'un plat unique."
                if is_composed
                else ""
            )
            result_skeleton = (
                self._guest_course_json_skeleton(course_key, True).split(": ", 1)[1]
                if is_composed
                else (
                    '{"title": "...", "ingredients": [{"name": "...", "quantity": 1, "unit": "..."}], '
                    f'"steps": ["..."], "notes": "...", "nutrition": {self._NUTRITION_SKELETON}}}'
                )
            )
            instructions = (
                f"Tu composes le {self.GUEST_COURSE_LABELS[course_key].lower()} d'un repas invités pour "
                f"{menu.get('guests', 2)} convives. Les autres plats déjà choisis pour ce repas sont :\n"
                + ("\n".join(other_courses) if other_courses else "aucun autre plat encore choisi")
                + f"\n\nCONTEXTE :\n{context}\n\n{RECIPE_QUALITY_GUIDELINES}\n\n"
                "Propose une idée différente de la précédente pour ce plat, cohérente avec les autres "
                f"plats du menu (pas de répétition d'ingrédients/techniques).{composed_note}\n\n"
                "RÉSULTAT ATTENDU : Retourne UNIQUEMENT un JSON valide, sans texte avant ni après, "
                f"exactement au format :\n{result_skeleton}"
            )

        response = await self.hass.services.async_call(
            "ai_task",
            "generate_data",
            {
                "task_name": "Remplacement d'un plat du menu invité",
                "entity_id": self._ai_task_entity_id(prefs),
                "instructions": instructions,
            },
            blocking=True,
            return_response=True,
        )

        response_text = response.get("data") or response.get("response") or response.get("result") or ""
        json_match = re.search(r"\{[\s\S]*\}", response_text)
        if json_match:
            response_text = json_match.group(0)

        try:
            new_value = json.loads(response_text)
            if not isinstance(new_value, dict) or not new_value.get("title"):
                raise ValueError("Réponse IA invalide")
        except Exception as e:
            logger.error(f"Erreur de parsing JSON (plat du menu invité) : {e}")
            raise ValueError("L'IA n'a pas pu générer de remplacement. Réessaie.") from e

        pexels_key = prefs.get("pexels_api_key")
        if pexels_key:
            try:
                new_value["image_url"] = await self._pexels_search_image(new_value.get("title", ""), pexels_key)
                new_value["image_status"] = "found"
            except Exception as e:
                logger.debug(f"Illustration ignorée pour '{new_value.get('title', '')}' : {e}")

        if target_item is not None:
            menu["courses"][course_key]["items"][item_index] = new_value
        else:
            menu["courses"][course_key] = new_value
        await self.store.async_save()

        return menu

    async def async_refine_guest_course(
        self, menu_id: str, course_key: str, message: str, item_index: int | None = None
    ) -> dict[str, Any]:
        """Ajuste un plat (ou une variante d'un assortiment) via une consigne libre, en dialogue avec l'IA."""
        menu = self._get_guest_menu(menu_id)
        if course_key not in (menu.get("course_keys") or self.GUEST_COURSE_KEYS):
            raise ValueError("Type de plat invalide")

        prefs = self.store.data.get("preferences", {})

        if item_index is not None:
            items = menu["courses"].get(course_key, {}).get("items", [])
            if item_index < 0 or item_index >= len(items):
                raise ValueError("Variante introuvable.")
            instructions = self._build_refine_instructions(items[item_index], message)
            parsed = await self._call_refine_ai(prefs, "Ajustement d'une variante du menu invité", instructions)
            items[item_index] = {**items[item_index], **parsed}
        else:
            instructions = self._build_refine_instructions(menu["courses"].get(course_key, {}), message)
            parsed = await self._call_refine_ai(prefs, "Ajustement d'un plat du menu invité", instructions)
            menu["courses"][course_key] = {**menu["courses"].get(course_key, {}), **parsed}

        await self.store.async_save()

        return menu

    async def async_regenerate_wine_pairings(self, menu_id: str) -> dict[str, Any]:
        """Régénère uniquement les suggestions d'accord mets-vins d'un menu invité."""
        menu = self._get_guest_menu(menu_id)
        prefs = self.store.data.get("preferences", {})

        course_lines = [
            f"- {self.GUEST_COURSE_LABELS[k]} : {menu['courses'][k].get('title', '')}"
            for k in self.GUEST_COURSE_KEYS
            if menu["courses"].get(k)
        ]

        instructions = (
            "Voici le menu d'un repas invités :\n" + "\n".join(course_lines) + "\n\n"
            f"{self.WINE_INSTRUCTION}\n\n"
            "RÉSULTAT ATTENDU : Retourne UNIQUEMENT un JSON valide, sans texte avant ni après, "
            f"exactement au format : {self.WINE_RESULT_SKELETON}"
        )

        response = await self.hass.services.async_call(
            "ai_task",
            "generate_data",
            {
                "task_name": "Accords mets-vins du menu invité",
                "entity_id": self._ai_task_entity_id(prefs),
                "instructions": instructions,
            },
            blocking=True,
            return_response=True,
        )

        response_text = response.get("data") or response.get("response") or response.get("result") or ""
        json_match = re.search(r"\{[\s\S]*\}", response_text)
        if json_match:
            response_text = json_match.group(0)

        try:
            parsed = json.loads(response_text)
            pairings = [p for p in (parsed.get("wine_pairings") or []) if isinstance(p, dict)]
        except Exception as e:
            logger.error(f"Erreur de parsing JSON (accords mets-vins) : {e}")
            raise ValueError("L'IA n'a pas pu générer de suggestions. Réessaie.") from e

        menu["wine_pairings"] = pairings
        await self.store.async_save()

        return menu

    async def async_dismiss_guest_menu(self, menu_id: str) -> None:
        """Supprime un menu invité."""
        self.store.data.get("guest_menus", {}).pop(menu_id, None)
        await self.store.async_save()

    def _flat_cook_plan(self, recipes: list[dict[str, Any]]) -> dict[str, Any]:
        """Repli : concatène simplement les étapes de chaque plat dans l'ordre fourni."""
        plan = []
        for idx, recipe in enumerate(recipes):
            for step_text in recipe.get("steps", []) or []:
                plan.append({"recipe_index": idx, "step_text": step_text})
        return {"plan": plan}

    async def async_generate_cook_plan(self, recipes: list[dict[str, Any]]) -> dict[str, Any]:
        """Génère un plan d'exécution interfolé pour cuisiner plusieurs plats en parallèle.

        `recipes` : liste de {"name": str, "steps": list[str]}.
        En cas d'échec (appel IA ou parsing), retourne un repli en concaténation plate
        au lieu de lever une exception.
        """
        if not recipes:
            return {"plan": []}

        if len(recipes) == 1:
            return self._flat_cook_plan(recipes)

        prefs = self.store.data.get("preferences", {})

        dishes_lines = []
        for idx, recipe in enumerate(recipes):
            steps = recipe.get("steps", []) or []
            steps_text = "\n".join(f"  {i + 1}. {s}" for i, s in enumerate(steps))
            dishes_lines.append(f"Plat {idx} — {recipe.get('name', '')} :\n{steps_text}")

        instructions = (
            "Tu es un assistant culinaire qui aide à cuisiner PLUSIEURS plats en même temps, "
            "en minimisant les temps morts (ex. démarrer la cuisson longue d'un plat pendant "
            "qu'un autre mijote).\n\n"
            "PLATS À CUISINER (dans l'ordre) :\n" + "\n\n".join(dishes_lines) + "\n\n"
            "CONSIGNE IMPORTANTE : ne réécris JAMAIS le texte d'une étape — reprends le texte "
            "ORIGINAL de chaque étape strictement à l'identique (verbatim). Ton seul travail "
            "est de RÉORDONNER et d'ENTRELACER les étapes des différents plats dans un ordre "
            "d'exécution unique et cohérent, en indiquant pour chaque étape à quel plat "
            "(recipe_index) elle appartient.\n\n"
            "RÉSULTAT ATTENDU : Retourne UNIQUEMENT un JSON valide, sans texte avant ni après, "
            "exactement au format :\n"
            "{\n"
            '  "plan": [\n'
            '    {"recipe_index": 0, "step_text": "texte exact de l\'étape"},\n'
            '    {"recipe_index": 1, "step_text": "texte exact de l\'étape"}\n'
            "  ]\n"
            "}"
        )

        try:
            response = await self.hass.services.async_call(
                "ai_task",
                "generate_data",
                {
                    "task_name": "Plan de cuisson entrelacé",
                    "entity_id": self._ai_task_entity_id(prefs),
                    "instructions": instructions,
                },
                blocking=True,
                return_response=True,
            )

            response_text = response.get("data") or response.get("response") or response.get("result") or ""
            json_match = re.search(r"\{[\s\S]*\}", response_text)
            if json_match:
                response_text = json_match.group(0)

            parsed = json.loads(response_text)
            plan = parsed.get("plan")
            if not isinstance(plan, list) or not plan:
                raise ValueError("Réponse IA invalide")
            for step in plan:
                if not isinstance(step, dict) or "recipe_index" not in step or "step_text" not in step:
                    raise ValueError("Étape de plan invalide")
        except Exception as e:
            logger.error(f"Erreur de génération du plan de cuisson entrelacé, repli en mode plat : {e}")
            return self._flat_cook_plan(recipes)

        return {"plan": plan}