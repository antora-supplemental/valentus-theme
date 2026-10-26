'use strict'

/**
 * Valentus demo/docs brand overlay (NOT part of the shipped bundle).
 *
 * Valentus ships a neutral placeholder logo. Its own demo/docs site keeps the
 * blood-drop brand by layering docs/brand/supplemental-ui/ on top of the
 * playbook's ui.supplemental_files directory (Antora accepts only one
 * supplemental directory, so this adds a second supplemental layer).
 * Files here replace same-path UI files.
 *
 *   antora:
 *     extensions:
 *       - require: ./docs/brand/lib/brand-overlay.js
 */

const fs = require('node:fs')
const path = require('node:path')

const DIR = path.join(__dirname, '..', 'supplemental-ui')

function walk (dir, base = '') {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const rel = base ? `${base}/${e.name}` : e.name
    return e.isDirectory() ? walk(path.join(dir, e.name), rel) : [rel]
  })
}

module.exports.register = function () {
  this.once('uiLoaded', ({ playbook, uiCatalog }) => {
    const outDir = (playbook.ui && playbook.ui.outputDir) || '_'
    for (const rel of walk(DIR)) {
      const contents = fs.readFileSync(path.join(DIR, rel))
      const existing = uiCatalog.findByType('asset').find((f) => f.path === rel)
      if (existing) {
        existing.contents = contents
        continue
      }
      const dirname = path.posix.dirname(rel)
      const basename = path.posix.basename(rel)
      const out = `${outDir}/${dirname}`
      uiCatalog.addFile({ contents, type: 'asset', path: rel, out: { dirname: out, path: `${out}/${basename}`, basename } })
    }
  })
}
