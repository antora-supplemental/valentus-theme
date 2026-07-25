/**
 * Valentus visual polish: sticky header shadow + theme crossfade cue.
 * Reading width lives in the read-width module (site-read-width.js).
 */
(function () {
  const root = document.documentElement

  const nav = document.querySelector('.adt-site-navbar')
  if (nav) {
    const onScroll = () => {
      nav.classList.toggle('is-scrolled', window.scrollY > 4)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
  }

  const markAnimating = () => {
    root.classList.add('adt-theme-animating')
    window.clearTimeout(markAnimating._t)
    markAnimating._t = window.setTimeout(() => {
      root.classList.remove('adt-theme-animating')
    }, 320)
  }

  document.addEventListener(
    'click',
    (e) => {
      if (e.target.closest('.theme-toggle')) markAnimating()
    },
    true
  )

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
})()
