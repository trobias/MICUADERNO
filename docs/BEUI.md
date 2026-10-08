# Interacciones de papelería · Be UI

Pedido del 08/10/2026: integrar la selección propuesta, un commit por componente.
Son implementaciones propias para el cuaderno clásico inspiradas en las interacciones del
[catálogo público de Be UI](https://beui.dev/). No se instala React, Tailwind ni Motion en el cuaderno.
Se reutilizan rutas, permisos, guardado y tokens; sin recursos externos durante el uso.
Las animaciones respetan Ajustes, movimiento reducido del sistema y teclado.

## Componentes entregados

| Componente | Uso y contrato |
| --- | --- |
| Checkbox | Puntadas interrumpibles, estados completos y parciales, sin movimiento del sistema reducido; conserva casillas y datos existentes. |
| Number Animation | Contadores N/M y porcentaje ruedan al cambiar; texto accesible real, sin animación inicial, durante escritura ni con movimiento reducido. |
| Adaptive Stepper | Controles menos/más para metas semanales e intervalos, con límites y entrada nativa editable; reutiliza validación y reglas existentes. |
| Sortable List | Organizar actividades permite arrastrar o subir/bajar metas; orden opcional en repeticiones, copia v13 aditiva y misma sección de permisos. |
| Swipeable List | Deslizar una actividad hacia la izquierda revela su menú completo; nunca marca ni borra, conserva scroll vertical, teclado y permisos. |
| Bottom Sheet | Diálogos nativos como hojas inferiores en celular, manija para cerrar, alternativa visible y Escape; foco modal nativo y movimiento reducido. |
| Project Folder | Mis hojas se agrupa por mes en carpetas desplegables con hojas pastel; la más reciente abre de entrada, enlaces reales y teclado nativo, sin colecciones nuevas. |
| Card Folder | Victorias y recuerdos del año dentro de bolsillos pastel con nota desplegable; mantiene fuentes, enlaces, privacidad y selección existentes. |
| Image Viewer | Fotos del álbum y adjuntos se amplían con miniaturas, zoom, gesto y teclado; fuentes locales validadas, descargar separado y controles de lectura permitidos. |
| Infinite Masonry | Álbum opcional de fotos y dibujos en columnas de distintas alturas, carga diferida en tandas de 24, visor y enlace a su fuente; sin auto-scroll. |
| Date Range Picker | Selector opcional Desde/Hasta filtra los álbumes del año con validación de rango y vuelta al año completo; filtros de lectura no persistidos. |
| Heat Calendar | Mosaico anual opcional de escritura y victorias, con días neutrales, fecha local, nombres accesibles, flechas y enlace al día; dentro de la parte mapa. |
| Tabs | Señalador pastel entre Mes y Semana, movimiento breve solo al cambiar con puntero; botones nativos, estados accesibles y preferencias de movimiento. |
| Color Selector | Muestras con nombre y selección marcada para colores propios; radios nativos, teclado y selectores/códigos personalizados conservados. |
| Bloom Menu | Un más en la barra de decorar despliega Anotar, Foto, Sticker y Dibujo en cuatro pétalos pastel; reutiliza menú accesible y acciones existentes. |
| Morphing Search | Búsqueda plegada en Mis hojas, índice efímero de texto y emociones, filtros por tipo/fecha, enlaces y exclusión de papelera, fuentes privadas y secciones no permitidas. |
| Action Swap | Guardando y Guardado intercambian glifo y texto con feedback breve al confirmar persistencia; sin loops ni movimiento al escribir, aviso de fallo conservado. |
| File Upload | Cola de imágenes/adjuntos con miniaturas, progreso real por archivos, errores y reintento; arrastrar adjuntos, límite vigente y permisos de Fotos. No cambia la sincronización. |
| OTP Input | Ingreso del PIN con seis casillas, números siempre ocultos y un único campo nativo para pegar, editar y usar gestores de contraseñas; sin cambiar la autenticación. |
