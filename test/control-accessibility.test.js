'use strict'
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const path = require('node:path')
const css = readFileSync(path.join(__dirname, '../packages/valentus-layout/supplemental-ui/css/site-visual.css'), 'utf8')
test('nav chevrons mask a pseudo element, never the keyboard-focus box', () => {
 const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
 for (const [, selector, body] of rules) if (selector.includes('.nav-item-toggle') && body.includes('mask-image')) assert.ok(selector.includes('::before'), selector)
 assert.match(css, /nav\.nav-menu \.nav-item-toggle:focus/)
 assert.match(css, /outline: 2px solid var\(--valentus-accent\) !important/)
})
test('search controls and nav filter expose accessible focus/boundary styles', () => {
 assert.match(css, /#search-input:focus,\s*#valentus-search-scope:focus/)
 assert.match(css, /\.nav-panel-menu \.nav-tree-filter-input\s*\{\s*border-color: var\(--valentus-ink-muted\)/)
})
