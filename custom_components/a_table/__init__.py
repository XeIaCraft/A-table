"""Intégration À table."""

from __future__ import annotations

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .const import DATA_COORDINATOR, DATA_STORE, DOMAIN
from .coordinator import ATableCoordinator
from .service import async_setup_services, async_unload_services
from .store import ATableStore
from .websocket import async_register_websocket_commands
from .frontend import async_register_frontend


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Configure l'intégration À table."""
    hass.data.setdefault(DOMAIN, {})
    await async_register_frontend(hass)

    store = ATableStore(hass)
    await store.async_load()

    coordinator = ATableCoordinator(hass, store)

    hass.data[DOMAIN][entry.entry_id] = {
        DATA_STORE: store,
        DATA_COORDINATOR: coordinator,
    }

    if len(hass.data[DOMAIN]) == 1:
        await async_setup_services(hass)

    if not hass.data[DOMAIN].get("websocket_registered"):
        async_register_websocket_commands(hass)
        hass.data[DOMAIN]["websocket_registered"] = True

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Décharge l'intégration À table."""
    hass.data[DOMAIN].pop(entry.entry_id, None)

    if not hass.data[DOMAIN]:
        await async_unload_services(hass)

    return True