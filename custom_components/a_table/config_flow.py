"""Configuration de l'intégration À table."""

from __future__ import annotations

import voluptuous as vol

from homeassistant import config_entries
from homeassistant.const import CONF_NAME

from .const import DOMAIN


class ATableConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Gère le flux de configuration de À table."""

    VERSION = 1

    async def async_step_user(self, user_input=None):
        """Configure À table."""

        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()

        if user_input is not None:
            return self.async_create_entry(
                title=user_input[CONF_NAME],
                data={
                    CONF_NAME: user_input[CONF_NAME],
                },
            )

        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema(
                {
                    vol.Required(CONF_NAME, default="À table"): str,
                }
            ),
        )