'use strict'

/**
 * Whether a component belongs in the breadcrumb component dropdown.
 *
 * Opt-in: set site key `valentus_bc_components: site-nav-tree` to limit the dropdown to the
 * curated roots published by @antora-supplemental/site-nav-tree
 * (site.keys.site_nav_tree_include / site_nav_tree_exclude). The current page's component is
 * always listed. Without the key (or without an include list), every component is listed.
 */
const split = (v) =>
  String(v || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

module.exports = (component, { data } = {}) => {
  if (!component) return false
  const root = (data && data.root) || {}
  const keys = (root.site && root.site.keys) || {}
  const name = String(component.name != null ? component.name : component)
  const current = root.page && root.page.component && root.page.component.name
  if (current != null && String(current) === name) return true
  if (String(keys.valentus_bc_components || '').trim() !== 'site-nav-tree') return true
  if (split(keys.site_nav_tree_exclude).includes(name)) return false
  const include = split(keys.site_nav_tree_include)
  return include.length ? include.includes(name) : true
}
