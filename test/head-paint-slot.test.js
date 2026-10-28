'use strict'
// 4.3.2: the paint slot + valentus-chrome.css live in head-styles.hbs so hub
// overrides of head-meta.hbs (fonts, favicons) cannot drop the colour layer.
const { test } = require('node:test')
const assert = require('node:assert')
const fs = require('node:fs')
const path = require('node:path')
const P = path.join(__dirname, '..', 'packages', 'valentus-layout', 'supplemental-ui', 'partials')
const SLOT = '{{!-- color-scheme:paint-slot --}}'

test('head-styles carries site.css, then the paint slot, then valentus-chrome', () => {
  const s = fs.readFileSync(path.join(P, 'head-styles.hbs'), 'utf8')
  const a = s.indexOf('css/site.css'); const b = s.indexOf(SLOT); const c = s.indexOf('css/valentus-chrome.css')
  assert.ok(a >= 0 && b > a && c > b, 'order site.css < slot < chrome')
})

test('head-meta no longer carries the slot or the chrome link', () => {
  const m = fs.readFileSync(path.join(P, 'head-meta.hbs'), 'utf8')
  assert.ok(!m.includes(SLOT))
  assert.ok(!m.includes('css/valentus-chrome.css'))
})
