# Marca y fundamentos

Referencia digital aprobada 1.0.0, 2026-09-07. El nombre visible y los textos alternativos usan **CEE Enriquez**, sin tilde.

## Logo

Usar el [PNG RGB original](../assets/brand/cee-enriquez-rgb.png), sin redibujarlo con una fuente, alterar proporciones, recortar letras, invertir colores ni agregar efectos. El mínimo digital aprobado es 80 px de ancho, con un área libre alrededor equivalente a un cuarto de la altura del logo. En fondo oscuro, conservar una placa blanca. El [PNG ByN](../assets/brand/cee-enriquez-byn.png) es la opción monocromática; no sustituye una variante negativa aprobada.

La marca gráfica puede tener su propio espaciado; no reproducir sus letras con Mark Pro. Las adaptaciones a favicon, icono o widget conservan los requisitos del host y necesitan comprobar legibilidad a tamaño real. Ver [01.01 · Marca](../assets/catalog/index.html#marca).

## Color y temas

La marca base usa grafito `#211C18`, gris `#5D6166` y blanco `#FFFFFF`, derivados del PNG elegido. Los valores ejecutables viven en [tokens.json](../assets/tokens.json); la tabla explica su función. Usar los pares de cada tema sin mezclar texto de uno con fondo del otro.

| Token de tema | Claro | Oscuro | Uso |
| --- | --- | --- | --- |
| `bg` | `#F5F5F4` | `#191918` | Fondo de página |
| `surface` | `#FFFFFF` | `#232322` | Contenedores y controles |
| `surface-alt` | `#EFEFED` | `#2D2D2B` | Superficie secundaria |
| `text` | `#211C18` | `#F3F1ED` | Texto principal |
| `muted` | `#5D6166` | `#B9B9B3` | Texto secundario legible |
| `line` | `#DEDEDC` | `#444440` | Divisiones decorativas |
| `control` | `#81817B` | `#888880` | Límite visible de control y scrollbar |
| `primary` / `on-primary` | `#211C18` / `#FFFFFF` | `#EEEAE3` / `#211C18` | Acción principal y su contenido |
| `hover` | `#E6E6E2` | `#3A3A36` | Interacción neutral |
| `success` / `success-bg` | `#285E46` / `#EDF5EF` | `#A1CFB3` / `#23372C` | Éxito |
| `warning` / `warning-bg` | `#795315` / `#FAF3E5` | `#E3C382` / `#3B3222` | Atención |
| `danger` / `danger-bg` | `#A13632` / `#FBEFED` | `#F0AAA4` / `#402C2B` | Error o consecuencia destructiva |
| `info` / `info-bg` | `#365C78` / `#EDF3F8` | `#AFC9E0` / `#273743` | Información |
| `focus` | `#365C78` | `#AFC9E0` | Foco visible |

No usar azul, verde o rojo como grandes superficies decorativas de navegación. El color semántico se acompaña de texto e icono; nunca es la única señal de error, selección o éxito. `line` no reemplaza `control` cuando el borde es necesario para identificar un campo. Ver [paleta](../assets/catalog/index.html#paleta) y [semántica](../assets/catalog/index.html#semantica).

## Tipografía y densidad

Mark Pro Regular 400 para lectura, Medium 500 para etiquetas/navegación y Bold 700 para títulos. No simular pesos 600 u 800. El respaldo es `Arial, sans-serif` en web y la fuente del sistema en Android/iOS. El titular autorizó distribuir internamente los tres archivos incluidos: [Regular](../assets/fonts/MarkPro-Regular.ttf), [Medium](../assets/fonts/MarkPro-Medium.ttf) y [Bold](../assets/fonts/MarkPro-Bold.ttf). Su inclusión en el repositorio privado no otorga licencia pública a terceros.

| Contexto | Tamaño y criterio |
| --- | --- |
| Cuerpo | 16 px, interlineado 1,5 |
| Título de página | 28–32 px; adaptar al ancho disponible |
| Título de sección | 22 px; subtítulos según jerarquía del ejemplo |
| Texto de controles | 14 px en escritorio, entrada de 16 px en táctil |
| Botón del catálogo | 13 px; 14 px en las composiciones móviles |
| Tabla compacta del catálogo | 12 px; preferir 14 px para lectura prolongada o mayor densidad de texto |
| Información auxiliar | 12 px; no usar como tamaño principal de lectura |

El título editorial de portada del catálogo es mayor y no define los encabezados ordinarios del producto. La vista TV amplía cifras y reduce información. En nativo usar escala de texto accesible y alturas mínimas, evitando cajas rígidas que recorten texto ampliado.

## Geometría y contenido

- Espaciado: 4, 8, 12, 16, 24 y 32. Bordes de 1 px; controles con radio 6 y paneles con radio 8. Usar sombras discretas en superposiciones. Los dispositivos dibujados en el catálogo no fijan el radio de componentes productivos.
- Alturas de botón: 32 px compacto, 36 px estándar, 44 px amplio en escritorio; mínimo 48 dp táctil nativo. Mantener texto, icono y área pulsable proporcionados.
- Iconos: familia ya utilizada por el proyecto, trazo aproximado 1,7–2, tamaños 16/20/24. Dar nombre accesible a acciones solo icono.
- Español claro, verbos concretos, unidades explícitas y estados verificables. Formato operativo `es-AR`; fechas y horas operativas en `America/Argentina/Buenos_Aires` donde ese sea el dominio del producto. No transformar datos almacenados por un cambio de formato visual.
- Números de tablas alineados a la derecha y cifras tabulares cuando la fuente lo permita. Enlaces subrayados; movimiento breve y funcional, respetando reducción de movimiento.

Comprobar 4,5:1 para texto normal y 3:1 para texto grande, foco y elementos esenciales de controles. El logo no debe recolorearse para satisfacer una regla aplicada al texto de la interfaz.

Este estándar digital no atribuye autoría del logo, historia empresarial, Pantone/CMYK oficiales, textos legales ni derechos sobre fuentes. Esos datos se validan por separado.
