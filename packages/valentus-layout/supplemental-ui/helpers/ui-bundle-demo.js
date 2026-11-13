'use strict'

const fs = require('node:fs')
const path = require('node:path')

function httpUrl (value) {
  if (typeof value !== 'string') return ''
  const v = value.trim()
  if (!/^https?:\/\//i.test(v)) return ''
  return v
}

function readJson (file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (_) {
    return null
  }
}

/**
 * Demo URL for this UI bundle.
 * Shipped copy: supplemental-ui/ui-bundle.json `demo`.
 * Repo copy: package.json `antoraRegistry.demo` (the descriptor extension-lister reads).
 * The current site URL and the forge homepage are not used.
 */
function uiBundleDemo () {
  const bundled = readJson(path.join(__dirname, '..', 'ui-bundle.json'))
  const fromBundle = httpUrl(bundled && bundled.demo)
  if (fromBundle) return fromBundle
  const pkg = readJson(path.join(__dirname, '..', '..', '..', 'package.json'))
  return httpUrl(pkg && pkg.antoraRegistry && pkg.antoraRegistry.demo)
}

module.exports = uiBundleDemo
