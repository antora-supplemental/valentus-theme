'use strict'

/**
 * Version kicker / dropdown label: named versions as-is; implicit default → fallback.
 * Default fallback is `~` (Antora’s unversioned marker) for dropdown rows.
 * Kickers pass fallback="Version" so the button reads “Version”, not `~`.
 */
function isNamedVersion (value) {
  if (value == null) return false
  const s = String(value).trim()
  if (s === '' || s === '~') return false
  const lower = s.toLowerCase()
  return lower !== 'default'
}

module.exports = (versionRef, { hash } = {}) => {
  const fallback = (hash && hash.fallback) || '~'
  let display
  let version
  if (versionRef && typeof versionRef === 'object') {
    display = versionRef.displayVersion
    version = versionRef.version
  } else {
    display = versionRef
    version = hash && hash.version
  }
  if (isNamedVersion(display)) return String(display)
  if (isNamedVersion(version)) return String(version)
  return fallback
}
