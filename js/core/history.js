/* Historial transitorio por superficie. Los comandos guardan por la vía normal de cada editor. */
(function (root) {
  'use strict';
  var MC = root.MC || (root.MC = {});
  var active = null;

  function create(opts) {
    opts = opts || {};
    var limit = Number.isFinite(opts.limit) ? Math.max(1, Math.floor(opts.limit)) : 50;
    var entries = [], cursor = 0, busy = false, listeners = [];
    function changed() { listeners.slice().forEach(function (fn) { fn(); }); }
    function canUndo() { return !busy && cursor > 0; }
    function canRedo() { return !busy && cursor < entries.length; }
    function push(command) {
      if (!command || typeof command.undo !== 'function' || typeof command.redo !== 'function') throw new TypeError('El comando necesita undo y redo');
      if (busy) return false;
      entries.length = cursor;
      entries.push(command);
      if (entries.length > limit) entries.shift();
      cursor = entries.length;
      changed();
      return true;
    }
    function run(direction) {
      if (!(direction === 'undo' ? canUndo() : canRedo())) return Promise.resolve(false);
      var command = entries[direction === 'undo' ? cursor - 1 : cursor];
      busy = true; changed();
      return Promise.resolve().then(function () { return command[direction](); }).then(function () {
        cursor += direction === 'undo' ? -1 : 1;
        busy = false; changed();
        return true;
      }, function (error) { busy = false; changed(); throw error; });
    }
    var stack = {
      push: push,
      undo: function () { return run('undo'); },
      redo: function () { return run('redo'); },
      canUndo: canUndo, canRedo: canRedo,
      clear: function () { if (busy) return; entries = []; cursor = 0; changed(); },
      onChange: function (fn) { listeners.push(fn); fn(); return function () { listeners = listeners.filter(function (x) { return x !== fn; }); }; }
    };
    return stack;
  }

  function editable(el) {
    return el && el.closest && el.closest('input, textarea, [contenteditable]:not([contenteditable="false"]), [role="textbox"]');
  }
  if (root.document) root.document.addEventListener('keydown', function (e) {
    if ((!e.ctrlKey && !e.metaKey) || e.altKey || editable(e.target)) return;
    var key = e.key.toLowerCase();
    var redo = (key === 'z' && e.shiftKey) || (key === 'y' && !e.shiftKey);
    var undo = key === 'z' && !e.shiftKey;
    if (!active || !(redo || undo) || !(redo ? active.canRedo() : active.canUndo())) return;
    e.preventDefault();
    (redo ? active.redo() : active.undo()).catch(function (error) { console.error(error); });
  });
  MC.history = {
    create: create,
    activate: function (stack) { var previous = active; active = stack; return previous; },
    active: function () { return active; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
