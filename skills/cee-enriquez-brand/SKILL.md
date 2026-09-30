---
name: cee-enriquez-brand
description: Aplicar o revisar la identidad visual CEE Enriquez en interfaces web y React Native, usando su catálogo aprobado, tokens y recursos de marca. Usar en proyectos CEE o cuando se solicite esta marca; no extenderla a productos de otras marcas.
---

# CEE Enriquez

Estándar digital **1.0.0**, aprobado visualmente el **7 de septiembre de 2026**. Escribir siempre **CEE Enriquez**, sin tilde. Estética empresarial sobria: superficies neutrales, jerarquía tipográfica y color funcional contenido.

## Aplicar el estándar

1. Revisar los componentes y el tema del proyecto para identificar el punto compartido donde aplicar el cambio solicitado. Reutilizar controles, navegación, iconos y validaciones existentes.
2. Leer [marca y fundamentos](references/brand.md). Para el componente pedido, consultar su fila en [componentes](references/components.md) y abrir el ejemplo enlazado del [catálogo](assets/catalog/index.html).
3. Leer únicamente la integración pertinente: [web](references/web.md) o [React Native](references/native.md). Usar [tokens.json](assets/tokens.json) como fuente de valores, [tokens CSS](assets/web/tokens.css) o [tokens nativos](assets/native/tokens.ts) como adaptadores. No inventar otra paleta ni copiar colores sueltos por pantalla.
4. Verificar los estados que modifica la tarea en claro y oscuro, teclado o interacción táctil, contraste y contenido largo. Confirmar que la presentación conserva permisos, guardado, validación y estados operativos reales.

Los recursos viven dentro de esta carpeta: resolver enlaces respecto de ella, sin depender del repositorio original ni de una ruta de esta PC. Para un ajuste puntual, cargar solo el ejemplo y las referencias necesarias.

## Límites que importan

- Usar [logo RGB](assets/brand/cee-enriquez-rgb.png) con sus proporciones originales y placa blanca en superficies oscuras. La [versión ByN](assets/brand/cee-enriquez-byn.png) sirve para reproducción monocromática; no es una versión negativa.
- Mark Pro incluye sus tres archivos autorizados en `assets/fonts/`: Regular 400, Medium 500 y Bold 700. Cargarlos desde el paquete y conservar el respaldo Arial/sans-serif en web o del sistema en nativo mientras cargan. La distribución es interna; no otorga licencia pública a terceros.
- El HTML y su JavaScript son ejemplos con datos ficticios. Consultar [styles.css](assets/catalog/styles.css) y [catalog.js](assets/catalog/catalog.js) para proporciones y estados; no trasladar simulaciones de autenticación, PIN, GPS, cámara, mapas, adjuntos o sincronización a producción.
- Una tarea de estilo no cambia permisos, esquemas, umbrales, destinatarios, reglas de negocio ni estrategia de persistencia. `administracion` y `admin` técnico siguen siendo perfiles diferentes.
- La aprobación corresponde al estándar de interfaces. No convierte reseñas históricas, valores institucionales, equivalencias de impresión ni licencias de terceros en declaraciones oficiales.
