/* Platform modifier key hint before paint (inlined by ui-orchestrator head slot / head-meta). */
(function () {
  var mod = 'ctrl'
  try {
    var uad = navigator.userAgentData
    var plat = (uad && uad.platform) || navigator.platform || ''
    var ua = navigator.userAgent || ''
    if (/mac|iphone|ipad|ipod/i.test(plat) || /Mac OS X|Macintosh/i.test(ua)) mod = 'meta'
  } catch (e) {}
  document.documentElement.setAttribute('data-adt-modkey', mod)
})()
