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

  if (cfg.askPlaceholder && input) {
    input.setAttribute('placeholder', cfg.askPlaceholder)
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
    } else {
      var searchInput = document.getElementById('search-input')
      if (name === 'search' && searchInput) {
        searchInput.focus()
        if (typeof searchInput.select === 'function') searchInput.select()
      }
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

      var backendUrl = cfg.backendUrl || ''
      if (!backendUrl) {
        showResult(
          'Ask is not connected yet (phase 1 stub). ' +
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
