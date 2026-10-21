;(function () {
  'use strict'
  var doc = document
  function initBreadcrumbDropdowns () {
    ;[].forEach.call(doc.querySelectorAll('.adt-bc-dropdown'), function (el) {
      el.addEventListener('click', function (e) { e.stopPropagation() })
    })
    ;[].forEach.call(doc.querySelectorAll('[data-adt-toggle]'), function (button) {
      if (button.getAttribute('data-adt-bound')) return
      button.setAttribute('data-adt-bound', '1')
      var id = button.getAttribute('data-adt-toggle')
      if (!id) return
      var list = doc.getElementById(id)
      if (!list) return
      button.addEventListener('click', function (e) {
        e.preventDefault()
        e.stopPropagation()
        var isHidden = list.hasAttribute('hidden')
        ;[].forEach.call(doc.querySelectorAll('.adt-bc-dropdown'), function (dd) {
          if (dd === list) return
          dd.setAttribute('hidden', 'hidden')
        })
        ;[].forEach.call(doc.querySelectorAll('[data-adt-toggle]'), function (b) {
          b.setAttribute('aria-expanded', 'false')
        })
        if (isHidden) {
          list.removeAttribute('hidden')
          button.setAttribute('aria-expanded', 'true')
        } else {
          list.setAttribute('hidden', 'hidden')
          button.setAttribute('aria-expanded', 'false')
        }
      })
    })
    doc.addEventListener('click', function () {
      ;[].forEach.call(doc.querySelectorAll('.adt-bc-dropdown'), function (el) {
        el.setAttribute('hidden', 'hidden')
      })
      ;[].forEach.call(doc.querySelectorAll('[data-adt-toggle]'), function (b) {
        b.setAttribute('aria-expanded', 'false')
      })
    })
  }
  function start () {
    initBreadcrumbDropdowns()
  }

  if (typeof adtChromeBind === 'function') {
    adtChromeBind({ onBoot: start, onLoaded: start })
  } else {
    function onSoftNavLoaded (fn) {
      if (window.SoftNav && typeof SoftNav.on === 'function') SoftNav.on('loaded', fn)
      else doc.addEventListener('soft-nav:loaded', function (e) { fn(e.detail || {}) })
    }
    if (doc.readyState === 'loading') {
      doc.addEventListener('DOMContentLoaded', start)
    } else {
      start()
    }
    onSoftNavLoaded(start)
  }
})()
