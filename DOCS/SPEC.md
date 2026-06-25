# SPEC.md — Sismicaid

## 1. Nombre provisional

**Sismicaid**

Aplicación web/PWA de emergencia para centralizar información sísmica, alertas de tsunami, recursos disponibles, necesidades ciudadanas y reportes verificados durante eventos críticos en Venezuela.

## 2. Objetivo del producto

Crear una plataforma web rápida, ligera, mobile-first y usable con mala conexión para que ciudadanos, voluntarios y personas de la diáspora puedan:

* Consultar eventos sísmicos recientes en Venezuela.
* Ver epicentros, magnitud, profundidad, intensidad estimada y evolución temporal.
* Consultar si existe alerta, vigilancia, amenaza o cancelación de tsunami en costas venezolanas.
* Conocer recomendaciones claras antes, durante y después de un sismo o amenaza de tsunami.
* Encontrar ayuda disponible: refugios, centros de acopio, hospitales, puntos de agua, carga y comunicación.
* Reportar daños, necesidades o recursos disponibles con el mínimo de fricción.
* Diferenciar información oficial, verificada, ciudadana pendiente o desactualizada.

## 3. Principios del producto

1. **Rapidez sobre estética compleja**

   * La app debe cargar rápido incluso con conexión inestable.
   * Evitar animaciones innecesarias, mapas pesados obligatorios o interfaces con demasiados pasos.

2. **Información crítica primero**

   * Cada pantalla debe responder en segundos:

     * Qué pasó.
     * Dónde pasó.
     * Qué riesgo existe.
     * Qué puedo hacer.
     * Dónde hay ayuda.
     * Dónde se necesita ayuda.

3. **No duplicar esfuerzos existentes**

   * La app no debe reemplazar sistemas oficiales ni iniciativas ciudadanas especializadas.
   * Para desaparecidos, se enlazarán plataformas existentes verificadas si están disponibles.
   * Esta app se enfoca en situación territorial, recursos, necesidades, reportes y prevención.

4. **Transparencia de fuente**

   * Todo dato debe mostrar fuente y última actualización.
   * Todo reporte ciudadano debe mostrar estado de verificación.

5. **No prometer predicción sísmica**

   * La app no predice terremotos.
   * La app muestra eventos registrados, secuencia temporal, intensidad estimada, alertas oficiales y recomendaciones preventivas.

6. **Diseño para crisis**

   * Interacciones cortas.
   * Botones grandes.
   * Textos directos.
   * Estados visuales claros.
   * Funcionamiento mobile-first.
   * Modo oscuro obligatorio.

## 4. Stack inicial recomendado

### Frontend

* Astro
* Svelte para componentes interactivos
* TypeScript estricto
* CSS puro con variables CSS
* Leaflet + OpenStreetMap para mapas
* PWA con Service Worker
* Sin Tailwind
* Sin librerías UI pesadas

### Backend

* Node.js + Fastify o Hono
* TypeScript estricto
* PostgreSQL
* Drizzle ORM o Prisma
* Jobs internos para fetch inicial y actualizaciones posteriores
* API REST simple

### Infraestructura

* Frontend: Cloudflare Pages, Vercel o Netlify
* Backend: Render, Railway, Fly.io o VPS
* Base de datos: Supabase PostgreSQL, Neon o PostgreSQL propio
* Cache: Redis opcional para fases posteriores
* Observabilidad mínima: logs de fetch, errores y tiempos de respuesta

## 5. Rutas principales

### 5.1 `/`

Pantalla de inicio y resumen de emergencia.

#### Objetivo

Mostrar el estado general de la situación sin obligar al usuario a navegar.

#### Contenido principal

1. Banner superior de estado:

   * Sin alerta activa
   * Evento sísmico reciente
   * Réplicas activas
   * Alerta/vigilancia de tsunami
   * Información desactualizada

2. Resumen sísmico:

   * Evento principal más reciente
   * Mayor magnitud registrada en las últimas 24h
   * Cantidad de eventos registrados
   * Hora de última actualización
   * Fuente principal usada

3. Accesos rápidos:

   * Ver mapa sísmico
   * Ver ayuda cercana
   * Reportar daño o necesidad
   * Ver recomendaciones
   * Ver centros de acopio/refugios

4. Alertas relevantes:

   * Tsunami
   * Daños estructurales
   * Zonas sin servicio
   * Recomendaciones oficiales

5. Listado corto de necesidades críticas:

   * Agua
   * Medicinas
   * Alimentos
   * Transporte
   * Energía/carga
   * Voluntarios

