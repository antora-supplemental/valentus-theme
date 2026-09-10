'use strict'

/**
 * Breadcrumb version control mode for the current page.
 * @returns {'hide'|'plain'|'menu'}
 * - menu: multiple versions, or a single implicit/unversioned (`~`) version
 * - plain: exactly one named version → text (not a dropdown)
 * - hide: no version at all
 */
function isImplicitVersion (cv) {
  if (!cv) return true
  const version = cv.version != null ? String(cv.version).trim() : ''
  const display =
    cv.displayVersion != null ? String(cv.displayVersion).trim() : ''
  if (version === '~' || version === '') return true
  const d = display.toLowerCase()
  if (!display || d === 'default' || d === '~') {
    // Named version string still counts as visible (e.g. version "0.1" with empty display)
    if (version && version !== '~') return false
    return true
  }
  return false
}

function versionCount (page) {
  if (!page) return 0
  if (Array.isArray(page.versions) && page.versions.length) return page.versions.length
  if (page.componentVersion) return 1
  return 0
}

module.exports = (page) => {
  const n = versionCount(page)
  if (n > 1) return 'menu'
  if (n === 1) {
    const cv =
      page.componentVersion ||
      (Array.isArray(page.versions) && page.versions[0]) ||
      null
    // Single `~` still gets a menu (button label "Version"; rows show `~`) so the
    // mast keeps a real segment instead of an empty `/  /` gap when the component
    // kicker is hidden.
    return isImplicitVersion(cv) ? 'menu' : 'plain'
  }
  return 'hide'
}
