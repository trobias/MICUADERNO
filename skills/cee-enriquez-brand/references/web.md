# Integración web

Para Next.js/Tailwind o HTML existente, empezar por su tema y componentes compartidos. Los recursos son [tokens CSS](../assets/web/tokens.css), [tokens fuente](../assets/tokens.json), [catálogo HTML](../assets/catalog/index.html), [estilos](../assets/catalog/styles.css) y [ejemplos](../assets/catalog/catalog.js). No agregar una biblioteca de componentes ni importar el CSS completo del catálogo en una aplicación: contiene su navegación, portada y maquetas.

## Tokens y tema

Copiar `tokens.css` al directorio de estilos del proyecto e importarlo una vez desde su entrada global. Expone variables como `--cee-color-bg`, `--cee-color-surface`, `--cee-color-text`, `--cee-color-primary` y `--cee-color-on-primary`. Usar los nombres presentes en el archivo generado. Conectar el selector de tema existente al tema de los tokens; no crear un segundo proveedor ni otra preferencia almacenada.

Ejemplo mínimo después de importar los tokens:

```css
body {
  background: var(--cee-color-bg);
  color: var(--cee-color-text);
  font-family: 'Mark Pro', Arial, sans-serif;
}

:focus-visible {
  outline: 2px solid var(--cee-color-focus);
  outline-offset: 3px;
}
```

Los colores CEE contienen valores HEX completos. En Tailwind 3 se consumen directamente, por ejemplo `colors: { 'cee-surface': 'var(--cee-color-surface)' }`, para usar `bg-cee-surface`. **No escribir `hsl(var(--cee-color-surface))`**: envolver HEX en `hsl()` produce un color inválido.

Si el proyecto usa variables semánticas HSL del tipo `--background: 0 0% 100%` y `hsl(var(--background))`, conservar ese contrato y adaptar los valores institucionales a canales HSL, o cambiar el adaptador completo de esa variable a un color CSS directo comprobando sus consumidores. No mezclar formatos ni hacer una sustitución global de nombres. Reutilizar los roles existentes: fondo → `bg`, tarjeta → `surface`, texto → `text`, texto secundario → `muted`, borde de control → `control`, primario → `primary`/`on-primary` y error → `danger`/`danger-bg`.

## Fuente y componentes

- Mantener `next/font/local` si el proyecto ya lo usa, con los archivos 400/500/700 incluidos en `assets/fonts/`; de lo contrario usar `@font-face` local con `font-display: swap`. Los archivos están autorizados para uso interno: no añadir una descarga externa de Mark Pro ni dar una licencia pública a terceros.
- Ajustar el Button, Input, Select, Dialog, Table y navegación compartidos existentes. Conservar variantes y firmas públicas; mapear principal, secundario, contorno, discreto, enlace y destructivo al catálogo.
- Reutilizar Lucide y los componentes Radix ya instalados. Conservar su semántica, gestión de foco, cierre, teclado y portales. Los controles nativos cubren casos sencillos sin dependencias nuevas.
- Usar etiquetas, `aria-describedby` para ayuda/error, `aria-invalid` cuando corresponda, `aria-busy` durante operaciones y nombre accesible para iconos. Mantener regiones de estado sin anunciar cada tecla del usuario.
- En tablas, conservar filtros, orden, páginas y selección reales. Encapsular el scroll horizontal en el contenedor; no dejar que la tabla ensanche toda la página. Emplear `control` para scrollbar visible y límites esenciales; `line` para divisiones decorativas.
- Mantener una sola columna de formulario en móvil cuando el ancho lo requiera, texto de entrada de 16 px y acciones visibles al abrir el teclado. No trasladar alturas del marco de teléfono dibujado a un viewport real.

## Ejemplo mínimo: Next.js con recursos locales

Rutas de ejemplo adaptables al proyecto: copiar los tres TTF de la skill a `app/fonts/` y `assets/web/tokens.css` a `app/cee-tokens.css`. En un proyecto con `src/app`, usar esa carpeta. Integrar estas declaraciones en el layout y CSS existentes; conservar sus proveedores y componentes. No reemplazar todo el layout por el ejemplo.

```tsx
// app/layout.tsx
import type { ReactNode } from 'react';
import localFont from 'next/font/local';
import './cee-tokens.css';
import './globals.css';

const markPro = localFont({
  src: [
    { path: './fonts/MarkPro-Regular.ttf', weight: '400', style: 'normal' },
    { path: './fonts/MarkPro-Medium.ttf', weight: '500', style: 'normal' },
    { path: './fonts/MarkPro-Bold.ttf', weight: '700', style: 'normal' },
  ],
  variable: '--font-mark-pro',
  fallback: ['Arial', 'sans-serif'],
  display: 'swap',
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" data-theme="light" className={markPro.variable}>
      <body>{children}</body>
    </html>
  );
}
```

El ejemplo arranca en claro. Conectar `data-theme="light"` o `data-theme="dark"` al estado del proveedor existente, respetando su inicialización y render de servidor. El selector no necesita un almacenamiento ni proveedor adicional. Los tokens cambian ambos temas con ese atributo.

```css
/* app/globals.css: adaptar al botón compartido existente. */
body {
  margin: 0;
  background: var(--cee-color-bg);
  color: var(--cee-color-text);
  font-family: var(--font-mark-pro), Arial, sans-serif;
  font-size: var(--cee-font-size-body);
  line-height: 1.5;
}

.cee-button {
  min-height: var(--cee-height-default);
  padding: 8px 16px;
  border: 1px solid transparent;
  border-radius: var(--cee-radius-control);
  background: var(--cee-color-primary);
  color: var(--cee-color-on-primary);
  font: inherit;
  font-size: var(--cee-font-size-button);
  font-weight: var(--cee-font-weight-medium);
  cursor: pointer;
}

.cee-button:hover:not(:disabled) { opacity: .9; }
.cee-button:active:not(:disabled) { opacity: .8; }
.cee-button:disabled { opacity: .45; cursor: not-allowed; }
.cee-button:focus-visible {
  outline: 2px solid var(--cee-color-focus);
  outline-offset: 3px;
}

@media (pointer: coarse) {
  .cee-button { min-height: var(--cee-height-touch); }
}
```

Aplicar `cee-button` al botón compartido conserva sus handlers y validaciones. No sustituir su control de carga por una respuesta simulada del catálogo.

## Lo que se toma del catálogo

Tomar proporción, color, jerarquía, estados y reglas de la ficha correspondiente. El JavaScript incluye registros ficticios, exportación local, PIN de demostración y respuestas simuladas. La integración usa handlers, validaciones, permisos y persistencia del producto, incluyendo protección contra duplicados y errores reales.

Comprobar el comportamiento afectado en claro y oscuro, móvil y escritorio. Para diálogos y menús verificar Escape, flechas donde correspondan, contención y retorno del foco. Revisar que un encabezado fijo no tape el destino enfocado, que los mensajes de error sigan visibles y que los datos/tablas tengan etiquetas legibles.
