# design.md — Guía de diseño UI

## 1. Dirección visual

La interfaz debe sentirse como una herramienta de emergencia, no como una landing promocional.

Palabras clave:

* Clara
* Rápida
* Sobria
* Confiable
* Accesible
* Directa
* Mobile-first
* Dark mode only

No debe parecer una app gubernamental antigua ni una dashboard pesada de analítica. Debe ser simple, legible y accionable.

## 2. Modo de color

La app usa únicamente dark mode.

No implementar light mode en el MVP.

Motivos:

* Reduce fatiga visual en uso nocturno.
* Encaja con contexto de emergencia.
* Permite destacar alertas por color.
* Simplifica diseño inicial.

## 3. Paleta base

### Fondo

```css
--color-bg: #070A0F;
--color-bg-soft: #0D111A;
--color-surface: #121826;
--color-surface-raised: #182133;
```

### Bordes

```css
--color-border: #263244;
--color-border-soft: #1E293B;
```

### Texto

```css
--color-text: #F8FAFC;
--color-text-muted: #CBD5E1;
--color-text-soft: #94A3B8;
--color-text-disabled: #64748B;
```

### Marca / acción primaria

```css
--color-primary: #38BDF8;
--color-primary-soft: #0EA5E9;
--color-primary-contrast: #02131F;
```

### Estados

```css
--color-success: #22C55E;
--color-info: #38BDF8;
--color-warning: #F59E0B;
--color-danger: #EF4444;
--color-critical: #DC2626;
--color-unknown: #94A3B8;
```

### Severidad sísmica

```css
--quake-low: #22C55E;
--quake-medium: #FACC15;
--quake-high: #F97316;
--quake-severe: #EF4444;
--quake-critical: #A855F7;
```

### Tsunami

```css
--tsunami-none: #22C55E;
--tsunami-info: #38BDF8;
--tsunami-watch: #F59E0B;
--tsunami-warning: #EF4444;
--tsunami-canceled: #94A3B8;
```

## 4. Tipografía

Usar fuente del sistema.

```css
font-family:
  system-ui,
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  sans-serif;
```

### Tamaños

```css
--font-xs: 0.75rem;
--font-sm: 0.875rem;
--font-md: 1rem;
--font-lg: 1.125rem;
--font-xl: 1.375rem;
--font-2xl: 1.75rem;
```

### Uso

* Títulos de pantalla: `font-xl` o `font-2xl`.
* Tarjetas críticas: `font-lg`.
* Cuerpo: `font-md`.
* Metadatos: `font-sm`.
* Badges: `font-xs` o `font-sm`.

## 5. Espaciado

```css
--space-1: 0.25rem;
--space-2: 0.5rem;
--space-3: 0.75rem;
--space-4: 1rem;
--space-5: 1.25rem;
--space-6: 1.5rem;
--space-8: 2rem;
```

Reglas:

* En móvil usar menos densidad visual, pero sin obligar a mucho scroll.
* Los botones críticos deben tener suficiente separación.
* Las tarjetas deben ser escaneables.

## 6. Bordes y radios

```css
--radius-sm: 0.5rem;
--radius-md: 0.75rem;
--radius-lg: 1rem;
--radius-xl: 1.25rem;
--radius-full: 999px;
```

Uso:

* Badges: `radius-full`
* Botones: `radius-md`
* Tarjetas: `radius-lg`
* Paneles flotantes: `radius-xl`

## 7. Sombras

Usar sombras sutiles.

```css
--shadow-soft: 0 8px 24px rgba(0, 0, 0, 0.24);
--shadow-raised: 0 16px 40px rgba(0, 0, 0, 0.35);
```

No abusar de sombras. En emergencia importa más el contraste y la jerarquía.

## 8. Layout responsive

### Breakpoints

```css
--bp-sm: 480px;
--bp-md: 768px;
--bp-lg: 1024px;
--bp-xl: 1280px;
```

### Mobile

* Navegación inferior fija.
* Header compacto.
* Mapas con panel inferior deslizable.
* Acciones críticas visibles arriba.
* Formularios en pasos cortos.
* Listados antes que dashboards complejos.

### Tablet

* Layout de dos columnas cuando tenga sentido.
* Mapa + lista.
* Tarjetas en grid de 2 columnas.

### Desktop

* Máximo 3 columnas:

  * Filtros
  * Mapa/listado
  * Detalle
* Evitar dashboards saturados.
* Mantener ancho máximo para textos.

## 9. Navegación

### Mobile nav

Items principales:

1. Inicio
2. Sismos
3. Ayuda
4. Reportar
5. Guía

La navegación debe tener icono y texto.

No usar más de 5 items principales.

### Desktop nav

Sidebar o topbar simple:

* Inicio
* Sismos
* Ayuda
* Necesidades
* Reportar
* Recomendaciones

## 10. Componentes visuales

### StatusBadge

Estados:

* Oficial
* Verificado
* Pendiente
* Desactualizado
* Cancelado
* Crítico

Debe ser pequeño, legible y con color semántico.

### SourceBadge

Muestra fuente:

* USGS
* NOAA/PTWC
* FUNVISIS
* Protección Civil
* Ciudadano
* Voluntario
* Medio verificado

### LastUpdated

Formato:

* “Actualizado hace 2 min”
* “Última consulta: 14:32”
* “Datos guardados sin conexión”

