/* Apply stored reading font size before paint (inlined by ui-orchestrator head slot). */
(function () {
  try {
    var s = localStorage.getItem('valentus-font-size')
    document.documentElement.setAttribute(
      'data-valentus-font-size',
      s === 'small' || s === 'medium' || s === 'large' ? s : 'medium'
    )
  } catch (e) {
    document.documentElement.setAttribute('data-valentus-font-size', 'medium')
  }
})()
