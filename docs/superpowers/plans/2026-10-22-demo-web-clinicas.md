# Demo de web para cada clínica — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Una web de ejemplo de clínica en `mentadev.com/demo/`, rellenada con los datos que viajan en el enlace, que el panel de prospección prepara y mete en el borrador del email.

**Architecture:** Página estática genérica en `demo/` (HTML + CSS + módulos ES) que lee del fragmento `#d=…` un JSON en base64url y pinta nombre, teléfono, municipio, tipo y tratamientos; horario y dirección son de ejemplo por tipo. El panel (`prospecting/`) guarda lo editado en una tabla `demos`, construye el enlace con el mismo módulo de codificación (`demo/enlace.js`, que el panel importa; la web pública no importa nada de `prospecting/`) y lo pone en el email.

**Tech Stack:** HTML/CSS/JS vanilla, módulos ES, Node 24 (`node:sqlite`, `node:test`). Sin dependencias.

**Spec:** `docs/superpowers/specs/2026-10-22-demo-web-clinicas-design.md`

**Rama:** crear `demo-clinicas` desde la rama actual (`fix-analizador-certificados`, que lleva el panel y aún no está en `main`).

## Global Constraints

- Pruebas: `node --test "tests/*.test.mjs"` (no pasar la carpeta). Todas deben seguir pasando.
- Sin dependencias npm, sin build, sin servicios externos en la demo (fotos y fuentes en el repo; fuentes de `/assets/fonts/`). Sin mapa incrustado. Sin cookies. Sin emojis: iconos SVG de trazo inline.
- Lo leído del enlace se pinta con `textContent`/atributos, nunca `innerHTML`.
- Idiomas: `es` y `en` solamente; la estructura de textos admite añadir `nl`/`de` sin tocar `demo.js`.
- Tipos: `dental`, `fisio`, `medica`, `estetica`, `generica` (por defecto `generica`).
- Etiquetas en la demo: cada foto «Foto de ejemplo» / «Example photo»; horario y dirección «Ejemplo» / «Example»; franja: «Web de ejemplo preparada por MentaDev para [nombre]. Fotos, horario, dirección y textos son orientativos.» / «Sample website prepared by MentaDev for [nombre]. Photos, opening hours, address and texts are for illustration only.»
- Dirección de ejemplo: `Calle Ejemplo, 1 · [municipio]` (en inglés igual). Nunca una calle real.
- Ninguna persona en la sección «sobre la clínica»; caras solo en fotos de ambiente.
- La cita no envía nada; al terminar: «En vuestra web, esta solicitud os llegaría al momento por email.»
- `noindex`: `<meta name="robots" content="noindex">` y `X-Robots-Tag: noindex` para `/demo/*` en `_headers`; `Disallow: /demo/` en `robots.txt`; no en `sitemap.xml`. Script de Cloudflare Web Analytics (token `86ba551e367d48e094c48d4ac87cbf4f`) antes de `</body>`.
- Mobile-first, bien a 360 px sin scroll horizontal; foco visible; `prefers-reduced-motion`.
- Precios y plazos del email: los de `report.mjs` (`PRECIO_WEB`, `PLAZO_WEB`), sin tocarlos.
- Voz en primera persona del plural.

## Review Focus

1. **Enlace cortado o modificado por el cliente de correo** (falta el final del base64, `#d=` vacío, JSON que no es objeto): la demo se ve completa con «Vuestra clínica» y sin teléfono, nunca en blanco ni con error. → test en Task 1 (`leerEnlace` devuelve `null`) y Task 3 (sin datos, la página trae contenido en el HTML).
2. **Nombres con acentos, comillas, `<script>`, `&` o 200 caracteres:** ida y vuelta exacta para ≤ 80 caracteres, recorte a 80, y nada se interpreta como HTML. → tests en Task 1.
3. **«Abierto ahora» en los bordes:** justo a la hora de cierre (cerrado), en la pausa de mediodía (cerrado, «abre a las 16:00»), sábado/domingo sin horario («abre el lunes a las 9:00»), y la hora de Madrid (no la del ordenador), incluido el cambio de hora. → tests en Task 1.
4. **Clínica excluida o anonimizada:** no se puede guardar demo; marcar «No volver a llamar» borra su demo. → tests en Task 4.
5. **Teléfono fijo y WhatsApp:** por defecto WhatsApp solo si el teléfono es móvil (empieza por 6 o 7); sin teléfono, ni llamar ni WhatsApp. → tests en Task 4 (valor por defecto) y Task 1 (validación).

