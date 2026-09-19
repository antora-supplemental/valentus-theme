# Chassis consumption

Valentus *consumes* antora-ui-chassis; it does not own region contracts.

Bootstrap: `ui-modules/packages/doc-layout` still vendors viewport CSS/JS.
Next: sync from `antora-ui-chassis/packages/*` (copy, not antora-ui-default as a dep).

Default UI is a peer body kit + paint at `ui.bundle`. Vendor snippets by copy only.

## Dark / light

- Chassis: scheme hooks (`packages/color-scheme`)
- Valentus paint: palettes
- Valentus body: toggle placement

Goal: retire `antora-dark-mode` once the above lands for sites on chassis.