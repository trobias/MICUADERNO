// Carga los scripts clásicos de js/core en el contexto global de Node.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..', '..');
const CORE = ['ns', 'dates', 'routes', 'recurrence', 'store', 'theme', 'templates', 'model', 'backup', 'zip', 'exporters', 'insights'];

function load() {
  if (globalThis.MC && globalThis.MC.__loaded) return globalThis.MC;
  for (const name of CORE) {
    const file = path.join(ROOT, 'js', 'core', name + '.js');
    vm.runInThisContext(fs.readFileSync(file, 'utf8'), { filename: file });
  }
  globalThis.MC.__loaded = true;
  return globalThis.MC;
}

module.exports = { load, ROOT };
