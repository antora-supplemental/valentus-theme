/**
 * After Antora build: stub /theme-demo/* HTML that redirects to /demo-pages/* (same relative path).
 * Baseline component renamed theme-demo → demo-pages in demo-data v0.3.0.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const siteDir = path.resolve(__dirname, '..', 'build', 'site')
const targetDir = path.join(siteDir, 'demo-pages')
const legacyDir = path.join(siteDir, 'theme-demo')

function redirectPage (targetHref) {
  const esc = targetHref.replace(/"/g, '&quot;')
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="refresh" content="0;url=${esc}">
<link rel="canonical" href="${esc}">
<title>Moved</title>
<script>location.replace(${JSON.stringify(targetHref)})</script>
</head>
<body><p>Moved to <a href="${esc}">${esc}</a>.</p></body>
</html>
`
}

function walkHtml (dir, base, out) {
  if (!fs.existsSync(dir)) return
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, name.name)
    if (name.isDirectory()) {
      walkHtml(full, base, out)
    } else if (name.name.endsWith('.html')) {
      out.push(path.relative(base, full))
    }
  }
}

if (!fs.existsSync(targetDir)) {
  console.warn('legacy-theme-demo-redirects: no build/site/demo-pages; skipping')
  process.exit(0)
}

const pages = []
walkHtml(targetDir, targetDir, pages)

for (const rel of pages) {
  const targetFile = path.join(targetDir, rel)
  const legacyFile = path.join(legacyDir, rel)
  const relTarget = path.relative(path.dirname(legacyFile), targetFile).split(path.sep).join('/')
  fs.mkdirSync(path.dirname(legacyFile), { recursive: true })
  fs.writeFileSync(legacyFile, redirectPage(relTarget), 'utf8')
}

console.log(`legacy-theme-demo-redirects: ${pages.length} stub(s) under build/site/theme-demo/`)
