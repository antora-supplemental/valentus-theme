# Agent notes — valentus-theme

Project facts for agents. Workstation/env facts live only in `$CODE_ROOT/MEMORIES.md` (never recreate a per-repo `MEMORIES.md`).

## Consumers / pin

Docs hubs pin Valentus `ui-bundle.zip` (prefer rolling `.../releases/download/v2/ui-bundle.zip` + `snapshot: true`):

- `FoodTruckNerdz/docs` (also `site/release_info.json` label)
- `antora-supplemental/docs`
- `openshellorg/docs`
- `dev-centr/docs`
- HCI Nerdz docs, connectome-fs docs, and other org hubs using the same pattern

After a Valentus patch release: update any exact pins / `release_info` label, then `gh workflow run` (or push) so Antora re-fetches the rolling `v2` asset.

## Antora UI quirks

- Default `site.js` nav panel: `mousedown` with `detail > 1` → `preventDefault()` so double-clicking nav labels does not select text. Nested `#search-input` under `[data-panel=menu]` cannot select-on-dblclick unless Valentus stops propagation at `#search-field` (`site-visual.js` / `site-search-chat.js`). Tool-band search outside the panel avoids the handler.
- Hub overrides of `head-meta.hbs` must keep the full Valentus CSS chain (`site-extra`, `site-doc-layout`, `site-visual`, `site-read-width`, `site-font-size`, `site-math`) + paint-hold / FOUC scripts; brand overlays only after that. Detail: docs guide Customization.
- Do not re-load `site.js` or Valentus footer scripts from hub `footer-content.hbs` when theme `footer-scripts.hbs` already injects them (double handlers → broken nav expand).
- Mast version control (`adt-version-mode`): hide when only `~` / unversioned; plain text for one named version; menu when multiple. Do not reintroduce a lone “Default” chip via hub overrides.
- Playbook YAML uses snake_case (`header_logo_dark`, `dark_mode_navbar`). Antora camelCases those names in the UI model (`headerLogoDark`, `darkModeNavbar`). Handlebars must read camelCase.
- `content.sources` with `url: .` fails in a git worktree (`.git` is a file). Point `url` at a sibling normal clone or build from a non-worktree checkout.

## Math

KaTeX via `supplemental-ui/js/site-math.js` + `css/site-math.css`. Playbooks still need `asciidoc.attributes.stem: latexmath`.
