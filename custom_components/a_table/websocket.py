"""API WebSocket de À table."""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import config_validation as cv

from .const import DATA_COORDINATOR, DOMAIN, PLACEMENTS


def async_register_websocket_commands(hass: HomeAssistant) -> None:
    """Enregistre les commandes WebSocket de À table."""

    websocket_api.async_register_command(hass, websocket_get_data)
    websocket_api.async_register_command(hass, websocket_add_recipe)
    websocket_api.async_register_command(hass, websocket_move_meal_card)
    websocket_api.async_register_command(hass, websocket_cook_meal_card)
    websocket_api.async_register_command(hass, websocket_generate_draft)
    websocket_api.async_register_command(hass, websocket_validate_draft)
    websocket_api.async_register_command(hass, websocket_update_preferences)
    websocket_api.async_register_command(hass, websocket_update_generation_rules)
    websocket_api.async_register_command(hass, websocket_add_temporary_ingredient)
    websocket_api.async_register_command(hass, websocket_update_temporary_ingredient)
    websocket_api.async_register_command(hass, websocket_remove_temporary_ingredient)
    websocket_api.async_register_command(hass, websocket_clear_cards_and_history)
    websocket_api.async_register_command(hass, websocket_toggle_favorite)
    websocket_api.async_register_command(hass, websocket_rate_recipe)
    websocket_api.async_register_command(hass, websocket_add_recipe_to_backlog)
    websocket_api.async_register_command(hass, websocket_toggle_shopping_item)
    websocket_api.async_register_command(hass, websocket_clear_shopping_checked)
    websocket_api.async_register_command(hass, websocket_analyze_tastes)
    websocket_api.async_register_command(hass, websocket_regenerate_proposal)
    websocket_api.async_register_command(hass, websocket_export_shopping_list)
    websocket_api.async_register_command(hass, websocket_import_recipe)


@callback
def _get_coordinator(hass: HomeAssistant):
    """Retourne le coordinateur de l'unique instance configurée."""
    entries = hass.data.get(DOMAIN, {})

    if not entries:
        raise RuntimeError("L'intégration À table n'est pas configurée")

    first_entry = next(iter(entries.values()))
    return first_entry[DATA_COORDINATOR]


