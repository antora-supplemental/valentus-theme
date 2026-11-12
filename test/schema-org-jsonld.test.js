'use strict'

const { test } = require('node:test')
const assert = require('node:assert')
const fs = require('node:fs')
const path = require('path')
const schemaOrgJsonLd = require('../packages/valentus-layout/supplemental-ui/helpers/schema-org-jsonld')

function render (root) {
  return schemaOrgJsonLd({ data: { root } })
}

const site = {
  title: 'Dev-Centr Docs',
  url: 'https://docs.devcentr.org',
  keys: {
    schemaOrgName: 'DevCentr',
    schemaOrgUrl: 'https://devcentr.org',
  },
}

test('emits organization, website, article, and breadcrumbs', () => {
  const json = render({
    site,
    page: {
      title: 'Schema.org on a public site',
      description: 'How a public page names itself.',
      url: '/general-knowledge/explanation/schema-org-on-a-public-site/',
      canonicalUrl: 'https://docs.devcentr.org/general-knowledge/explanation/schema-org-on-a-public-site/',
      breadcrumbs: [
        { content: 'General Knowledge', url: '/general-knowledge/' },
        { content: 'Schema.org on a public site', url: '/general-knowledge/explanation/schema-org-on-a-public-site/' },
      ],
    },
  })
  const data = JSON.parse(json)
  assert.equal(data['@context'], 'https://schema.org')
  assert.deepEqual(data['@graph'].map((node) => node['@type']), [
    'Organization',
    'WebSite',
    'TechArticle',
    'BreadcrumbList',
  ])
  assert.equal(data['@graph'][0].name, 'DevCentr')
  assert.equal(data['@graph'][0].url, 'https://devcentr.org')
  assert.equal(data['@graph'][1].name, 'Dev-Centr Docs')
  assert.equal(data['@graph'][2].headline, 'Schema.org on a public site')
  assert.equal(data['@graph'][3].itemListElement[0].position, 1)
  assert.equal(data['@graph'][3].itemListElement[0].item, 'https://docs.devcentr.org/general-knowledge/')
})

test('strips tags, escapes a bare less-than, and emits the graph once', () => {
  const root = {
    site,
    page: {
      title: 'A <script>alert</script> and 1 < 2',
      url: '/page/',
    },
  }
  const json = render(root)
  const article = JSON.parse(json)['@graph'][2]
  assert.equal(article.headline, 'A alert and 1 < 2')
  assert.match(json, /1 \\u003c 2/)
  assert.equal(render(root), '')
})

test('skips a relative site url and an unknown page type', () => {
  assert.equal(render({ site: { title: 'Local', url: '/' }, page: { title: 'Local' } }), '')
  const json = render({
    site: Object.assign({}, site, { keys: Object.assign({}, site.keys, { schemaOrgType: 'NotAType' }) }),
    page: { title: 'Page', url: '/page/' },
  })
  assert.equal(JSON.parse(json)['@graph'][2]['@type'], 'TechArticle')
})

test('head partial is included from head-styles', () => {
  const partials = path.join(__dirname, '..', 'packages', 'valentus-layout', 'supplemental-ui', 'partials')
  const styles = fs.readFileSync(path.join(partials, 'head-styles.hbs'), 'utf8')
  const partial = fs.readFileSync(path.join(partials, 'head-schema-org.hbs'), 'utf8')
  assert.match(styles, /\{\{> head-schema-org\}\}/)
  assert.match(partial, /application\/ld\+json/)
})