#### Acciones

* Entrar al mapa sísmico.
* Filtrar por estado/municipio.
* Reportar rápidamente.
* Copiar resumen para WhatsApp.

#### Estados vacíos

Si no hay datos recientes:

> No hay eventos sísmicos recientes cargados para Venezuela. Última consulta: [hora]. Verifica fuentes oficiales.

#### Estados de error

Si falla el backend:

> No se pudo actualizar la información. Mostrando últimos datos guardados.

---

### 5.2 `/sismos`

Mapa sísmico, epicentros, intensidad y tsunami.

Esta ruta reemplaza a `/familiares`.

#### Objetivo

Mostrar la secuencia sísmica reciente en Venezuela y zonas cercanas, incluyendo epicentros, magnitud, profundidad, intensidad estimada, hora, posible amenaza de tsunami y recomendaciones inmediatas.

#### Importante

La pantalla no debe decir “movimiento real de placas” como afirmación científica exacta. Debe usar lenguaje como:

* “Secuencia de eventos sísmicos registrados”
* “Desplazamiento observado de la actividad sísmica”
* “Evolución temporal de epicentros”
* “Intensidad estimada de sacudida”
* “Profundidad y magnitud registradas”

#### Layout mobile

1. Header compacto:

   * Título: “Mapa sísmico”
   * Estado de última actualización
   * Botón de recargar

2. Tarjeta de alerta:

   * Estado tsunami
   * Evento principal
   * Última réplica registrada
   * Botón “Qué hacer ahora”

3. Mapa:

   * Epicentros como círculos
   * Tamaño según magnitud
   * Color según intensidad estimada o severidad
   * Línea temporal opcional conectando eventos por hora
   * Marcadores de costa con alerta tsunami si aplica

4. Panel inferior deslizable:

   * Lista de eventos
   * Filtros rápidos
   * Detalle del evento seleccionado

#### Layout desktop

* Columna izquierda: filtros y lista de eventos.
* Centro: mapa.
* Columna derecha: detalle del evento, tsunami y recomendaciones.

#### Capas del mapa

1. Epicentros

   * Latitud/longitud
   * Magnitud
   * Profundidad
   * Hora local Venezuela
   * Fuente
   * Estado de revisión

2. Intensidad estimada

   * MMI si está disponible
   * CDI si está disponible
   * Alert color si está disponible

3. Secuencia temporal

   * Orden cronológico
   * Línea o animación simple por hora
   * No usar animaciones pesadas por defecto

4. Tsunami

   * Costa sin alerta
   * Costa bajo información/aviso
   * Costa bajo vigilancia
   * Costa bajo alerta
   * Alerta cancelada

5. Impacto estimado

   * PAGER si está disponible
   * Mostrar como estimación técnica, no balance oficial

#### Filtros

* Última hora
* Últimas 6 horas
* Últimas 24 horas
* Últimos 7 días
* Magnitud mínima
* Profundidad
* Intensidad estimada
* Fuente
* Eventos con tsunami flag
* Eventos revisados
* Eventos automáticos

#### Detalle de evento

Campos:

* Magnitud
* Tipo de magnitud
* Lugar
* Fecha/hora UTC
* Fecha/hora Venezuela
* Latitud
* Longitud
* Profundidad
* Intensidad estimada MMI
* Intensidad reportada CDI
* Estado de revisión
* Fuente
* URL oficial
* Tsunami flag
* PAGER alert si existe
* Última actualización
* Eventos relacionados si existen

#### Recomendaciones integradas

Mostrar recomendaciones según contexto:

Si hay sismo reciente sin tsunami:

* Mantente fuera de estructuras dañadas.
* Prepárate para réplicas.
* Usa escaleras, no ascensores.
* Revisa fugas de gas, cables caídos y grietas.
* Usa mensajes de texto si la red está saturada.

Si hay amenaza de tsunami:

* Aléjate de la costa.
* Busca terreno alto o muévete tierra adentro.
* No esperes confirmación adicional si estás en costa y sentiste un sismo fuerte o largo.
* No regreses hasta que una autoridad confirme que es seguro.
* Evita playas, puertos, malecones y desembocaduras.

#### Estados especiales

Si no hay datos de tsunami:

> No hay datos de tsunami disponibles en este momento. Consulta fuentes oficiales antes de acercarte a la costa.

Si la alerta fue cancelada:

> La alerta de tsunami aparece como cancelada en la última fuente consultada. Mantente atento a nuevas actualizaciones oficiales.

