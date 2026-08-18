"""Logique métier de À table."""

from __future__ import annotations

import json
import logging
import re
from datetime import datetime, timedelta
from typing import Any
from uuid import uuid4

from homeassistant.core import HomeAssistant
from homeassistant.util import dt as dt_util

from .const import PLACEMENTS, STATUS_ACTIVE, STATUS_COOKED
from .store import ATableStore

logger = logging.getLogger(__name__)


class ATableCoordinator:
    """Centralise les opérations sur recettes, planning et historique."""

    def __init__(self, hass: HomeAssistant, store: ATableStore) -> None:
        """Initialise le coordinateur."""
        self.hass = hass
        self.store = store

    def get_data(self) -> dict[str, Any]:
        """Retourne les données de l'application."""
        return self.store.data

    async def async_add_recipe(
        self,
        title: str,
        servings: int = 2,
        cooking_minutes: int | None = None,
        tags: list[str] | None = None,
    ) -> dict[str, Any]:
        """Ajoute une recette minimale et une carte dans À cuisiner."""
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
            "ingredients": [],
            "steps": [],
            "nutrition": {},
            "image_url": None,
            "image_alt": "",
            "image_status": "missing",
            "image_reference": None,
            "price_per_serving": None,
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

        count = min(count, 10)  # max 10

        context = self._build_prompt_context(count, prefs, rules, temp_ings, recipes, history)

        instructions = (
            "Tu es un assistant de planification de repas. "
            "Propose des recettes réalistes, appétissantes, cohérentes et adaptées au foyer. "
            "Écris de manière naturelle, comme un vrai humain qui cuisine.\n\n"
            "CONTEXTE UTILISATEUR (à respecter strictement) :\n"
            f"{context}\n\n"
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
                "entity_id": "ai_task.google_ai_task",
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
                "entity_id": "ai_task.google_ai_task",
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

        servings = prefs.get("default_servings", 2)
        appetite = prefs.get("appetite", "normal")
        lines.append(f"- Foyer : {servings} personnes, appétit {appetite}.")

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
        lines.append(f"- Objectifs : {', '.join(objectives) if objectives else 'aucun objectif spécifique'}.")

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
        lines.append(
            "- QUOTAS DE DIVERSITÉ À RESPECTER STRICTEMENT :\n"
            f"- Au maximum {max_fav} proposition(s) parmi les recettes favorites ou évaluées positivement (👍) ci-dessus.\n"
            f"- Au maximum {max_rec} répétition(s) d'un plat identique ou très similaire à l'historique récent.\n"
            f"- Au moins {min_new_pct}% des propositions doivent être de nouvelles recettes, absentes de la bibliothèque personnelle listée ci-dessus."
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
            ing_names = { (i.get("name", "") or "").lower() for i in ingredients if isinstance(i, dict) }
            for t in temp_ings:
                t_name = (t.get("name", "") or "").lower()
                if t_name and any(t_name in n for n in ing_names):
                    used_temp_names.add(t.get("id"))

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
        """Vide l'état coché de la liste de courses (nouvelle semaine de courses)."""
        self.store.data["shopping_list_checked"] = {}
        await self.store.async_save()