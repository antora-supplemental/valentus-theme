#!/usr/bin/env node
'use strict'

/**
 * Vendors antora-dark-mode CSS/JS into supplemental-ui for bundled releases.
 * Run after antora-dark-mode updates: pnpm dark-mode:sync
 *
 * FOUC script lives in partials/head-meta.hbs (inline); keep in sync with
 * antora-dark-mode supplemental-ui/partials/head-meta.hbs when that changes.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '..')
const DARK_MODE_ROOT = path.resolve(REPO_ROOT, '..', 'antora-dark-mode', 'supplemental-ui')
const SUPPLEMENTAL = path.join(REPO_ROOT, 'supplemental-ui')

const copies = [
  ['css/site-extra.css', 'css/site-extra.css'],
  ['js/site-dark-mode.js', 'js/site-dark-mode.js'],
]

if (!fs.existsSync(DARK_MODE_ROOT)) {
  console.error(`antora-dark-mode supplemental-ui not found at ${DARK_MODE_ROOT}`)
  process.exit(1)
}

for (const [from, to] of copies) {
  const src = path.join(DARK_MODE_ROOT, from)
  const dest = path.join(SUPPLEMENTAL, to)
  if (!fs.existsSync(src)) {
    console.error(`Missing source: ${src}`)
    process.exit(1)
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.copyFileSync(src, dest)
  console.log(`Synced ${from}`)
}

console.log('Done. Verify partials/head-meta.hbs FOUC script matches antora-dark-mode if head-meta changed.')
