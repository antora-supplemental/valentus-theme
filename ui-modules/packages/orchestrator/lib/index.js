'use strict'

const path = require('node:path')
const { loadRegistry, resolveFromPlaybook, resolveModules } = require('./manifest')
const { injectModuleUi, applySlotPartials } = require('./inject')

const PACKAGE_ID = '@antora-supplemental/ui-orchestrator'

function orchestratorConfigFromPlaybook (playbook) {
  for (const ext of playbook.antora?.extensions || []) {
    if (typeof ext !== 'object') continue
    const req = String(ext.require || '')
    if (req.includes('ui-orchestrator') || req.includes('orchestrator/lib/index.js')) {
      const { require: _r, enabled: _e, id: _i, ...config } = ext
      return config
    }
  }
  return {}
}

module.exports.register = function register () {
  const logger = this.getLogger(PACKAGE_ID)
  let resolvedModules = null

  this.on('playbookBuilt', ({ playbook }) => {
    const playbookDir = process.cwd()
    const config = orchestratorConfigFromPlaybook(playbook)

    const registryPath =
      resolveFromPlaybook(playbookDir, config.registry) ||
      path.resolve(__dirname, '../../../registry.json5')

    const registry = loadRegistry(registryPath)
    resolvedModules = resolveModules({ registry, registryPath, config, playbookDir })

    const ids = resolvedModules.map((m) => m.manifest.id)
    logger.info(`UI modules enabled (${ids.length}): ${ids.join(', ')}`)
  })

  this.on('uiLoaded', ({ playbook, uiCatalog }) => {
    if (!resolvedModules?.length) return

    const uiOutputDir = playbook.ui?.outputDir || '_'

    for (const mod of resolvedModules) {
      injectModuleUi(uiCatalog, uiOutputDir, mod)
    }

    applySlotPartials(uiCatalog, resolvedModules)
  })
}