Si supera el umbral definido, mostrar color warning.

### EventCard

Debe mostrar:

* Magnitud grande
* Lugar
* Hora local
* Profundidad
* Intensidad estimada si existe
* Tsunami flag si existe
* Fuente
* Estado de revisión

Ejemplo visual:

```txt
M 7.5
16 km SW de Morón
18:05 VET · Prof. 10 km
Intensidad estimada: IX
Fuente: USGS · Revisado
```

### TsunamiAlertCard

Estados visuales:

* Sin alerta: borde verde
* Información: borde azul
* Vigilancia: borde amarillo
* Alerta: borde rojo
* Cancelado: borde gris

Debe mostrar:

* Estado actual
* Fuente
* Última emisión
* Zonas afectadas
* Acción recomendada

### RecommendationCard

Debe ser breve.

Estructura:

* Título accionable
* 2 a 4 bullets máximo
* Contexto:

  * Sismo
  * Costa
  * Edificio dañado
  * Comunicación

### ReportFormStep

Reglas:

* Un objetivo por paso.
* Máximo 4 pasos.
* Inputs grandes.
* Selección por botones.
* Confirmación clara.
* Guardado local si no hay conexión.

## 11. Mapa

### Reglas

1. El mapa nunca debe ser la única forma de consultar datos.
2. Siempre debe existir vista lista.
3. Los marcadores deben tener leyenda.
4. El tamaño del marcador indica magnitud.
5. El color indica intensidad/severidad.
6. Las costas con alerta deben tener capa visible y leyenda.
7. No cargar capas pesadas por defecto.
8. En móvil, el mapa debe tener altura controlada.

### Leyenda sísmica

```txt
Verde: leve
Amarillo: moderado
Naranja: fuerte
Rojo: severo
Morado: crítico
```

### Leyenda tsunami

```txt
Verde: sin alerta
Azul: información
Amarillo: vigilancia
Rojo: alerta
Gris: cancelado/desconocido
```

## 12. Accesibilidad

1. Contraste mínimo AA.
2. No depender solo del color.
3. Todos los badges deben tener texto.
4. Botones con área mínima de 44x44px.
5. Inputs con labels visibles.
6. Estados de error con texto claro.
7. Navegación por teclado en desktop.
8. `aria-label` en botones iconográficos.
9. No usar animaciones indispensables.
10. Respetar `prefers-reduced-motion`.

## 13. Formularios

### Principios

* Pedir lo mínimo.
* Permitir ubicación aproximada.
* No obligar foto.
* No obligar contacto.
* Explicar qué se publicará y qué no.

### Estilo de inputs

```css
.input {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  border-radius: var(--radius-md);
  padding: 0.875rem 1rem;
}
```

### Botones

Primario:

```css
.button-primary {
  background: var(--color-primary);
  color: var(--color-primary-contrast);
}
```

Peligro:

```css
.button-danger {
  background: var(--color-danger);
  color: white;
}
```

Secundario:

```css
.button-secondary {
  background: var(--color-surface-raised);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}
```

## 14. Estados de carga

Usar:

* Skeletons pequeños.
* Texto “Cargando últimos datos...”
* Mostrar datos cacheados si existen.

No usar spinners infinitos sin contexto.

## 15. Estados vacíos

Ejemplos:

```txt
No hay alertas activas según la última fuente consultada.
```

```txt
No hay reportes verificados para esta zona.
```

```txt
No se encontraron recursos con estos filtros.
```

## 16. Estados de error

Ejemplos:

```txt
No se pudo actualizar la información sísmica. Mostrando últimos datos guardados.
```

```txt
La fuente de tsunami no respondió. Verifica canales oficiales antes de acercarte a la costa.
```

```txt
Tu reporte se guardó en este dispositivo y se enviará cuando vuelva la conexión.
```

## 17. Offline/PWA

Cuando no haya conexión:

* Mostrar banner superior:

  * “Sin conexión. Mostrando últimos datos guardados.”
* Permitir consultar datos cacheados.
* Permitir redactar reportes.
* Guardar reportes localmente.
* Enviar reportes al recuperar conexión.
* Marcar claramente los datos como posiblemente desactualizados.

## 18. Tono visual de emergencia

Correcto:

* Sobrio
* Alto contraste
* Jerarquía clara
* Botones grandes
* Mensajes cortos

Evitar:

* Gradientes decorativos excesivos
* Fondos animados
* Glassmorphism pesado
* Tarjetas demasiado pequeñas
* Mapas saturados
* Alertas parpadeantes
* Textos dramáticos

## 19. Prioridad visual por pantalla

### Home

Prioridad:

1. Estado general
2. Alerta tsunami
3. Último sismo
4. Acciones rápidas
5. Necesidades críticas

### Sismos

Prioridad:

1. Estado tsunami
2. Evento principal
3. Mapa/lista
4. Filtros
5. Recomendaciones

### Ayuda

Prioridad:

1. Recursos cercanos
2. Estado operativo
3. Verificación
4. Necesidades del recurso
5. Copiar/compartir

### Reportar

Prioridad:

1. Tipo de reporte
2. Ubicación aproximada
3. Urgencia
4. Descripción
5. Enviar

### Recomendaciones

Prioridad:

1. Qué hacer ahora
2. Según contexto
3. Checklist
4. Comunicación
5. Kit básico
