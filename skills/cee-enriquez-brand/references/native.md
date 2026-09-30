# Integración React Native y Expo

Usar [tokens nativos](../assets/native/tokens.ts), que exportan `ceeTokens` y `ceeThemes`, junto con el proveedor de tema y componentes del proyecto. `ceeThemes.light` y `ceeThemes.dark` conservan las claves de [tokens.json](../assets/tokens.json); para nombres con guion usar acceso como `theme['on-primary']`. Los valores numéricos de espaciado, radios y alturas se trasladan a unidades lógicas de React Native.

## Tema y tipografía

Reutilizar la preferencia de tema existente y su respuesta al esquema del sistema. Seleccionar los colores de un solo tema para cada superficie. No interpretar variables CSS ni importar el CSS del catálogo en React Native; el token `shadow` describe la referencia web y debe adaptarse a la API de sombra/elevación ya utilizada por el proyecto.

Mark Pro incluye los tres archivos autorizados para uso interno en `assets/fonts/` y requiere carga real de cada variante. Si Expo carga familias explícitas, mapear 400 → `MarkPro-Regular`, 500 → `MarkPro-Medium` y 700 → `MarkPro-Bold` usando esos mismos alias en la carga y en `fontFamily`. No asumir que `fontWeight` seleccionará otro archivo al mantener la misma familia específica. Si el proyecto registra una familia con pesos nativos, conservar ese mecanismo y verificar las tres variantes en dispositivo. No sintetizar 600/800.

Mientras cargan las fuentes o si su carga falla, usar el respaldo del sistema (`System` en iOS o `sans-serif` en Android, según el adaptador existente). La skill contiene los archivos y puede instalarse completa; no depende de otra carpeta de fuentes. Conservar escalado de texto accesible; evitar alturas fijas para títulos, mensajes o filas multilínea.

## Ejemplo mínimo: Expo y acción real

Rutas adaptables: copiar `assets/native/tokens.ts` de la skill a `theme/cee-tokens.ts` y los TTF a `assets/fonts/` del proyecto. Este ejemplo puede vivir en `components/CeeButton.tsx` dentro de una app Expo que ya tenga `expo-font`. Si las fuentes ya se cargan en el layout, reutilizar ese estado y omitir este `useFonts`; no crear otro cargador ni instalar dependencias para reemplazar el mecanismo actual. `theme` se recibe del proveedor existente y `onPress` del flujo real.

```tsx
import { useFonts } from 'expo-font';
import { Platform, Pressable, StyleSheet, Text } from 'react-native';
import { ceeThemes, ceeTokens } from '../theme/cee-tokens';

type CeeButtonProps = {
  label: string;
  onPress: () => void;
  theme: keyof typeof ceeThemes;
  disabled?: boolean;
};

export function CeeButton({ label, onPress, theme, disabled = false }: CeeButtonProps) {
  const [fontsLoaded] = useFonts({
    'MarkPro-Regular': require('../assets/fonts/MarkPro-Regular.ttf'),
    'MarkPro-Medium': require('../assets/fonts/MarkPro-Medium.ttf'),
    'MarkPro-Bold': require('../assets/fonts/MarkPro-Bold.ttf'),
  });
  const colors = ceeThemes[theme];
  const fallback = Platform.OS === 'ios'
    ? ceeTokens.typography.families.nativeFallback.ios
    : ceeTokens.typography.families.nativeFallback.android;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: colors.primary, opacity: disabled ? .45 : pressed ? .86 : 1 },
      ]}
    >
      <Text style={[
        styles.label,
        { color: colors['on-primary'], fontFamily: fontsLoaded ? 'MarkPro-Medium' : fallback },
      ]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: ceeTokens.geometry.controlHeight.touch,
    borderRadius: ceeTokens.geometry.radius.control,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: ceeTokens.typography.sizes.control, textAlign: 'center' },
});
```

El botón usa el mínimo táctil de 48 dp y texto de 14. La pantalla que lo consume mantiene sus validaciones, manejo de errores y bloqueo mientras guarda, pasando ese estado mediante `disabled`. El ejemplo no persiste datos ni simula una respuesta de servidor. Para títulos, las claves con guion se leen como `ceeTokens.typography.sizes['page-title']` y `['section-title']`.

## Controles, navegación y superposiciones

- Área táctil mínima 48 dp para acciones y controles. Usar `minHeight`, padding y área pulsable apropiados; no recortar texto ampliado para mantener una maqueta exacta.
- Cuerpo de 16, controles de entrada de 16, etiquetas y botones móviles de 14, pesos reales 400/500/700. Los valores compactos de escritorio no definen la densidad táctil.
- Reutilizar componentes nativos instalados, iconos Expo existentes y el sistema de navegación actual. La barra inferior usa 3–5 destinos con etiqueta y estado seleccionado accesible.
- Mapear estados al equivalente nativo: deshabilitado, seleccionado, ocupado y rol/nombre accesible. Proporcionar texto e icono además del color.
- Usar la solución de áreas seguras del proyecto. Integrar su ajuste frente al teclado y contenido desplazable para mantener acción principal accesible; probar con teclado numérico y multilinea.
- Cerrar cámara antes de presentar resultado de QR. Respetar el comportamiento de Atrás, foco accesible y prioridad de alertas en modales y hojas inferiores; no superponer una actualización sobre una alerta operativa crítica.
- Mantener scroll nativo, indicadores visibles cuando haya contenido adicional y encabezados fijos únicamente cuando ayuden. Los widgets Android requieren adaptación al host y no admiten presumir el mismo render que React Native.

## Estados operativos reales

El catálogo define cómo comunicar cada estado; no decide cómo persistir ni autorizar:

| Estado real | Presentación |
| --- | --- |
| Guardado local confirmado | “Guardado en este dispositivo”, con próximo paso claro. |
| En cola | “Pendiente de sincronización”, conservando operación y evidencia. |
| En envío | “Sincronizando”; progreso solo si está medido. |
| Falló el envío, copia local intacta | Explicar fallo de sincronización y que el registro se conserva; reintento seguro. |
| Servidor confirmó recepción | Mostrar sincronización completada según la confirmación real del producto. |

No afirmar “guardado” antes de confirmar la persistencia real ni reemplazar el fallo de guardado local por una promesa de recuperación. Conservar SQLite, cola, idempotencia, reintentos, archivos y reglas de negocio existentes. Una vista remota vacía o un error de consulta no demuestra pérdida local.

GPS muestra disponibilidad, precisión y antigüedad; mantener permisos, umbrales y política de captura del flujo actual. PIN mantiene autenticación real, longitud de dominio y borrado seguro; el ejemplo de cuatro dígitos no redefine la política. Alertas conservan destinatarios, confirmaciones y prioridades. Las reglas de actualización y compatibilidad nativa permanecen a cargo del mecanismo de release del producto.

Probar en dispositivo los flujos afectados: escala de texto, áreas seguras, teclado, Atrás, permiso denegado cuando corresponda y guardado/envío con conectividad interrumpida. Las pantallas HTML de despacho, novedades, QR, cámara y GPS son referencias visuales, no evidencia de pruebas nativas.
