'use strict'

const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { fadeState } = require('../packages/valentus-layout/supplemental-ui/js/valentus-breadcrumb-scroll')

const ui = path.join(__dirname, '../packages/valentus-layout/supplemental-ui')

describe('breadcrumb scroller fadeState', () => {
  it('shows no fades without overflow', () => {
    assert.deepEqual(fadeState(0, 300, 300), { overflow: false, start: false, end: false })
  })
  it('fades only the end at the start', () => {
    assert.deepEqual(fadeState(0, 300, 800), { overflow: true, start: false, end: true })
  })
  it('fades both edges mid-scroll, independently', () => {
    assert.deepEqual(fadeState(1, 300, 800), { overflow: true, start: true, end: true })
    assert.deepEqual(fadeState(498, 300, 800), { overflow: true, start: true, end: true })
  })
  it('fades only the start at the end', () => {
    assert.deepEqual(fadeState(500, 300, 800), { overflow: true, start: true, end: false })
  })
  it('handles RTL negative scrollLeft', () => {
    assert.deepEqual(fadeState(-250, 300, 800), { overflow: true, start: true, end: true })
  })
})

describe('breadcrumb scroller CSS + wiring', () => {
  const css = fs.readFileSync(path.join(ui, 'css/site-doc-layout.css'), 'utf8')
  it('hides the scrollbar and keeps one line', () => {
    assert.match(css, /scrollbar-width:\s*none/)
    assert.match(css, /\.valentus-breadcrumbs > ul::-webkit-scrollbar\s*\{\s*display:\s*none/)
    assert.match(css, /overscroll-behavior-x:\s*contain/)
  })
  it('fades with a mask, not colored overlays', () => {
    assert.match(css, /ul\.is-fade-end\s*\{[^}]*mask-image|mask-image:\s*linear-gradient\(to right, transparent 0/)
  })
  it('loads the script from footer-scripts', () => {
    const hbs = fs.readFileSync(path.join(ui, 'partials/footer-scripts.hbs'), 'utf8')
    assert.match(hbs, /js\/valentus-breadcrumb-scroll\.js/)
  })
  it('ui-module mirror matches the layout CSS', () => {
    const mirror = fs.readFileSync(path.join(__dirname, '../ui-modules/packages/doc-layout/ui/css/site-doc-layout.css'), 'utf8')
    assert.equal(mirror, css)
  })
})