---

### Task 1: Enlace y horario (módulos puros)

**Files:**
- Create: `demo/enlace.js`, `demo/horario.js`
- Test: `tests/demo-enlace.test.mjs`, `tests/demo-horario.test.mjs`

**Interfaces:**
- Produces:
  - `export const TIPOS = ['dental','fisio','medica','estetica','generica']`
  - `export function crearEnlace(datos: {nombre: string, telefono: string|null, municipio: string, tipo: string, tratamientos: number[], whatsapp: boolean}, base = 'https://mentadev.com/demo/') -> string` — `base + '#d=' + base64url(UTF-8 JSON {v:1,n,t,m,k,tr,w})`. Lanza `Error` si los datos no pasan `validar`.
  - `export function leerEnlace(hash: string) -> datos | null` — acepta `location.hash`; `null` ante cualquier fallo.
  - `export function validar(datos) -> datos` (normalizado) — `nombre` texto 1–80 (recorta a 80, quita controles), `municipio` 1–60, `telefono` `null` o `/^\+?\d[\d\s().-]{5,24}$/`, `tipo` en `TIPOS` (si no, `generica`), `tratamientos` enteros 0–29 únicos (máx. 12), `whatsapp` booleano y `false` si no hay teléfono.
  - `export function ahoraEnMadrid(fecha: Date) -> {dia: 0..6 (0 = domingo), minutos: number}` — con `Intl.DateTimeFormat('en-GB', {timeZone: 'Europe/Madrid', …})`.
  - `export function estadoHorario(horario: Array<Array<[number, number]>> /* 7 días, 0 = domingo, tramos en minutos */, ahora: {dia, minutos}) -> {abierto: boolean, hasta: number|null, abre: {dia: number, minutos: number}|null}` — `hasta` = cierre del tramo actual; `abre` = próximo inicio (hoy más tarde o días siguientes, hasta 7).
  - `export const hhmm = (minutos) -> 'HH:MM'`
  - Base64url con `TextEncoder`/`btoa` para que funcione igual en Node 24 y en el navegador.

- [ ] **Step 1: Tests que fallan**

`tests/demo-enlace.test.mjs`:
- `ida y vuelta con acentos y símbolos`: `leerEnlace(new URL(crearEnlace({nombre: 'Consulta del Dr. Soler & «Hijos» <b>', telefono: '965 85 18 01', municipio: 'Benidorm', tipo: 'medica', tratamientos: [0, 2], whatsapp: false})).hash)` es `deepEqual` a la entrada.
- `recorta el nombre a 80`: nombre de 200 «a» → `nombre.length === 80`.
- `enlace roto devuelve null`: `leerEnlace('')`, `leerEnlace('#d=')`, `leerEnlace('#d=%%%')`, el enlace válido con los últimos 10 caracteres quitados, `'#d=' + base64url('[1,2]')` → todos `null`.
- `tipo desconocido pasa a generica` y `whatsapp sin teléfono es false`.
- `tratamientos fuera de rango o repetidos se descartan`: `[0, 0, 99, -1, 1.5, 3]` → `[0, 3]`.
- `crearEnlace lanza con nombre vacío`.

`tests/demo-horario.test.mjs` (horario de prueba `L–V [[540,840],[960,1200]]`, sábado y domingo `[]`):
- lunes 10:00 → `{abierto: true, hasta: 840}`.
- lunes 14:00 exacto → `abierto: false`, `abre: {dia: 1, minutos: 960}`.
- lunes 20:00 → `abre: {dia: 2, minutos: 540}`.
- sábado 11:00 → `abre: {dia: 1, minutos: 540}`.
- horario vacío toda la semana → `{abierto: false, hasta: null, abre: null}`.
- `ahoraEnMadrid(new Date('2026-10-25T08:30:00Z'))` → `{dia: 0, minutos: 570}` (día del cambio a horario de invierno, UTC+1) y `ahoraEnMadrid(new Date('2026-07-06T08:30:00Z'))` → `{dia: 1, minutos: 630}` (UTC+2).
- `hhmm(540) === '09:00'`.

