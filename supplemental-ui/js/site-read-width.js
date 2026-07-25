/**
 * Reading width control: narrow | comfortable | wide
 * Persists to localStorage (`adt-read-width`) and html[data-adt-read-width].
 */
(function () {
  const root = document.documentElement
  const WIDTH_KEY = 'adt-read-width'
  const WIDTHS = ['narrow', 'comfortable', 'wide']

  function normalizeWidth(value) {
    return WIDTHS.indexOf(value) >= 0 ? value : 'comfortable'
  }

  function syncWidthButtons(width) {
    document.querySelectorAll('.adt-read-width-btn').forEach((btn) => {
      const on = btn.getAttribute('data-adt-read-width') === width
      btn.setAttribute('aria-pressed', on ? 'true' : 'false')
    })
  }

  function applyReadWidth(width) {
    const next = normalizeWidth(width)
    root.setAttribute('data-adt-read-width', next)
    try {
      localStorage.setItem(WIDTH_KEY, next)
    } catch (e) {
      /* ignore quota / private mode */
    }
    syncWidthButtons(next)
  }

  applyReadWidth(root.getAttribute('data-adt-read-width') || 'comfortable')

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.adt-read-width-btn')
    if (!btn) return
    const group = btn.closest('.adt-read-width')
    if (!group) return
    applyReadWidth(btn.getAttribute('data-adt-read-width'))
  })
})()
