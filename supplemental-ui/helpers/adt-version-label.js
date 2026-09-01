'use strict'

/**
 * Version kicker / dropdown label: show named versions as-is; implicit default → fallback.
 * Button fallback: "Version"; dropdown row fallback: "Default".
 */
function isNamedVersion (value) {
  if (value == null) return false
  const s = String(value).trim()
  return s !== '' && s.toLowerCase() !== 'default'
}

module.exports = (versionRef, { hash } = {}) => {
  const fallback = (hash && hash.fallback) || 'Version'
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
