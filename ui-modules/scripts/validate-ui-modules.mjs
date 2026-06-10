#!/usr/bin/env node
'use strict'

/**
 * Validates ui-module.json5 manifests and registry.json5.
 * Emits a machine-readable index for antora-supplemental registry crawlers.
 *
 * Usage:
 *   node ui-modules/scripts/validate-ui-modules.mjs [--index-out path]
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import JSON5 from 'json5'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const UI_MODULES_ROOT = path.resolve(__dirname, '..')
const SCHEMA_PATH = path.join(UI_MODULES_ROOT, 'schema', 'ui-module-manifest.schema.json')

function readJson5 (filePath) {
  return JSON5.parse(fs.readFileSync(filePath, 'utf8'))
}

function walkUiFiles (uiRoot, dir = uiRoot) {
  if (!fs.existsSync(dir)) return []
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walkUiFiles(uiRoot, full))
    else out.push(path.relative(uiRoot, full).split(path.sep).join('/'))
  }
  return out
}

function validateManifestShape (manifest, filePath) {
  const errors = []
  for (const key of ['id', 'name', 'version', 'type']) {
    if (!manifest[key]) errors.push(`${filePath}: missing required field "${key}"`)
  }
  if (manifest.type === 'ui-recipe' && !Array.isArray(manifest.modules)) {
    errors.push(`${filePath}: ui-recipe requires "modules" array`)
  }
  if (manifest.type === 'ui-module') {
    const uiRoot = path.join(path.dirname(filePath), 'ui')
    if (!fs.existsSync(uiRoot)) {
      errors.push(`${filePath}: ui-module missing ui/ directory`)
    } else {
      for (const css of manifest.slots?.head?.stylesheets || []) {
        if (!fs.existsSync(path.join(uiRoot, css))) {
          errors.push(`${filePath}: head stylesheet not found: ui/${css}`)
        }
      }
      for (const js of manifest.slots?.head?.scripts || []) {
        if (!fs.existsSync(path.join(uiRoot, js))) {
          errors.push(`${filePath}: head script not found: ui/${js}`)
        }
      }
      for (const frag of manifest.slots?.head?.fragments || []) {
        if (!fs.existsSync(path.join(uiRoot, frag))) {
          errors.push(`${filePath}: head fragment not found: ui/${frag}`)
        }
      }
      for (const js of manifest.slots?.foot?.scripts || []) {
        if (!fs.existsSync(path.join(uiRoot, js))) {
          errors.push(`${filePath}: foot script not found: ui/${js}`)
        }
      }
    }
  }
  return errors
}

function resolveModules (registry, registryDir) {
  const modules = new Map()
  for (const entry of registry.modules) {
    const moduleRoot = path.resolve(registryDir, entry.path)
    const manifestPath = path.join(moduleRoot, entry.manifest || 'ui-module.json5')
    const manifest = readJson5(manifestPath)
    modules.set(entry.id, { entry, moduleRoot, manifestPath, manifest })
  }
  return modules
}

function validateRegistry (registry, registryDir) {
  const errors = []
  const modules = resolveModules(registry, registryDir)
  const ids = new Set(modules.keys())

  for (const [id, { manifest, manifestPath }] of modules) {
    errors.push(...validateManifestShape(manifest, manifestPath))

    for (const req of manifest.requires || []) {
      if (!ids.has(req)) errors.push(`${manifestPath}: requires unknown module "${req}"`)
    }
    for (const conflict of manifest.conflicts || []) {
      if (!ids.has(conflict)) errors.push(`${manifestPath}: conflicts with unknown module "${conflict}"`)
    }
  }

  for (const recipeEntry of registry.recipes || []) {
    const recipePath = path.resolve(registryDir, recipeEntry.path)
    const recipe = readJson5(recipePath)
    errors.push(...validateManifestShape(recipe, recipePath))
    for (const modId of recipe.modules || []) {
      if (!ids.has(modId)) errors.push(`${recipePath}: unknown module "${modId}"`)
    }
    const enabled = new Set(recipe.modules || [])
    for (const modId of recipe.modules || []) {
      const { manifest, manifestPath } = modules.get(modId)
      for (const conflict of manifest.conflicts || []) {
        if (enabled.has(conflict)) {
          errors.push(`${recipePath}: modules "${modId}" and "${conflict}" conflict`)
        }
      }
    }
  }

  return { errors, modules }
}

function buildIndex (registry, registryDir, modules) {
  const index = {
    schema: '1.0',
    generatedAt: new Date().toISOString(),
    repository: registry.repository,
    source: 'ui-modules/registry.json5',
    modules: [],
    recipes: [],
  }

  for (const [id, { entry, moduleRoot, manifest, manifestPath }] of modules) {
    const uiRoot = path.join(moduleRoot, 'ui')
    index.modules.push({
      id,
      name: manifest.name,
      version: manifest.version,
      type: 'ui-module',
      description: manifest.description || '',
      repository: manifest.repository || registry.repository,
      manifestPath: path.relative(UI_MODULES_ROOT, manifestPath).split(path.sep).join('/'),
      modulePath: entry.path,
      requires: manifest.requires || [],
      recommends: manifest.recommends || [],
      conflicts: manifest.conflicts || [],
      partials: manifest.ui?.partials || {},
      slots: manifest.slots || {},
      uiFileCount: fs.existsSync(uiRoot) ? walkUiFiles(uiRoot).length : 0,
      install: {
        orchestrator: {
          registry: './ui-modules/registry.json5',
          modules: [id],
        },
      },
    })
  }

  for (const recipeEntry of registry.recipes || []) {
    const recipePath = path.resolve(registryDir, recipeEntry.path)
    const recipe = readJson5(recipePath)
    index.recipes.push({
      id: recipeEntry.id,
      name: recipe.name,
      version: recipe.version,
      type: 'ui-recipe',
      description: recipe.description || '',
      modules: recipe.modules,
      manifestPath: path.relative(UI_MODULES_ROOT, recipePath).split(path.sep).join('/'),
      install: {
        orchestrator: {
          registry: './ui-modules/registry.json5',
          recipe: recipeEntry.id,
        },
      },
    })
  }

  return index
}

function main () {
  const args = process.argv.slice(2)
  const indexOutIdx = args.indexOf('--index-out')
  const indexOut =
    indexOutIdx >= 0 ? args[indexOutIdx + 1] : path.join(UI_MODULES_ROOT, 'registry-index.json')

  const registryPath = path.join(UI_MODULES_ROOT, 'registry.json5')
  const registry = readJson5(registryPath)
  const { errors, modules } = validateRegistry(registry, UI_MODULES_ROOT)

  if (errors.length) {
    console.error('UI module validation failed:\n')
    for (const err of errors) console.error(`  - ${err}`)
    process.exit(1)
  }

  const index = buildIndex(registry, UI_MODULES_ROOT, modules)
  fs.writeFileSync(indexOut, `${JSON.stringify(index, null, 2)}\n`, 'utf8')

  console.log(`Validated ${index.modules.length} modules and ${index.recipes.length} recipes.`)
  console.log(`Registry index written to ${indexOut}`)
  if (fs.existsSync(SCHEMA_PATH)) {
    console.log(`Schema: ${path.relative(process.cwd(), SCHEMA_PATH)}`)
  }
}

main()