Si los datos están desactualizados:

> Estos datos tienen más de [X] minutos sin actualizarse. Úsalos con precaución.

---

### 5.3 `/ayuda`

Mapa/listado de ayuda disponible.

#### Objetivo

Mostrar recursos activos para personas afectadas.

#### Tipos de ayuda

* Refugios
* Centros de acopio
* Hospitales
* Ambulatorios
* Puntos de agua
* Puntos de comida
* Puntos de carga eléctrica
* Puntos con señal/comunicación
* Transporte
* Voluntariado
* Atención médica
* Atención psicológica

#### Ficha de recurso

* Nombre
* Tipo
* Estado/municipio/parroquia
* Ubicación aproximada
* Estado operativo:

  * Activo
  * Saturado
  * Cerrado
  * Sin confirmar
* Necesidades actuales
* Contacto si es público
* Última actualización
* Nivel de verificación
* Fuente
* Botón copiar para WhatsApp

#### Filtros

* Cerca de mí
* Estado
* Municipio
* Tipo de ayuda
* Verificados
* Necesita donaciones
* Abierto ahora
* Con capacidad disponible

#### Regla crítica

No exponer direcciones privadas de personas afectadas. Solo ubicaciones públicas o aproximadas cuando haya riesgo.

---

### 5.4 `/necesidades`

Tablero de necesidades y recursos ofrecidos.

#### Objetivo

Conectar necesidades reales con personas que pueden ayudar.

#### Categorías

* Agua
* Alimentos
* Medicinas
* Insumos médicos
* Baterías/powerbanks
* Linternas
* Plantas eléctricas
* Transporte
* Ropa
* Pañales
* Mascotas
* Herramientas
* Voluntarios
* Sangre
* Maquinaria
* Comunicación

#### Vista principal

Cada tarjeta debe mostrar:

* Qué se necesita
* Dónde
* Urgencia
* Cantidad si se conoce
* Fuente
* Última actualización
* Estado:

  * Pendiente
  * En proceso
  * Cubierto parcialmente
  * Cubierto
  * Desactualizado

#### Acciones

* Marcar “puedo ayudar”
* Copiar solicitud
* Reportar como duplicado
* Actualizar estado
* Ver ubicación aproximada

---

### 5.5 `/reportar`

Formulario rápido de reporte ciudadano.

#### Objetivo

Permitir reportar daños, necesidades o recursos en menos de 60 segundos.

#### Tipos de reporte

* Daño estructural
* Vía bloqueada
* Derrumbe
* Persona atrapada
* Necesidad urgente
* Recurso disponible
* Refugio activo
* Centro de acopio
* Hospital/ambulatorio operativo
* Riesgo eléctrico
* Fuga de gas
* Zona sin señal
* Zona sin agua
* Zona sin luz

#### Campos mínimos

* Tipo de reporte
* Estado
* Municipio
* Parroquia opcional
* Ubicación aproximada
* Descripción corta
* Urgencia:

  * Baja
  * Media
  * Alta
  * Crítica
* Evidencia opcional:

  * Foto comprimida
  * Enlace
* Fuente:

  * Lo vi personalmente
  * Me lo reportaron
  * Medio de comunicación
  * Autoridad
  * Voluntario
* Contacto opcional privado

#### Reglas

* No publicar datos personales sensibles.
* No publicar nombres de heridos o fallecidos sin confirmación oficial.
* No publicar direcciones privadas completas.
* No permitir lenguaje alarmista o especulativo.
* Todo reporte entra como “pendiente”.

#### UX

* Formulario en pasos cortos.
* Máximo 4 pasos.
* Botón persistente “Enviar reporte”.
* Guardado local si no hay conexión.
* Reintento automático cuando vuelva la conexión.

---

### 5.6 `/recomendaciones`

Guía de prevención y autoprotección.

#### Objetivo

Dar instrucciones claras, rápidas y contextualizadas.

#### Secciones

1. Durante un sismo

   * Agáchate, cúbrete y sujétate.
   * Aléjate de ventanas.
   * No corras hacia escaleras durante la sacudida.
   * Si estás afuera, aléjate de postes, cables, fachadas y árboles.
   * Si estás manejando, detente en un lugar seguro.

2. Después de un sismo

   * Prepárate para réplicas.
   * No uses ascensores.
   * Revisa heridas.
   * Evita estructuras dañadas.
   * Revisa fugas de gas.
   * No enciendas fuego si hueles gas.
   * Usa SMS o mensajería para no saturar líneas.

