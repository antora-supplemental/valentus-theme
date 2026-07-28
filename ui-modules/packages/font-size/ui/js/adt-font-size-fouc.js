/* Apply stored reading font size before paint (inlined by ui-orchestrator head slot). */
(function () {
  try {
    var s = localStorage.getItem('adt-font-size')
    document.documentElement.setAttribute(
      'data-adt-font-size',
      s === 'small' || s === 'medium' || s === 'large' ? s : 'medium'
    )
  } catch (e) {
    document.documentElement.setAttribute('data-adt-font-size', 'medium')
  }
})()