@websocket_api.websocket_command(
    {
        vol.Required("type"): "a_table/get_data",
    }
)
@websocket_api.async_response
async def websocket_get_data(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Retourne toutes les données nécessaires à l'interface."""
    coordinator = _get_coordinator(hass)
    connection.send_result(msg["id"], coordinator.get_data())


@websocket_api.websocket_command(
    {
        vol.Required("type"): "a_table/add_recipe",
        vol.Required("title"): str,
        vol.Optional("servings", default=2): vol.All(
            vol.Coerce(int),
            vol.Range(min=1, max=20),
        ),
        vol.Optional("cooking_minutes"): vol.All(
            vol.Coerce(int),
            vol.Range(min=0, max=1440),
        ),
        vol.Optional("tags", default=[]): [str],
    }
)
@websocket_api.async_response
async def websocket_add_recipe(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Ajoute une recette minimale."""
    coordinator = _get_coordinator(hass)

    try:
        card = await coordinator.async_add_recipe(
            title=msg["title"],
            servings=msg["servings"],
            cooking_minutes=msg.get("cooking_minutes"),
            tags=msg["tags"],
        )
    except ValueError as err:
        connection.send_error(msg["id"], "invalid_input", str(err))
        return

    connection.send_result(msg["id"], card)


@websocket_api.websocket_command(
    {
        vol.Required("type"): "a_table/move_meal_card",
        vol.Required("meal_card_id"): str,
        vol.Required("placement"): vol.In(PLACEMENTS),
        vol.Optional("position"): vol.All(
            vol.Coerce(int),
            vol.Range(min=0),
        ),
    }
)
@websocket_api.async_response
async def websocket_move_meal_card(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Déplace une carte-repas."""
    coordinator = _get_coordinator(hass)

    try:
        card = await coordinator.async_move_meal_card(
            meal_card_id=msg["meal_card_id"],
            placement=msg["placement"],
            position=msg.get("position"),
        )
    except ValueError as err:
        connection.send_error(msg["id"], "invalid_input", str(err))
        return

    connection.send_result(msg["id"], card)


@websocket_api.websocket_command(
    {
        vol.Required("type"): "a_table/cook_meal_card",
        vol.Required("meal_card_id"): str,
    }
)
@websocket_api.async_response
async def websocket_cook_meal_card(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Marque une carte comme cuisinée."""
    coordinator = _get_coordinator(hass)

    try:
        history_item = await coordinator.async_cook_meal_card(
            meal_card_id=msg["meal_card_id"],
        )
    except ValueError as err:
        connection.send_error(msg["id"], "invalid_input", str(err))
        return

    connection.send_result(msg["id"], history_item)


@websocket_api.websocket_command(
    {
        vol.Required("type"): "a_table/generate_draft",
        vol.Optional("count", default=6): vol.All(
            vol.Coerce(int),
            vol.Range(min=1, max=10),
        ),
    }
)
@websocket_api.async_response
async def websocket_generate_draft(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Génère un brouillon de propositions de repas."""
    coordinator = _get_coordinator(hass)

    try:
        result = await coordinator.async_generate_draft(
            count=msg.get("count", 6),
        )
    except ValueError as err:
        connection.send_error(msg["id"], "invalid_input", str(err))
        return

    connection.send_result(msg["id"], result)


@websocket_api.websocket_command(
    {
        vol.Required("type"): "a_table/validate_draft",
        vol.Required("draft_id"): str,
        vol.Optional("selected_indices"): vol.All(
            cv.ensure_list,
            [vol.All(vol.Coerce(int), vol.Range(min=0))],
        ),
        vol.Optional("modifications"): dict,
        vol.Optional("discard", default=False): bool,
    }
)
@websocket_api.async_response
async def websocket_validate_draft(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Valide un brouillon ou le supprime si discard=True."""
    coordinator = _get_coordinator(hass)

    try:
        result = await coordinator.async_validate_draft(
            draft_id=msg["draft_id"],
            selected_indices=msg.get("selected_indices"),
            modifications=msg.get("modifications"),
            discard=msg.get("discard", False),
        )
    except ValueError as err:
        connection.send_error(msg["id"], "invalid_input", str(err))
        return

    connection.send_result(msg["id"], result)


@websocket_api.websocket_command(
    {
        vol.Required("type"): "a_table/update_preferences",
        vol.Optional("preferences"): dict,
    }
)
@websocket_api.async_response
async def websocket_update_preferences(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Met à jour les préférences utilisateur."""
    coordinator = _get_coordinator(hass)

    try:
        await coordinator.async_update_preferences(msg.get("preferences", {}))
    except ValueError as err:
        connection.send_error(msg["id"], "invalid_input", str(err))
        return

    connection.send_result(msg["id"], coordinator.get_data())


@websocket_api.websocket_command(
    {
        vol.Required("type"): "a_table/update_generation_rules",
        vol.Optional("rules"): dict,
    }
)
@websocket_api.async_response
async def websocket_update_generation_rules(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Met à jour les règles de génération."""
    coordinator = _get_coordinator(hass)

    try:
        await coordinator.async_update_generation_rules(msg.get("rules", {}))
    except ValueError as err:
        connection.send_error(msg["id"], "invalid_input", str(err))
        return

    connection.send_result(msg["id"], coordinator.get_data())


@websocket_api.websocket_command(
    {
        vol.Required("type"): "a_table/add_temporary_ingredient",
        vol.Required("ingredient"): dict,
    }
)
@websocket_api.async_response
async def websocket_add_temporary_ingredient(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Ajoute un aliment temporaire."""
    coordinator = _get_coordinator(hass)

    try:
        await coordinator.async_add_temporary_ingredient(msg["ingredient"])
    except ValueError as err:
        connection.send_error(msg["id"], "invalid_input", str(err))
        return

    connection.send_result(msg["id"], coordinator.get_data())


@websocket_api.websocket_command(
    {
        vol.Required("type"): "a_table/update_temporary_ingredient",
        vol.Required("ingredient_id"): str,
        vol.Required("updates"): dict,
    }
)
@websocket_api.async_response
async def websocket_update_temporary_ingredient(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Met à jour un aliment temporaire."""
    coordinator = _get_coordinator(hass)

    try:
        await coordinator.async_update_temporary_ingredient(msg["ingredient_id"], msg["updates"])
    except ValueError as err:
        connection.send_error(msg["id"], "invalid_input", str(err))
        return

    connection.send_result(msg["id"], coordinator.get_data())


@websocket_api.websocket_command(
    {
        vol.Required("type"): "a_table/remove_temporary_ingredient",
        vol.Required("ingredient_id"): str,
    }
)
@websocket_api.async_response
async def websocket_remove_temporary_ingredient(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Supprime un aliment temporaire."""
    coordinator = _get_coordinator(hass)

    try:
        await coordinator.async_remove_temporary_ingredient(msg["ingredient_id"])
    except ValueError as err:
        connection.send_error(msg["id"], "invalid_input", str(err))
        return

    connection.send_result(msg["id"], coordinator.get_data())


@websocket_api.websocket_command(
    {
        vol.Required("type"): "a_table/clear_cards_and_history",
    }
)
@websocket_api.async_response
async def websocket_clear_cards_and_history(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Vide toutes les cartes, recettes, brouillons et historique."""
    coordinator = _get_coordinator(hass)

    try:
        await coordinator.async_clear_cards_and_history()
    except ValueError as err:
        connection.send_error(msg["id"], "invalid_input", str(err))
        return

    connection.send_result(msg["id"], coordinator.get_data())


@websocket_api.websocket_command(
    {
        vol.Required("type"): "a_table/toggle_favorite",
        vol.Required("recipe_id"): str,
    }
)
@websocket_api.async_response
async def websocket_toggle_favorite(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Bascule le statut favori d'une recette."""
    coordinator = _get_coordinator(hass)

    try:
        recipe = await coordinator.async_toggle_favorite(msg["recipe_id"])
    except ValueError as err:
        connection.send_error(msg["id"], "invalid_input", str(err))
        return

    connection.send_result(msg["id"], recipe)


@websocket_api.websocket_command(
    {
        vol.Required("type"): "a_table/rate_recipe",
        vol.Required("recipe_id"): str,
        vol.Required("liked"): bool,
        vol.Optional("comment", default=""): str,
    }
)
@websocket_api.async_response
async def websocket_rate_recipe(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Ajoute un retour (aimé/pas aimé + commentaire) à une recette."""
    coordinator = _get_coordinator(hass)

    try:
        recipe = await coordinator.async_rate_recipe(
            recipe_id=msg["recipe_id"],
            liked=msg["liked"],
            comment=msg.get("comment", ""),
        )
    except ValueError as err:
        connection.send_error(msg["id"], "invalid_input", str(err))
        return

    connection.send_result(msg["id"], recipe)


@websocket_api.websocket_command(
    {
        vol.Required("type"): "a_table/add_recipe_to_backlog",
        vol.Required("recipe_id"): str,
        vol.Optional("servings"): vol.All(
            vol.Coerce(int),
            vol.Range(min=1, max=20),
        ),
    }
)
@websocket_api.async_response
async def websocket_add_recipe_to_backlog(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Ajoute une carte dans À cuisiner à partir d'une recette existante."""
    coordinator = _get_coordinator(hass)

    try:
        card = await coordinator.async_add_recipe_to_backlog(
            recipe_id=msg["recipe_id"],
            servings=msg.get("servings"),
        )
    except ValueError as err:
        connection.send_error(msg["id"], "invalid_input", str(err))
        return

    connection.send_result(msg["id"], card)


@websocket_api.websocket_command(
    {
        vol.Required("type"): "a_table/toggle_shopping_item",
        vol.Required("key"): str,
    }
)
@websocket_api.async_response
async def websocket_toggle_shopping_item(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Bascule l'état coché d'un article de la liste de courses."""
    coordinator = _get_coordinator(hass)
    checked = await coordinator.async_toggle_shopping_item(msg["key"])
    connection.send_result(msg["id"], checked)


@websocket_api.websocket_command(
    {
        vol.Required("type"): "a_table/clear_shopping_checked",
    }
)
@websocket_api.async_response
async def websocket_clear_shopping_checked(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Vide l'état coché de la liste de courses."""
    coordinator = _get_coordinator(hass)
    await coordinator.async_clear_shopping_checked()
    connection.send_result(msg["id"], coordinator.get_data())


@websocket_api.websocket_command(
    {
        vol.Required("type"): "a_table/analyze_tastes",
    }
)
@websocket_api.async_response
async def websocket_analyze_tastes(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Analyse l'historique récent via l'IA pour suggérer des goûts."""
    coordinator = _get_coordinator(hass)

    try:
        result = await coordinator.async_analyze_tastes()
    except ValueError as err:
        connection.send_error(msg["id"], "invalid_input", str(err))
        return

    connection.send_result(msg["id"], result)


@websocket_api.websocket_command(
    {
        vol.Required("type"): "a_table/regenerate_proposal",
        vol.Required("draft_id"): str,
        vol.Required("index"): vol.All(vol.Coerce(int), vol.Range(min=0)),
    }
)
@websocket_api.async_response
async def websocket_regenerate_proposal(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Remplace une seule proposition d'un brouillon via l'IA."""
    coordinator = _get_coordinator(hass)

    try:
        proposal = await coordinator.async_regenerate_proposal(
            draft_id=msg["draft_id"],
            index=msg["index"],
        )
    except ValueError as err:
        connection.send_error(msg["id"], "invalid_input", str(err))
        return

    connection.send_result(msg["id"], proposal)


@websocket_api.websocket_command(
    {
        vol.Required("type"): "a_table/export_shopping_list",
        vol.Required("recipe_ids"): [str],
    }
)
@websocket_api.async_response
async def websocket_export_shopping_list(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Marque des recettes comme déjà exportées vers la liste de tâches."""
    coordinator = _get_coordinator(hass)
    await coordinator.async_export_shopping_list(msg["recipe_ids"])
    connection.send_result(msg["id"], coordinator.get_data())


@websocket_api.websocket_command(
    {
        vol.Required("type"): "a_table/import_recipe",
        vol.Optional("text"): str,
        vol.Optional("media_content_id"): str,
        vol.Optional("media_content_type"): str,
    }
)
@websocket_api.async_response
async def websocket_import_recipe(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Structure une recette (texte et/ou photo) via l'IA et l'ajoute au backlog."""
    coordinator = _get_coordinator(hass)

    try:
        card = await coordinator.async_import_recipe(
            text=msg.get("text"),
            media_content_id=msg.get("media_content_id"),
            media_content_type=msg.get("media_content_type"),
        )
    except ValueError as err:
        connection.send_error(msg["id"], "invalid_input", str(err))
        return

    connection.send_result(msg["id"], card)