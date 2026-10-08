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
