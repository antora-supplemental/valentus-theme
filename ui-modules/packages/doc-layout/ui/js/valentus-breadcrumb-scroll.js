/*! Valentus breadcrumb scroller: one-line, scrollbar-free H-scroll with edge fades. */
;(function () {
  'use strict'
  /**
   * Pure fade state (exported for tests). Each edge fades on its own whenever any
   * text is hidden past it, so mid-scroll shows both fades at once.
   */
  function fadeState (scrollLeft, clientWidth, scrollWidth) {
    var overflow = scrollWidth - clientWidth > 1
    // RTL scrollers report negative scrollLeft; use distance from the start edge.
    var pos = Math.abs(scrollLeft)
    return { overflow: overflow, start: overflow && pos > 0.5, end: overflow && pos + clientWidth < scrollWidth - 1 }
  }
  if (typeof module === 'object' && module.exports) module.exports = { fadeState: fadeState }
  if (typeof window === 'undefined' || typeof document === 'undefined') return

  var doc = document
  var SEL = '.valentus-breadcrumbs > ul'
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)')
  var ro = typeof ResizeObserver === 'function'
    ? new ResizeObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) update(entries[i].target)
    })
    : null

  function behavior () { return reduced && reduced.matches ? 'auto' : 'smooth' }

  function update (el) {
    var s = fadeState(el.scrollLeft, el.clientWidth, el.scrollWidth)
    el.classList.toggle('is-overflowing', s.overflow)
    el.classList.toggle('is-fade-start', s.start)
    el.classList.toggle('is-fade-end', s.end)
    if (s.overflow) {
      if (el.getAttribute('tabindex') !== '0') el.setAttribute('tabindex', '0')
      if (!el.hasAttribute('aria-label')) el.setAttribute('aria-label', 'Breadcrumb')
    } else if (el.getAttribute('tabindex') === '0' && el.hasAttribute('data-valentus-bc-scroll')) {
      el.removeAttribute('tabindex')
    }
    return s
  }

  // Dropdowns live inside the scroller; float them in the viewport so overflow + mask cannot clip them.
  function placeMenus (el) {
    var open = false
    var lists = el.querySelectorAll('.valentus-bc-dropdown')
    for (var i = 0; i < lists.length; i++) {
      var list = lists[i]
      if (list.hasAttribute('hidden')) {
        list.classList.remove('valentus-bc-dropdown--floating')
        list.style.left = list.style.top = ''
        continue
      }
      open = true
      var anchor = list.parentNode
      var r = anchor.getBoundingClientRect()
      list.classList.add('valentus-bc-dropdown--floating')
      var w = list.offsetWidth
      var left = Math.max(8, Math.min(r.left, doc.documentElement.clientWidth - w - 8))
      list.style.left = left + 'px'
      list.style.top = r.bottom + 'px'
    }
    el.classList.toggle('is-menu-open', open)
  }

  function bind (el) {
    if (el.hasAttribute('data-valentus-bc-scroll')) { update(el); return }
    el.setAttribute('data-valentus-bc-scroll', '')
    el.addEventListener('scroll', function () { update(el); placeMenus(el) }, { passive: true })
    el.addEventListener('focusin', function (e) {
      var t = e.target
      if (t === el || !el.classList.contains('is-overflowing')) return
      var crumb = t.closest('li') || t
      if (crumb.parentNode !== el) return
      crumb.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: behavior() })
    })
    if (ro) ro.observe(el)
    if (typeof MutationObserver === 'function') {
      new MutationObserver(function () { placeMenus(el) })
        .observe(el, { subtree: true, attributes: true, attributeFilter: ['hidden'] })
    }
    // Current page (last crumb) visible on load; instant, never animated.
    var s = update(el)
    if (s.overflow) {
      el.scrollTo({ left: el.scrollWidth * (getComputedStyle(el).direction === 'rtl' ? -1 : 1), behavior: 'instant' })
      update(el)
    }
  }

  function start () {
    var els = doc.querySelectorAll(SEL)
    for (var i = 0; i < els.length; i++) bind(els[i])
  }

  window.addEventListener('resize', function () {
    var els = doc.querySelectorAll(SEL)
    for (var i = 0; i < els.length; i++) { update(els[i]); placeMenus(els[i]) }
  }, { passive: true })
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(start)

  if (typeof bindSoftNavContext === 'function') {
    bindSoftNavContext({ onBoot: start, onLoaded: start })
  } else {
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start)
    else start()
    if (window.SoftNav && typeof SoftNav.on === 'function') SoftNav.on('loaded', start)
    else doc.addEventListener('soft-nav:loaded', start)
  }
})()