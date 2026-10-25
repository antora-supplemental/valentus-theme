'use strict'

/**
 * Breadcrumb trail items for the mast.
 *
 * When `@antora-supplemental/site-nav-tree` is active (`site.keys.site_nav_tree`):
 * 1. Strip leading crumbs that are foreign component roots (esp. Home / site home)
 * 2. Drop a leading crumb that duplicates the *current* component root (already in
 *    the sidebar forest / component kicker)
 *
 * Always (with or without site-nav-tree):
 * 3. Enrich intermediate crumbs that lack an internal URL by resolving a section
 *    landing from `page.navigation` (Overview/Home child, else first descendant
 *    with an internal URL). Nav titles (`. Section`) and parents unlinked by
 *    site-nav-tree promoteLinkedSectionLandings become clickable so readers can
 *    navigate up without scrolling the side-nav.
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

function hasInternalUrl (item) {
  return !!(item && item.url && (item.urlType === 'internal' || item.urlType == null || item.urlType === ''))
}

function navLabel (item) {
  return crumbContent(item).toLowerCase().replace(/\s+/g, ' ')
}

function isHomeNavItem (item) {
  if (!item) return false
  const text = navLabel(item)
  return text === 'home' || text === 'overview'
}

/**
 * Top-level list of nav items Antora / site-nav-tree expose on page.navigation.
 * Handles a single anonymous tree `{ items: [...] }` or a forest of roots.
 */
function navigationRoots (navigation) {
  if (!navigation) return []
  if (Array.isArray(navigation)) return navigation
  if (Array.isArray(navigation.items)) return navigation.items
  return []
}

function findChildByContent (siblings, content) {
  const want = String(content || '').trim()
  if (!want || !Array.isArray(siblings)) return null
  for (const item of siblings) {
    if (crumbContent(item) === want) return item
  }
  return null
}

function findDeepByContent (siblings, content) {
  const want = String(content || '').trim()
  if (!want || !Array.isArray(siblings)) return null
  for (const item of siblings) {
    if (crumbContent(item) === want) return item
    const nested = findDeepByContent(item.items, content)
    if (nested) return nested
  }
  return null
}

/**
 * Landing URL for a nav node: own internal URL, else Overview/Home child,
 * else first BFS descendant with an internal URL.
 */
function landingFromNavItem (item) {
  if (!item) return null
  if (hasInternalUrl(item)) {
    return { url: item.url, urlType: item.urlType || 'internal' }
  }
  const kids = Array.isArray(item.items) ? item.items : []
  const home = kids.find(isHomeNavItem)
  if (home && hasInternalUrl(home)) {
    return { url: home.url, urlType: home.urlType || 'internal' }
  }
  const queue = kids.slice()
  while (queue.length) {
    const node = queue.shift()
    if (!node) continue
    if (hasInternalUrl(node)) {
      return { url: node.url, urlType: node.urlType || 'internal' }
    }
    if (Array.isArray(node.items) && node.items.length) {
      queue.push(...node.items)
    }
  }
  return null
}

/**
 * Walk the trail against the sidebar nav and attach internal URLs to crumbs
 * that Antora left as bare section titles (or that site-nav-tree unlinked).
 */
function enrichCrumbUrls (crumbs, navigation) {
  const list = Array.isArray(crumbs) ? crumbs : []
  if (!list.length) return list

  let siblings = navigationRoots(navigation)
  const out = []

  for (let i = 0; i < list.length; i++) {
    const crumb = list[i]
    const copy = Object.assign({}, crumb)
    const label = crumbContent(crumb)

    let match = findChildByContent(siblings, label)
    if (!match) match = findDeepByContent(siblings, label)

    if (!hasInternalUrl(copy) && match) {
      const landing = landingFromNavItem(match)
      if (landing) {
        copy.url = landing.url
        copy.urlType = landing.urlType
      }
    }

    out.push(copy)

    if (match && Array.isArray(match.items) && match.items.length) {
      siblings = match.items
    }
  }

  return out
}

function stripSiteNavTreeDupes (list, site, page) {
  const currentComponent = page && page.component
  const currentName = currentComponent && currentComponent.name
  const homeComponent = findHomeComponent(site)
  const crumbs = list.slice()

  while (crumbs.length) {
    const first = crumbs[0]
    const foreign =
      isSiteHomeCrumb(first, site, homeComponent) ||
      isForeignComponentRootCrumb(first, site, currentName)
    if (currentComponent && crumbMatchesComponentRoot(first, currentComponent)) break
    if (!foreign) break
    crumbs.shift()
  }

  const cv = page && page.componentVersion
  const componentUrl = cv && cv.url
  const componentTitle =
    (currentComponent && currentComponent.title) ||
    (cv && (cv.title || cv.displayVersion))

  const first = crumbs[0]
  if (!first) return crumbs

  const urlMatch =
    first.url &&
    componentUrl &&
    normalizeUrl(first.url) === normalizeUrl(componentUrl)
  const titleMatch =
    first.content &&
    componentTitle &&
    String(first.content) === String(componentTitle)

  if (urlMatch || titleMatch) return crumbs.slice(1)
  return crumbs
}

function adtBcTrailCrumbs (breadcrumbs, options) {
  const list = Array.isArray(breadcrumbs) ? breadcrumbs.slice() : []
  if (!list.length) return list

  const root = options && options.data && options.data.root
  const site = root && root.site
  const page = root && root.page
  const keys = site && site.keys

  let crumbs = list
  if (keys && String(keys.site_nav_tree) === 'true') {
    crumbs = stripSiteNavTreeDupes(crumbs, site, page)
  }

  return enrichCrumbUrls(crumbs, page && page.navigation)
}

module.exports = adtBcTrailCrumbs
module.exports.enrichCrumbUrls = enrichCrumbUrls
module.exports.landingFromNavItem = landingFromNavItem
module.exports.hasInternalUrl = hasInternalUrl
module.exports.stripSiteNavTreeDupes = stripSiteNavTreeDupes