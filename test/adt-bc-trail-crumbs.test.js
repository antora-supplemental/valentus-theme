'use strict'

const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const helper = require('../supplemental-ui/helpers/adt-bc-trail-crumbs')
const { enrichCrumbUrls, landingFromNavItem } = helper

function opts (page, site) {
  return { data: { root: { page, site } } }
}

describe('landingFromNavItem', () => {
  it('returns own internal URL when present', () => {
    assert.deepEqual(landingFromNavItem({ content: 'Docs', url: '/d/', urlType: 'internal' }), {
      url: '/d/',
      urlType: 'internal',
    })
  })

  it('prefers Overview child when parent has no URL', () => {
    const item = {
      content: 'Software',
      items: [
        { content: 'Overview', url: '/soft/', urlType: 'internal' },
        { content: 'Guides', url: '/soft/guides/', urlType: 'internal' },
      ],
    }
    assert.deepEqual(landingFromNavItem(item), { url: '/soft/', urlType: 'internal' })
  })

  it('falls back to first descendant with an internal URL', () => {
    const item = {
      content: 'Documentation',
      items: [
        { content: 'Getting Started', url: '/guide/', urlType: 'internal' },
        { content: 'Install', url: '/guide/install/', urlType: 'internal' },
      ],
    }
    assert.deepEqual(landingFromNavItem(item), { url: '/guide/', urlType: 'internal' })
  })
})

describe('enrichCrumbUrls', () => {
  it('links a bare nav-title crumb to the first child page', () => {
    const navigation = [
      {
        content: 'Documentation',
        items: [
          { content: 'Getting Started', url: '/v/guide/', urlType: 'internal' },
          { content: 'Customization', url: '/v/guide/customization.html', urlType: 'internal' },
        ],
      },
    ]
    const crumbs = [
      { content: 'Documentation' },
      { content: 'Customization', url: '/v/guide/customization.html', urlType: 'internal' },
    ]
    const out = enrichCrumbUrls(crumbs, navigation)
    assert.equal(out[0].url, '/v/guide/')
    assert.equal(out[0].urlType, 'internal')
    assert.equal(out[1].url, '/v/guide/customization.html')
  })

  it('uses Overview landing for unlinked section parents', () => {
    const navigation = [
      {
        content: 'Email',
        items: [
          { content: 'Overview', url: '/bb/email/', urlType: 'internal' },
          { content: 'SMTP', url: '/bb/email/smtp.html', urlType: 'internal' },
        ],
      },
    ]
    const crumbs = [
      { content: 'Email' },
      { content: 'SMTP', url: '/bb/email/smtp.html', urlType: 'internal' },
    ]
    const out = enrichCrumbUrls(crumbs, navigation)
    assert.equal(out[0].url, '/bb/email/')
    assert.equal(out[0].urlType, 'internal')
  })

  it('does not overwrite an existing internal URL', () => {
    const navigation = [
      {
        content: 'Guides',
        url: '/guides/',
        urlType: 'internal',
        items: [{ content: 'A', url: '/guides/a.html', urlType: 'internal' }],
      },
    ]
    const crumbs = [{ content: 'Guides', url: '/guides/', urlType: 'internal' }]
    const out = enrichCrumbUrls(crumbs, navigation)
    assert.equal(out[0].url, '/guides/')
  })

  it('handles anonymous { items } navigation wrappers', () => {
    const navigation = {
      items: [
        {
          content: 'Documentation',
          items: [{ content: 'Index', url: '/d/', urlType: 'internal' }],
        },
      ],
    }
    const out = enrichCrumbUrls([{ content: 'Documentation' }], navigation)
    assert.equal(out[0].url, '/d/')
  })
})

describe('adt-bc-trail-crumbs helper', () => {
  it('enriches even when site_nav_tree is off', () => {
    const page = {
      navigation: [
        {
          content: 'Documentation',
          items: [{ content: 'Customization', url: '/c.html', urlType: 'internal' }],
        },
      ],
      breadcrumbs: [
        { content: 'Documentation' },
        { content: 'Customization', url: '/c.html', urlType: 'internal' },
      ],
    }
    const out = helper(page.breadcrumbs, opts(page, { keys: {} }))
    assert.equal(out[0].url, '/c.html')
    assert.equal(out[0].urlType, 'internal')
  })

  it('still strips foreign Home when site_nav_tree is on', () => {
    const page = {
      component: { name: 'guide', title: 'Guide' },
      componentVersion: { url: '/guide/', title: 'Guide' },
      navigation: [
        {
          content: 'Guide',
          url: '/guide/',
          urlType: 'internal',
          items: [
            {
              content: 'Documentation',
              items: [{ content: 'Page', url: '/guide/page.html', urlType: 'internal' }],
            },
          ],
        },
      ],
      breadcrumbs: [
        { content: 'Home', url: '/', urlType: 'internal' },
        { content: 'Guide', url: '/guide/', urlType: 'internal' },
        { content: 'Documentation' },
        { content: 'Page', url: '/guide/page.html', urlType: 'internal' },
      ],
    }
    const site = {
      keys: { site_nav_tree: 'true' },
      homeUrl: '/',
      components: {
        home: { name: 'home', title: 'Home', latest: { url: '/' } },
        guide: page.component,
      },
    }
    const out = helper(page.breadcrumbs, opts(page, site))
    assert.equal(out[0].content, 'Documentation')
    assert.equal(out[0].url, '/guide/page.html')
    assert.equal(out[1].content, 'Page')
  })
})