'use strict'

/**
 * @antora-supplemental/valentus-paint - Antora extension (PAINT layer).
 *
 * Valentus colors for any layout that follows the --cs-* contract of
 * @antora-supplemental/color-scheme: the Antora Default UI, Valentus Layout,
 * or another layout. Adds css/valentus-paint.css to the UI and links it:
 *
 *   - at the `{{!-- color-scheme:paint-slot --}}` marker when a head partial
 *     has one (Valentus Layout puts it before its layout CSS, so layout rules
 *     win over paint rules, as in v3);
 *   - otherwise at the end of head-styles (else head-meta), like default-paint.
 *
 *   antora:
 *     extensions:
 *       - require: '@antora-supplemental/color-scheme'
 *       - require: '@antora-supplemental/valentus-paint'
 */

const fs = require('node:fs')
const path = require('node:path')

const PACKAGE_ID = '@antora-supplemental/valentus-paint'
const ROOT = path.join(__dirname, '..')
const ASSET = 'css/valentus-paint.css'
const LINK = `<link rel="stylesheet" href="{{{uiRootPath}}}/${ASSET}">`
const SLOT = '{{!-- color-scheme:paint-slot --}}'

function bodyOf (file) {
  return Buffer.isBuffer(file.contents) ? file.contents.toString('utf8') : String(file.contents || '')
}

function addOrReplaceAsset (uiCatalog, uiOutputDir, relPath, contents) {
  const existing = uiCatalog.findByType('asset').find((f) => f.path === relPath)
  if (existing) {
    existing.contents = contents
    return
  }
  const dirname = path.posix.dirname(relPath)
  const basename = path.posix.basename(relPath)
  const outDir = `${uiOutputDir}/${dirname}`
  uiCatalog.addFile({ contents, type: 'asset', path: relPath, out: { dirname: outDir, path: `${outDir}/${basename}`, basename } })
}

/** Insert the paint link into a head partial source (slot first, else append). */
function insertLink (source) {
  if (source.includes(LINK)) return source
  if (source.includes(SLOT)) return source.replace(SLOT, `${SLOT}\n${LINK}`)
  return `${source.replace(/\s*$/, '')}\n${LINK}\n`
}

/** Returns 'slot', 'append', 'present' or false (no head partial). */
function ensureValentusPaint (uiCatalog, uiOutputDir) {
  addOrReplaceAsset(uiCatalog, uiOutputDir, ASSET, fs.readFileSync(path.join(ROOT, ASSET)))
  const partials = uiCatalog.findByType('partial')
  const heads = partials.filter((f) => ['head-styles', 'head-meta'].includes(f.stem))
  if (heads.some((f) => bodyOf(f).includes(LINK))) return 'present'
  const target = heads.find((f) => bodyOf(f).includes(SLOT)) ||
    partials.find((f) => f.stem === 'head-styles') || partials.find((f) => f.stem === 'head-meta')
  if (!target) return false
  const how = bodyOf(target).includes(SLOT) ? 'slot' : 'append'
  target.contents = Buffer.from(insertLink(bodyOf(target)))
  return how
}

// Destructured single param: Antora then binds `this` to the generator context.
function register ({ config }) {
  config = config || {}
  const logger = this.getLogger(PACKAGE_ID)
  this.on('uiLoaded', ({ playbook, uiCatalog }) => {
    if (config.enabled === false) return
    const how = ensureValentusPaint(uiCatalog, playbook.ui?.outputDir || '_')
    if (how) logger.info(`valentus-paint: ${ASSET} linked (${how})`)
    else logger.warn('valentus-paint: UI has no head-styles/head-meta partial; nothing linked')
  })
}

module.exports = register
module.exports.register = register
module.exports.ensureValentusPaint = ensureValentusPaint
module.exports.insertLink = insertLink
module.exports.ASSET = ASSET
module.exports.SLOT = SLOT
