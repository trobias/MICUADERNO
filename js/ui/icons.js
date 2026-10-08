/* Sistema de íconos propio: 24×24, trazo 1.75, puntas redondeadas, currentColor. */
(function (root) {
  'use strict';
  var MC = root.MC || (root.MC = {});

  var ICONS = {
    hoy: '<path d="M3 18h18"/><path d="M6.5 18a5.5 5.5 0 0 1 11 0"/><path d="M12 7.5V5.2M6.6 9.7 5.1 8.2M17.4 9.7l1.5-1.5M4.4 14H2.8M21.2 14h-1.6"/>',
    calendario: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.2"/><path d="M3.5 10h17M8 3.2v3.6M16 3.2v3.6"/><path d="M8 13.8h.01M12 13.8h.01M16 13.8h.01M8 17.2h.01M12 17.2h.01"/>',
    rutinas: '<path d="M5 16.5c-1.4-4.6 1.6-9.5 6.4-9.9 3.4-.3 6 2 6 4.9 0 2.6-2 4.5-4.4 4.5-2 0-3.5-1.3-3.5-3.1 0-1.5 1.1-2.6 2.6-2.6"/><path d="M5 16.5c.9 2.3 3.4 3.8 6.3 3.8 2.3 0 4.3-.8 5.8-2.2"/><path d="M19.5 4.5 17 7"/>',
    paginas: '<path d="M8 3.5h7.5l4 4V19.8a.7.7 0 0 1-.7.7H8.7a.7.7 0 0 1-.7-.7z"/><path d="M15.5 3.5v4h4"/><path d="M11 12h5.5M11 15.5h5.5"/><path d="M5 7v13.3c0 .4.3.7.7.7H14"/>',
    anio: '<circle cx="12" cy="12.5" r="8.3"/><circle cx="12" cy="12.5" r="6.1"/><path d="M12 4.2V2.2M10.3 2.2h3.4"/><path d="M9 10.5l2 2m0-2-2 2M13 12.5l2 2m0-2-2 2"/>',
    ajustes: '<path d="M6.5 4h11M6.5 20h11"/><path d="M8 4v16M16 4v16"/><path d="M8 7.5l8 2.3M8 11.3l8 2.3M8 15.1l8 2.3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/>',
    'arrow-left': '<path d="M14.5 6 8.5 12l6 6"/>',
    'arrow-right': '<path d="M9.5 6l6 6-6 6"/>',
    more: '<path d="M6 12h.01M12 12h.01M18 12h.01" stroke-width="3"/>',
    close: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
    edit: '<path d="M4.5 19.5l1-4.2L15.8 5a1.9 1.9 0 0 1 2.7 0l.5.5a1.9 1.9 0 0 1 0 2.7L8.7 18.5z"/><path d="M13.8 7l3.2 3.2"/>',
    trash: '<path d="M4.5 7h15M9.5 7V4.8h5V7"/><path d="M6.5 7l.9 12.2c.1.7.6 1.3 1.4 1.3h6.4c.8 0 1.3-.6 1.4-1.3L17.5 7"/><path d="M10.2 11v6M13.8 11v6"/>',
    download: '<path d="M12 4v11"/><path d="M7.5 10.8 12 15.2l4.5-4.4"/><path d="M4.5 16.5v2.3c0 .9.7 1.7 1.7 1.7h11.6c.9 0 1.7-.8 1.7-1.7v-2.3"/>',
    upload: '<path d="M12 15.5V4.5"/><path d="M7.5 8.8 12 4.4l4.5 4.4"/><path d="M4.5 16.5v2.3c0 .9.7 1.7 1.7 1.7h11.6c.9 0 1.7-.8 1.7-1.7v-2.3"/>',
    print: '<path d="M7 8.5V3.8h10v4.7"/><rect x="3.8" y="8.5" width="16.4" height="8" rx="1.8"/><path d="M7 14h10v6.2H7z"/><path d="M16.8 11.3h.01"/>',
    star: '<path d="M12 3.8l2.4 5 5.4.7-4 3.7 1 5.4L12 16l-4.8 2.6 1-5.4-4-3.7 5.4-.7z"/>',
    heart: '<path d="M12 19.5s-7-4.3-7-9.4A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.1c0 5.1-7 9.4-7 9.4z"/>',
    butterfly: '<path d="M12 8.5v10"/><path d="M12 10c-1.8-3.6-5.6-5.6-7.3-4.3-1.5 1.2-.3 4.9 3 6.1-2.4.8-3 3.3-1.7 4.3 1.6 1.3 4.4-.6 6-3.6"/><path d="M12 10c1.8-3.6 5.6-5.6 7.3-4.3 1.5 1.2.3 4.9-3 6.1 2.4.8 3 3.3 1.7 4.3-1.6 1.3-4.4-.6-6-3.6"/><path d="M11 7.2 9.6 4.8M13 7.2l1.4-2.4"/>',
    sparkle: '<path d="M12 4c.5 4.2 1.8 5.5 6 6-4.2.5-5.5 1.8-6 6-.5-4.2-1.8-5.5-6-6 4.2-.5 5.5-1.8 6-6z"/><path d="M18.5 15.5c.2 1.6.7 2.1 2.3 2.3-1.6.2-2.1.7-2.3 2.3-.2-1.6-.7-2.1-2.3-2.3 1.6-.2 2.1-.7 2.3-2.3z"/>',
    check: '<path d="M5 12.5l4.2 4.2L19 7"/>',
    moon: '<path d="M19 14.6A7.5 7.5 0 0 1 9.4 5a7.5 7.5 0 1 0 9.6 9.6z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>',
    pause: '<path d="M9 6.5v11M15 6.5v11"/>',
    play: '<path d="M8 5.8v12.4L18 12z"/>',
    pin: '<path d="M9 4.5h6l-1 5 3 3.2H7l3-3.2z"/><path d="M12 12.7v7"/>',
    bell: '<path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 1.5h-14z"/><path d="M10.3 20.2a1.8 1.8 0 0 0 3.4 0"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
    install: '<rect x="5" y="3.5" width="14" height="17" rx="2.5"/><path d="M12 7.5v7.5M9 12.2l3 3 3-3"/>',
    loop: '<path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.5"/><path d="M20 4.5v4h-4"/><path d="M20 12a8 8 0 0 1-13.7 5.6L4 15.5"/><path d="M4 19.5v-4h4"/>',
    later: '<path d="M4 12h13"/><path d="M13 7.5l4.5 4.5-4.5 4.5"/><path d="M20.5 6v12"/>',
    'half': '<rect x="5" y="5" width="14" height="14" rx="2"/><path d="M8 16 16 8"/>',
    knot: '<circle cx="12" cy="12" r="2.6"/><path d="M12 5.5v2M12 16.5v2"/>',
    stitch: '<rect x="5" y="5" width="14" height="14" rx="2"/><path d="M8.5 8.5l7 7M15.5 8.5l-7 7"/>',
    box: '<rect x="5" y="5" width="14" height="14" rx="2"/>',
    sticker: '<path d="M5 4.5h10l4.5 4.5v9.5c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1z"/><path d="M15 4.5V8a1 1 0 0 0 1 1h3.5"/><path d="M9 14.5c1.6 1.4 4.4 1.4 6 0"/><path d="M9.5 11h.01M14.5 11h.01"/>',
    rotate: '<path d="M18.5 12a6.5 6.5 0 1 1-2-4.7"/><path d="M17.3 3.5v4.2h-4.2"/>',
    'rotate-left': '<path d="M5.5 12a6.5 6.5 0 1 0 2-4.7"/><path d="M6.7 3.5v4.2h4.2"/>',
    undo: '<path d="M9 8H4.5L8 4.5M4.5 8h10a5.5 5.5 0 0 1 0 11H12"/>',
    redo: '<path d="M15 8h4.5L16 4.5M19.5 8h-10a5.5 5.5 0 0 0 0 11H12"/>',
    grow: '<path d="M12 5v14M5 12h14"/><circle cx="12" cy="12" r="9"/>',
    shrink: '<path d="M5 12h14"/><circle cx="12" cy="12" r="9"/>',
    text: '<path d="M5 6.5h14M12 6.5V19M9 19h6"/>',
    // Herramientas de dibujo (A11)
    nib: '<path d="M12 3.5l5.5 7-5.5 10-5.5-10z"/><path d="M12 13.2v7.3"/><circle cx="12" cy="11.2" r="1.3"/>',
    graphite: '<path d="M5 19l2.2-.6L18.6 7a1.8 1.8 0 0 0-2.6-2.6L4.6 15.8z"/><path d="M5 19l.6-2.2M14.6 5.8l2.6 2.6"/><path d="M8.5 20.5h10" stroke-dasharray="1.5 2.5"/>',
    marker: '<path d="M7 15.5l8.8-8.8 3 3-8.8 8.8H7z"/><path d="M14.2 8.3l3 3"/><path d="M4 21h9" stroke-width="3" opacity=".45"/>',
    spray: '<rect x="8.5" y="9" width="7" height="11.5" rx="1.6"/><path d="M10 9V6.5h4V9M12 6.5V4.5h3"/><path d="M18.5 3.5h.01M20.5 5.5h.01M18.5 6.8h.01M20.8 2.8h.01" stroke-width="2.2"/>',
    bucket: '<path d="M4.5 11l6.6-6.6 7.5 7.5-6.6 6.6a2 2 0 0 1-2.8 0L4.5 13.8a2 2 0 0 1 0-2.8z"/><path d="M8 7.5L5.6 5.1"/><path d="M4.8 12h13.6"/><path d="M20 15.5c.9 1.3 1.4 2.2 1.4 3a1.4 1.4 0 0 1-2.8 0c0-.8.5-1.7 1.4-3z"/>',
    eraser: '<path d="M8.5 19.5h11"/><path d="M4.6 14.6l9-9a2 2 0 0 1 2.8 0l2.9 2.9a2 2 0 0 1 0 2.8l-7.8 7.8H8.4l-3.8-3.8a1.2 1.2 0 0 1 0-1.7z"/><path d="M9 10.3l5.6 5.6"/>',
    list: '<path d="M9.5 7h10M9.5 12h10M9.5 17h10"/><path d="M5 7h.01M5 12h.01M5 17h.01" stroke-width="2.6"/>',
    cup: '<path d="M5 9.5h11v4.5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z"/><path d="M16 11h1.5a2.3 2.3 0 0 1 0 4.6H16"/><path d="M8.5 3.5c-.8 1 .8 2 0 3M12 3.5c-.8 1 .8 2 0 3"/>',
    energy1: '<rect x="7" y="4" width="10" height="17" rx="2.5"/><path d="M9.5 17.5h5"/>',
    energy2: '<rect x="7" y="4" width="10" height="17" rx="2.5"/><path d="M9.5 17.5h5M9.5 14h5"/>',
    energy3: '<rect x="7" y="4" width="10" height="17" rx="2.5"/><path d="M9.5 17.5h5M9.5 14h5M9.5 10.5h5M9.5 7.5h5"/>',
    week: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.2"/><path d="M3.5 10h17M8 3.2v3.6M16 3.2v3.6M9.2 10v10.5M14.8 10v10.5"/>',
    grid: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.2"/><path d="M3.5 10h17M3.5 15.2h17M9.2 5v15.5M14.8 5v15.5"/>'
  };

  function injectSprite() {
    if (document.getElementById('mc-icons')) return;
    var symbols = Object.keys(ICONS).map(function (name) {
      return '<symbol id="i-' + name + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">' + ICONS[name] + '</symbol>';
    }).join('');
    var holder = document.createElement('div');
    holder.id = 'mc-icons';
    holder.setAttribute('aria-hidden', 'true');
    holder.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    holder.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg">' + symbols + '</svg>';
    document.body.insertBefore(holder, document.body.firstChild);
  }

  /** MC.icon('plus') → <svg aria-hidden>…</svg>. Con label → role=img + aria-label. */
  MC.icon = function (name, label) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('class', 'icon icon-' + name);
    if (label) { svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', label); }
    else { svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false'); }
    var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '#i-' + name);
    svg.appendChild(use);
    return svg;
  };

  MC.icons = { ICONS: ICONS, injectSprite: injectSprite };
})(typeof window !== 'undefined' ? window : globalThis);