- [ ] **Step 2:** `node --test tests/demo-enlace.test.mjs tests/demo-horario.test.mjs` → FAIL (no existen los módulos).
- [ ] **Step 3:** Implementar `demo/enlace.js` y `demo/horario.js` con las firmas de arriba.
- [ ] **Step 4:** Mismo comando → PASS.
- [ ] **Step 5:** `git add demo/enlace.js demo/horario.js tests/demo-enlace.test.mjs tests/demo-horario.test.mjs && git commit -m "Demo de clínica: enlace con los datos y cálculo del horario"`

---

### Task 2: Contenido por tipo (ES/EN) y fotos

**Files:**
- Create: `demo/contenido.js`, `demo/fotos/*.webp`, `demo/fotos/CREDITOS.txt`
- Test: `tests/demo-contenido.test.mjs`

**Interfaces:**
- Consumes: `TIPOS` de `demo/enlace.js`.
- Produces: `export const IDIOMAS = ['es','en']`, `export const COMUNES: {es: {...}, en: {...}}` (textos de interfaz: menú, botones, pasos de la cita, etiquetas «Foto de ejemplo»/«Ejemplo», franja, días de la semana, «Abierto ahora · cierra a las {h}», «Cerrado · abre {cuando} a las {h}», resumen final de la cita) y `export const CONTENIDO: Record<tipo, {acento: '#hex', horario: 7×tramos, tratamientos: Array<{es: {t, d}, en: {t, d}}>, defecto: number[], textos: {es: {titular, entradilla, sobre, primeraVisita: string[]}, en: {…}}, fotos: {portada, clinica, ambiente, contacto}}>` (cada foto `{src: '/demo/fotos/x.webp', alt: {es, en}}`).

Valores fijados:
- Horarios: `dental` L–V 9:00–14:00 y 16:00–20:00; `fisio` L–V 8:00–14:00 y 15:30–21:00, S 9:00–13:00; `medica` L–V 9:00–14:00 y 16:30–19:30; `estetica` L–V 10:00–14:00 y 16:00–20:30, S 10:00–14:00; `generica` L–V 9:00–14:00 y 16:00–20:00.
- 8–12 tratamientos por tipo (`defecto`: los 4–6 más habituales). Textos en lenguaje de paciente, sin promesas de resultados, sin precios, sin reseñas.
- Inglés escrito a mano, natural (pacientes extranjeros en la Costa Blanca).
- Fotos: de Unsplash o Pexels (licencia que permite uso comercial), descargadas a ~1600 px de ancho en WebP (parámetros de la URL de descarga, p. ej. `?w=1600&fm=webp&q=70`), ≤ 250 KB cada una. `clinica` sin personas. Hasta 4 por tipo; se pueden compartir entre tipos. `CREDITOS.txt`: archivo, autor, URL y licencia de cada una.

- [ ] **Step 1: Test que falla** `tests/demo-contenido.test.mjs`:
  - `cada tipo existe y tiene es y en con las mismas claves` (recorre `TIPOS`, compara claves de `textos.es`/`textos.en`, y `es`/`en` de cada tratamiento con `t` y `d` no vacíos).
  - `defecto son índices válidos` y `hay entre 8 y 12 tratamientos` (y ≤ 30, el máximo de `validar`).
  - `horario: 7 días, tramos ordenados dentro de 0–1440`.
  - `acento legible con texto blanco` (contraste ≥ 4.5, misma fórmula que `tests/sectores.test.mjs`).
  - `cada foto existe en disco, pesa ≤ 250 KB y tiene alt en es y en`; `CREDITOS.txt` nombra cada archivo de `demo/fotos/`.
  - `COMUNES.es` y `COMUNES.en` tienen las mismas claves`.
- [ ] **Step 2:** `node --test tests/demo-contenido.test.mjs` → FAIL.
- [ ] **Step 3:** Escribir `demo/contenido.js`, descargar las fotos y escribir `CREDITOS.txt`.
- [ ] **Step 4:** Mismo comando → PASS.
- [ ] **Step 5:** `git add demo/contenido.js demo/fotos tests/demo-contenido.test.mjs && git commit -m "Demo de clínica: textos en español e inglés por tipo y fotos de ejemplo"`

---

### Task 3: Página de la demo

**Files:**
- Create: `demo/index.html`, `demo/demo.css`, `demo/demo.js`
- Modify: `_headers`, `robots.txt`
- Test: `tests/demo-pagina.test.mjs`

**Interfaces:**
- Consumes: `leerEnlace`, `crearEnlace` (no), `ahoraEnMadrid`, `estadoHorario`, `hhmm` (Task 1); `CONTENIDO`, `COMUNES`, `IDIOMAS` (Task 2).
- Produces: la URL pública `https://mentadev.com/demo/#d=…` (Task 4 la construye).

