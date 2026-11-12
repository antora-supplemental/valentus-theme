'use strict'

const PAGE_TYPES = new Set([
  'TechArticle',
  'NewsArticle',
  'BlogPosting',
  'Article',
  'SoftwareApplication',
  'SoftwareSourceCode',
  'WebPage',
])

function stripTags (value) {
  return String(value == null ? '' : value).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

function absolute (siteUrl, url) {
  if (!url) return ''
  const raw = String(url)
  if (/^https?:\/\//i.test(raw)) return raw
  const base = String(siteUrl).replace(/\/$/, '')
  return raw.charAt(0) === '/' ? base + raw : base + '/' + raw
}

function fragmentId (url, fragment) {
  return String(url).replace(/\/$/, '') + '/#' + fragment
}

function schemaOrgJsonLd (options) {
  const root = options && options.data && options.data.root
  if (!root || root.schemaOrgJsonLdDone) return ''
  const site = root.site || {}
  const page = root.page || {}
  const keys = site.keys || {}
  const siteUrl = site.url
  if (!siteUrl || String(siteUrl).charAt(0) === '/') return ''

  const orgUrl = keys.schemaOrgUrl || keys.siteHomeUrl || siteUrl
  const orgName = stripTags(keys.schemaOrgName || site.title || '')
  const siteName = stripTags(site.title || orgName)
  if (!orgName || !siteName) return ''

  root.schemaOrgJsonLdDone = true

  const attrs = page.attributes || {}
  const requested = stripTags(attrs['page-schema-type'] || keys.schemaOrgType || 'TechArticle')
  const pageType = PAGE_TYPES.has(requested) ? requested : 'TechArticle'
  const pageUrl = page.canonicalUrl || absolute(siteUrl, page.url)
  const orgId = fragmentId(orgUrl, 'organization')
  const siteId = fragmentId(siteUrl, 'website')

  const graph = [
    {
      '@type': 'Organization',
      '@id': orgId,
      name: orgName,
      url: orgUrl,
    },
    {
      '@type': 'WebSite',
      '@id': siteId,
      name: siteName,
      url: siteUrl,
      publisher: { '@id': orgId },
    },
  ]

  if (pageUrl && page.title) {
    const article = {
      '@type': pageType,
      headline: stripTags(page.title),
      url: pageUrl,
      isPartOf: { '@id': siteId },
      publisher: { '@id': orgId },
    }
    const description = stripTags(page.description || '')
    if (description) article.description = description
    graph.push(article)
  }

  const crumbs = Array.isArray(page.breadcrumbs) ? page.breadcrumbs : []
  const items = []
  for (const crumb of crumbs) {
    const name = stripTags(crumb && crumb.content)
    const itemUrl = absolute(siteUrl, crumb && crumb.url)
    if (!name || !itemUrl) continue
    items.push({
      '@type': 'ListItem',
      position: items.length + 1,
      name,
      item: itemUrl,
    })
  }
  if (items.length >= 2) {
    graph.push({ '@type': 'BreadcrumbList', itemListElement: items })
  }

  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c')
}

module.exports = schemaOrgJsonLd
module.exports.PAGE_TYPES = PAGE_TYPES
