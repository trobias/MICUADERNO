# MI CUADERNO

*un lugarcito para mí ♡*

Un diario personal con forma de cuaderno de tela bordado: podés escribir cómo te sentiste al empezar y terminar el día, y antes o después de una actividad, con tus propias palabras. Hay actividades con estados amables (*lo hice · hice un poquito · lo dejo para otro día · hoy no salió*), rutinas, páginas libres, stickers y dibujos, adjuntos, calendario, año bordado y recuerdos. Nada se pierde de golpe: hay papelera, deshacer y un “guardado ✓” que avisa cuándo quedó guardado; cada día o página puede marcarse como privado.

**En la versión actual, todo queda en este dispositivo.** No hay estadísticas de uso. La base de la versión en la nube (cuenta con usuario y PIN, permisos por sección, avisos) ya está hecha pero **todavía no está publicada** ni sincroniza datos: ver [`docs/NUBE.md`](docs/NUBE.md) y [`MIGRATION_PLAN.md`](MIGRATION_PLAN.md).

## Cómo abrirlo

**Opción 1 — Carpeta (sin instalar nada).** Descargá el repo (o la carpeta que arma `npm run dist`) y hacé **doble clic en `index.html`**. Funciona sin internet en Chrome, Edge y Firefox. Tus datos quedan guardados en ese navegador.

**Opción 2 — Como app (PWA).** Publicá esta carpeta en cualquier hosting estático con HTTPS (por ejemplo **GitHub Pages**: *Settings → Pages → Deploy from branch*). Al abrir la dirección, el navegador ofrece **Instalar**: queda con su ícono, se abre sin barra del navegador, funciona sin conexión y puede dejarte recordatorios suaves (solo si los activás).

> Cada navegador y cada forma de abrirlo (carpeta o web) guarda su propio cuaderno. Para pasar de uno a otro: **Ajustes → Guardar una copia** y después **Abrir una copia…** en el otro.

## Cuidar tus datos

- **Ajustes → Mis datos → Guardar una copia (.json)**: una copia completa. El cuaderno te lo recuerda de vez en cuando.
- **Abrir una copia…** restaura esa copia (avisa antes de reemplazar lo que hay).
- **Llevarme mi cuaderno**: texto (.txt), planilla (.xlsx), CSV e **Imprimir mi cuaderno** (A4, A5 o Carta; también “Guardar como PDF”).

## Para quien desarrolla

Leé primero [`AGENTS.md`](AGENTS.md), [`HANDOFF.md`](HANDOFF.md) (estado para retomar sin contexto) y [`MIGRATION_PLAN.md`](MIGRATION_PLAN.md) (orden aprobado A→B→C). Después [`SPEC.md`](SPEC.md), [`DESIGN.md`](DESIGN.md) y [`DATA_MODEL.md`](DATA_MODEL.md). Decisiones en [`DECISIONS.md`](DECISIONS.md). La visión histórica, en [`VISION.md`](VISION.md); estado, en [`ROADMAP.md`](ROADMAP.md) y [`BACKLOG.md`](BACKLOG.md).

```
npm test          # pruebas unitarias (sin dependencias)
npm install       # solo para e2e e íconos (playwright-core)
npm run e2e       # recorridos reales en Chromium (file:// y http://); al final dice cuántos pasaron
npm run check     # sintaxis + unit + e2e
npm run serve     # http://localhost:4173 para probar la PWA
npm run dist      # arma dist/MI-CUADERNO/ + .zip para regalar
npm run dev       # nube: Next.js en http://localhost:3000 (con .env.local de Supabase, con cuentas)
npm run build     # nube: build de producción (lo que corre Vercel)
npm run test:cloud  # nube: PIN, avisos y RLS contra un Postgres local
```

La capa de la nube (Next.js + Supabase en Vercel) está en `app/`, `lib/`, `proxy.ts` y `supabase/`; cómo publicarla, en [`docs/NUBE.md`](docs/NUBE.md).

El cuaderno es HTML + CSS + JavaScript sin frameworks ni paso de build (la capa de cuentas en la nube usa Next.js, aparte). Fuentes (OFL) incluidas: Young Serif, Castoro, Atkinson Hyperlegible Next y Nanum Pen Script.