Estructura (orden): franja de aviso → cabecera (nombre, selector ES/EN, «Pedir cita») → portada (titular, entradilla, foto, estado del horario + Llamar + WhatsApp) → tratamientos (los elegidos) → sobre la clínica (foto sin personas) → tu primera visita (pasos) → pedir cita (3 pasos: motivo [tratamientos elegidos + «Primera visita» + «Otro»] → día de los próximos 6 con horario y franja mañana/tarde según el horario → nombre y teléfono → resumen y aviso de que no se envía) → contacto (dirección de ejemplo, horario semanal con etiqueta «Ejemplo», teléfono) → pie («Web de ejemplo hecha por MentaDev», enlace a mentadev.com).

- El HTML trae el contenido completo del tipo `generica` en español con «Vuestra clínica» (se ve sin JS y si el enlace está roto, sin botones de llamar/WhatsApp). `demo.js` (módulo, `type="module"`) lo sustituye con los datos del enlace.
- `tel:` con los dígitos; WhatsApp `https://wa.me/34XXXXXXXXX` (añade 34 si no hay prefijo) solo si `whatsapp`.
- Idioma inicial: `navigator.language` empieza por `es` → `es`, si no `en`; el cambio actualiza `<html lang>` y todos los textos, sin recargar. Guarda la elección en `sessionStorage` con `try/catch`.
- El estado del horario se recalcula cada minuto.
- `<title>`: `[nombre] · Web de ejemplo`. `meta robots noindex`. Sin Open Graph ni JSON-LD.
- Estilo de clínica, con el `acento` del tipo; Poppins para el texto y Bricolage para los titulares, desde `/assets/fonts/`. Las etiquetas de ejemplo, pequeñas pero con contraste suficiente.

- [ ] **Step 1: Test que falla** `tests/demo-pagina.test.mjs` (lee los archivos como texto):
  - `noindex en la página, en _headers y en robots.txt`: `<meta name="robots" content="noindex">`; `_headers` contiene un bloque `/demo/*` con `X-Robots-Tag: noindex`; `robots.txt` contiene `Disallow: /demo/`; `sitemap.xml` no contiene `/demo`.
  - `lleva la analítica`: contiene `86ba551e367d48e094c48d4ac87cbf4f`.
  - `sin servicios externos`: ningún `src=` ni `href=` de `<link>`/`<script>`/`<img>` empieza por `http` salvo `https://static.cloudflareinsights.com/beacon.min.js`.
  - `sin JS se ve completa y avisada`: el HTML contiene «Vuestra clínica», «Foto de ejemplo», «Web de ejemplo preparada por MentaDev» y `Calle Ejemplo, 1`.
  - `demo.js no usa innerHTML ni insertAdjacentHTML`.
