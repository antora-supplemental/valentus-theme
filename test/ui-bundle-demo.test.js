'use strict'

const { readFileSync } = require('node:fs')
const path = require('node:path')
const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const uiBundleDemo = require('../packages/valentus-layout/supplemental-ui/helpers/ui-bundle-demo')

const root = path.join(__dirname, '..')

describe('ui bundle demo', () => {
  it('reads antoraRegistry.demo and does not use the current site url', () => {
    const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'))
    const bundled = JSON.parse(readFileSync(
      path.join(root, 'packages/valentus-layout/supplemental-ui/ui-bundle.json'),
      'utf8',
    ))
    const footer = readFileSync(
      path.join(root, 'packages/valentus-layout/supplemental-ui/partials/footer-content.hbs'),
      'utf8',
    )
    assert.equal(bundled.demo, pkg.antoraRegistry.demo)
    assert.equal(uiBundleDemo(), 'https://antora-supplemental.github.io/valentus-theme')
    assert.match(footer, /ui-bundle-demo/)
    assert.doesNotMatch(footer, /site\.url/)
  })
})
