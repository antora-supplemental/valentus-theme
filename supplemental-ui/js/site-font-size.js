/**
 * Reading font size control: small | medium | large
 * Persists to localStorage (`adt-font-size`) and html[data-adt-font-size].
 * UI is shown only in condensed viewports; preference applies at all widths.
 */
(function () {
  const root = document.documentElement
  const SIZE_KEY = 'adt-font-size'
  const SIZES = ['small', 'medium', 'large']

  function normalizeSize(value) {
    return SIZES.indexOf(value) >= 0 ? value : 'medium'
  }

  function syncSizeButtons(size) {
    document.querySelectorAll('.adt-font-size-btn').forEach((btn) => {
      const on = btn.getAttribute('data-adt-font-size') === size
      btn.setAttribute('aria-pressed', on ? 'true' : 'false')
    })
  }

  function applyFontSize(size) {
    const next = normalizeSize(size)
    root.setAttribute('data-adt-font-size', next)
    try {
      localStorage.setItem(SIZE_KEY, next)
    } catch (e) {
      /* ignore quota / private mode */
    }
    syncSizeButtons(next)
  }

  applyFontSize(root.getAttribute('data-adt-font-size') || 'medium')

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.adt-font-size-btn')
    if (!btn) return
    const group = btn.closest('.adt-font-size')
    if (!group) return
    applyFontSize(btn.getAttribute('data-adt-font-size'))
  })
})()
