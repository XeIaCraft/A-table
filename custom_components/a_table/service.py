"""Services de l'intégration À table."""

from __future__ import annotations

import voluptuous as vol

from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.helpers import config_validation as cv

from .const import DATA_COORDINATOR, DOMAIN, PLACEMENTS

SERVICE_ADD_RECIPE = "add_recipe"
SERVICE_MOVE_MEAL_CARD = "move_meal_card"
SERVICE_COOK_MEAL_CARD = "cook_meal_card"
SERVICE_GENERATE_DRAFT = "generate_draft"
SERVICE_VALIDATE_DRAFT = "validate_draft"
SERVICE_CLEAR_CARDS_AND_HISTORY = "clear_cards_and_history"

ATTR_TITLE = "title"
ATTR_SERVINGS = "servings"
ATTR_COOKING_MINUTES = "cooking_minutes"
ATTR_TAGS = "tags"
ATTR_MEAL_CARD_ID = "meal_card_id"
ATTR_PLACEMENT = "placement"
ATTR_POSITION = "position"
ATTR_DRAFT_ID = "draft_id"
ATTR_COUNT = "count"
ATTR_SELECTED_INDICES = "selected_indices"
ATTR_MODIFICATIONS = "modifications"


async def async_setup_services(hass: HomeAssistant) -> None:
    """Enregistre les services À table."""

    async def async_add_recipe(call: ServiceCall) -> None:
        coordinator = _get_coordinator(hass)
        await coordinator.async_add_recipe(
            title=call.data[ATTR_TITLE],
            servings=call.data.get(ATTR_SERVINGS, 2),
            cooking_minutes=call.data.get(ATTR_COOKING_MINUTES),
            tags=call.data.get(ATTR_TAGS, []),
        )

    async def async_move_meal_card(call: ServiceCall) -> None:
        coordinator = _get_coordinator(hass)
        await coordinator.async_move_meal_card(
            meal_card_id=call.data[ATTR_MEAL_CARD_ID],
            placement=call.data[ATTR_PLACEMENT],
            position=call.data.get(ATTR_POSITION),
        )

    async def async_cook_meal_card(call: ServiceCall) -> None:
        coordinator = _get_coordinator(hass)
        await coordinator.async_cook_meal_card(
            meal_card_id=call.data[ATTR_MEAL_CARD_ID],
        )

    async def async_generate_draft(call: ServiceCall) -> None:
        coordinator = _get_coordinator(hass)
        await coordinator.async_generate_draft(
            count=call.data.get(ATTR_COUNT, 6),
        )

    async def async_validate_draft(call: ServiceCall) -> None:
        coordinator = _get_coordinator(hass)
        await coordinator.async_validate_draft(
            draft_id=call.data[ATTR_DRAFT_ID],
            selected_indices=call.data.get(ATTR_SELECTED_INDICES),
            modifications=call.data.get(ATTR_MODIFICATIONS),
        )

    async def async_clear_cards_and_history(call: ServiceCall) -> None:
        coordinator = _get_coordinator(hass)
        await coordinator.async_clear_cards_and_history()

    hass.services.async_register(
        DOMAIN,
        SERVICE_ADD_RECIPE,
        async_add_recipe,
        schema=vol.Schema(
            {
                vol.Required(ATTR_TITLE): cv.string,
                vol.Optional(ATTR_SERVINGS, default=2): vol.All(
                    vol.Coerce(int),
                    vol.Range(min=1, max=20),
                ),
                vol.Optional(ATTR_COOKING_MINUTES): vol.All(
                    vol.Coerce(int),
                    vol.Range(min=0, max=1440),
                ),
                vol.Optional(ATTR_TAGS, default=[]): vol.All(
                    cv.ensure_list,
                    [cv.string],
                ),
            }
        ),
    )

    hass.services.async_register(
        DOMAIN,
        SERVICE_MOVE_MEAL_CARD,
        async_move_meal_card,
        schema=vol.Schema(
            {
                vol.Required(ATTR_MEAL_CARD_ID): cv.string,
                vol.Required(ATTR_PLACEMENT): vol.In(PLACEMENTS),
                vol.Optional(ATTR_POSITION): vol.All(
                    vol.Coerce(int),
                    vol.Range(min=0),
                ),
            }
        ),
    )

    hass.services.async_register(
        DOMAIN,
        SERVICE_COOK_MEAL_CARD,
        async_cook_meal_card,
        schema=vol.Schema(
            {
                vol.Required(ATTR_MEAL_CARD_ID): cv.string,
            }
        ),
    )

    hass.services.async_register(
        DOMAIN,
        SERVICE_GENERATE_DRAFT,
        async_generate_draft,
        schema=vol.Schema(
            {
                vol.Optional(ATTR_COUNT, default=6): vol.All(
                    vol.Coerce(int),
                    vol.Range(min=1, max=10),
                ),
            }
        ),
    )

    hass.services.async_register(
        DOMAIN,
        SERVICE_VALIDATE_DRAFT,
        async_validate_draft,
        schema=vol.Schema(
            {
                vol.Required(ATTR_DRAFT_ID): cv.string,
                vol.Optional(ATTR_SELECTED_INDICES): vol.All(
                    cv.ensure_list,
                    [vol.All(vol.Coerce(int), vol.Range(min=0))],
                ),
                vol.Optional(ATTR_MODIFICATIONS): dict,
            }
        ),
    )

    hass.services.async_register(
        DOMAIN,
        SERVICE_CLEAR_CARDS_AND_HISTORY,
        async_clear_cards_and_history,
        schema=vol.Schema({}),
    )


async def async_unload_services(hass: HomeAssistant) -> None:
    """Supprime les services À table."""
    for service in (
        SERVICE_ADD_RECIPE,
        SERVICE_MOVE_MEAL_CARD,
        SERVICE_COOK_MEAL_CARD,
        SERVICE_GENERATE_DRAFT,
        SERVICE_VALIDATE_DRAFT,
        SERVICE_CLEAR_CARDS_AND_HISTORY,
    ):
        if hass.services.has_service(DOMAIN, service):
            hass.services.async_remove(DOMAIN, service)


def _get_coordinator(hass: HomeAssistant):
    """Retourne le coordinateur de l'unique instance configurée."""
    entries = hass.data.get(DOMAIN, {})

    if not entries:
        raise RuntimeError("L'intégration À table n'est pas configurée")

    first_entry = next(iter(entries.values()))
    return first_entry[DATA_COORDINATOR]