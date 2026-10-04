# Índice de Páginas después de borrar — investigación y arreglo

Estado al 04/10/2026: **reproducido y arreglado en Chromium (cache `v25`)**; queda confirmar en el navegador o dispositivo de la persona usuaria y en otros motores. El commit `3403078` corrigió la cobertura E2E y amplió el diagnóstico; el arreglo de la app está en `js/ui/motion.js` (ver «Causa y arreglo» al final). Este archivo es el punto de partida para cualquier agente que vuelva a trabajar en Páginas, Mis hojas o navegación.

## Qué se reportó y cuánto importa

Al borrar una página, a veces el índice aparece pero no marca un enlace al pasar el mouse y no deja abrir otra página hasta salir al calendario y volver a Páginas. Si se reproduce, es un problema importante de navegación porque corta un flujo habitual. No hay evidencia de pérdida de páginas, de fallo de IndexedDB ni de que afecte al resto de secciones. No confundirlo con los E2E llamados `base:`: esos prueban versiones de IndexedDB y son casos distintos.

En otra corrida se informó **42/43 E2E**, con fallo en el caso del índice. Quien la investigaba indicó que forzar un recálculo de estilo devolvía el hit-test y sospechó del panel de Chromium. El reporte compartido no incluye la traza, el elemento que interceptó el enlace, las coordenadas ni la versión del navegador. Esa observación orienta el diagnóstico, pero **no prueba** que Chromium sea la causa ni que un recálculo sea la solución.

## Ruta de código y qué comprueba el test

- `js/views/pages.js`: `remove()` cancela el borrador, manda la página a la papelera, navega al índice con `MC.routes.pages()` y ofrece Deshacer. `renderIndex()` carga `M.getPages()` de forma asíncrona y dibuja enlaces `.toc__link`.
- `js/app.js`: `openPanel()` reemplaza el contenido de `#panel-body` al cambiar la ruta dentro del `<dialog id="panel">`; `MC.motion.swap()` anima ese contenido. `css/notebook.css` define el panel y sus capas; `css/components.css` define el aviso de Deshacer.
- `tests/e2e/run.mjs`, caso **«páginas: después de borrar, el índice responde siempre»**: borra y vuelve al índice en `file://` y HTTP, también después de decorar y deshacer. Comprueba `elementFromPoint()` para cada enlace, ausencia de diálogos/popovers/inert sobrantes, `:hover`, clic, teclado y toque móvil. Una falla de `elementFromPoint()` sobre **uno** de los enlaces no demuestra por sí sola que **todos** estén inertes; hay que leer cuál falló y qué lo cubrió.

## Evidencia de esta revisión

| Comprobación | Resultado |
|---|---|
| Caso aislado antes del ajuste | 6/6 corridas pasaron. |
| Suite completa antes del ajuste | 43/43 E2E pasaron. |
| Caso aislado después del ajuste | 1/1 pasó con `tap()` auténtico. |
| `npm run check` después del ajuste | Sintaxis de 34 JS, 94 unitarias y 43/43 E2E Chromium. |
| Caso aislado con el arreglo de `motion.js` | 0/9 fallaron (sin el arreglo, 1/6). |
| `npm run check` con el arreglo | Sintaxis de 35 JS, 99 unitarias y 43/43 E2E Chromium. |

Se encontró un defecto **del test**: el contexto móvil no tenía `hasTouch` y `tap()` hacía fallback silencioso a `click()`. `3403078` habilitó tacto en ese contexto, quitó el fallback y amplió el error de hit-test con enlace, coordenadas, elemento superior, scroll y animaciones del panel. Eso fortalece la prueba móvil y prepara la próxima reproducción; no equivale a reparar el síntoma de escritorio.

## Qué hacer si vuelve a fallar

1. Conservar la salida completa de `npm run e2e` o `npm run check`, especialmente el JSON de `assertIndexAlive`: `hits` (`ok`, título, `x/y`, `top`), `panelScroll`, `panelAnimations`, `extraDialogs`, `popovers` e `inert`. Anotar si falló en `simple`, `decorando`, `deshacer`, `file://`, HTTP o táctil; el test actual podría añadir esa última etiqueta al error si hace falta.
2. Confirmar si el enlace existe y está visible, si otro elemento queda encima, si está fuera del viewport o si falla solamente el hit-test de Chromium. Comparar mouse, teclado y toque sin cambiar el DOM entre mediciones. Registrar versión de Chromium y resolución. No convertir un fallo de geometría del test en diagnóstico de la app sin comprobar un clic real.
3. Repetir la secuencia mínima: abrir Páginas → borrar una página → intentar abrir otra **sin salir al calendario**. Si ocurre en el navegador de la persona usuaria, usar `?debug=hit` para ver qué queda bajo el puntero y guardar pasos, navegador y ancho de pantalla. Probar otros motores cuando estén disponibles.
4. Corregir la causa demostrada, ejecutar el caso enfocado con `$env:E2E_GREP='páginas: después de borrar'; npm run e2e`, después `npm run check` y revisar a mano mouse/teclado/toque. Mantener una prueba que falle antes y pase después. Actualizar este archivo, `BACKLOG.md`, `HANDOFF.md` y `CHANGELOG.md` al cerrar el síntoma.

**Prioridad:** tratar como falla de navegación si se reproduce; mantenerlo visible en el backlog. La intermitencia del E2E, sin traza ni reproducción actual, no demuestra que deban detenerse tareas independientes de preparación de la nube. La futura vista Mis hojas debe preservar y ampliar este recorrido antes de retirar Páginas.

## Causa y arreglo (04/10/2026, cache `v25`)

**Reproducción.** Con el caso aislado repetido seis veces sin cambios, falló 1 de 6 (`base: 1/6`). En la corrida fallida, `document.elementsFromPoint()` sobre los enlaces del índice **salteaba todo el subárbol de `#panel-body`** (devolvía el `<dialog>` y lo que estaba detrás), el enlace no tomaba foco con `focus()` y no figuraba como ignorado en el árbol de accesibilidad; no había animaciones en curso, ni `inert`, ni diálogos o popovers sobrantes. Forzar `display: none` → `''` en `#panel-body` devolvía de inmediato el hit-test y el foco: el contenido estaba dibujado pero Chromium había quedado con una capa de hit-test vieja del contenedor.

**Causa.** `MC.motion.swap()` animaba `#panel-body` —el contenedor fijo del cuadro— con WAAPI (`opacity`/`transform`) en el mismo tick en que se reemplazaba su contenido (borrar → navegar al índice → dibujo asíncrono de `renderIndex`). Esa combinación (contenedor compuesto que cambia de hijos mientras se anima) dejaba a veces el hit-test del contenedor desactualizado en Chromium.

**Arreglo.** `swap()` ahora anima **la hoja nueva** (`container.firstElementChild`), nunca el contenedor fijo. La transición se ve igual (misma duración, curva y desplazamiento; respeta `html[data-motion]`), pero el contenedor que recibe los clics no queda compuesto. Comprobación: el mismo caso repetido nueve veces con el arreglo, `fix: 0/9` (antes `1/6`), y `npm run check` completo.

**Si vuelve a fallar**, seguir los pasos de arriba: puede haber otra causa en otro motor. El caso E2E se mantiene sin cambios.
