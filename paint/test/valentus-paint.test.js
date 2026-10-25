'use strict'
const { test } = require('node:test')
const assert = require('node:assert')
const fs = require('node:fs')
const path = require('node:path')
const ext = require('../lib/index.js')

function catalog (partials) {
  const files = Object.entries(partials).map(([stem, body]) => ({ type: 'partial', stem, contents: Buffer.from(body) }))
  return {
    files,
    findByType (t) { return files.filter((f) => f.type === t) },
    addFile (f) { files.push(f) },
  }
}

test('links at the paint slot when a head partial has one', () => {
  const c = catalog({ 'head-meta': `<a>\n${ext.SLOT}\n<link rel="stylesheet" href="layout.css">\n` })
  assert.strictEqual(ext.ensureValentusPaint(c, '_'), 'slot')
  const body = c.files[0].contents.toString()
  assert.ok(body.indexOf('valentus-paint.css') < body.indexOf('layout.css'))
  assert.ok(c.findByType('asset').some((f) => f.path === ext.ASSET))
})

test('appends to head-styles without a slot, once', () => {
  const c = catalog({ 'head-styles': '<link rel="stylesheet" href="{{{uiRootPath}}}/css/site.css">\n', 'head-meta': '' })
  assert.strictEqual(ext.ensureValentusPaint(c, '_'), 'append')
  assert.strictEqual(ext.ensureValentusPaint(c, '_'), 'present')
  assert.strictEqual(c.files[0].contents.toString().split('valentus-paint.css').length, 2)
})

test('paint css: hex values only in :root and html.dark-theme token blocks', () => {
  const css = fs.readFileSync(path.join(__dirname, '..', ext.ASSET), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
  let depth = 0; let start = 0
  for (let i = 0; i < css.length; i++) {
    if (css[i] === '{') depth++
    else if (css[i] === '}' && --depth === 0) {
      const block = css.slice(start, i + 1); start = i + 1
      const sel = block.slice(0, block.indexOf('{')).trim()
      if (/#[0-9a-fA-F]{3,8}\b/.test(block)) assert.ok([':root', 'html.dark-theme'].includes(sel), `hex in ${sel}`)
    }
  }
})

test('paint css defines the full --cs-* contract for both schemes', () => {
  const css = fs.readFileSync(path.join(__dirname, '..', ext.ASSET), 'utf8')
  for (const t of ['canvas', 'elevated', 'ink', 'ink-muted', 'border', 'accent', 'accent-hover', 'accent-soft', 'hover', 'code-bg', 'code-fg',
    'admonition-note', 'admonition-tip', 'admonition-important', 'admonition-warning', 'admonition-caution']) {
    assert.match(css, new RegExp(`--cs-${t}:`), t)
  }
})
