'use strict'

const fs = require('node:fs')
const path = require('node:path')

let parseJson5
try {
  parseJson5 = require('json5').parse
} catch {
  parseJson5 = JSON.parse
}

function readJson5File (filePath) {
  const text = fs.readFileSync(filePath, 'utf8')
  return parseJson5(text)
}

function resolveFromPlaybook (playbookDir, maybeRelative) {
  if (!maybeRelative) return null
  if (path.isAbsolute(maybeRelative)) return maybeRelative
  return path.resolve(playbookDir, maybeRelative)
}

function loadRegistry (registryPath) {
  const registry = readJson5File(registryPath)
  if (!registry.modules || !Array.isArray(registry.modules)) {
    throw new Error(`Registry ${registryPath} must include a modules array`)
  }
  return registry
}

function loadRecipe (recipePath) {
  const recipe = readJson5File(recipePath)
  if (recipe.type !== 'ui-recipe' || !Array.isArray(recipe.modules)) {
    throw new Error(`Recipe ${recipePath} must be type ui-recipe with a modules array`)
  }
  return recipe
}

function loadModuleManifest (moduleRoot) {
  const manifestPath = path.join(moduleRoot, 'ui-module.json5')
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Missing manifest: ${manifestPath}`)
  }
  const manifest = readJson5File(manifestPath)
  if (manifest.type !== 'ui-module') {
    throw new Error(`Expected ui-module manifest at ${manifestPath}`)
  }
  return { manifest, moduleRoot, uiRoot: path.join(moduleRoot, 'ui') }
}

function resolveModuleEntries ({ registry, registryPath, config, playbookDir }) {
  const registryDir = path.dirname(registryPath)
  const byId = new Map()

  for (const entry of registry.modules) {
    const moduleRoot = path.resolve(registryDir, entry.path)
    byId.set(entry.id, { ...loadModuleManifest(moduleRoot), registryId: entry.id })
  }

  let requestedIds = []

  if (config.recipe) {
    const recipePath = resolveFromPlaybook(playbookDir, config.recipe)
    const recipeId = path.basename(recipePath, path.extname(recipePath))
    let recipe
    if (fs.existsSync(recipePath)) {
      recipe = loadRecipe(recipePath)
    } else {
      const fromRegistry = registry.recipes?.find((r) => r.id === config.recipe || r.id === recipeId)
      if (!fromRegistry) {
        throw new Error(`Recipe not found: ${config.recipe}`)
      }
      recipe = loadRecipe(path.resolve(registryDir, fromRegistry.path))
    }
    requestedIds = recipe.modules.slice()
  } else if (Array.isArray(config.modules)) {
    requestedIds = config.modules.map((m) => (typeof m === 'string' ? m : m.id))
  } else if (Array.isArray(config.enable)) {
    requestedIds = config.enable.slice()
  } else {
    throw new Error('ui-orchestrator: configure recipe, modules, or enable')
  }

  const resolved = []
  for (const id of requestedIds) {
    const mod = byId.get(id)
    if (!mod) throw new Error(`Unknown module id "${id}" in registry ${registryPath}`)
    resolved.push(mod)
  }
  return { resolved, byId }
}

function topologicalSort (modules) {
  const byId = new Map(modules.map((m) => [m.manifest.id, m]))
  const visited = new Set()
  const stack = new Set()
  const sorted = []

  function visit (id) {
    if (visited.has(id)) return
    if (stack.has(id)) {
      throw new Error(`Circular module dependency involving "${id}"`)
    }
    stack.add(id)
    const mod = byId.get(id)
    if (!mod) throw new Error(`Required module "${id}" is not enabled`)
    for (const req of mod.manifest.requires || []) {
      visit(req)
    }
    stack.delete(id)
    visited.add(id)
    sorted.push(mod)
  }

  for (const mod of modules) {
    visit(mod.manifest.id)
  }
  return sorted
}

function validateConflicts (modules) {
  const enabled = new Set(modules.map((m) => m.manifest.id))
  for (const mod of modules) {
    for (const conflict of mod.manifest.conflicts || []) {
      if (enabled.has(conflict)) {
        throw new Error(
          `Module "${mod.manifest.id}" conflicts with "${conflict}" — disable one of them`
        )
      }
    }
  }
}

function ensureRequires (modules, byId) {
  const enabled = new Set(modules.map((m) => m.manifest.id))
  const missing = new Set()
  for (const mod of modules) {
    for (const req of mod.manifest.requires || []) {
      if (!enabled.has(req)) missing.add(req)
    }
  }
  if (missing.size) {
    throw new Error(
      `Missing required modules: ${[...missing].join(', ')}. Add them to the recipe or modules list.`
    )
  }
}

function expandWithRequires (initial, byId) {
  const enabled = new Map(initial.map((m) => [m.manifest.id, m]))
  let changed = true
  while (changed) {
    changed = false
    for (const mod of [...enabled.values()]) {
      for (const req of mod.manifest.requires || []) {
        if (!enabled.has(req)) {
          const reqMod = byId.get(req)
          if (!reqMod) throw new Error(`Unknown required module "${req}" in registry`)
          enabled.set(req, reqMod)
          changed = true
        }
      }
    }
  }
  return [...enabled.values()]
}

function resolveModules (options) {
  const { registry, registryPath, config, playbookDir } = options
  const { resolved, byId } = resolveModuleEntries({ registry, registryPath, config, playbookDir })
  const expanded = expandWithRequires(resolved, byId)
  const sorted = topologicalSort(expanded)
  ensureRequires(sorted, byId)
  validateConflicts(sorted)
  return sorted
}

module.exports = {
  readJson5File,
  resolveFromPlaybook,
  loadRegistry,
  loadRecipe,
  loadModuleManifest,
  resolveModules,
}
