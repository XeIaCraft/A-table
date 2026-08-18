"""Stockage persistant de l'intégration À table."""

from __future__ import annotations

from copy import deepcopy
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .const import DOMAIN

STORAGE_VERSION = 1
STORAGE_KEY = f"{DOMAIN}.data"

DEFAULT_DATA: dict[str, Any] = {
    "recipes": {},
    "meal_cards": {},
    "history": [],
    "drafts": {},
    "temporary_ingredients": [],
    "shopping_list_checked": {},
    "shopping_list_exported_recipe_ids": [],
    "guest_menus": {},
    "preferences": {
        "ai_task_entity_id": "ai_task.google_ai_task",
        "todo_entity_id": None,
        "default_servings": 2,
        "default_recipe_count": 6,
        "appetite": "normal",  # low, normal, high
        "diets": [],  # vegetarian, vegan, pescatarian, no_pork, no_lactose, no_gluten, paleo, keto, other, everything
        "diet_other_text": "",
        "allergies": [],  # gluten, lactose, crustaceans, eggs, fish, soy, peanuts, tree_nuts, celery, mustard, molluscs, sesame, other
        "allergies_other_text": "",
        "liked_ingredients": [],
        "disliked_ingredients": [],
        "available_equipment": [],
        "preferred_equipment": None,  # single value now
        "objectives": [],  # max 3
        "budget_per_serving": None,
        "target_kcal_per_serving": None,
        "google_search_api_key": None,
        "google_search_engine_id": None,
        "grocery_store": "",  # where user shops
        "time_profile": "normal",  # quick (<=20), normal (<=60), chill (>60)
        "complexity": "free",  # simple, medium, free
        "history_days_for_generation": 20,
        "history_days_for_display": 20,
        "include_personal_recipes_in_context": True,
        "custom_context": "",
        "macro_ratios": {
            "protein_pct": 30,
            "carb_pct": 45,
            "fat_pct": 25,
        },
        "recipe_sources": {
            "enabled": True,
            "allowed_domains": [],
            "use_as_inspiration": True,
            "require_image_for_generated_recipes": False,
            "show_source_in_ui": False,
        },
    },
    "generation_rules": {
        "max_favorites": 2,
        "max_recurrence": 1,  # max times a similar dish can appear (including history)
        "min_new_recipes_pct": 90,  # target % of new recipes
        "max_repeat_protein": 2,  # max proposals sharing the same main protein
        "max_repeat_starch": 2,  # max proposals sharing the same main starch
        "max_repeat_vegetable": 2,  # max proposals sharing the same main vegetable
    },
}


class ATableStore:
    """Gère les données persistantes de À table."""

    def __init__(self, hass: HomeAssistant) -> None:
        """Initialise le stockage."""
        self._store = Store[dict[str, Any]](
            hass,
            STORAGE_VERSION,
            STORAGE_KEY,
        )
        self.data: dict[str, Any] = deepcopy(DEFAULT_DATA)

    async def async_load(self) -> None:
        """Charge les données ou crée la structure initiale."""
        stored_data = await self._store.async_load()

        if stored_data:
            self.data = deepcopy(DEFAULT_DATA)
            self.data.update(stored_data)

        self._ensure_structure()

    def _ensure_structure(self) -> None:
        """Garantit la présence des clés attendues, sans écraser les données existantes."""
        for key, value in DEFAULT_DATA.items():
            if key not in self.data:
                self.data[key] = deepcopy(value)

        for key, value in DEFAULT_DATA["preferences"].items():
            if isinstance(value, dict):
                existing = self.data["preferences"].get(key)
                if not isinstance(existing, dict):
                    self.data["preferences"][key] = deepcopy(value)
                else:
                    for sub_key, sub_value in value.items():
                        existing.setdefault(sub_key, sub_value)
            else:
                self.data["preferences"].setdefault(key, value)

        for key, value in DEFAULT_DATA["generation_rules"].items():
            self.data["generation_rules"].setdefault(key, value)

        self.data.setdefault("drafts", {})
        self.data.setdefault("temporary_ingredients", [])
        self.data.setdefault("recipes", {})
        self.data.setdefault("meal_cards", {})
        self.data.setdefault("history", [])
        if not isinstance(self.data.get("shopping_list_checked"), dict):
            self.data["shopping_list_checked"] = {}
        if not isinstance(self.data.get("shopping_list_exported_recipe_ids"), list):
            self.data["shopping_list_exported_recipe_ids"] = []
        if not isinstance(self.data.get("guest_menus"), dict):
            self.data["guest_menus"] = {}

        prefs = self.data["preferences"]
        for list_key in ("liked_ingredients", "disliked_ingredients", "objectives", "diets", "allergies", "available_equipment"):
            if not isinstance(prefs.get(list_key), list):
                prefs[list_key] = []

        domains = prefs.get("recipe_sources", {})
        if not isinstance(domains.get("allowed_domains"), list):
            domains["allowed_domains"] = []

        if prefs.get("preferred_equipment") and prefs["preferred_equipment"] not in prefs.get("available_equipment", []):
            prefs["preferred_equipment"] = None

    async def async_save(self) -> None:
        """Sauvegarde les données."""
        await self._store.async_save(self.data)