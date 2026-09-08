import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join, resolve } from 'node:path'

const imageDir = resolve('docs/modules/ROOT/images/diagrams')
const config = resolve('docs/mermaid-config.json')
const check = process.argv.includes('--check')
const diagrams = [
  { name: 'decision-flow', title: 'Decision flow', description: 'A decision sends yes and no outcomes through separate actions before both reach the end.' },
  { name: 'authentication-sequence', title: 'Authentication sequence', description: 'Alice and Bob exchange an authentication request and response followed by another request and response.' },
]
const tools = {
  mmdc: resolve('node_modules/@mermaid-js/mermaid-cli/src/cli.js'),
  adapter: resolve('node_modules/@dev-centr/mermaid-svg-css-vars/bin/mermaid-svg-css-vars.js'),
}
const temporary = mkdtempSync(join(tmpdir(), 'valentus-diagrams-'))
const presets = {
  light: { 'color.canvas': '#ffffff', 'color.surface.primary': '#f3f4f6', 'color.surface.secondary': '#ffffff', 'color.text.primary': '#1f2937', 'color.border.primary': '#6b7280', 'color.edge': '#4b5563', 'color.edge.label': '#374151', 'color.accent.primary': '#0f766e' },
  dark: { 'color.canvas': '#111827', 'color.surface.primary': '#293548', 'color.surface.secondary': '#1f2937', 'color.text.primary': '#f9fafb', 'color.border.primary': '#9ca3af', 'color.edge': '#d1d5db', 'color.edge.label': '#e5e7eb', 'color.accent.primary': '#5eead4' },
}
const bindings = [
  { kind: 'presentation', selector: 'svg', attribute: 'color', token: 'color.text.primary' },
  { kind: 'presentation', selector: '.background', attribute: 'fill', token: 'color.canvas' },
  { kind: 'presentation', selector: '.node rect, .node polygon, .node circle, .actor, .label-container, .entityBox', attribute: 'fill', token: 'color.surface.primary' },
  { kind: 'presentation', selector: '.cluster rect, .edgeLabel rect, .labelBkg', attribute: 'fill', token: 'color.surface.secondary' },
  { kind: 'presentation', selector: '.node rect, .node polygon, .node circle, .actor, .entityBox', attribute: 'stroke', token: 'color.border.primary' },
  { kind: 'presentation', selector: '.flowchart-link, .messageLine0, .messageLine1, .relationshipLine', attribute: 'stroke', token: 'color.edge' },
  { kind: 'presentation', selector: '.nodeLabel, .cluster-label, .actor, .messageText, .labelText, .edgeLabel', attribute: 'fill', token: 'color.text.primary' },
  { kind: 'presentation', selector: '.edgeLabel', attribute: 'color', token: 'color.edge.label' },
]
function manifestFor(name) {
  return { $schema: 'https://docs.devcentr.org/themed-svg/schemas/themed-svg-manifest-v1.schema.json', schemaVersion: 1, namespace: `valentus-example-${name}`, source: { kind: 'diagram-generator', uri: `${name}.mmd`, generator: 'mermaid' }, tokens: Object.keys(presets.light).map((id) => ({ id })), defaultPreset: 'light', presets, bindings, fallback: { unresolvedToken: 'error', missingTarget: 'warn' } }
}
function escapeXml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}
function normalizeAccessibility(path, diagram) {
  let svg = readFileSync(path, 'utf8').replace(/<title(?:\s[^>]*)?>[\s\S]*?<\/title>/i, '').replace(/<desc(?:\s[^>]*)?>[\s\S]*?<\/desc>/i, '')
  svg = svg.replace(/<svg\b([^>]*)>/i, (_whole, attributes) => {
    const normalized = attributes.replace(/\srole="[^"]*"/i, '').replace(/\saria-labelledby="[^"]*"/i, '')
    return `<svg${normalized} role="img" aria-labelledby="${diagram.name}-title ${diagram.name}-desc"><title id="${diagram.name}-title">${escapeXml(diagram.title)}</title><desc id="${diagram.name}-desc">${escapeXml(diagram.description)}</desc>`
  })
  writeFileSync(path, svg, 'utf8')
}
function assertSafeSvg(path, mode) {
  const svg = readFileSync(path, 'utf8')
  for (const pattern of [/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/, /\bviewBox="[^"]+"/, /\bpreserveAspectRatio="[^"]+"/, /\brole="img"/, /<title(?:\s[^>]*)?>[^<]+<\/title>/, /<desc(?:\s[^>]*)?>[^<]+<\/desc>/, /\baria-labelledby="[^"]+"/]) if (!pattern.test(svg)) throw new Error(`${basename(path)} fails the accessibility contract`)
  if (/<(?:script|foreignObject|iframe|object|embed|audio|video)\b/i.test(svg) || /\son[a-z]+\s*=/i.test(svg) || /\b(?:href|src)\s*=\s*["'](?:https?:|\/\/|data:)/i.test(svg)) throw new Error(`${basename(path)} contains unsafe content`)
  if (mode === 'standalone-adaptive' && !/prefers-color-scheme:\s*dark/.test(svg)) throw new Error(`${basename(path)} lacks a dark preset`)
  if (mode === 'host' && !svg.includes('--themed-svg-')) throw new Error(`${basename(path)} lacks host variables`)
}
try {
  const mermaidConfig = JSON.parse(readFileSync(config, 'utf8'))
  if (mermaidConfig.htmlLabels !== false || mermaidConfig.flowchart?.htmlLabels !== false) throw new Error('Mermaid global and flowchart htmlLabels must both be false')
  for (const diagram of diagrams) {
    const source = join(imageDir, `${diagram.name}.mmd`)
    const manifestPath = join(imageDir, `${diagram.name}.theme.json`)
    const manifest = `${JSON.stringify(manifestFor(diagram.name), null, 2)}\n`
    if (check) {
      if (!existsSync(manifestPath) || readFileSync(manifestPath, 'utf8') !== manifest) throw new Error(`${basename(manifestPath)} is stale`)
    } else writeFileSync(manifestPath, manifest, 'utf8')
    const raw = join(temporary, `${diagram.name}.raw.svg`)
    const secondRaw = join(temporary, `${diagram.name}.second.raw.svg`)
    const renderArgs = ['-i', source, '-c', config, '-b', 'transparent']
    execFileSync(process.execPath, [tools.mmdc, ...renderArgs, '-o', raw], { stdio: 'inherit' })
    execFileSync(process.execPath, [tools.mmdc, ...renderArgs, '-o', secondRaw], { stdio: 'inherit' })
    normalizeAccessibility(raw, diagram)
    normalizeAccessibility(secondRaw, diagram)
    if (readFileSync(raw, 'utf8') !== readFileSync(secondRaw, 'utf8')) throw new Error(`${basename(source)} is not deterministic`)
    const adaptive = join(imageDir, `${diagram.name}.svg`)
    const host = join(imageDir, `${diagram.name}.host.svg`)
    execFileSync(process.execPath, [tools.adapter, '--manifest', manifestPath, '--dual-output', ...(check ? ['--check'] : []), raw, '--output', adaptive, '--host-output', host], { stdio: 'inherit' })
    assertSafeSvg(adaptive, 'standalone-adaptive')
    assertSafeSvg(host, 'host')
  }
} finally {
  rmSync(temporary, { recursive: true, force: true })
}
