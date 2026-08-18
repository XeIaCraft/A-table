"""Ressource frontend pour À table."""

from __future__ import annotations

from pathlib import Path

from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant

URL_BASE = "/a-table"
MODULE_URL = f"{URL_BASE}/a-table.js"


async def async_register_frontend(hass: HomeAssistant) -> None:
    """Expose le dossier frontend de l'intégration via HTTP."""
    if hass.data.setdefault("a_table_frontend", {}).get("path_registered"):
        return

    frontend_path = Path(__file__).parent

    try:
        await hass.http.async_register_static_paths(
            [
                StaticPathConfig(
                    URL_BASE,
                    str(frontend_path),
                    cache_headers=False,
                )
            ]
        )
    except RuntimeError:
        pass

    hass.data["a_table_frontend"]["path_registered"] = True