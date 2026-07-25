'use strict'

const fs = require('node:fs')
const path = require('node:path')

const PACKAGE_ID = '@antora-supplemental/antora-search-chat'
const UI_ROOT = path.join(__dirname, '..', 'ui')

function extensionConfigFromPlaybook (playbook) {
  for (const ext of playbook.antora?.extensions || []) {
    if (typeof ext !== 'object') continue
    const req = String(ext.require || '')
    if (
      req.includes('antora-search-chat') ||
      req.includes('packages/antora-search-chat')
    ) {
      const { require: _r, enabled: _e, id: _i, ...config } = ext
      return config
    }
  }
  return {}
}

function walkFiles (dir, base = dir) {
  if (!fs.existsSync(dir)) return []
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...walkFiles(full, base))
    } else if (entry.isFile()) {
      out.push(path.relative(base, full).split(path.sep).join('/'))
    }
  }
  return out
}

function addOrReplacePartial (uiCatalog, stem, relPath, contents) {
  const existing = uiCatalog.findByType('partial').find((f) => f.stem === stem)
  if (existing) {
    existing.contents = contents
    return
  }
  uiCatalog.addFile({
    contents,
    path: relPath,
    stem,
    type: 'partial',
  })
}

function addOrReplaceAsset (uiCatalog, uiOutputDir, relPath, contents) {
  const existing = uiCatalog.findByType('asset').find((f) => f.path === relPath)
  if (existing) {
    existing.contents = contents
    return
  }
  const dirname = path.posix.dirname(relPath)
  const basename = path.posix.basename(relPath)
  const outDir = dirname === '.' ? uiOutputDir : `${uiOutputDir}/${dirname}`
  uiCatalog.addFile({
    contents,
    type: 'asset',
    path: relPath,
    out: {
      dirname: outDir,
      path: `${outDir}/${basename}`,
      basename,
    },
  })
}

function appendStylesheetLink (uiCatalog, href) {
  const head = uiCatalog.findByType('partial').find((f) => f.stem === 'head-meta')
  if (!head) return
  const body = Buffer.isBuffer(head.contents)
    ? head.contents.toString('utf8')
    : String(head.contents || '')
  const tag = `<link rel="stylesheet" href="{{{uiRootPath}}}/${href}">`
  if (body.includes(href)) return
  head.contents = Buffer.from(`${body.trim()}\n${tag}\n`)
}

function appendFooterScript (uiCatalog, src) {
  const foot = uiCatalog.findByType('partial').find((f) => f.stem === 'footer-scripts')
  if (!foot) return
  const body = Buffer.isBuffer(foot.contents)
    ? foot.contents.toString('utf8')
    : String(foot.contents || '')
  const tag = `<script src="{{{uiRootPath}}}/${src}"></script>`
  if (body.includes(src)) return
  const marker = '{{!-- antora-search-chat:foot --}}'
  if (body.includes(marker)) return
  foot.contents = Buffer.from(`${body.trim()}\n${marker}\n${tag}\n`)
}

function injectRuntimeConfig (uiCatalog, uiOutputDir, config) {
  const payload = {
    backendUrl: config.backend_url || config.backendUrl || '',
    defaultTab: config.default_tab || config.defaultTab || 'search',
    askPlaceholder: config.ask_placeholder || config.askPlaceholder || 'Ask about this site…',
  }
  const js = `window.__ADT_SEARCH_CHAT__ = ${JSON.stringify(payload)};\n`
  addOrReplaceAsset(
    uiCatalog,
    uiOutputDir,
    'js/site-search-chat-config.js',
    Buffer.from(js)
  )
}

/**
 * Antora extension: enhance lunr with a Search / Ask omnibox (product target).
 * Phase 1 stub may still use tabbed panels. Does not fork lunr index generation.
 */
module.exports.register = function register (context = {}) {
  const logger = this.getLogger(PACKAGE_ID)
  let config = { ...context }

  this.on('playbookBuilt', ({ playbook }) => {
    config = { ...extensionConfigFromPlaybook(playbook), ...context }
    if (config.enabled === false) {
      logger.info('disabled via enabled: false')
      return
    }
    // Lets nav-menu.hbs prefer {{> adt-search-chat}} over the plain lunr field.
    process.env.SITE_SEARCH_CHAT = 'true'
    const hasLunr = (playbook.antora?.extensions || []).some((ext) => {
      const req = typeof ext === 'string' ? ext : String(ext?.require || '')
      return req.includes('lunr-extension')
    })
    if (!hasLunr) {
      logger.warn(
        'No @antora/lunr-extension found in antora.extensions. ' +
          'Search tab expects lunr; register lunr before antora-search-chat.'
      )
    } else {
      logger.info('composing with @antora/lunr-extension (wrap, not fork)')
    }
    if (!config.backend_url && !config.backendUrl) {
      logger.info('Ask backend stubbed (set backend_url for phase 2)')
    }
  })

  this.on('uiLoaded', ({ playbook, uiCatalog }) => {
    const cfg = { ...extensionConfigFromPlaybook(playbook), ...config }
    if (cfg.enabled === false || cfg.ui === false) return

    const uiOutputDir = playbook.ui?.outputDir || '_'

    for (const rel of walkFiles(UI_ROOT)) {
      const full = path.join(UI_ROOT, rel)
      const contents = fs.readFileSync(full)
      if (rel.startsWith('partials/') && rel.endsWith('.hbs')) {
        const stem = path.basename(rel, '.hbs')
        addOrReplacePartial(uiCatalog, stem, rel, contents)
      } else {
        addOrReplaceAsset(uiCatalog, uiOutputDir, rel, contents)
      }
    }

    injectRuntimeConfig(uiCatalog, uiOutputDir, cfg)
    appendStylesheetLink(uiCatalog, 'css/site-search-chat.css')
    appendFooterScript(uiCatalog, 'js/site-search-chat-config.js')
    appendFooterScript(uiCatalog, 'js/site-search-chat.js')

    logger.info('injected Search/Ask UI into catalog (owns .adt-nav-search slot)')
  })
}
