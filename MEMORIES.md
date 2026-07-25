# MEMORIES

Durable facts for agents working in this repository.

## Antora `site.keys` camelCase (uses: 1)

Playbook YAML uses snake_case (`header_logo_dark`, `dark_mode_navbar`).
Antora's playbook builder camelCases those names in the UI model (`headerLogoDark`, `darkModeNavbar`).
Handlebars partials must read the camelCase form. Snake_case `lookup` silently misses and falls back to defaults.
