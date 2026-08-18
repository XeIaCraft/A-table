"""Capteur Home Assistant pour À table."""

from __future__ import annotations

from datetime import timedelta
from typing import Any

from homeassistant.components.sensor import SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.util import dt as dt_util

from .const import DATA_COORDINATOR, DOMAIN, STATUS_ACTIVE

SCAN_INTERVAL = timedelta(minutes=5)

WEEKDAY_KEYS = (
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Configure le capteur "repas du jour" de À table."""
    coordinator = hass.data[DOMAIN][entry.entry_id][DATA_COORDINATOR]
    async_add_entities([ATableTodayMealSensor(coordinator, entry)])


class ATableTodayMealSensor(SensorEntity):
    """Expose le repas planifié pour aujourd'hui."""

    _attr_should_poll = True
    _attr_icon = "mdi:silverware-fork-knife"
    _attr_name = "Repas du jour"

    def __init__(self, coordinator, entry: ConfigEntry) -> None:
        """Initialise le capteur."""
        self._coordinator = coordinator
        self._attr_unique_id = f"{entry.entry_id}_today_meal"

    def update(self) -> None:
        """Recalcule l'état à partir des données en mémoire du coordinateur."""
        data = self._coordinator.store.data
        today_key = WEEKDAY_KEYS[dt_util.now().weekday()]

        card = next(
            (
                c
                for c in data.get("meal_cards", {}).values()
                if c.get("status") == STATUS_ACTIVE and c.get("placement") == today_key
            ),
            None,
        )

        if card is None:
            self._attr_native_value = "Aucun repas prévu"
            self._attr_extra_state_attributes = {}
            return

        recipe = data.get("recipes", {}).get(card.get("recipe_id"), {})
        self._attr_native_value = recipe.get("title", "Aucun repas prévu")
        self._attr_extra_state_attributes = {
            "recipe_id": card.get("recipe_id"),
            "meal_card_id": card.get("id"),
            "servings": card.get("servings"),
            "cooking_minutes": recipe.get("cooking_minutes"),
            "tags": recipe.get("tags", []),
        }