3. Si estás en la costa

   * Aléjate del mar tras un sismo fuerte o largo.
   * Busca terreno alto o muévete tierra adentro.
   * No vayas a la playa a observar.
   * Espera información oficial.

4. Kit básico

   * Agua
   * Alimentos no perecederos
   * Linterna
   * Radio
   * Pilas
   * Powerbank
   * Documentos
   * Medicinas
   * Silbato
   * Botiquín
   * Copia de contactos

5. Comunicación familiar

   * Punto de encuentro
   * Contacto fuera de la zona afectada
   * Mensaje corto predefinido
   * Evitar llamadas salvo emergencia

#### Formato

* Tarjetas cortas.
* Checklist descargable o copiable.
* Sin textos largos.
* Lenguaje directo.

---

### 5.7 `/estado/:slug`

Página de estado o municipio.

#### Objetivo

Concentrar información por zona.

#### Ejemplo

`/estado/la-guaira`

#### Contenido

* Resumen de sismos cercanos
* Intensidad máxima estimada
* Alertas activas
* Recursos disponibles
* Necesidades activas
* Reportes de daño
* Vías bloqueadas
* Última actualización
* Fuentes usadas

#### Filtros internos

* Solo verificados
* Últimas 24h
* Urgencia alta/crítica
* Recursos abiertos
* Reportes ciudadanos

---

### 5.8 `/admin`

Panel de moderación.

#### Objetivo

Validar reportes, controlar fuentes y mantener calidad de información.

#### Funciones

* Ver reportes pendientes.
* Aprobar, rechazar o marcar duplicado.
* Editar ubicación aproximada.
* Cambiar nivel de verificación.
* Fusionar reportes duplicados.
* Marcar datos como desactualizados.
* Crear recursos verificados.
* Crear necesidades verificadas.
* Revisar logs de fuentes oficiales.
* Forzar fetch manual.
* Exportar CSV.

#### Roles

* Admin
* Moderador
* Voluntario verificado
* Lector

---

## 6. Modelo de datos inicial

### 6.1 Tabla `official_sources`

Guarda fuentes oficiales o confiables.

Campos:

* `id`
* `name`
* `type`

  * `seismic`
  * `tsunami`
  * `civil_protection`
  * `media`
  * `manual`
* `country`
* `base_url`
* `status`

  * `active`
  * `degraded`
  * `disabled`
* `trust_level`

  * `official`
  * `verified`
  * `community`
* `last_checked_at`
* `created_at`
* `updated_at`

---

### 6.2 Tabla `seismic_events`

Guarda eventos sísmicos normalizados.

Campos:

* `id`
* `external_id`
* `source_id`
* `source_name`
* `status`

  * `automatic`
  * `reviewed`
  * `deleted`
* `event_type`

  * `earthquake`
  * `quarry_blast`
  * `other`
* `place`
* `country`
* `latitude`
* `longitude`
* `depth_km`
* `magnitude`
* `magnitude_type`
* `event_time_utc`
* `event_time_local`
* `updated_at_source`
* `mmi`
* `cdi`
* `alert_level`

  * `green`
  * `yellow`
  * `orange`
  * `red`
  * `unknown`
* `tsunami_flag`
* `significance`
* `felt_reports_count`
* `detail_url`
* `raw_payload`
* `created_at`
* `updated_at`

Índices:

* `external_id`
* `event_time_utc`
* `magnitude`
* `latitude`, `longitude`
* `source_id`
* `tsunami_flag`

---

### 6.3 Tabla `tsunami_alerts`

Guarda alertas y boletines de tsunami.

Campos:

* `id`
* `external_id`
* `source_id`
* `provider`

  * `NOAA_PTWC`
  * `NOAA_NTWC`
  * `LOCAL_AUTHORITY`
* `status`

  * `information`
  * `watch`
  * `advisory`
  * `warning`
  * `canceled`
  * `unknown`
* `headline`
* `description`
* `affected_area_text`
* `effective_at`
* `expires_at`
* `event_time_utc`
* `related_seismic_event_id`
* `raw_payload`
* `created_at`
* `updated_at`

Índices:

* `status`
* `effective_at`
* `expires_at`
* `related_seismic_event_id`

---

### 6.4 Tabla `coastal_alert_zones`

Guarda zonas costeras venezolanas para pintar alertas.

Campos:

* `id`
* `name`
* `state`
* `municipality`
* `coastline_geojson`
* `risk_level`

  * `none`
  * `info`
  * `watch`
  * `warning`
  * `canceled`