- [ ] **Step 2:** `node --test tests/demo-pagina.test.mjs` → FAIL.
- [ ] **Step 3:** **Antes de escribir la página, cargar la skill `frontend-design:frontend-design`** (lo pide la titular: que la demo sea espectacular) y seguirla para la dirección visual, la tipografía y el movimiento, dentro de las Global Constraints (sin servicios externos, solo `transform`/`opacity` en las animaciones, `prefers-reduced-motion`, 360 px). Escribir `demo/index.html`, `demo/demo.css`, `demo/demo.js`; añadir a `_headers` el bloque `/demo/*` con `X-Robots-Tag: noindex`; añadir `Disallow: /demo/` a `robots.txt`.
- [ ] **Step 4:** Mismo comando → PASS, y `node --test "tests/*.test.mjs"` → todo PASS.
- [ ] **Step 5: Comprobación visual.** Servir la raíz (`npx wrangler dev` o `node -e` con un servidor estático) y abrir con el navegador (Claude in Chrome o Puppeteer) un enlace creado con `crearEnlace({nombre: 'Consulta del Dr. Soler', telefono: '965 85 18 01', municipio: 'Benidorm', tipo: 'medica', tratamientos: [0,1,2,3], whatsapp: false})`. Capturas a 360 px y a 1280 px, en ES y en EN; recorrer la cita hasta el resumen; abrir `/demo/` sin `#` y con `#d=roto`. Esperado: sin scroll horizontal a 360 px, etiquetas visibles, sin errores en la consola.
- [ ] **Step 6:** `git add demo/index.html demo/demo.css demo/demo.js _headers robots.txt tests/demo-pagina.test.mjs && git commit -m "Demo de clínica: página con horario, idiomas y cita en 3 pasos"`

---

### Task 4: Tabla `demos` en el CRM

**Files:**
- Modify: `prospecting/schema.sql`, `prospecting/crm.mjs` (`SCHEMA_VERSION` 4 → 5, `setStatus`, `purge`)
- Test: `tests/prospecting-demo.test.mjs`

**Interfaces:**
- Consumes: `validar`, `crearEnlace` de `../demo/enlace.js`; `CONTENIDO` de `../demo/contenido.js` (para `demoPorDefecto`).
- Produces:
  - Tabla `demos(lead_id INTEGER PRIMARY KEY REFERENCES leads(id) ON DELETE CASCADE, nombre TEXT NOT NULL, tipo TEXT NOT NULL, tratamientos TEXT NOT NULL /* JSON */, whatsapp INTEGER NOT NULL CHECK(whatsapp IN (0,1)), fecha TEXT NOT NULL)`.
  - `crm.guardarDemo(id: number, {nombre, tipo, tratamientos, whatsapp}) -> void` — valida con `validar` (con el teléfono y municipio de la ficha); lanza `'La ficha no existe o está excluida'` si no existe o es `suppressed`. Sustituye la fila anterior.
  - `crm.demo(id: number) -> {nombre, tipo, tratamientos: number[], whatsapp: boolean, fecha, enlace: string} | null` — `enlace` con `crearEnlace` y los datos actuales de la ficha (teléfono, municipio).
  - `crm.demoPorDefecto(id: number) -> {nombre: lead.name, tipo: 'generica', tratamientos: CONTENIDO.generica.defecto, whatsapp: teléfono móvil}` (móvil: empieza por 6 o 7 sin el 34, como `esMovil` de `report.mjs`; moverla a un sitio común si hace falta, sin duplicarla).

- [ ] **Step 1: Tests que fallan** `tests/prospecting-demo.test.mjs` (mismo `preparar` que `tests/prospecting-panel.test.mjs`, solo con `CRM`):
  - `guardar y leer`: `guardarDemo(sinWeb, {nombre: 'Consulta del Dr. Soler', tipo: 'medica', tratamientos: [0, 2], whatsapp: false})` → `demo(sinWeb)` tiene esos valores y `leerEnlace(new URL(enlace).hash)` devuelve `telefono: '966 00 00 01'` y `municipio: 'Benidorm'`.
  - `el nombre guardado de la clínica no cambia` (`crm.lead(id).name === 'Sonrisa Sin Web'`).
  - `no se guarda en una excluida` (tras `setStatus(id, 'suppressed', 'o')` lanza) y `marcar no volver a llamar borra la demo` (`demo(id) === null`).
  - `purge que borra la clínica borra su demo` (reloj +31 días, `purge()`, `demo(id) === null`).
  - `por defecto: WhatsApp solo con móvil` (fijo `966…` → `false`; con un lead de teléfono `612 34 56 78` → `true`).
  - `migración desde la versión 4`: base en disco temporal creada con el esquema v4 (`PRAGMA user_version = 4`, sin `demos`) → al abrir con `CRM` tiene la tabla y `user_version = 5`, sin perder leads.
