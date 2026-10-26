'use strict'
const test = require('node:test')
const assert = require('node:assert')
const listed = require('../packages/valentus-layout/supplemental-ui/helpers/valentus-bc-component-listed.js')

const ctx = (keys, current) => ({ data: { root: { site: { keys }, page: current ? { component: { name: current } } : {} } } })

test('lists every component without the opt-in key', () => {
  assert.strictEqual(listed({ name: 'b' }, ctx({ site_nav_tree_include: 'a' }, 'a')), true)
})

test('site-nav-tree mode limits to include roots plus current component', () => {
  const keys = { valentus_bc_components: 'site-nav-tree', site_nav_tree_include: 'a,c', site_nav_tree_exclude: 'x' }
  assert.strictEqual(listed({ name: 'a' }, ctx(keys, 'z')), true)
  assert.strictEqual(listed({ name: 'b' }, ctx(keys, 'z')), false)
  assert.strictEqual(listed({ name: 'z' }, ctx(keys, 'z')), true)
  assert.strictEqual(listed({ name: 'x' }, ctx({ ...keys, site_nav_tree_include: '' }, 'z')), false)
  assert.strictEqual(listed({ name: 'q' }, ctx({ ...keys, site_nav_tree_include: '' }, 'z')), true)
})