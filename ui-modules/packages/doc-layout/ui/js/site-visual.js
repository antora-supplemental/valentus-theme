/**
 * Valentus visual polish: sticky header shadow + search UX helpers +
 * tree-nav horizontal scroll edge fades.
 * Root light↔dark transition lives in antora-dark-mode (View Transitions +
 * html.adt-theme-animating fallback). Reading width: site-read-width.js.
 */
(function () {
  const nav = document.querySelector('.adt-site-navbar')
  if (nav) {
    const onScroll = () => {
      nav.classList.toggle('is-scrolled', window.scrollY > 4)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
  }

  // Antora UI default site.js (nav panel): mousedown with detail > 1 → preventDefault
  // so double-clicking nav labels does not select text. When #search-input lives inside
  // [data-panel=menu], that also blocks selecting the query. Stop multi-click mousedown
  // from bubbling out of the search field (tool-band search is already outside the panel;
  // search-chat adds its own stop when present).
  const searchField = document.getElementById('search-field')
  if (searchField && !document.querySelector('[data-adt-search-chat]')) {
    searchField.addEventListener('mousedown', (e) => {
      if (e.detail > 1) e.stopPropagation()
    })
  }

  // Focus search with / (defer when search-chat owns / and ?)
  document.addEventListener('keydown', (e) => {
    if (document.querySelector('[data-adt-search-chat]')) return
    if (e.key !== '/') return
    if (e.metaKey || e.ctrlKey || e.altKey) return
    const t = e.target
    if (
      t instanceof HTMLElement &&
      (t.isContentEditable ||
        t.tagName === 'INPUT' ||
        t.tagName === 'TEXTAREA' ||
        t.tagName === 'SELECT')
    ) {
      return
    }
    const input = document.getElementById('search-input')
    if (!input || input.disabled) return
    e.preventDefault()
    input.focus()
    input.select()
  })

  /**
   * Tree-nav edge fades: right when more content to the right, left when scrolled
   * away from start. Classes drive mask-image in site-visual.css.
   */
  function updateNavScrollFades (menu) {
    if (!(menu instanceof HTMLElement)) return
    const epsilon = 1
    const maxScroll = menu.scrollWidth - menu.clientWidth
    const canScroll = maxScroll > epsilon
    const atStart = menu.scrollLeft <= epsilon
    const atEnd = menu.scrollLeft >= maxScroll - epsilon
    menu.classList.toggle('adt-nav-overflow-start', canScroll && !atStart)
    menu.classList.toggle('adt-nav-overflow-end', canScroll && !atEnd)
  }

  function bindNavScrollFades (menu) {
    if (!(menu instanceof HTMLElement) || menu.dataset.adtNavScrollBound === '1') return
    menu.dataset.adtNavScrollBound = '1'
    const refresh = () => updateNavScrollFades(menu)
    menu.addEventListener('scroll', refresh, { passive: true })
    window.addEventListener('resize', refresh)
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(refresh)
      ro.observe(menu)
    }
    if (typeof MutationObserver !== 'undefined') {
      const mo = new MutationObserver(refresh)
      mo.observe(menu, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['class', 'style'],
      })
    }
    refresh()
    // After fonts/icons settle (nav-typology nowrap labels)
    window.setTimeout(refresh, 0)
    window.setTimeout(refresh, 250)
  }

  function initNavScrollFades () {
    document
      .querySelectorAll('nav.nav-menu.nav-tree-only, nav.nav-menu.adt-nav-tree-only')
      .forEach(bindNavScrollFades)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavScrollFades)
  } else {
    initNavScrollFades()
  }
})()
