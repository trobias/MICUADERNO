/* Nivel de motion y transiciones de vista. Ver DESIGN §12. */
(function (root) {
  'use strict';
  var MC = root.MC || (root.MC = {});

  var level = 'suaves';
  var mq = root.matchMedia ? root.matchMedia('(prefers-reduced-motion: reduce)') : null;

  function apply(l) {
    level = MC.model.MOTION.indexOf(l) !== -1 ? l : 'suaves';
    document.documentElement.dataset.motion = level;
  }

  /**
   * ¿Se permite este tipo de movimiento?
   *  move   → desplazamientos/escala (UI)
   *  cover3d→ giro de la tapa
   *  scenes → escenas ambientales
   *  fade   → solo opacidad
   */
  function allows(kind) {
    if (level === 'ninguna') return false;
    if (kind === 'fade') return true;
    if (level === 'reducidas') return false;
    if (kind === 'cover3d') return level === 'completas';
    return true;
  }

  function duration(name) {
    var v = getComputedStyle(document.documentElement).getPropertyValue('--dur-' + name).trim();
    return parseFloat(v) || 0;
  }

  /** Transición de página: la hoja se desliza apenas (dir: 1 adelante, -1 atrás, 0 cambio de pestaña). */
  function swap(container, render, dir) {
    var dur = duration(dir ? 'panel' : 'ui');
    if (!dur || !allows('fade') || !container.animate) { render(); return; }
    var dx = allows('move') && dir ? 12 * dir : 0;
    render();
    container.animate(
      [{ opacity: 0, transform: 'translateX(' + dx + 'px)' }, { opacity: 1, transform: 'translateX(0)' }],
      { duration: dur, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }
    );
  }

  if (mq && mq.addEventListener) {
    mq.addEventListener('change', function () { MC.emit('motion:system'); });
  }

  MC.motion = { apply: apply, allows: allows, level: function () { return level; }, duration: duration, swap: swap,
    systemReduced: function () { return !!(mq && mq.matches); } };
})(typeof window !== 'undefined' ? window : globalThis);
