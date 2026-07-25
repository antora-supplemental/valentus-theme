;(function () {
  'use strict'

  var cfg = window.__ADT_SEARCH_CHAT__ || {}
  var root = document.querySelector('[data-adt-search-chat]')
  if (!root) return

  var tabs = Array.prototype.slice.call(root.querySelectorAll('[data-adt-search-tab]'))
  var panels = Array.prototype.slice.call(root.querySelectorAll('[data-adt-search-panel]'))
  var form = root.querySelector('[data-adt-search-ask-form]')
  var input = root.querySelector('[data-adt-ask-input]')
  var result = root.querySelector('[data-adt-ask-result]')
  var searchInput =
    root.querySelector('[data-adt-search-input]') || document.getElementById('search-input')
  var ph = root.querySelector('[data-adt-search-ph]')
  var phAsk = ph && ph.querySelector('.adt-search-ph-ask')

  function resolveAskEnabled () {
    if (typeof cfg.askEnabled === 'boolean') return cfg.askEnabled
    if (cfg.backendUrl) return true
    if (cfg.localAssist) return true
    var attr = root.getAttribute('data-ask-enabled')
    if (attr === 'true') return true
    if (attr === 'false') return false
    return false
  }

  var askEnabled = resolveAskEnabled()
  root.setAttribute('data-ask-enabled', askEnabled ? 'true' : 'false')
  if (phAsk) {
    phAsk.classList.toggle('is-disabled', !askEnabled)
  }

  if (cfg.askPlaceholder && input) {
    input.setAttribute('placeholder', cfg.askPlaceholder)
  }

  // Fake placeholder: hide when focused or non-empty (native placeholder cannot
  // grey/strike only the "or Ask" segment).
  function syncSearchPlaceholder () {
    if (!ph || !searchInput) return
    // Keep native placeholder empty so it never fights the overlay.
    if (searchInput.getAttribute('placeholder')) {
      searchInput.setAttribute('placeholder', '')
    }
    var hide =
      document.activeElement === searchInput || String(searchInput.value || '').length > 0
    ph.classList.toggle('is-hidden', hide)
  }

  if (searchInput) {
    searchInput.addEventListener('focus', syncSearchPlaceholder)
    searchInput.addEventListener('blur', syncSearchPlaceholder)
    searchInput.addEventListener('input', syncSearchPlaceholder)
    syncSearchPlaceholder()
  }

  function activate (name) {
    tabs.forEach(function (tab) {
      var on = tab.getAttribute('data-adt-search-tab') === name
      tab.classList.toggle('is-active', on)
      tab.setAttribute('aria-selected', on ? 'true' : 'false')
    })
    panels.forEach(function (panel) {
      var on = panel.getAttribute('data-adt-search-panel') === name
      panel.classList.toggle('is-active', on)
      if (on) {
        panel.removeAttribute('hidden')
      } else {
        panel.setAttribute('hidden', '')
      }
    })
    if (name === 'ask' && input) {
      input.focus()
    } else if (name === 'search' && searchInput) {
      searchInput.focus()
      if (typeof searchInput.select === 'function') searchInput.select()
      syncSearchPlaceholder()
    }
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      activate(tab.getAttribute('data-adt-search-tab'))
    })
  })

  if (cfg.defaultTab === 'ask') {
    activate('ask')
  }

  function isTypingTarget (t) {
    return (
      t instanceof HTMLElement &&
      (t.isContentEditable ||
        t.tagName === 'INPUT' ||
        t.tagName === 'TEXTAREA' ||
        t.tagName === 'SELECT')
    )
  }

  // / → Search (lexical); ? (Shift+/) → Ask
  // Layout caveat: some keyboards report key === '?', others key === '/' + shiftKey.
  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return
    if (isTypingTarget(e.target)) return

    var isAsk = e.key === '?' || (e.key === '/' && e.shiftKey)
    var isSearch = e.key === '/' && !e.shiftKey

    if (isAsk) {
      e.preventDefault()
      activate('ask')
      return
    }
    if (isSearch) {
      e.preventDefault()
      activate('search')
    }
  })

  function showResult (text, isError) {
    if (!result) return
    result.hidden = false
    result.textContent = text
    result.classList.toggle('is-error', !!isError)
  }

  if (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault()
      var question = (input && input.value ? input.value : '').trim()
      if (!question) {
        showResult('Enter a question to ask.', true)
        return
      }

      if (!askEnabled) {
        showResult(
          'Ask is not enabled on this site. Set ask_enabled: true and/or backend_url ' +
            '(or local_assist) on the antora-search-chat extension. Use Search for keyword results.',
          false
        )
        return
      }

      var backendUrl = cfg.backendUrl || ''
      if (!backendUrl) {
        showResult(
          'Ask is enabled but no backend is connected yet (phase 1 stub). ' +
            'Set backend_url on the antora-search-chat extension when a Q&A API is available. ' +
            'Use the Search tab for keyword results from the lunr index.',
          false
        )
        return
      }

      showResult('Thinking…', false)
      fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ question: question }),
      })
        .then(function (res) {
          if (!res.ok) throw new Error('Ask backend returned HTTP ' + res.status)
          return res.json()
        })
        .then(function (data) {
          var answer = (data && (data.answer || data.text)) || 'No answer in response.'
          showResult(answer, false)
        })
        .catch(function (err) {
          showResult(
            'Ask request failed: ' + (err && err.message ? err.message : String(err)),
            true
          )
        })
    })
  }
})()
