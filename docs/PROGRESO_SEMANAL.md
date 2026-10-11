# Progreso semanal — contrato D64

## El problema que se corrige

Había dos cálculos sobre información distinta. La dueña tenía el plan semanal y registros de actividades, algunos sin `routineId`; estos últimos se sumaban como obligaciones nuevas aunque su nombre ya tuviera una meta. Una invitada sin permiso de Repeticiones recibía solo los registros y los trataba como un plan completo: podía mostrar una meta alcanzada y un porcentaje que no representaban la planificación.

La investigación de producción fue de lectura: plan persistido, agregados de registros y permisos efectivos de la sesión. No se cambiaron registros ni permisos. Las pruebas usan exclusivamente una reproducción sintética de Nicole, sin identificadores ni contenido personal de producción.

## Una sola regla

Una **repetición** es la regla que programa una actividad (días fijos o cierta cantidad semanal). Una **actividad** es la casilla de un día, suelta o generada por esa regla. Un **registro adicional** es una marca que supera la meta: la repetición no es un extra por sí misma.

1. `weeks.activityPlan` es la referencia de una semana cerrada. No sustituirlo por las reglas actuales. Una invitada conserva también el plan recibido de la semana en curso; mirar nunca lo regenera ni lo guarda.
2. Calcular cada repetición por sus fechas elegibles e id, deduplicando ocurrencias. Limitar cada meta flexible antes de agrupar: las marcas excedentes de una repetición no completan otra repetición del mismo nombre.
3. Agrupar con `MC.model.weeklyActivityKey`: espacios, mayúsculas y tildes equivalentes; conserva la equivalencia existente entre Practicar/Practica Diseño. No hacer coincidencias por palabras parciales ni por interpretación del texto.
4. Los registros restantes cuyo nombre coincide con una meta aportan a esa meta, sin aumentar su denominador. No se les escribe `routineId`, no se fusionan registros y no se alteran estados, reglas o fechas. Sin meta de ese nombre, cada actividad suelta sigue siendo una oportunidad propia.
5. `Lo hice` aporta 1; `Un poquito`, 0,5. Se priorizan completas al limitar. `checked = done + partial` cuenta las marcas que caben en la meta; `value = done + partial / 2` determina el porcentaje. Alcanzar N/N sigue dando estrella aunque todas sean Un poquito (D58).
6. `recorded` conserva el número de marcas done/partial, incluso sobre la meta. `extra = recorded - checked` muestra registros adicionales. Pendientes, Hoy no salió y Lo dejo para otro día no son avances ni registros adicionales. El resumen de avance puede tener menos marcas que los registros originales: no implica borrado.
7. Días borrados o excluidos de observaciones y actividades borradas quedan fuera conforme a las reglas existentes. No leer textos de emociones para decidir un avance.

`MC.model.weeklyProgress` es el cálculo común; `getWeeklyProgress` carga los datos y pasa el alcance de lectura. `MC.insights.victories` usa el mismo cálculo para el año y la primera fecha de alcance. No persistir totales ni generar marcas automáticas en `marks`.

## Permisos y lectura parcial

`weeklyProgressAccess()` requiere Actividades **y** Repeticiones en una invitada; dueño y uso local tienen información completa. Semana permite notas, pero no sustituye ninguno de esos dos permisos. Mi año tampoco concede acceso a las metas.

| Información compartida | Presentación |
| --- | --- |
| Actividades y Repeticiones | Cálculo sobre los registros y plan recibidos, N/M, barra, porcentaje y estrella |
| Actividades sin Repeticiones | Conteos de marcas por nombre y aviso de metas no compartidas; sin denominador, barra, porcentaje, completo ni victoria semanal automática |
| Repeticiones sin Actividades | Aviso de registros no compartidos; sin conteos de avance ni porcentaje |

El modo parcial devuelve `complete: false`, `total/value/percent: null`; cero sería un avance conocido y no significa lo mismo. También devuelve `missing` para el aviso. Las victorias elegidas manualmente conservan sus reglas de privacidad. Los permisos son necesarios para calcular; los filtros de privacidad y los datos recibidos siguen aplicándose. No prometer igualdad si una fuente está oculta o aún no llegó.

Nunca ampliar permisos para arreglar una cifra. Si la dueña quiere compartir el progreso de las metas, debe compartir también Repeticiones mediante el flujo de permisos existente. No cambiar RLS ni añadir planes a una sección ajena.

## Ejemplo reproducible

`tests/fixtures/weekly-progress.cjs` crea cinco metas: Trabajar 5, Practica Diseño 5, Caminar 3, Salir con una amiga 1 y Bici 1. Hay 14 actividades, con 9 marcas done/partial, mezclando sueltas y ocurrencias enlazadas.

| Resultado | Cálculo anterior | D64 |
| --- | --- | --- |
| Oportunidades totales | 23 (15 previstas + 8 sueltas) | 15 |
| Caminar | 4/5 | 3/3 + 1 registro adicional |
| Avance ponderado | 7,5/23 → 33 % | 6,5/15 → 43 % |
| Invitada sin metas | 7,5/14 → 54 %, Caminar 4/4 completo | 9 marcas, Caminar 4 registros; sin porcentaje ni completo |

Los 14 registros sobreviven al cálculo, la copia y la recarga. El cuarto Caminar permanece en su día; ya no exige otra oportunidad ni aumenta el avance por encima de 3/3.

## Verificación y mantenimiento

- Unitarias: `tests/unit/weekly-progress.test.js` (normalización, límites, privacidad, historial, copia y permisos) y `tests/unit/year-a8.test.js` (misma meta, fecha de alcance y lectura parcial).
- Navegador: recorrido D64 en `tests/e2e/run.mjs`, file/HTTP, escritorio/375 px, recarga, año y permisos parciales/completos. Las respuestas de nube son fixtures; comprobar que mirar no sube nada.
- Ejecutar `npm test`, `npm run check`, `npm run typecheck` y `npm run build` con el Chromium instalado configurado como `CHROMIUM`. Para iterar: `E2E_GREP=D64 npm run e2e` (asignar variables según el shell).
- Si cambia el contrato, actualizar este documento, SPEC, DATA_MODEL y los casos de regresión. No copiar filas personales para fabricar fixtures.
- Después de una publicación autorizada, verificar el shell v82 en web/PWA y la misma semana: dueña con meta y adicionales; invitada sin Repeticiones con aviso; con ambos permisos y las mismas fuentes, mismo cálculo. Esta comprobación es de lectura y no autoriza cambiar permisos o datos.
- Sin migración: copia v13 e IndexedDB 5. Shell cache v82. Publicar requiere autorización; build y fixtures locales no prueban que producción ya tenga la corrección.
