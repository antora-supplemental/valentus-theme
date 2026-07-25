/* Apply stored reading width before paint (inlined by ui-orchestrator head slot). */
(function () {
  try {
    var w = localStorage.getItem('adt-read-width')
    document.documentElement.setAttribute(
      'data-adt-read-width',
      w === 'narrow' || w === 'comfortable' || w === 'wide' ? w : 'comfortable'
    )
  } catch (e) {
    document.documentElement.setAttribute('data-adt-read-width', 'comfortable')
  }
})()