* `last_alert_id`
* `updated_at`

---

### 6.5 Tabla `resources`

Guarda recursos disponibles.

Campos:

* `id`
* `type`

  * `shelter`
  * `hospital`
  * `collection_center`
  * `water`
  * `food`
  * `charging_point`
  * `communication`
  * `transport`
  * `volunteer_center`
* `name`
* `state`
* `municipality`
* `parish`
* `latitude`
* `longitude`
* `location_precision`

  * `exact`
  * `approximate`
  * `area`
* `status`

  * `active`
  * `saturated`
  * `closed`
  * `unknown`
* `capacity_status`

  * `available`
  * `limited`
  * `full`
  * `unknown`
* `description`
* `public_contact`
* `verification_status`

  * `pending`
  * `verified`
  * `rejected`
  * `outdated`
* `source_id`
* `created_by`
* `last_verified_at`
* `created_at`
* `updated_at`

---

### 6.6 Tabla `needs`

Guarda necesidades activas.

Campos:

* `id`
* `category`
* `title`
* `description`
* `state`
* `municipality`
* `parish`
* `latitude`
* `longitude`
* `location_precision`
* `urgency`

  * `low`
  * `medium`
  * `high`
  * `critical`
* `quantity`
* `status`

  * `open`
  * `in_progress`
  * `partially_covered`
  * `covered`
  * `outdated`
* `verification_status`
* `source_id`
* `related_resource_id`
* `created_by`
* `last_verified_at`
* `created_at`
* `updated_at`

---

### 6.7 Tabla `citizen_reports`

Guarda reportes ciudadanos.

Campos:

* `id`
* `report_type`
* `title`
* `description`
* `state`
* `municipality`
* `parish`
* `latitude`
* `longitude`
* `location_precision`
* `urgency`
* `evidence_url`
* `report_source_type`

  * `first_hand`
  * `reported_by_other`
  * `media`
  * `authority`
  * `volunteer`
* `private_contact`
* `public_safe_summary`
* `verification_status`

  * `pending`
  * `in_review`
  * `verified`
  * `rejected`
  * `duplicate`
  * `outdated`
* `moderator_notes`
* `created_at`
* `updated_at`

---

### 6.8 Tabla `safety_recommendations`

Guarda recomendaciones preventivas.

Campos:

* `id`
* `context`

  * `earthquake_before`
  * `earthquake_during`
  * `earthquake_after`
  * `tsunami`
  * `coast`
  * `damaged_building`
  * `communications`
* `title`
* `body`
* `priority`
* `source_id`
* `is_active`
* `created_at`
* `updated_at`

---

### 6.9 Tabla `fetch_runs`

Guarda logs de carga de datos.

Campos:

* `id`
* `source_id`
* `job_name`
* `status`

  * `success`
  * `partial`
  * `failed`
* `started_at`
* `finished_at`
* `items_found`
* `items_created`
* `items_updated`
* `error_message`
* `raw_response_snapshot`

---

## 7. Fetch inicial de datos

### 7.1 Objetivo del fetch inicial

Al arrancar el sistema por primera vez, cargar datos mínimos para que la app sea útil inmediatamente.

### 7.2 Datos necesarios para arranque

1. Fuentes oficiales base

   * USGS Earthquake Catalog
   * USGS GeoJSON feeds
   * NOAA / Tsunami.gov PTWC
   * NOAA / Tsunami.gov NTWC
   * FUNVISIS
   * Protección Civil / recomendaciones oficiales disponibles

2. Eventos sísmicos recientes

   * Últimas 24 horas
   * Últimos 7 días
   * Magnitud mínima sugerida: 2.5 o configurable
   * Bounding box de Venezuela y zonas cercanas del Caribe

3. Eventos significativos

   * Magnitud 4.5+
   * Eventos con `tsunami_flag`
   * Eventos con `alert_level`
   * Eventos con `mmi`

4. Alertas de tsunami

   * Últimos boletines PTWC
   * Últimos boletines NTWC
   * Estado actual:

     * information
     * watch
     * advisory
     * warning
     * canceled

5. Zonas costeras base

   * La Guaira
   * Falcón
   * Carabobo
   * Aragua
   * Miranda
   * Anzoátegui
   * Sucre
   * Nueva Esparta
   * Zulia
   * Delta Amacuro

6. Recomendaciones base

   * Sismo antes
   * Sismo durante
   * Sismo después
   * Costa/tsunami
   * Comunicación en emergencia
   * Edificios dañados

