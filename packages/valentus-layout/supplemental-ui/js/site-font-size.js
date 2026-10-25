/**
 * Reading font size control: small | medium | large
 * Persists to localStorage (`valentus-font-size`) and html[data-valentus-font-size].
 * UI is shown only in condensed viewports; preference applies at all widths.
 */
(function () {
  const root = document.documentElement
  const SIZE_KEY = 'valentus-font-size'
  const SIZES = ['small', 'medium', 'large']

  function normalizeSize(value) {
    return SIZES.indexOf(value) >= 0 ? value : 'medium'
  }

  function syncSizeButtons(size) {
    document.querySelectorAll('.valentus-font-size-btn').forEach((btn) => {
      const on = btn.getAttribute('data-valentus-font-size') === size
      btn.setAttribute('aria-pressed', on ? 'true' : 'false')
    })
  }

  function applyFontSize(size) {
    const next = normalizeSize(size)
    root.setAttribute('data-valentus-font-size', next)
    try {
      localStorage.setItem(SIZE_KEY, next)
    } catch (e) {
      /* ignore quota / private mode */
    }
    syncSizeButtons(next)
  }

  applyFontSize(root.getAttribute('data-valentus-font-size') || 'medium')

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.valentus-font-size-btn')
    if (!btn) return
    const group = btn.closest('.valentus-font-size')
    if (!group) return
    applyFontSize(btn.getAttribute('data-valentus-font-size'))
  })
})()