- [ ] **Step 2:** `node --test tests/prospecting-demo.test.mjs` → FAIL.
- [ ] **Step 3:** Añadir la tabla a `schema.sql`, subir `SCHEMA_VERSION` a 5 (el `schema.sql` con `IF NOT EXISTS` ya crea la tabla al migrar; comentar «Versión 5: demos»), borrar `demos` en `setStatus(…, 'suppressed')` y en la anonimización de `purge`, e implementar los tres métodos.
- [ ] **Step 4:** `node --test "tests/*.test.mjs"` → todo PASS.
- [ ] **Step 5:** `git add prospecting/schema.sql prospecting/crm.mjs tests/prospecting-demo.test.mjs && git commit -m "Prospección: guardar la demo de cada clínica"`

---

### Task 5: Panel — preparar la demo

**Files:**
- Modify: `prospecting/panel.mjs`, `prospecting/panel/index.html`, `prospecting/panel/panel.js`, `prospecting/panel/panel.css`
- Test: `tests/prospecting-panel.test.mjs` (añadir)

**Interfaces:**
- Consumes: `crm.guardarDemo`, `crm.demo`, `crm.demoPorDefecto` (Task 4); `CONTENIDO`, `TIPOS` (Tasks 1–2).
- Produces:
  - `detalleDe(id)` añade `demo: crm.demo(id) ?? null`, `demoPorDefecto` y `catalogo: {tipos: [{id, nombre}], tratamientos: {[tipo]: string[] /* títulos es */}, defecto: {[tipo]: number[]}}`.
  - `POST /api/clinicas/:id/demo` con `{nombre, tipo, tratamientos, whatsapp}` → 200 con `detalleDe(id)`; 400 con el mensaje de error; 404 si no existe. Mismas reglas que el resto (`x-panel`, JSON, ≤ 10 000 bytes).
- UI: bloque «Web de ejemplo» en la ficha, encima del email: nombre que se mostrará (por defecto el de Google), tipo (select; al cambiarlo marca su `defecto`), tratamientos (casillas), «Con WhatsApp» (casilla), botón «Preparar demo» / «Guardar cambios»; con demo guardada: «Abrir demo» (nueva pestaña) y «Copiar enlace». Pintado con `textContent`, como el resto del panel.

- [ ] **Step 1: Tests que fallan** en `tests/prospecting-panel.test.mjs`:
  - `preparar la demo devuelve el enlace`: POST a `/api/clinicas/${sinWeb}/demo` con `{nombre: 'Consulta del Dr. Soler', tipo: 'medica', tratamientos: [0,1], whatsapp: false}` → 200 y `demo.enlace` empieza por `https://mentadev.com/demo/#d=`.
  - `sin x-panel se rechaza` → 403; `tipo con tratamientos inválidos se normaliza` (índice 99 desaparece); clínica inexistente → 404.
  - `el detalle trae el catálogo`: `GET /api/clinicas/${sinWeb}` → `catalogo.tipos.length === 5` y `demo === null`.
- [ ] **Step 2:** `node --test tests/prospecting-panel.test.mjs` → FAIL.
- [ ] **Step 3:** Ruta y `detalleDe` en `panel.mjs`; bloque en `index.html`, `panel.js` y `panel.css`.
- [ ] **Step 4:** `node --test "tests/*.test.mjs"` → todo PASS. Abrir el panel (`node prospecting/panel.mjs --sin-navegador` con una base de prueba en el scratchpad, nunca `private-data/`), preparar una demo y abrirla: se ve con los datos.
- [ ] **Step 5:** `git add prospecting/panel.mjs prospecting/panel tests/prospecting-panel.test.mjs && git commit -m "Panel: preparar la web de ejemplo de cada clínica"`

---

### Task 6: Email, guion y documentación

**Files:**
- Modify: `prospecting/report.mjs` (`ficha`, `borradorEmail`), `prospecting/panel.mjs` (pasar la demo a `borradorEmail`), `prospecting/panel/panel.js` (nota si falta la demo), `prospecting/README.md`, `CLAUDE.md`
- Test: `tests/prospecting-si.test.mjs`, `tests/prospecting-guion.test.mjs` (añadir/ajustar)

