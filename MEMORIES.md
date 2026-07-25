# MEMORIES

Durable facts for agents working in this repository.

## Antora nav panel blocks multi-click select (uses: 1)

Antora UI default `site.js` (nav panel): `mousedown` with `detail > 1` → `preventDefault()` so double-clicking nav labels does not select text. Any `#search-input` (or other form control) nested under `[data-panel=menu]` cannot select-on-dblclick unless Valentus stops propagation at `#search-field` (see `site-visual.js` / `site-search-chat.js`). Not a lunr `search-ui.js` bug (`confineEvent` only stops click propagation). Tool-band search outside the panel avoids the handler entirely.

## Antora `site.keys` camelCase (uses: 1)

Playbook YAML uses snake_case (`header_logo_dark`, `dark_mode_navbar`).
Antora's playbook builder camelCases those names in the UI model (`headerLogoDark`, `darkModeNavbar`).
Handlebars partials must read the camelCase form. Snake_case `lookup` silently misses and falls back to defaults.

## Worktree sibling for demos (uses: 1)

Visual redesign demo lives in sibling worktree
`Z:\code\github.com\antora-supplemental\valentus-theme-visual-redesign`
(often on `feature/antora-search-chat` or demo branches). Main checkout stays on `main` / fix branches.

## Antora rejects linked worktrees as content sources (uses: 1)

`content.sources` with `url: .` fails in a git worktree (`.git` is a file).
Use a playbook that points `url` at a sibling normal clone (e.g. `antora-playbook-visual-demo.yml` → `../valentus-theme`), or build from a non-worktree checkout.
