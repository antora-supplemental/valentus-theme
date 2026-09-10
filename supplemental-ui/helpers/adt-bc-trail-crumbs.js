'use strict'

/**
 * Breadcrumb trail items for the mast.
 * When `@antora-supplemental/site-nav-tree` is active (`site.keys.site_nav_tree`),
 * drop a leading crumb that duplicates the component root (already in the sidebar forest).
 */

function normalizeUrl (url) {
  if (url == null || url === '') return ''
  let u = String(url).split(/[?#]/)[0]
  u = u.replace(/\/index\.html$/i, '/')
  if (u.length > 1) u = u.replace(/\/+$/, '/') || '/'
  return u
}

module.exports = (breadcrumbs, options) => {
  const list = Array.isArray(breadcrumbs) ? breadcrumbs.slice() : []
  if (!list.length) return list

  const root = options && options.data && options.data.root
  const keys = root && root.site && root.site.keys
  if (!keys || String(keys.site_nav_tree) !== 'true') return list

  const page = root.page
  const cv = page && page.componentVersion
  const component = page && page.component
  const componentUrl = cv && cv.url
  const componentTitle =
    (component && component.title) || (cv && (cv.title || cv.displayVersion))

  const first = list[0]
  if (!first) return list

  const urlMatch =
    first.url &&
    componentUrl &&
    normalizeUrl(first.url) === normalizeUrl(componentUrl)
  const titleMatch =
    first.content &&
    componentTitle &&
    String(first.content) === String(componentTitle)

  if (urlMatch || titleMatch) return list.slice(1)
  return list
}