**Interfaces:**
- Consumes: `crm.demo(id)` (Task 4).
- Produces: `borradorEmail(lead, analysis, consentimiento, demo = null)`; con `demo`, el cuerpo incluye el enlace en su propia línea y este párrafo exacto: «Las fotos, el horario y la dirección son de ejemplo y los textos, orientativos: es una idea para que veáis cómo quedaría. La adaptaríamos a vuestra clínica con vuestras fotos, tratamientos y datos.»

Textos fijados:
- Email sin web, con demo: tras el saludo, «Como hablamos por teléfono, os hemos preparado una web de ejemplo con el nombre de [demo.nombre], para que veáis cómo podría ser la vuestra. Podéis abrirla en el móvil o en el ordenador:» + enlace + párrafo de arriba; después se mantiene lo que tendría la web, precio, plazo, garantía, cierre y pie. Asunto: «[demo.nombre]: vuestra web de ejemplo (gratis y sin compromiso)».
- Email con web, con demo: se mantienen las 3 mejoras; antes de «Son vuestras…», «Y para que veáis cómo podría verse una web nueva, os hemos preparado una de ejemplo con vuestro nombre:» + enlace + párrafo de arriba.
- Sin demo: el email no cambia (y el panel muestra «Prepara la web de ejemplo para añadirla al email»).
- Guion sin web, «Qué les ofreces»: «Hemos visto que no tenéis web propia y os hemos preparado una web de ejemplo con el nombre de vuestra clínica, para que veáis cómo quedaría.» / «¿Os mandamos el enlace por email, gratis, para que la vea quien lleve estos temas?». `revision` (sin web): «Como no tenéis web, os mandamos por email el enlace a una web de ejemplo con vuestro nombre, que podéis abrir en el móvil, y lo que tendría vuestra web con el precio cerrado (desde 349 € + IVA, lista en 7 días laborables). Es gratis y sin compromiso: si no os convence, no pasa nada.» Con web, «Qué les ofreces» añade «y una idea de cómo podría verse una web nueva». Ajustar las frases que dicen «la propuesta» para que sigan teniendo sentido.
- «Antes de llamar» (todas): «Si sale en la conversación, pregunta qué tratamientos hacen: los marcarás en su web de ejemplo.»
- `consentimientos.que` para los nuevos: «Recibir por email la revisión gratis de su web o una propuesta con una web de ejemplo».
- README de prospección: sección «Web de ejemplo» (qué es, que los datos viajan en el enlace, la tabla `demos` y su borrado). `CLAUDE.md`: una línea en «Prospección» y otra en «Convenciones» sobre `demo/` (página pública con `noindex`, sin datos guardados en el servidor, horario/dirección/fotos de ejemplo y etiquetados, ES/EN).

- [ ] **Step 1: Tests que fallan**:
  - `prospecting-si`: `borradorEmail(lead sin web, análisis sinweb, consentimiento, demo)` → `cuerpo` contiene `demo.enlace` y el párrafo fijado; asunto empieza por `demo.nombre`. Con web → contiene las 3 mejoras y el enlace. Sin demo → igual que antes (los tests existentes siguen pasando sin cambios).
  - `prospecting-guion`: la ficha sin web contiene «web de ejemplo» en «Qué les ofreces» y la frase de los tratamientos en `antes`.
  - `prospecting-panel`: tras preparar la demo y registrar el sí, `GET /api/clinicas/:id` → `email.cuerpo` contiene el enlace.
- [ ] **Step 2:** `node --test "tests/prospecting-*.test.mjs"` → FAIL en los nuevos.
- [ ] **Step 3:** Cambiar `report.mjs`, pasar `crm.demo(id)` en `detalleDe`, nota en `panel.js`, README y `CLAUDE.md`.
- [ ] **Step 4:** `node --test "tests/*.test.mjs"` → todo PASS. `node prospecting/cli.mjs <base de prueba> report <id>` muestra el guion nuevo.
- [ ] **Step 5:** `git add prospecting tests CLAUDE.md && git commit -m "Prospección: la web de ejemplo en el email y en el guion"`

---

## Después

- Preparar en el panel real la demo del doctor Soler (#29) y revisarla con la titular antes de llamar.
- Publicar en mentadev.com (push a `main`) solo cuando la titular lo decida: la rama lleva también los cambios del panel aún sin revisar.