### 7.3 Jobs iniciales

#### `seed:official-sources`

Crea registros base en `official_sources`.

#### `fetch:usgs-recent-earthquakes`

Consulta eventos recientes en Venezuela y alrededores.

Debe guardar:

* Magnitud
* Lugar
* Coordenadas
* Profundidad
* Hora
* MMI
* CDI
* Alert level
* Tsunami flag
* Significance
* Fuente
* Payload bruto

#### `fetch:usgs-significant-earthquakes`

Consulta eventos significativos recientes.

Debe priorizar:

* Magnitud >= 4.5
* Alert level amarillo/naranja/rojo
* Tsunami flag activo
* Eventos con productos PAGER

#### `fetch:tsunami-ptwc`

Lee feed Atom/CAP del PTWC.

Debe guardar:

* Estado de alerta
* Área afectada
* Mensaje oficial
* Hora de emisión
* Hora de expiración si existe
* Evento sísmico relacionado si se puede inferir

#### `seed:coastal-zones`

Carga zonas costeras venezolanas base.

En MVP puede usarse una geometría simplificada por estado costero.

#### `seed:safety-recommendations`

Carga recomendaciones estáticas oficiales o curadas manualmente desde fuentes oficiales.

### 7.4 Normalización de eventos sísmicos

Cada evento externo debe normalizarse a `seismic_events`.

Reglas:

* `external_id` debe ser único por fuente.
* Si llega un evento con el mismo `external_id`, actualizarlo, no duplicarlo.
* Si cambia magnitud, intensidad o estado de revisión, actualizar.
* Guardar siempre `raw_payload`.
* Convertir hora UTC a hora local de Venezuela para visualización.
* No eliminar eventos antiguos; marcar como desactualizados si aplica.

### 7.5 Bounding box inicial sugerido

Usar un área amplia que cubra Venezuela y zonas cercanas del Caribe.

Parámetros conceptuales:

* `minlatitude`: 0
* `maxlatitude`: 15
* `minlongitude`: -75
* `maxlongitude`: -55

Estos valores pueden ajustarse cuando se defina precisión geográfica final.

### 7.6 Endpoints internos del backend

#### `GET /api/status`

Devuelve estado general de la app.

Respuesta:

* Última actualización sísmica
* Última actualización tsunami
* Estado de fuentes
* Cantidad de eventos recientes
* Alertas activas

#### `GET /api/seismic-events`

Filtros:

* `from`
* `to`
* `minMagnitude`
* `maxMagnitude`
* `minDepth`
* `maxDepth`
* `source`
* `hasTsunamiFlag`
* `alertLevel`
* `bbox`

#### `GET /api/seismic-events/:id`

Detalle de evento.

#### `GET /api/tsunami-alerts/current`

Devuelve alerta actual más relevante.

#### `GET /api/coastal-zones`

Devuelve zonas costeras con estado de alerta.

#### `GET /api/resources`

Lista recursos.

#### `GET /api/needs`

Lista necesidades.

#### `POST /api/reports`

Crea reporte ciudadano pendiente.

#### `GET /api/recommendations`

Devuelve recomendaciones filtradas por contexto.

---

## 8. Reglas de verificación

### Niveles de confianza

1. `official`

   * Fuente oficial directa.

2. `verified`

   * Medio reconocido, ONG o voluntario validado.

3. `community_pending`

   * Reporte ciudadano no confirmado.

4. `outdated`

   * Dato con más tiempo del aceptable sin actualización.

5. `rejected`

   * Falso, duplicado o no verificable.

### Reglas visuales

* No mezclar reportes ciudadanos con datos oficiales sin etiqueta.
* Mostrar “pendiente de verificar” de forma clara.
* Los mapas deben permitir ocultar reportes no verificados.

---

## 9. Criterios de MVP

El MVP está listo cuando:

* La home muestra estado general.
* `/sismos` muestra eventos sísmicos desde fuente oficial.
* `/sismos` muestra estado tsunami desde fuente oficial.
* `/sismos` permite filtrar por tiempo y magnitud.
* `/recomendaciones` muestra guías claras.
* `/reportar` permite crear reportes ciudadanos.
* `/ayuda` muestra recursos manuales o verificados.
* `/necesidades` muestra necesidades manuales o verificadas.
* El backend guarda eventos, alertas y reportes.
* Hay logs de fetch inicial.
* La app funciona correctamente en móvil.
* La app muestra últimos datos cacheados si falla el backend.
