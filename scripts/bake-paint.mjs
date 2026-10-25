#!/usr/bin/env node
// Bake Valentus Paint into an unpacked UI bundle dir (release.yml):
// copies paint/css/valentus-paint.css to <dir>/css/ and links it at the
// layout's `{{!-- color-scheme:paint-slot --}}` marker in partials/head-meta.hbs,
// using the same insertion as the paint extension.
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'

const dir = process.argv[2]
if (!dir) { console.error('usage: bake-paint.mjs <ui-bundle-dir>'); process.exit(2) }
const { insertLink, ASSET, SLOT } = createRequire(import.meta.url)('../paint/lib/index.js')
mkdirSync(join(dir, 'css'), { recursive: true })
copyFileSync(new URL('../paint/' + ASSET, import.meta.url), join(dir, ASSET))
const head = join(dir, 'partials', 'head-meta.hbs')
const src = readFileSync(head, 'utf8')
if (!src.includes(SLOT)) { console.error(`${head}: no paint slot marker`); process.exit(1) }
writeFileSync(head, insertLink(src))
console.log(`baked ${ASSET} into ${head}`)
