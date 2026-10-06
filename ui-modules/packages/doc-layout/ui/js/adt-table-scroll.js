/*! Wrap bare AsciiDoc tables so overflow-x can live on a div (not the table). */
;(function () {
  function wrapTables (root) {
    var doc = root || document
    var tables = doc.querySelectorAll('.doc table.tableblock')
    for (var i = 0; i < tables.length; i++) {
      var table = tables[i]
      if (table.closest('.tablecontainer, .adt-table-scroll, .admonitionblock, .colist')) continue
      var parent = table.parentNode
      if (!parent) continue
      var wrap = doc.createElement('div')
      wrap.className = 'adt-table-scroll'
      wrap.setAttribute('role', 'region')
      wrap.setAttribute('tabindex', '0')
      var caption = table.querySelector('caption')
      var label = caption ? caption.textContent.trim() : 'Scrollable table'
      wrap.setAttribute('aria-label', label)
      parent.insertBefore(wrap, table)
      wrap.appendChild(table)
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { wrapTables(document) })
  } else {
    wrapTables(document)
  }
})()
