'use strict'

/**
 * Breadcrumb version control mode for the current page.
 * @returns {'hide'|'plain'|'menu'}
 * - menu: multiple versions → dropdown
 * - plain: exactly one named version → text (link-styled chrome)
 * - hide: unversioned / implicit default (`~`) only, or no version
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
    return isImplicitVersion(cv) ? 'hide' : 'plain'
  }
  return 'hide'
}
