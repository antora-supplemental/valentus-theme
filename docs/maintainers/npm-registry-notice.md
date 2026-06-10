# npm: web deprecate + final patch publish (use both)

## Already deprecated on npmjs.com?

You cannot “double-deprecate.” Running `npm deprecate` again (CLI) or using the website **replaces** the message on the versions you target—it does not stack.

| Action | Updates banner message? | Updates README tab? |
|--------|-------------------------|-------------------|
| npm website **Deprecate package** | Yes (registry metadata) | No |
| `npm deprecate pkg@* "new text"` | Yes (overwrites previous message) | No |
| `npm publish` patch with new `README.md` | No (unless `deprecated` in tarball) | **Yes** |

**Why both:** npm’s deprecation **banner** is a separate UI layer and often has poor contrast in npm’s dark theme. The **README** is normal Markdown and stays readable. Publish `1.0.10` so the README tab shows the formal notice; keep or refresh the registry banner with a **short** CLI message that points to the README.

## Recommended sequence (after web deprecate)

### 1. Publish final patch (README fix)

```powershell
cd Z:\code\github.com\antora-supplemental\valentus-theme
# In package.json: remove "private": true (restore after)
npm publish --access public
# Restore "private": true in git
```

Version in git: **1.0.10** (includes `deprecated` in `package.json` + `README.md`).

### 2. Short banner message (CLI — overwrites web text)

Use one line so the npm banner stays readable in dark mode:

```bash
npm deprecate valentus-theme@* "RETIRED — Do not install. Open README tab or use GitHub ui-bundle.zip (see releases)."
```

To target only old tarballs and leave the banner logic on latest:

```bash
npm deprecate valentus-theme@"<1.0.10" "RETIRED — use ui-bundle.zip; see v1.0.10 README on npm or GitHub releases."
```

### 3. Optional: undeprecate then re-deprecate

If the website left the package in a bad state, set message to empty then set again:

```bash
npm deprecate valentus-theme@* ""
npm deprecate valentus-theme@* "RETIRED — Do not install. See README on this package page."
```

## `npm deprecate` alone (what you did on the web)

- Shows a **banner** on the package page (when npm’s UI renders it).
- Prints **`npm WARN deprecated`** on install.
- Does **not** change the README (npm still shows **1.0.9** install docs until you publish **1.0.10**).

## GitHub `ui-bundle.zip`

Unrelated to npm publish. Tag `v1.0.10` in git when you want a matching GitHub Release asset; release workflow does not publish npm.