---

## 📦 Colección de skills (para agentes)

Colección y respaldo de skills para agentes de inteligencia artificial y desarrollo asistido.

Este repositorio contiene el archivo comprimido **`skills.rar`** (y alternativo **`skills.zip`**) con **73 skills** completas, además del árbol desglosado en el directorio [`skills/`](./skills) para consulta directa.

---

## 📦 Descarga directa

* 📁 **[Descargar skills.rar](./skills.rar)** *(Comprimido con WinRAR)*
* 📁 **[Descargar skills.zip](./skills.zip)** *(Formato ZIP universal)*

---

## 🚀 Cómo instalar las skills en tu entorno

Para instalarlas en tu perfil de usuario de Antigravity / Codex / Claude:

1. Descarga y descomprime `skills.rar` (o `skills.zip`).
2. Copia las carpetas de las skills que necesites dentro de:
   * **Windows**: `%USERPROFILE%\.agents\skills\` (o `%USERPROFILE%\.gemini\antigravity\skills\`)
   * **Linux / macOS**: `~/.agents/skills/`
3. Reinicia tu sesión o recarga las skills en tu asistente.

---

## 📚 Catálogo de Skills Incluidas (73 Skills)

### 🎨 Frontend, Diseño y UI/UX
* **`accessibility`**: Auditorías y mejoras de accesibilidad web bajo lineamientos WCAG 2.2.
* **`animate`**: Creación de animaciones e interacciones desde cero.
* **`browser-testing-with-devtools`**: Pruebas en navegadores reales mediante Chrome DevTools MCP.
* **`cee-enriquez-brand`**: Tokens, paletas y componentes de la identidad de marca CEE Enriquez.
* **`core-web-vitals`**: Optimización de LCP, INP, CLS y experiencia de página.
* **`frontend-ui-engineering`**: Construcción de interfaces responsivas y de grado productivo.
* **`generative_ui`**: Renderizado de widgets interactivos y artefactos HTML.
* **`impeccable`**: Pulido visual, jerarquía, diseño, microinteracciones y estilos.
* **`modern-web-guidance`**: Guía y estándares actualizados de APIs web modernas.
* **`review-animations`**: Auditoría y crítica de animaciones existentes.
* **`ui-ux-pro-max`**: Inteligencia de diseño UX/UI, paletas y sistemas de diseño.

### 🛡️ Seguridad, Auditoría y Calidad
* **`agentic-actions-auditor`**: Auditoría de workflows de GitHub Actions con agentes IA.
* **`best-practices`**: Buenas prácticas modernas de seguridad, compatibilidad y código limpio.
* **`code-review-and-quality`**: Revisión multieje de código antes de merge.
* **`code-simplification`**: Refactorización para reducir complejidad innecesaria.
* **`constraint-driven-development`**: Contratos de estándares de calidad irrenunciables.
* **`differential-review`**: Análisis de seguridad diferencial en PRs y diffs.
* **`insecure-defaults`**: Detección de configuraciones inseguras y secrets hardcodeados.
* **`ponytail-review`**: Detección y poda de sobreingeniería y abstracciones muertas.
* **`project-quality-gates`**: Descubrimiento y ejecución de pruebas y linters del proyecto.
* **`security-and-hardening`**: Endurecimiento de entradas, validaciones y autenticación.
* **`security-audit`**: Auditoría de seguridad y pentesting de servicios y repositorios.
* **`supply-chain-risk-auditor`**: Detección de dependencias de alto riesgo y vulnerabilidades.
* **`web-quality-audit`**: Auditoría integral de calidad web (rendimiento, SEO, a11y).

### ⚡ Superpowers & Metodologías de Desarrollo
* **`brainstorming`**: Exploración previa de diseño, requerimientos e intención de usuario.
* **`diagnosing-superpowers`**: Diagnóstico y resolución de sesiones anómalas.
* **`dispatching-parallel-agents`**: Coordinación y despacho de tareas independientes en paralelo.
* **`executing-plans`**: Ejecución disciplinada de planes de implementación paso a paso.
* **`finishing-a-development-branch`**: Integración, verificación y cierre de branches.
* **`receiving-code-review`**: Procesamiento técnico riguroso de feedback de code review.
* **`requesting-code-review`**: Verificación previa y solicitud de revisión de código.
* **`subagent-driven-development`**: Ejecución de planes mediante subagentes especializados.
* **`systematic-debugging`**: Depuración metódica basada en hipótesis y evidencia.
* **`test-driven-development`**: Desarrollo guiado por pruebas (TDD).
* **`using-git-worktrees`**: Aislamiento de ramas de desarrollo con git worktrees.
* **`using-superpowers`**: Selección y orquestación disciplinada de habilidades.
* **`verification-before-completion`**: Verificación rigurosa de evidencia antes de concluir tareas.
* **`writing-plans`**: Creación de planes de implementación detallados y ejecutables.
* **`writing-skills`**: Creación y validación de nuevas skills.

### 🛠️ Backend, APIs y Base de Datos
* **`api-and-interface-design`**: Diseño de contratos, endpoints REST/GraphQL y fronteras de módulos.
* **`ci-cd-and-automation`**: Configuración y mantenimiento de pipelines de CI/CD.
* **`deprecation-and-migration`**: Migraciones sin downtime, deprecación de APIs y esquemas.
* **`documentation-and-adrs`**: Registro de decisiones de arquitectura (ADRs) y specs.
* **`incremental-implementation`**: Estrategia de entrega en incrementos pequeños y reversibles.
* **`observability-and-instrumentation`**: Telemetría, métricas, tracing y logging estructurado.
* **`performance`**: Optimización de velocidad de carga y rendimiento de red.
* **`performance-optimization`**: Optimización de consultas SQL, algoritmos y bottlenecks.
* **`prisma-cli`**: Referencia rápida de comandos de CLI de Prisma ORM.
* **`prisma-client-api`**: Operaciones CRUD, filtros y transacciones con Prisma Client.
* **`project-doc-sync`**: Sincronización continua de AGENTS.md y CLAUDE.md.
* **`react-doctor`**: Diagnóstico de antipatrones y bugs específicos de React.
* **`shipping-and-launch`**: Checklists y preparación para lanzamientos a producción.
* **`spec-driven-development`**: Redacción de especificaciones previas a codificar.
* **`supabase-postgres-best-practices`**: Optimización y buenas prácticas para Postgres en Supabase.
* **`typesafe-ai`**: Construcción de software asistido por IA estructurada y tipada.

### 🤖 Herramientas de Sistema, Agentes y Automatización
* **`agy-customizations`**: Guía y extensiones para Antigravity.
* **`antigravity_guide`**: Documentación integral de Antigravity CLI e IDE.
* **`computer-use`**: Control y automatización a nivel de ventanas del sistema operativo.
* **`context-engineering`**: Optimización de contexto y reglas del asistente.
* **`migrate-workflows`**: Migración de flujos de trabajo a formato skill moderno.
* **`orca-cli`**: Manejo de terminales, worktrees y agentes coordinados por Orca.
* **`orchestration`**: Coordinación y supervisión de agentes trabajadores y DAGs.
* **`permissioned-github`**: Operaciones de GitHub con permisos controlados.

### 📄 Documentos, Datos y Productividad
* **`docs`**: Creación y edición colaborativa de documentos de trabajo.
* **`docx`**: Manipulación y generación de documentos Word (.docx, .dotx).
* **`import-memory`**: Importación y sincronización de perfiles de memoria entre agentes.
* **`morning`**: Resumen diario y briefing interactivo.
* **`pdf`**: Lectura, extracción, fusión, división y formularios PDF.
* **`pptx`**: Creación y edición de presentaciones PowerPoint (.pptx).
* **`seo`**: Optimización para motores de búsqueda y marcado estructurado.
* **`setup-writing-style`**: Calibración de estilo y tono de voz personalizada.
* **`skill-creator`**: Desarrollo y benchmarking de nuevas skills.
* **`xlsx`**: Procesamiento, fórmulas y análisis de hojas de cálculo Excel (.xlsx, .csv).
