'use strict'

/**
 * Breadcrumb trail items for the mast.
 * When `@antora-supplemental/site-nav-tree` is active (`site.keys.site_nav_tree`):
 * 1. Strip leading crumbs that are foreign component roots (esp. Home / site home)
 * 2. Drop a leading crumb that duplicates the *current* component root (already in
 *    the sidebar forest / component kicker)
 *
 * Multi-component hubs often put `home` first in the forest and xref into other
 * components from home nav. Antora's trail can then start with Home even when
 * page.component is elsewhere. The icon-only house chip already covers site home —
 * the underlined trail should stay within the current component.
 */

function normalizeUrl (url) {
  if (url == null || url === '') return ''
  let u = String(url).split(/[?#]/)[0]
  u = u.replace(/\/index\.html$/i, '/')
  if (u.length > 1) u = u.replace(/\/+$/, '/') || '/'
  return u
}

function crumbContent (crumb) {
  if (!crumb || crumb.content == null) return ''
  return String(crumb.content).trim()
}

function componentRootUrl (component) {
  if (!component) return ''
  const latest = component.latest
  if (latest && latest.url) return latest.url
  const versions = component.versions
  if (Array.isArray(versions) && versions[0] && versions[0].url) return versions[0].url
  return component.url || ''
}

function componentRootTitle (component) {
  if (!component) return ''
  return (
    component.title ||
    (component.latest && (component.latest.title || component.latest.displayVersion)) ||
    ''
  )
}

function crumbMatchesComponentRoot (crumb, component) {
  if (!crumb || !component) return false
  const rootUrl = componentRootUrl(component)
  const rootTitle = componentRootTitle(component)
  const urlMatch =
    crumb.url && rootUrl && normalizeUrl(crumb.url) === normalizeUrl(rootUrl)
  const titleMatch =
    crumbContent(crumb) &&
    rootTitle &&
    crumbContent(crumb) === String(rootTitle).trim()
  return !!(urlMatch || titleMatch)
}

function isSiteHomeCrumb (crumb, site, homeComponent) {
  if (!crumb) return false
  const content = crumbContent(crumb)
  if (content.toLowerCase() === 'home') return true

  const homeUrl = site && site.homeUrl
  if (crumb.url && homeUrl && normalizeUrl(crumb.url) === normalizeUrl(homeUrl)) {
    return true
  }

  if (homeComponent && crumbMatchesComponentRoot(crumb, homeComponent)) return true
  return false
}

function findHomeComponent (site) {
  const components = site && site.components
  if (!components) return null
  if (components.home) return components.home
  if (typeof components[Symbol.iterator] === 'function') {
    for (const c of components) {
      if (c && (c.name === 'home' || String(c.title || '').trim() === 'Home')) return c
    }
  }
  for (const key of Object.keys(components)) {
    const c = components[key]
    if (c && (c.name === 'home' || key === 'home')) return c
  }
  return null
}

function listSiteComponents (site) {
  const components = site && site.components
  if (!components) return []
  if (typeof components[Symbol.iterator] === 'function') return Array.from(components)
  return Object.keys(components).map((k) => components[k]).filter(Boolean)
}

function isForeignComponentRootCrumb (crumb, site, currentComponentName) {
  if (!crumb) return false
  for (const component of listSiteComponents(site)) {
    const name = component && component.name
    if (!name || name === currentComponentName) continue
    if (crumbMatchesComponentRoot(crumb, component)) return true
  }
  return false
}

module.exports = (breadcrumbs, options) => {
  const list = Array.isArray(breadcrumbs) ? breadcrumbs.slice() : []
  if (!list.length) return list

  const root = options && options.data && options.data.root
  const site = root && root.site
  const keys = site && site.keys
  if (!keys || String(keys.site_nav_tree) !== 'true') return list

  const page = root.page
  const currentComponent = page && page.component
  const currentName = currentComponent && currentComponent.name
  const homeComponent = findHomeComponent(site)

  // 1. Drop leading foreign roots (Home first among them) / site-home crumbs
  while (list.length) {
    const first = list[0]
    const foreign =
      isSiteHomeCrumb(first, site, homeComponent) ||
      isForeignComponentRootCrumb(first, site, currentName)
    // Never strip the current component's own root here — step 2 owns that
    if (currentComponent && crumbMatchesComponentRoot(first, currentComponent)) break
    if (!foreign) break
    list.shift()
  }

  // 2. Drop leading crumb that duplicates the current component root
  const cv = page && page.componentVersion
  const componentUrl = cv && cv.url
  const componentTitle =
    (currentComponent && currentComponent.title) ||
    (cv && (cv.title || cv.displayVersion))

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