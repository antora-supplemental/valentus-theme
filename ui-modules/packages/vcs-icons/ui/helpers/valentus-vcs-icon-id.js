'use strict'

/**
 * Hostname → VCS icon id for Handlebars (header / baked <img> src).
 * Canonical copy lives in `@antora-supplemental/page-edit`; this mirror keeps
 * the UI bundle self-contained when the Antora extension is not installed.
 */
function vcsIconIdFromUrl (url, unknownId) {
  const fallback = unknownId || 'code'
  if (!url) return fallback
  let host
  try {
    host = new URL(url).hostname.toLowerCase()
  } catch {
    return fallback
  }
  if (
    host === 'github.com' ||
    host === 'raw.githubusercontent.com' ||
    host === 'github.dev' ||
    host.endsWith('.github.com')
  ) {
    return 'github'
  }
  if (host === 'bitbucket.org' || host.includes('bitbucket.')) return 'bitbucket'
  if (host.includes('gitlab')) return 'gitlab'
  if (host === 'codeberg.org' || host.endsWith('.codeberg.page') || host.endsWith('.codeberg.org')) {
    return 'codeberg'
  }
  if (host.includes('gitea')) return 'gitea'
  if (host.includes('forgejo')) return 'forgejo'
  if (host.includes('sourcehut') || host.endsWith('sr.ht') || host === 'git.sr.ht') {
    return 'sourcehut'
  }
  return fallback
}

module.exports = (url, unknownIdOrOptions) => {
  const unknownId =
    typeof unknownIdOrOptions === 'string' ? unknownIdOrOptions : 'code'
  try {
    return require('@antora-supplemental/page-edit').adtVcsIconIdHelper(url, unknownId)
  } catch {
    return vcsIconIdFromUrl(url, unknownId)
  }
}
