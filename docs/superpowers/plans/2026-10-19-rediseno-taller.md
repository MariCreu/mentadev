# Rediseño "Taller en directo" (fase 1: home) · Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rehacer `index.html` como la experiencia "Taller en directo": el visitante elige su negocio, una web de ejemplo se diseña sola y se transforma en tienda, en app y en automatización, sin perder ningún contenido comercial, el formulario ni el SEO.

**Architecture:**
- HTML estático y semántico con todo el contenido (mejora progresiva).
- Una hoja `taller.css` solo para la home.
- Módulos ES nativos por escena (`js/…`), que comparten un estado de "sector" mediante el evento `md:sector`.
- GSAP + ScrollTrigger alojados en `assets/vendor/gsap/` para las escenas fijadas.
- Sin build ni npm. Las pruebas de lógica pura usan `node --test`, que viene con Node.

**Tech Stack:** HTML, CSS y JS vanilla (módulos ES), GSAP 3.15 + ScrollTrigger (alojados en la web), Cloudflare Workers (static assets), Node 24 (`node --test`) para las pruebas, `wrangler dev` para la vista local y Claude in Chrome para la verificación visual.

**Spec:** `docs/superpowers/specs/2026-10-19-rediseno-taller-design.md`

## Global Constraints

- Se trabaja solo en la rama `rediseno-taller`. **Nunca** push ni merge a `main` sin autorización expresa (`main` publica en mentadev.com).
- Sin build ni dependencias de npm en el repo. Las librerías y fuentes se copian en el repo, con su licencia.
- No se cargan servicios externos, salvo la analítica ya existente (Cloudflare Web Analytics, `beacon.min.js`, token `86ba551e367d48e094c48d4ac87cbf4f`, antes de `</body>`).
- H1 exacto: "Tu idea, hecha realidad." Descriptor: "Web, apps y soluciones digitales." Mensaje de automatización: "Cuéntanos cómo trabajas. Buscamos qué puedes dejar de hacer a mano.", solo en la escena 06.
- Precios y condiciones sin cambios: web desde 349 € + IVA; garantía de 7 días laborables o se devuelve el primer plazo; 2 plazos; alojamiento del primer año; 2 meses de soporte; mantenimiento 15 € + IVA/mes; automatización desde 490 € + IVA, con diagnóstico gratis de 30 min y mantenimiento desde 29 € + IVA/mes; revisión gratis con 3 mejoras en 48 h laborables.
- Voz en primera persona del plural, sin tecnicismos en los textos comerciales, sin comparativas con otras opciones, sin clientes ni resultados inventados y sin emojis (iconos SVG de trazo).
- Paleta: papel `#F8FAFB`, antracita `#1F2937`, menta `#6EC6B4`, lavanda `#BDAEE1`, menta oscuro `#2E8574`, lavanda oscuro `#6F5BBF`, noche `#0F161F`. Texto siempre con contraste AA.
- Tipografías: Bricolage Grotesque (titulares), Poppins (texto), JetBrains Mono (anotaciones).
- Presupuestos:
  - JS comprimido < 150 KB en total;
  - fuentes nuevas ≤ 80 KB;
  - Lighthouse ≥ 90 en las 4 categorías, en móvil y en escritorio;
  - CLS < 0,05;
  - LCP < 2,5 s (móvil simulado).
- Todo debe verse bien a 360 px; teclado y foco visibles; `prefers-reduced-motion` (RM) muestra cada escena en su estado final; sin JS, todo el contenido sigue visible.
- Los CTA `data-servicio` deben coincidir con las tarjetas del paso 1 del formulario y con `SERVICIOS` de `worker/index.js`.
- Animar solo `transform` y `opacity`. El H1 nunca empieza con `opacity: 0`.

## Review Focus

1. **Doble clic o cambio rápido de sector mientras la web de ejemplo se está montando:** el montaje en curso debe cancelarse y acabar en el sector nuevo, sin bloques duplicados ni mezclados.
2. **Redimensionar la ventana o girar la tablet a mitad de una escena fijada:** al cruzar 1024 px, los ScrollTrigger se rehacen sin dejar la página bloqueada, desplazada o con huecos.
3. **Navegar con teclado a un elemento dentro de una escena fijada** (botón "Añadir" de la tienda, hueco del panel): el foco debe quedar visible en pantalla, sin saltos de scroll incontrolados.
4. **`sessionStorage` inaccesible** (navegación privada o bloqueado): elegir sector debe seguir funcionando (solo se pierde el recuerdo).
5. **Llegar con `?servicio=…#contacto` desde una guía** o desde un CTA de una escena fijada: el formulario se abre en el paso 2 con el servicio correcto y la página no queda "atrapada" en una escena fijada.

Cada punto tiene su prueba en la tarea que lo implementa (marcadas con **[RF n]**).

---

## Mapa de archivos

| Archivo | Responsabilidad |
|---|---|
| `js/sectores.js` (nuevo) | Datos de los 6 sectores: textos, productos, panel, flujos y valores de la calculadora. Fuente única. |
| `js/sector-state.js` (nuevo) | Estado del sector elegido; evento `md:sector`; `sessionStorage` tolerante a fallos. |
| `js/calculadora.js` (nuevo) | Cálculo puro del ahorro (sin DOM). |
| `js/movimiento.js` (nuevo) | Utilidades: detectar RM, puntos de corte, acceso a GSAP, `matchMedia` de escenas. |
| `js/hero-build.js` (nuevo) | Selector de sector del hero, montaje y reconstrucción de la web de ejemplo, autorrecorrido. |
| `js/escena-servicios.js` (nuevo) | Escena fijada web → tienda → app; demo del carrito y del panel. |
| `js/escena-automatizacion.js` (nuevo) | Tareas "a mano → automático", selector compacto y calculadora animada. |
| `js/vitrina.js` (nuevo) | Vitrina horizontal de proyectos (fijada en escritorio, nativa en móvil). |
| `js/interacciones.js` (nuevo) | Botones magnéticos, cursor de demos, cabecera compacta, barra de progreso, ficha técnica y barra de 7 días. |
| `main.js` (modificar) | Pasa a módulo ES. Formulario por pasos y envío (lógica actual), calculadora con `calculadora.js` e integración del sector. |
| `site.js` (modificar) | Añade la clase `js` a `<html>` y no aplica `.md-reveal` si la página no lo usa. |
| `taller.css` (nuevo) | Estilos de la home nueva. |
| `index.html` (reescribir) | Las 8 escenas, la cabecera y el pie; JSON-LD y analítica conservados. |
| `worker/index.js` (modificar) | Campo opcional `sector`, validado contra `js/sectores.js`. |
| `assets/vendor/gsap/` (nuevo) | `gsap.min.js`, `ScrollTrigger.min.js`, `LICENSE.md`. |
| `assets/fonts/` (añadir) | `bricolage-grotesque-latin-wght-normal.woff2`, `jetbrains-mono-latin-400-normal.woff2` y sus licencias. |
| `tests/*.test.mjs` (nuevo) | Pruebas `node --test` de sectores, estado, calculadora y Worker. |
| `.assetsignore` (modificar) | Añadir `tests` para no publicar las pruebas. |
| `CLAUDE.md`, `README.md` (modificar) | Convenciones nuevas. |

---

### Task 1: Base: fuentes, GSAP, pruebas y exclusiones

**Files:**
- Create: `assets/vendor/gsap/gsap.min.js`, `assets/vendor/gsap/ScrollTrigger.min.js`, `assets/vendor/gsap/LICENSE.md`
- Create: `assets/fonts/bricolage-grotesque-latin-wght-normal.woff2`, `assets/fonts/jetbrains-mono-latin-400-normal.woff2`, `assets/fonts/OFL-Bricolage-Grotesque.txt`, `assets/fonts/OFL-JetBrains-Mono.txt`
- Create: `tests/smoke.test.mjs`
- Modify: `.assetsignore`, `_headers`

**Interfaces:**
- Produces: `/assets/vendor/gsap/gsap.min.js` (global `window.gsap`) y `/assets/vendor/gsap/ScrollTrigger.min.js` (global `window.ScrollTrigger`); familias CSS `"Bricolage Grotesque"` y `"JetBrains Mono"` (se declaran en la Task 6); comando de pruebas `node --test tests/`.

- [ ] **Step 1: Pedir permiso de descarga a la persona usuaria** (regla de seguridad: cualquier descarga se confirma antes). Mensaje literal:
  > Para la base del rediseño necesito descargar 4 archivos de jsDelivr (el CDN público de npm): `gsap.min.js` (73 KB) y `ScrollTrigger.min.js` (45 KB) de gsap@3.15.0, y las fuentes `bricolage-grotesque-latin-wght-normal.woff2` (41 KB) y `jetbrains-mono-latin-400-normal.woff2` (21 KB) de Fontsource, más sus licencias. ¿Los descargo?

  Si la respuesta no es un sí, detenerse.

- [ ] **Step 2: Descargar a la carpeta del repo** (rutas fijas, versión fijada)

```bash
cd "C:/Users/maric/OneDrive/Documentos/MentaDev/mentadev"
mkdir -p assets/vendor/gsap
curl -fsSL -o assets/vendor/gsap/gsap.min.js https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js
curl -fsSL -o assets/vendor/gsap/ScrollTrigger.min.js https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollTrigger.min.js
curl -fsSL -o assets/vendor/gsap/LICENSE.md https://cdn.jsdelivr.net/npm/gsap@3.15.0/LICENSE.md
curl -fsSL -o assets/fonts/bricolage-grotesque-latin-wght-normal.woff2 https://cdn.jsdelivr.net/npm/@fontsource-variable/bricolage-grotesque@5/files/bricolage-grotesque-latin-wght-normal.woff2
curl -fsSL -o assets/fonts/OFL-Bricolage-Grotesque.txt https://cdn.jsdelivr.net/npm/@fontsource-variable/bricolage-grotesque@5/LICENSE
curl -fsSL -o assets/fonts/jetbrains-mono-latin-400-normal.woff2 https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono@5/files/jetbrains-mono-latin-400-normal.woff2
curl -fsSL -o assets/fonts/OFL-JetBrains-Mono.txt https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono@5/LICENSE
ls -la assets/vendor/gsap assets/fonts
```

Esperado: 7 archivos nuevos. Los `.woff2` empiezan por los bytes `wOF2`; compruébalo con `head -c 4 assets/fonts/bricolage-grotesque-latin-wght-normal.woff2`.

- [ ] **Step 3: Excluir las pruebas de la web y cachear el vendor**

Añade al final de `.assetsignore`:

```
tests
tests/**
```

Añade a `_headers`, antes del bloque `/*`:

```
/assets/vendor/*
  Cache-Control: public, max-age=31536000, immutable
```

- [ ] **Step 4: Prueba de humo del ejecutor de pruebas**

`tests/smoke.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('GSAP y las fuentes están en el repo', () => {
  const gsap = readFileSync(new URL('../assets/vendor/gsap/gsap.min.js', import.meta.url), 'utf8');
  assert.match(gsap, /GreenSock|gsap/i);
  const font = readFileSync(new URL('../assets/fonts/bricolage-grotesque-latin-wght-normal.woff2', import.meta.url));
  assert.equal(font.subarray(0, 4).toString('latin1'), 'wOF2');
});
```

Run: `node --test tests/`
Esperado: `pass 1`, `fail 0`.

- [ ] **Step 5: Commit**

```bash
git add assets/vendor assets/fonts .assetsignore _headers tests/smoke.test.mjs
git commit -m "Rediseño: base con GSAP y fuentes alojadas, y pruebas con node --test"
```

---

### Task 2: Datos de sectores y estado del sector

**Files:**
- Create: `js/sectores.js`, `js/sector-state.js`
- Test: `tests/sectores.test.mjs`, `tests/sector-state.test.mjs`

**Interfaces:**
- Produces:
  - `js/sectores.js`:
    - `export const SECTORES` es un array de 6 objetos `Sector`, en este orden de `id`: `restaurante`, `clinica`, `estetica`, `tienda`, `academia`, `otro`.
    - `export const SECTOR_POR_DEFECTO = 'restaurante'`.
    - `export function sectorPorId(id)` devuelve un `Sector` o `undefined`.
  - Forma de `Sector`:
    `{ id, etiqueta, articulo, acento, web: { nombre, titular, boton }, productos: [{ nombre, precio }] (3 elementos, precio en céntimos o 0 = "Gratis"), panel: { titulo, unidad, citas: [{ hora, texto }] (4), libres: number }, flujos: [{ icono, desde, hasta }] (4), calculadora: { horas, tarifa } }`
  - `js/sector-state.js`:
    - `export function createSectorState({ storage, target, inicial })` devuelve `{ get(): string, set(id, source = 'usuario'): boolean, elegido(): boolean }`. Emite `CustomEvent('md:sector', { detail: { id, source } })` en `target`. `set` devuelve `false` si el id no existe.
    - `export const sectorState`: la instancia por defecto, con `window.sessionStorage` envuelto en try/catch y `document` como `target`.
    - Clave de almacenamiento: `'md-sector'`.

- [ ] **Step 1: Prueba de los datos**

`tests/sectores.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SECTORES, SECTOR_POR_DEFECTO, sectorPorId } from '../js/sectores.js';

test('hay 6 sectores con ids fijos y en orden', () => {
  assert.deepEqual(SECTORES.map((s) => s.id), ['restaurante', 'clinica', 'estetica', 'tienda', 'academia', 'otro']);
  assert.equal(sectorPorId(SECTOR_POR_DEFECTO).etiqueta, 'Restaurante');
  assert.equal(sectorPorId('nada'), undefined);
});

test('cada sector tiene todos sus datos completos', () => {
  for (const s of SECTORES) {
    assert.ok(s.etiqueta && s.articulo && /^#[0-9A-F]{6}$/i.test(s.acento), s.id);
    assert.ok(s.web.nombre && s.web.titular && s.web.boton, s.id);
    assert.equal(s.productos.length, 3, s.id);
    for (const p of s.productos) assert.ok(p.nombre && Number.isInteger(p.precio) && p.precio >= 0, s.id);
    assert.equal(s.panel.citas.length, 4, s.id);
    assert.ok(s.panel.titulo && s.panel.unidad && Number.isInteger(s.panel.libres), s.id);
    assert.equal(s.flujos.length, 4, s.id);
    for (const f of s.flujos) assert.ok(f.icono && f.desde && f.hasta, s.id);
    assert.ok(s.calculadora.horas >= 1 && s.calculadora.horas <= 40 && s.calculadora.tarifa >= 5 && s.calculadora.tarifa <= 100, s.id);
  }
});

test('los textos no usan tecnicismos prohibidos ni nombres de clientes reales', () => {
  const texto = JSON.stringify(SECTORES).toLowerCase();
  for (const palabra of ['api', 'n8n', 'zapier', 'make.com', ' ia ', 'luna y papel', 'infanapp']) assert.ok(!texto.includes(palabra), palabra);
});

test('el acento de cada sector tiene contraste AA con texto blanco', () => {
  const lum = (hex) => {
    const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  for (const s of SECTORES) assert.ok((1.05) / (lum(s.acento) + 0.05) >= 4.5, `${s.id} ${s.acento}`);
});
```

- [ ] **Step 2: Ejecutar y ver que falla**

Run: `node --test tests/sectores.test.mjs`
Esperado: FAIL con `Cannot find module '../js/sectores.js'`.

- [ ] **Step 3: Escribir `js/sectores.js`**

```js
// Datos de los sectores de la home "Taller en directo". Fuente única para el hero,
// la tienda, el panel, la automatización, la calculadora y el formulario.
// Los productos, precios y citas son EJEMPLOS (la interfaz los marca como tales).
// Precio en céntimos; 0 = "Gratis".
export const SECTOR_POR_DEFECTO = 'restaurante';

export const SECTORES = [
  {
    id: 'restaurante', etiqueta: 'Restaurante', articulo: 'un restaurante', acento: '#A4471F',
    web: { nombre: 'Tu restaurante', titular: 'Cocina de casa, mesa reservada.', boton: 'Reservar mesa' },
    productos: [{ nombre: 'Menú del día', precio: 1450 }, { nombre: 'Parrillada para dos', precio: 3200 }, { nombre: 'Tarta casera', precio: 450 }],
    panel: { titulo: 'Reservas de hoy', unidad: 'mesas', libres: 3, citas: [
      { hora: '13:30', texto: 'Mesa 4 · 2 personas' }, { hora: '14:00', texto: 'Mesa 7 · 4 personas' },
      { hora: '20:30', texto: 'Mesa 2 · 3 personas' }, { hora: '21:00', texto: 'Mesa 9 · 6 personas' }] },
    flujos: [
      { icono: 'cal', desde: 'Entra una reserva online', hasta: 'Confirmación y recordatorio para que no falle' },
      { icono: 'food', desde: 'Llega un pedido para llevar', hasta: 'Pasa a cocina ordenado y sin errores' },
      { icono: 'receipt', desde: 'Un proveedor envía su factura', hasta: 'Queda registrada y lista para la gestoría' },
      { icono: 'chart', desde: 'Cierras el día', hasta: 'Te llega al móvil el resumen de ventas' }],
    calculadora: { horas: 6, tarifa: 18 },
  },
  {
    id: 'clinica', etiqueta: 'Clínica', articulo: 'una clínica', acento: '#22688A',
    web: { nombre: 'Tu clínica', titular: 'Tu salud, en buenas manos.', boton: 'Pedir cita' },
    productos: [{ nombre: 'Valoración inicial', precio: 3000 }, { nombre: 'Sesión de fisioterapia', precio: 4000 }, { nombre: 'Bono de 5 sesiones', precio: 18000 }],
    panel: { titulo: 'Citas de hoy', unidad: 'huecos', libres: 2, citas: [
      { hora: '09:00', texto: 'Primera valoración' }, { hora: '10:30', texto: 'Sesión de seguimiento' },
      { hora: '12:00', texto: 'Revisión' }, { hora: '17:30', texto: 'Sesión de fisioterapia' }] },
    flujos: [
      { icono: 'cal', desde: 'Un paciente pide cita', hasta: 'Confirmación y recordatorio automáticos' },
      { icono: 'calx', desde: 'Alguien cancela a última hora', hasta: 'Se avisa a la lista de espera y el hueco se llena' },
      { icono: 'star', desde: 'Termina un tratamiento', hasta: 'Se le pide su opinión y se programa la revisión' },
      { icono: 'receipt', desde: 'Llega fin de mes', hasta: 'Las facturas se generan y se envían solas' }],
    calculadora: { horas: 5, tarifa: 25 },
  },
  {
    id: 'estetica', etiqueta: 'Peluquería y estética', articulo: 'una peluquería o centro de estética', acento: '#9A3B6B',
    web: { nombre: 'Tu salón', titular: 'Tu mejor versión, con cita en un minuto.', boton: 'Reservar cita' },
    productos: [{ nombre: 'Corte y peinado', precio: 2200 }, { nombre: 'Color', precio: 4500 }, { nombre: 'Manicura', precio: 1800 }],
    panel: { titulo: 'Citas de hoy', unidad: 'huecos', libres: 4, citas: [
      { hora: '10:00', texto: 'Corte y peinado' }, { hora: '11:15', texto: 'Color' },
      { hora: '16:30', texto: 'Manicura' }, { hora: '18:00', texto: 'Corte' }] },
    flujos: [
      { icono: 'cal', desde: 'Un cliente reserva', hasta: 'Recordatorio el día antes y menos citas perdidas' },
      { icono: 'clock', desde: 'Pasan 6 semanas desde su última visita', hasta: 'Se le invita a volver a reservar' },
      { icono: 'gift', desde: 'Es su cumpleaños', hasta: 'Le llega una felicitación con un detalle' },
      { icono: 'ticket', desde: 'Vendes un bono de sesiones', hasta: 'Las sesiones se descuentan y se avisa al acabar' }],
    calculadora: { horas: 4, tarifa: 18 },
  },
  {
    id: 'tienda', etiqueta: 'Tienda', articulo: 'una tienda', acento: '#8A5A12',
    web: { nombre: 'Tu tienda', titular: 'Lo que te gusta, a un clic.', boton: 'Ver productos' },
    productos: [{ nombre: 'Taza de cerámica', precio: 950 }, { nombre: 'Camiseta', precio: 1990 }, { nombre: 'Pack regalo', precio: 2900 }],
    panel: { titulo: 'Pedidos de hoy', unidad: 'envíos', libres: 5, citas: [
      { hora: '09:12', texto: 'Pedido · 2 productos' }, { hora: '11:40', texto: 'Pedido · 1 producto' },
      { hora: '13:05', texto: 'Pedido · 3 productos' }, { hora: '18:22', texto: 'Pedido · 1 producto' }] },
    flujos: [
      { icono: 'cart', desde: 'Vendes un producto online', hasta: 'El stock se actualiza en todos tus canales' },
      { icono: 'truck', desde: 'Envías un pedido', hasta: 'El cliente recibe el aviso con el seguimiento' },
      { icono: 'mail', desde: 'Alguien deja el carrito a medias', hasta: 'Le llega un recordatorio amable' },
      { icono: 'bell', desde: 'Queda poco stock', hasta: 'Te avisa para reponer a tiempo' }],
    calculadora: { horas: 6, tarifa: 20 },
  },
  {
    id: 'academia', etiqueta: 'Academia', articulo: 'una academia', acento: '#3F49A6',
    web: { nombre: 'Tu academia', titular: 'Aprende con quien sabe enseñar.', boton: 'Apuntarme' },
    productos: [{ nombre: 'Clase de prueba', precio: 0 }, { nombre: 'Matrícula', precio: 3000 }, { nombre: 'Mensualidad', precio: 7500 }],
    panel: { titulo: 'Clases de hoy', unidad: 'plazas', libres: 6, citas: [
      { hora: '16:00', texto: 'Inglés · nivel inicial' }, { hora: '17:00', texto: 'Refuerzo escolar' },
      { hora: '18:00', texto: 'Inglés · nivel medio' }, { hora: '19:30', texto: 'Preparación de examen' }] },
    flujos: [
      { icono: 'user', desde: 'Se apunta un alumno nuevo', hasta: 'Alta, bienvenida y cobro, todo en orden' },
      { icono: 'receipt', desde: 'Llega el recibo del mes', hasta: 'Se cobra y se avisa solo' },
      { icono: 'bell', desde: 'Un alumno falta a clase', hasta: 'Se avisa a la familia al momento' },
      { icono: 'doc', desde: 'Acaba el trimestre', hasta: 'Cada alumno recibe su informe' }],
    calculadora: { horas: 5, tarifa: 20 },
  },
  {
    id: 'otro', etiqueta: 'Otro', articulo: 'un negocio', acento: '#1F2937',
    web: { nombre: 'Tu negocio', titular: 'Tu negocio, por fin en internet.', boton: 'Contactar' },
    productos: [{ nombre: 'Servicio básico', precio: 5000 }, { nombre: 'Servicio completo', precio: 12000 }, { nombre: 'Bono mensual', precio: 9000 }],
    panel: { titulo: 'Agenda de hoy', unidad: 'huecos', libres: 3, citas: [
      { hora: '09:30', texto: 'Reunión con cliente' }, { hora: '11:00', texto: 'Presupuesto pendiente' },
      { hora: '16:00', texto: 'Entrega de trabajo' }, { hora: '17:30', texto: 'Llamada de seguimiento' }] },
    flujos: [
      { icono: 'cal', desde: 'Un cliente reserva', hasta: 'Confirmación y recordatorio automáticos' },
      { icono: 'box', desde: 'Entra un pedido', hasta: 'Se registra y se avisa automáticamente' },
      { icono: 'doc', desde: 'Recibes un formulario', hasta: 'Los datos llegan ordenados y empieza el seguimiento' },
      { icono: 'chart', desde: 'Haces el mismo informe cada semana', hasta: 'Se genera y se envía solo' }],
    calculadora: { horas: 5, tarifa: 20 },
  },
];

export const sectorPorId = (id) => SECTORES.find((s) => s.id === id);

export const formatearPrecio = (centimos) =>
  centimos === 0 ? 'Gratis' : new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(centimos / 100);
```

- [ ] **Step 4: Ejecutar y ver que pasa**

Run: `node --test tests/sectores.test.mjs`
Esperado: `pass 4`. Si el test de contraste falla en un sector, oscurece su `acento` hasta que pase (no bajes el umbral).

- [ ] **Step 5: Prueba del estado [RF 4]**

`tests/sector-state.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSectorState } from '../js/sector-state.js';

const memoria = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)) }; };
const rota = { getItem() { throw new Error('bloqueado'); }, setItem() { throw new Error('bloqueado'); } };

test('empieza en el inicial y emite al cambiar', () => {
  const target = new EventTarget();
  const eventos = [];
  target.addEventListener('md:sector', (e) => eventos.push(e.detail));
  const st = createSectorState({ storage: memoria(), target, inicial: 'restaurante' });
  assert.equal(st.get(), 'restaurante');
  assert.equal(st.elegido(), false);
  assert.equal(st.set('clinica'), true);
  assert.equal(st.get(), 'clinica');
  assert.equal(st.elegido(), true);
  assert.deepEqual(eventos, [{ id: 'clinica', source: 'usuario' }]);
});

test('rechaza ids desconocidos sin emitir', () => {
  const target = new EventTarget();
  let n = 0;
  target.addEventListener('md:sector', () => n++);
  const st = createSectorState({ storage: memoria(), target, inicial: 'restaurante' });
  assert.equal(st.set('banco'), false);
  assert.equal(st.get(), 'restaurante');
  assert.equal(n, 0);
});

test('recuerda la elección entre instancias', () => {
  const storage = memoria();
  createSectorState({ storage, target: new EventTarget(), inicial: 'restaurante' }).set('academia');
  const st2 = createSectorState({ storage, target: new EventTarget(), inicial: 'restaurante' });
  assert.equal(st2.get(), 'academia');
  assert.equal(st2.elegido(), true);
});

test('[RF 4] funciona aunque sessionStorage esté bloqueado', () => {
  const st = createSectorState({ storage: rota, target: new EventTarget(), inicial: 'restaurante' });
  assert.equal(st.get(), 'restaurante');
  assert.equal(st.set('tienda'), true);
  assert.equal(st.get(), 'tienda');
});

test('el origen "auto" (autorrecorrido) no cuenta como elección del usuario', () => {
  const st = createSectorState({ storage: memoria(), target: new EventTarget(), inicial: 'restaurante' });
  st.set('clinica', 'auto');
  assert.equal(st.elegido(), false);
});
```

Run: `node --test tests/sector-state.test.mjs`
Esperado: FAIL, el módulo no existe.

- [ ] **Step 6: Escribir `js/sector-state.js`**

```js
// Estado del sector elegido en la home. Emite 'md:sector' en `target` al cambiar.
// sessionStorage puede estar bloqueado (navegación privada): entonces solo se pierde el recuerdo.
import { SECTOR_POR_DEFECTO, sectorPorId } from './sectores.js';

const CLAVE = 'md-sector';

const leer = (storage) => { try { return storage?.getItem(CLAVE) ?? null; } catch { return null; } };
const guardar = (storage, id) => { try { storage?.setItem(CLAVE, id); } catch { /* sin recuerdo */ } };

export function createSectorState({ storage, target, inicial = SECTOR_POR_DEFECTO }) {
  const recordado = leer(storage);
  let actual = sectorPorId(recordado) ? recordado : inicial;
  let porUsuario = Boolean(sectorPorId(recordado));

  return {
    get: () => actual,
    elegido: () => porUsuario,
    set(id, source = 'usuario') {
      if (!sectorPorId(id)) return false;
      if (source === 'usuario') { porUsuario = true; guardar(storage, id); }
      if (id === actual) return true;
      actual = id;
      target.dispatchEvent(new CustomEvent('md:sector', { detail: { id, source } }));
      return true;
    },
  };
}

const storageSeguro = (() => { try { return window.sessionStorage; } catch { return null; } })();
export const sectorState = typeof document === 'undefined'
  ? null
  : createSectorState({ storage: storageSeguro, target: document });
```

Nota: en el primer test, `set('clinica')` cambia de `restaurante` a `clinica` y emite. Un `set` al mismo id no emite, pero sí marca la elección del usuario.

- [ ] **Step 7: Ejecutar todas las pruebas**

Run: `node --test tests/`
Esperado: todas pasan (smoke, sectores y sector-state).

- [ ] **Step 8: Commit**

```bash
git add js/sectores.js js/sector-state.js tests/sectores.test.mjs tests/sector-state.test.mjs
git commit -m "Rediseño: datos de los 6 sectores y estado del sector elegido"
```

---

### Task 3: Calculadora pura

**Files:**
- Create: `js/calculadora.js`
- Test: `tests/calculadora.test.mjs`

**Interfaces:**
- Produces:
  - `export const AUTOMATABLE = 0.5`
  - `export const PRICE_FROM = 490`
  - `export function calcularAhorro(horasSemana, tarifaHora)`, que devuelve `{ horasMes: number, eurosAno: number, meses: number, caso: 'menos-de-un-mes' | 'meses' | 'no-compensa' }`, con números sin redondear, salvo `meses`, que es `Math.ceil`.
  - `export function textoAmortizacion(resultado)`, que devuelve la frase exacta que se muestra ahora en la home.

- [ ] **Step 1: Prueba**

`tests/calculadora.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularAhorro, textoAmortizacion, PRICE_FROM } from '../js/calculadora.js';

test('valores por defecto: 5 h a 20 € → ~11 h/mes y 2.600 €/año, unos 3 meses', () => {
  const r = calcularAhorro(5, 20);
  assert.equal(Math.round(r.horasMes), 11);
  assert.equal(Math.round(r.eurosAno), 2600);
  assert.equal(r.caso, 'meses');
  assert.equal(r.meses, 3);
  assert.equal(textoAmortizacion(r), `Una automatización desde ${PRICE_FROM} € + IVA se amortizaría en unos 3 meses.`);
});

test('mucho tiempo → menos de un mes', () => {
  const r = calcularAhorro(40, 100);
  assert.equal(r.caso, 'menos-de-un-mes');
  assert.equal(textoAmortizacion(r), `Una automatización desde ${PRICE_FROM} € + IVA se amortizaría en menos de un mes.`);
});

test('poco tiempo → no compensa (más de 24 meses)', () => {
  const r = calcularAhorro(1, 5);
  assert.equal(r.caso, 'no-compensa');
  assert.equal(textoAmortizacion(r), 'Con tan poco tiempo quizá no compense automatizar. En el diagnóstico te lo diremos con sinceridad.');
});
```

Run: `node --test tests/calculadora.test.mjs` → FAIL (no existe el módulo).

- [ ] **Step 2: Implementar** `js/calculadora.js`, con la misma fórmula y textos que el `main.js` actual:

```js
// Ahorro estimado de automatizar: se supone que se automatiza la mitad del tiempo.
// Si cambia el precio de la automatización, cambiar PRICE_FROM (y la web).
export const AUTOMATABLE = 0.5;
export const PRICE_FROM = 490;
const SEMANAS_MES = 52 / 12;

export function calcularAhorro(horasSemana, tarifaHora) {
  const horasMes = horasSemana * AUTOMATABLE * SEMANAS_MES;
  const eurosMes = horasMes * tarifaHora;
  const mesesExactos = PRICE_FROM / eurosMes;
  const caso = mesesExactos < 1 ? 'menos-de-un-mes' : mesesExactos <= 24 ? 'meses' : 'no-compensa';
  return { horasMes, eurosAno: eurosMes * 12, meses: Math.ceil(mesesExactos), caso };
}

export function textoAmortizacion({ caso, meses }) {
  if (caso === 'menos-de-un-mes') return `Una automatización desde ${PRICE_FROM} € + IVA se amortizaría en menos de un mes.`;
  if (caso === 'meses') return `Una automatización desde ${PRICE_FROM} € + IVA se amortizaría en unos ${meses} meses.`;
  return 'Con tan poco tiempo quizá no compense automatizar. En el diagnóstico te lo diremos con sinceridad.';
}
```

- [ ] **Step 3: Ejecutar**: `node --test tests/` → todas pasan.

- [ ] **Step 4: Commit**

```bash
git add js/calculadora.js tests/calculadora.test.mjs
git commit -m "Rediseño: cálculo de la calculadora como función pura con pruebas"
```

---

### Task 4: Worker: campo opcional `sector`

**Files:**
- Modify: `worker/index.js` (bloque de validación y construcción del email)
- Test: `tests/worker.test.mjs`

**Interfaces:**
- Consumes: `SECTORES`, `sectorPorId` de `js/sectores.js`.
- Produces: el `POST /api/contacto` acepta `sector` (id). Si es válido, el email incluye la línea `Sector: <etiqueta>` tras `Servicio:`. Si no viene o no es válido, se ignora sin error.

- [ ] **Step 1: Prueba** (basada en el script de pruebas manual que ya se usó, ahora con `node:test`)

`tests/worker.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.js';

const B = { nombre: 'Ana', email: 'ana@example.com', elapsed: 5000 };
const envio = async (data, origin = 'http://l') => {
  const sent = [];
  const env = { CONTACT_TO: 'destino@example.com', EMAIL: { send: async (m) => sent.push(m) }, ASSETS: { fetch: () => new Response('asset') } };
  const res = await worker.fetch(new Request('http://l/api/contacto', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify(data) }), env);
  return { status: res.status, sent };
};

test('sector válido aparece en el email', async () => {
  const { status, sent } = await envio({ ...B, servicio: 'Web o landing', mensaje: 'Hola', sector: 'clinica' });
  assert.equal(status, 200);
  assert.match(sent[0].text, /Servicio: Web o landing\nSector: Clínica/);
});

test('sector desconocido o ausente se ignora', async () => {
  for (const sector of ['banco', undefined, 42]) {
    const { status, sent } = await envio({ ...B, servicio: 'Web o landing', mensaje: 'Hola', sector });
    assert.equal(status, 200);
    assert.doesNotMatch(sent[0].text, /Sector:/);
  }
});

test('se mantienen las reglas actuales', async () => {
  assert.equal((await envio({ ...B, servicio: 'Revisión gratis de mi web', web: 'minegocio.es' })).status, 200);
  assert.equal((await envio({ ...B, servicio: 'Revisión gratis de mi web' })).status, 400);
  assert.equal((await envio({ ...B, servicio: 'Tienda online' })).status, 400);
  assert.equal((await envio({ ...B, servicio: 'Tienda online', mensaje: 'x', website: 'spam' })).sent.length, 0);
  assert.equal((await envio({ ...B, servicio: 'Tienda online', mensaje: 'x' }, 'https://evil.com')).status, 403);
});
```

Run: `node --test tests/worker.test.mjs`
Esperado: FAIL en "sector válido…" (no hay línea `Sector:`); las demás pasan.

- [ ] **Step 2: Implementar en `worker/index.js`**

1. Al principio del archivo, tras los comentarios:

```js
import { sectorPorId } from '../js/sectores.js';
```

2. Junto a `const tieneWeb = …`:

```js
  const sector = typeof data.sector === 'string' ? sectorPorId(data.sector) : undefined;
```

3. Sustituye la línea `const extra = [...]` por:

```js
  const extra = [sector && `Sector: ${sector.etiqueta}`, tieneWeb && `¿Tiene web?: ${tieneWeb}`, web && `Web: ${web}`].filter(Boolean);
```

(El texto ya monta `Servicio:` y luego `...extra`, así que la línea `Sector:` queda justo tras `Servicio:`.)

- [ ] **Step 3: Ejecutar**: `node --test tests/` → todas pasan.

- [ ] **Step 4: Comprobar que wrangler empaqueta la importación**

Run: `npx wrangler deploy --dry-run --outdir "$TEMP/md-dry" 2>&1 | tail -5`
Esperado: termina sin errores (no despliega nada).

- [ ] **Step 5: Commit**

```bash
git add worker/index.js tests/worker.test.mjs
git commit -m "Worker: acepta el sector elegido (opcional) y lo añade al email"
```

---

### Task 5: HTML de la home (contenido completo, sin JS) + estructura de `taller.css`

**Files:**
- Rewrite: `index.html` (todo `<body>`; `<head>` se conserva, con los cambios del Step 1)
- Create: `taller.css`

**Interfaces:**
- Produces: IDs, clases y atributos `data-*` que usan las Tasks 6–11:
  - **Cabecera:** `header#top.md-head`, `a.md-head-cta`, `div.md-head-progress > span`, `button.md-burger`, `nav#menu-movil.md-mnav`.
  - **Escena 01:** `section#inicio.esc-hero`, `h1.hero-title` (dos `span.hero-line`, el segundo con `span.hero-mark`), `div.hero-picker[role=radiogroup]` con `button[data-sector][role=radio][aria-checked]` (6), `p.hero-offer`, `div.demo-window#demo` (contenedor del montaje) con `div.demo-site[data-sector]`, `p.demo-live[aria-live=polite].sr-only`.
  - **Escena 02:** `section#garantias.esc-ficha` con `dl.ficha` (4 × `div.ficha-row` con `dt`, `dd.ficha-val`, `dd.ficha-note`).
  - **Escenas 03–05:** `section#servicios.esc-servicios` con `div.serv-pin` > `div.serv-copy` (3 × `article.serv-step[data-step=web|tienda|app]`) y `div.serv-stage` > `div.serv-mock[data-mode=web]` (contiene `div.mock-web`, `div.mock-shop`, `div.mock-app`), `ol.serv-index`; tienda: `ul.shop-grid` con `button.shop-add[data-i]`, `span.cart-count`, `span.cart-total`, `button.shop-pay`; app: `ul.app-list`, `button.app-slot[data-i]`, `span.app-libres`; `p.serv-live[aria-live=polite].sr-only`.
  - **Escena 06:** `section#automatizacion.esc-noche` con `div.noche-pin` > `ol.noche-tasks` (4 × `li.task` con `span.task-from`, `span.task-to`), `div.noche-picker` (6 `button[data-sector]`), `div.noche-line`, `div#calculadora.calc` (mismos `data-calc`/`data-out` que ahora: `data-calc="horas|tarifa"`, `data-out="horas|euros|amortiza|anuncio"`, `a[data-calc-cta][data-servicio="Automatización de procesos"]`).
  - **Escena 07:** `section#proyectos.esc-vitrina` con `div.vitrina-track` (4 × `article.vitrina-panel`; el último, `.vitrina-tuyo`) y `div.vitrina-nav` (`button[data-dir=prev|next]`).
  - **Escena 08:** `section#planes.esc-planes` (`div.plan-web`, `div.plan-medida`, `div.dias` con `div.dias-bar > span` y 4 `li.dia`), `section#revision.esc-revision` (`span.rev-url`, `ul.rev-list`), `section#faq.esc-faq` (8 `details`), `section#contacto.esc-contacto` con **el formulario actual sin cambios de `name`, `data-*` ni IDs** (`form#contact-form.md-steps…`), más `p.form-sector[hidden]` > `strong[data-sector-label]` en el paso 2 e `input[type=hidden][name=sector]`.
  - **Pie:** `footer.md-foot` (contenido actual: marca, descriptor, Instagram, navegación, legales, fila `.md-foot-guides`).
  - **Barra fija del móvil y WhatsApp flotante:** el marcado actual (`.md-mbar`, `.md-wa-float`).

- [ ] **Step 1: `<head>`** Conserva íntegro el actual (title, metas, OG, iconos, JSON-LD) y cambia solo los recursos:

```html
<link rel="preload" href="assets/fonts/bricolage-grotesque-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/poppins-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="taller.css">
```

(Se deja de cargar `styles.css` en la home. Las guías, legales y 404 lo siguen usando.)

- [ ] **Step 2: Escribir el `<body>`** con las 8 escenas, en este orden: cabecera, 01 hero, 02 ficha, 03–05 servicios, 06 noche, 07 vitrina, 08 planes, revisión, FAQ, contacto y pie. Reglas:
  - Cada escena es un `<section>` con un `<h2>` (salvo el hero, que tiene el único `<h1>`). Las anotaciones de taller son `<span class="note" aria-hidden="true">` con texto mono, por ejemplo `01 / web`.
  - **Textos:** copia literal del `index.html` actual (garantías, servicios, flujos "General" y "Restaurante", calculadora, proyectos, plan web con sus 9 características, "A medida", 7 días, revisión, las 8 preguntas de la FAQ idénticas al JSON-LD, contacto y aviso legal del formulario). Textos nuevos permitidos, solo estos:
    - "Elige tu negocio";
    - "Web de ejemplo";
    - "Ejemplo" (etiqueta en los productos, precios y citas de demo);
    - "// especificaciones";
    - "Lo que pasa cuando no miras.";
    - "Tu proyecto, aquí";
    - "Hablemos de tu proyecto" (CTA principal);
    - "Quiero mi tienda";
    - "Para:" (sector en el formulario).
  - **Controles que solo funcionan con JavaScript** llevan además la clase `solo-js`: `.hero-picker`, `.noche-picker`, `button.shop-add`, `button.shop-pay`, `button.app-slot` y `.vitrina-nav`. Así, sin JS no aparecen botones que no hacen nada.
  - **La web de ejemplo** del hero, la tienda y el panel van en HTML con los datos de `restaurante` (copiados de `js/sectores.js`), de modo que sin JS se ven completos.
  - **Los flujos de la escena 06** van en HTML con los de `restaurante`. Debajo, como enlace de texto, "Más ejemplos por sector en nuestra guía de automatización" → `/automatizacion-de-procesos`.
  - **Proyectos:** usa `<img>` reales (`assets/proyectos/*.webp`) con `width`, `height`, `alt` descriptivo y `loading="lazy"`.
  - **CTA con `data-servicio`:**
    - hero "Hablemos de tu proyecto" → sin `data-servicio`;
    - "Quiero mi web" → `Web o landing`;
    - "Quiero mi tienda" → `Tienda online`;
    - "Cuéntanos tu idea" (apps) → `App o plataforma`;
    - "Quiero mi diagnóstico gratis" → `Automatización de procesos`;
    - "Quiero la revisión gratis" → `Revisión gratis de mi web`;
    - "Tu proyecto, aquí" → sin `data-servicio`.
  - **Al final del `<body>`, en este orden:**

```html
<script src="site.js" defer></script>
<script src="assets/vendor/gsap/gsap.min.js" defer></script>
<script src="assets/vendor/gsap/ScrollTrigger.min.js" defer></script>
<script type="module" src="main.js"></script>
<script type="module" src="js/hero-build.js"></script>
<script type="module" src="js/escena-servicios.js"></script>
<script type="module" src="js/escena-automatizacion.js"></script>
<script type="module" src="js/vitrina.js"></script>
<script type="module" src="js/interacciones.js"></script>
<!-- Cloudflare Web Analytics: visitas agregadas, sin cookies (ver privacidad.html) -->
<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "86ba551e367d48e094c48d4ac87cbf4f"}'></script>
```

- [ ] **Step 3: `taller.css`, primera versión** (tokens, base, retícula, tipografía, componentes, estructura de cada escena en su **estado final**, sin animación). Bloques obligatorios:

```css
@font-face{font-family:"Bricolage Grotesque";font-style:normal;font-weight:200 800;font-display:swap;src:url("assets/fonts/bricolage-grotesque-latin-wght-normal.woff2") format("woff2")}
@font-face{font-family:"JetBrains Mono";font-style:normal;font-weight:400;font-display:swap;src:url("assets/fonts/jetbrains-mono-latin-400-normal.woff2") format("woff2")}
/* Poppins 400/500/600: mismas @font-face que styles.css */
@font-face{font-family:"Bricolage Fallback";src:local("Arial");size-adjust:96%;ascent-override:92%;descent-override:24%;line-gap-override:0%}
:root{
  --papel:#F8FAFB;--tinta:#1F2937;--tinta-2:#4B5563;--menta:#6EC6B4;--menta-d:#2E8574;--menta-s:#E3F4F0;
  --lav:#BDAEE1;--lav-d:#6F5BBF;--lav-s:#EFEBF9;--noche:#0F161F;--noche-2:#172231;--linea:#E3E7EC;
  --f-tit:"Bricolage Grotesque","Bricolage Fallback",system-ui,sans-serif;--f-txt:"Poppins",system-ui,sans-serif;--f-mono:"JetBrains Mono",ui-monospace,monospace;
  --wrap:1280px;--gutter:clamp(16px,4vw,48px);--r:18px;
  --muelle:cubic-bezier(.34,1.56,.64,1);--suave:cubic-bezier(.22,1,.36,1);
}
*{box-sizing:border-box}html{scroll-padding-top:84px}
body{margin:0;background:var(--papel);color:var(--tinta);font:400 17px/1.6 var(--f-txt);-webkit-font-smoothing:antialiased}
.wrap{max-width:var(--wrap);margin:0 auto;padding:0 var(--gutter)}
.reticula{background-image:linear-gradient(rgba(111,91,191,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(111,91,191,.07) 1px,transparent 1px);background-size:24px 24px}
.note{font:400 11px/1.4 var(--f-mono);letter-spacing:.02em;color:var(--lav-d)}
.tit{font-family:var(--f-tit);font-weight:800;letter-spacing:-.04em;line-height:.92}
.hero-title{font-family:var(--f-tit);font-weight:800;font-size:clamp(56px,11vw,168px);letter-spacing:-.045em;line-height:.88;margin:0}
.hero-mark{background:var(--menta);border-radius:.12em;padding:0 .06em;box-decoration-break:clone;-webkit-box-decoration-break:clone}
.btn{display:inline-flex;align-items:center;gap:10px;min-height:52px;padding:0 24px;border-radius:999px;background:var(--tinta);color:#fff;font:600 16px var(--f-txt);text-decoration:none;border:0;cursor:pointer;box-shadow:0 6px 0 var(--menta);transition:transform .25s var(--muelle),box-shadow .25s var(--muelle)}
.btn:hover{transform:translateY(-2px);box-shadow:0 8px 0 var(--menta)}
.btn:active{transform:translateY(5px);box-shadow:0 1px 0 var(--menta)}
.btn-2{display:inline-flex;align-items:center;gap:10px;min-height:52px;padding:0 22px;border-radius:999px;border:1.5px solid var(--tinta);color:var(--tinta);background:transparent;font:600 16px var(--f-txt);text-decoration:none}
:focus-visible{outline:3px solid var(--lav-d);outline-offset:3px}
.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
html:not(.js) .solo-js{display:none !important}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms !important;transition-duration:.01ms !important;scroll-behavior:auto !important}}
```

Después, estilos por escena según la sección 6 de la especificación (escritorio, tablet ≤ 1023 y móvil ≤ 767), siempre en su estado final. La animación llega en las Tasks 7–11.
  - **01:** rejilla de 2 columnas que pasa a 1 en ≤ 1023; el selector se convierte en fila desplazable en móvil.
  - **02:** filas de la ficha.
  - **03–05:** sin fijar, como 3 bloques apilados (el estado móvil y RM). La versión fijada se activa en la Task 8 con la clase `.is-pinned` en `.esc-servicios`.
  - **06:** fondo noche.
  - **07:** `.vitrina-track{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;gap:24px}` y cada panel con `scroll-snap-align:start;flex:0 0 min(84vw,880px)`.
  - **08:** planes, barra de días llena, revisión, FAQ en 2 columnas en ≥ 1024, y contacto con el formulario: copia y adapta las reglas `.md-steps`, `.md-choice`, `.md-field`, `.md-form-status`, `.md-hp` y `.md-yesno` de `styles.css` a los tokens nuevos.
  - **Cabecera, pie, `.md-mbar`, `.md-mnav` y `.md-burger`:** copia de `styles.css` adaptada a los tokens nuevos.

- [ ] **Step 4: Verificación sin JS y con contenido completo**

Arranca **un único** servidor (antes, comprueba que no queda ninguno: `netstat -ano | grep ":8787 " | grep LISTEN` debe salir vacío):

```bash
npx wrangler dev --port 8787 --ip 127.0.0.1 --persist-to "$TEMP/md-wrangler-state"
```

Como el contenido sin JavaScript es el propio HTML, compruébalo con `curl -s http://127.0.0.1:8787/ > "$TEMP/home.html"` y un script de Node que lea ese archivo y verifique que aparecen:
- el H1 exacto;
- `349 €`, `490 €`, `15 €`, `29 €`;
- `7 días laborables`;
- las 8 `<summary>`;
- los 4 flujos de restaurante;
- las 3 imágenes de proyectos;
- `id="contact-form"`;
- el JSON-LD válido (`JSON.parse` sin error);
- el token de la analítica.

Después, capturas a 1440, 834 y 360 px: nada se sale del ancho (`document.documentElement.scrollWidth === innerWidth`).

- [ ] **Step 5: Commit**

```bash
git add index.html taller.css
git commit -m "Rediseño: HTML completo de las 8 escenas y estilos base del taller (sin animación)"
```

---

### Task 6: `main.js` como módulo: formulario, calculadora y sector

**Files:**
- Modify: `main.js`, `site.js`

**Interfaces:**
- Consumes: `sectorState` y `SECTORES` (Task 2), `calcularAhorro` y `textoAmortizacion` (Task 3), `waUrl`, `WHATSAPP_NUMBER` y `CONTACT_EMAIL` (globales de `site.js`).
- Produces: el formulario con `input[name=sector]` sincronizado y `p.form-sector` visible tras elegir. La calculadora (`#calculadora`) escucha `md:sector` para aplicar `sector.calculadora` mientras el usuario no haya tocado los valores. `main.js` no exporta nada.

- [ ] **Step 1: `site.js`**: primera línea ejecutable del archivo:

```js
document.documentElement.classList.add('js');
```

- [ ] **Step 2: `main.js`** convertido en módulo:
  - **Al inicio:**

```js
import { sectorState } from './js/sector-state.js';
import { sectorPorId } from './js/sectores.js';
import { calcularAhorro, textoAmortizacion } from './js/calculadora.js';
```

  - **Calculadora:** sustituye las constantes `AUTOMATABLE` y `PRICE_FROM` y la fórmula internas por `calcularAhorro`/`textoAmortizacion`. Mantén los selectores `data-calc`/`data-out`, el anuncio con retardo de 700 ms y el CTA que rellena el mensaje sin pisar. Añade:

```js
let calcTocada = false;
// en el listener 'input' de cada campo: calcTocada = true;
document.addEventListener('md:sector', ({ detail }) => {
  if (calcTocada) return;
  const { horas, tarifa } = sectorPorId(detail.id).calculadora;
  values.horas = horas; values.tarifa = tarifa;
  fields.horas.forEach((i) => { i.value = horas; });
  fields.tarifa.forEach((i) => { i.value = tarifa; });
  render();
});
```

  - **Formulario: integración del sector**, tras `goTo(1, false)`:

```js
const campoSector = form.querySelector('input[name="sector"]');
const avisoSector = form.querySelector('.form-sector');
const aplicarSector = (id) => {
  const s = sectorPorId(id);
  campoSector.value = s && sectorState.elegido() ? id : '';
  avisoSector.hidden = !campoSector.value;
  if (campoSector.value) avisoSector.querySelector('[data-sector-label]').textContent = s.etiqueta;
};
aplicarSector(sectorState.get());
document.addEventListener('md:sector', ({ detail }) => aplicarSector(detail.id));
```

    En `goTo(2)`, si el mensaje está vacío (o es el último prefijo puesto por el sector) y hay un sector elegido, rellénalo con `Tengo ${s.articulo}. ` usando el mismo patrón `prefill` que la calculadora.
  - **No tocar:** `?servicio=`, `data-servicio`, la validación, el envío, `fallbackLinks` y los mensajes de estado.

- [ ] **Step 3: Verificar en el navegador** (servidor de la Task 5 en marcha)

Ejecuta en la consola de la página, con `javascript_tool`, y espera `true` en cada línea:

```js
(async () => {
  const f = document.getElementById('contact-form');
  const { sectorState } = await import('/js/sector-state.js');
  const r = [];
  sectorState.set('clinica');
  r.push(f.querySelector('input[name=sector]').value === 'clinica');
  r.push(!f.querySelector('.form-sector').hidden);
  document.querySelector('a[data-servicio="Web o landing"]').click();
  r.push(f.querySelector('[data-step-num]').textContent === '2');
  r.push(f.elements.mensaje.value.startsWith('Tengo una clínica'));
  r.push(document.querySelector('[data-out=horas]').textContent.trim().length > 0);
  return r.join(',');
})()
```

Esperado: `true,true,true,true,true`.

**[RF 5]** Abre `http://127.0.0.1:8787/?servicio=Tienda%20online#contacto`: el formulario está en el paso 2 con "Tienda online", y `window.scrollY` está dentro de `#contacto` (`document.getElementById('contacto').getBoundingClientRect().top < innerHeight`).

Envío simulado completo (un servicio de cada tipo, incluida la revisión). El último `.wrangler/tmp/email/*/email-text/*.txt` contiene `Sector: Clínica`.

- [ ] **Step 4: Commit**

```bash
git add main.js site.js
git commit -m "Rediseño: main.js como módulo; formulario y calculadora integrados con el sector"
```

---

### Task 7: Utilidades de movimiento + hero que se construye

**Files:**
- Create: `js/movimiento.js`, `js/hero-build.js`
- Modify: `taller.css` (estados de montaje del hero)

**Interfaces:**
- Produces:
  - `js/movimiento.js`:
    - `export const reduce`: un `MediaQueryList` de `(prefers-reduced-motion: reduce)`;
    - `export const esEscritorio = () => matchMedia('(min-width: 1024px)').matches`;
    - `export const gsapListo()`, que devuelve `{ gsap, ScrollTrigger } | null` (null si no han cargado; registra el plugin una sola vez);
    - `export function escenas(config)`: envuelve `gsap.matchMedia()` con las claves `escritorio: '(min-width: 1024px) and (prefers-reduced-motion: no-preference)'` y `movil: '(max-width: 1023px) and (prefers-reduced-motion: no-preference)'`, y llama a `config.escritorio?.()` y `config.movil?.()`. Devuelve el `matchMedia` de GSAP o `null`.
  - `js/hero-build.js`:
    - `export function pintarSitio(contenedor, sector)`: escribe los textos y el color en `.demo-site` (sin animación). También lo usa la Task 8 para la maqueta de servicios.

- [ ] **Step 1: `js/movimiento.js`**

```js
// Utilidades comunes de animación. Con "reducir movimiento" o sin GSAP, las escenas
// se quedan en su estado final (el que pinta taller.css).
export const reduce = matchMedia('(prefers-reduced-motion: reduce)');
export const esEscritorio = () => matchMedia('(min-width: 1024px)').matches;

let registrado = false;
export function gsapListo() {
  const { gsap, ScrollTrigger } = window;
  if (!gsap || !ScrollTrigger) return null;
  if (!registrado) { gsap.registerPlugin(ScrollTrigger); registrado = true; }
  return { gsap, ScrollTrigger };
}

export function escenas(config) {
  const g = gsapListo();
  if (!g) return null;
  const mm = g.gsap.matchMedia();
  mm.add({
    escritorio: '(min-width: 1024px) and (prefers-reduced-motion: no-preference)',
    movil: '(max-width: 1023px) and (prefers-reduced-motion: no-preference)',
  }, (ctx) => {
    if (ctx.conditions.escritorio) return config.escritorio?.(ctx);
    if (ctx.conditions.movil) return config.movil?.(ctx);
  });
  return mm;
}
```

- [ ] **Step 2: `js/hero-build.js`** (selector, montaje y autorrecorrido). Requisitos que el código debe cumplir:
  - `pintarSitio(contenedor, sector)` pone `contenedor.dataset.sector = sector.id`, la variable CSS `--acento` = `sector.acento`, y los textos `[data-f=nombre]`, `[data-f=titular]` y `[data-f=boton]`.
  - **Selector:** `button[data-sector]` dentro de `.hero-picker`, con `role="radio"` y `aria-checked`, flechas izquierda/derecha y arriba/abajo con *roving tabindex*. Al elegir → `sectorState.set(id)`. También escucha `md:sector` para marcar el botón activo si cambia desde otra escena.
  - **Montaje** al recibir `md:sector`:
    - si no hay GSAP o RM está activo: `pintarSitio` directamente;
    - si no, una línea de tiempo: los bloques `.demo-block` salen (`yPercent: 20, opacity: 0, stagger .04, duración .25`) → `pintarSitio` → los bloques vuelven a entrar con `ease: 'back.out(1.6)'` y `stagger .06`, y las anotaciones `.demo-note` se escriben.
    - **[RF 1]** guarda la línea de tiempo en curso y, si llega otro sector, hace `tl.progress(1).kill()` antes de crear la nueva, para que nunca convivan dos.
  - **Entrada inicial:** solo con GSAP y sin RM. Las palabras del H1 suben desde una máscara (`.hero-line > span`, `yPercent: 110 → 0`, `stagger .08`), **sin tocar `opacity`**; el subrayado `.hero-mark` se escala desde la izquierda (`scaleX: 0 → 1`, `transform-origin: left`); el selector aparece; y el sitio se monta como en un cambio de sector.
  - **Autorrecorrido:** si `!sectorState.elegido()`, cada 4 s `sectorState.set(siguiente, 'auto')`. Se pausa con `pointerenter`/`focusin` en `#demo` y en `.hero-picker`, y se reanuda al salir. Se detiene del todo con el primer clic o tecla en el selector, con RM o cuando la pestaña está oculta (`document.hidden`).
  - **Anuncio:** `.demo-live.textContent = 'Web de ejemplo para ' + sector.etiqueta.toLowerCase()`, solo cuando `source === 'usuario'`, para que el autorrecorrido no hable cada 4 s.

Código de referencia (completar el montaje según los requisitos anteriores):

```js
import { SECTORES, sectorPorId } from './sectores.js';
import { sectorState } from './sector-state.js';
import { reduce, gsapListo } from './movimiento.js';

const demo = document.getElementById('demo');
const sitio = demo?.querySelector('.demo-site');
const picker = document.querySelector('.hero-picker');
const live = document.querySelector('.demo-live');

export function pintarSitio(contenedor, sector) {
  contenedor.dataset.sector = sector.id;
  contenedor.style.setProperty('--acento', sector.acento);
  for (const campo of ['nombre', 'titular', 'boton']) {
    contenedor.querySelectorAll(`[data-f="${campo}"]`).forEach((el) => { el.textContent = sector.web[campo]; });
  }
}

let tlActual = null;
function montar(sector) {
  const g = gsapListo();
  if (!g || reduce.matches || !sitio) { if (sitio) pintarSitio(sitio, sector); return; }
  if (tlActual) tlActual.progress(1).kill(); // [RF 1]
  const bloques = sitio.querySelectorAll('.demo-block');
  tlActual = g.gsap.timeline({ onComplete: () => { tlActual = null; } })
    .to(bloques, { yPercent: 20, opacity: 0, duration: 0.25, stagger: 0.04, ease: 'power2.in' })
    .add(() => pintarSitio(sitio, sector))
    .fromTo(bloques, { yPercent: -10, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: 'back.out(1.6)' })
    .fromTo(sitio.querySelectorAll('.demo-note'), { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.4, stagger: 0.08 }, '-=0.3');
}
// … selector (roving tabindex + flechas), entrada inicial, autorrecorrido y anuncio según los requisitos.
```

Nota: `clipPath` no es `transform`/`opacity`, pero solo se usa en las anotaciones, que son pequeñas y no están en escenas fijadas. Es una excepción aceptada.

- [ ] **Step 3: CSS de soporte** en `taller.css`: `.demo-site{--acento:#A4471F}`, el botón y la cabecera del sitio de ejemplo usan `var(--acento)`; `.hero-line{display:block;overflow:hidden}`; `.hero-line>span{display:inline-block}`; `.hero-picker button[aria-checked=true]{background:var(--tinta);color:#fff}`.

- [ ] **Step 4: Verificar en el navegador**
  1. **Carga:** el H1 es visible en la primera captura (con GSAP). Con `getComputedStyle` sobre `.hero-title`, `opacity` es `"1"` desde el inicio.
  2. **Selector:** clic en "Clínica" → tras ~1 s, `.demo-site[data-sector=clinica]`, el titular "Tu salud, en buenas manos." y `--acento #22688A`.
  3. **[RF 1]** Ejecuta `['clinica','tienda','academia','estetica'].forEach((id,i)=>setTimeout(()=>document.querySelector(`.hero-picker [data-sector=${id}]`).click(), i*60))` y, a los 2 s, comprueba `data-sector="estetica"`, que `sitio.querySelectorAll('.demo-block').length` es el mismo que al inicio y que todos los bloques tienen `opacity` 1.
  4. **Teclado:** Tab hasta el selector y flecha derecha 2 veces → el sector cambia y el foco es visible.
  5. **Autorrecorrido:** sin tocar nada, a los 9 s el sector ha cambiado al menos 2 veces; tras un clic en el selector, deja de cambiar.
  6. **RM** (Emulate CSS `prefers-reduced-motion: reduce` vía DevTools o `matchMedia` forzado en una pestaña con la preferencia del sistema): el cambio es inmediato y no hay autorrecorrido.

- [ ] **Step 5: Commit**

```bash
git add js/movimiento.js js/hero-build.js taller.css
git commit -m "Rediseño: hero con selector de negocio y web de ejemplo que se construye"
```

---

### Task 8: Escena de servicios (web → tienda → app) con demos

**Files:**
- Create: `js/escena-servicios.js`
- Modify: `taller.css` (estado `.is-pinned` y transiciones de la maqueta)

**Interfaces:**
- Consumes: `pintarSitio` (Task 7), `escenas` y `gsapListo` (Task 7), `sectorState` y `sectorPorId`, y `formatearPrecio` (Task 2).
- Produces: `.serv-mock[data-mode]` toma los valores `web`, `tienda` o `app`; los contadores `.cart-count`, `.cart-total` y `.app-libres` se actualizan; la clase `.is-pinned` en `.esc-servicios` solo en escritorio y sin RM.

- [ ] **Step 1: Demos** (siempre activas, con o sin GSAP):
  - **Pintar la tienda y el panel:** al cargar y en `md:sector`, se pintan los 3 productos (nombre, `formatearPrecio`, etiqueta "Ejemplo") y las 4 citas más los huecos libres. El carrito se vacía al cambiar de sector.
  - **`button.shop-add`:** suma 1 al contador y el precio al total, añade `.bump` a `.cart-count` durante 400 ms (animación CSS de escala con `--muelle`) y anuncia en `.serv-live` "Añadido: <producto>. Carrito: n productos, total X".
  - **`button.shop-pay`:** muestra "Pago de prueba: en tu tienda real, aquí se paga con tarjeta o Bizum" en `.serv-live` y como texto visible bajo el botón. No hace nada más.
  - **`button.app-slot`:** marca el hueco como "Reservado" (`aria-pressed=true`, texto "Reservado") y resta 1 a `.app-libres` (mínimo 0). Si se vuelve a pulsar, se deshace. Se anuncia.
- [ ] **Step 2: Escena fijada (solo escritorio y sin RM)**, dentro de `escenas({ escritorio() { … } })`:
  - añade `.is-pinned` a `.esc-servicios` (y la quita en el `return () => …` de limpieza);
  - `ScrollTrigger.create({ trigger: '.esc-servicios', start: 'top top', end: '+=300%', pin: '.serv-pin', scrub: true, onUpdate(self) { … } })`, donde el progreso `0–0,33` corresponde a `web`, `0,33–0,66` a `tienda` y `0,66–1` a `app`;
  - al cambiar de tramo: `mock.dataset.mode = modo`, marca `ol.serv-index li[aria-current=step]` y muestra el `article.serv-step` correspondiente (los otros quedan con `inert` y `aria-hidden="true"`);
  - **transición entre modos**, una línea de tiempo por cambio:
    - de web a tienda: los `.demo-block` de `.mock-web` salen y los `li` de `.shop-grid` entran como cartas (`y: 30, rotation: -3 → 0, ease: back.out`);
    - de tienda a app: la rejilla se pliega (`scaleY: .6, opacity: 0`) y entran la barra lateral y la lista del panel (`x: -20 → 0, stagger`).
  - **[RF 3]** en `focusin` dentro de `.serv-pin`: si el elemento enfocado está dentro de un `.serv-step` o modo que no es el actual, desplaza a su tramo con `window.scrollTo({ top: st.start + tramo * (st.end - st.start) + 1, behavior: 'auto' })`, para que el foco nunca quede en un elemento invisible.
  - **[RF 2]** la limpieza de `matchMedia` quita `.is-pinned`, restablece `data-mode=web` y quita `inert` y `aria-hidden` de todos los pasos.
- [ ] **Step 3: Móvil y RM**: sin fijar. Los tres bloques apilados (el CSS base de la Task 5) muestran cada uno su maqueta. En móvil sin RM, cada maqueta entra una vez al aparecer en pantalla (`ScrollTrigger` con `once: true`), con su gesto propio: la web "se monta", la tienda "reparte cartas" y el panel "se desliza".
- [ ] **Step 4: Verificar**
  1. **Escritorio (1440):** al bajar, el índice pasa por 01, 02 y 03, `data-mode` cambia y no se ven huecos en blanco (capturas a 10, 45 y 80 % del recorrido).
  2. **Tienda:** "Añadir" 2 veces → `.cart-count` = 2 y el total cuadra con `formatearPrecio` de la suma.
  3. **Panel:** pulsar un hueco → "Reservado" y `.app-libres` baja 1; volver a pulsar → se deshace.
  4. **Sector:** cambiar a "Academia" en el hero → la tienda muestra "Clase de prueba · Gratis" y el carrito se vacía.
  5. **[RF 3]** Tab desde el CTA del hero hasta un botón "Añadir" de la tienda: el botón queda visible en la captura y con foco visible.
  6. **[RF 2]** Ventana a 1440 → bajar a la mitad de la escena → `resize_window` a 900 → captura: sin `.is-pinned`, la escena apilada, sin espacio vacío anómalo (comprueba `document.querySelector('.pin-spacer')` → `null` o sin altura extra). Vuelta a 1440 → la escena fijada funciona.
  7. **Móvil (390):** demos operativas por toque y `scrollWidth === innerWidth`.
- [ ] **Step 5: Commit**

```bash
git add js/escena-servicios.js taller.css
git commit -m "Rediseño: escena de servicios que transforma la web en tienda y en app, con demos"
```

---

### Task 9: Escena nocturna de automatización

**Files:**
- Create: `js/escena-automatizacion.js`
- Modify: `taller.css`

**Interfaces:**
- Consumes: `sectorState`, `sectorPorId`, `escenas` y `gsapListo`. La calculadora ya escucha `md:sector` en `main.js`, así que este módulo no la toca.
- Produces: `li.task` con `data-estado="mano|auto"`; el selector compacto `.noche-picker` sincronizado con el estado.

- [ ] **Step 1: Pintar flujos por sector:** al cargar y en `md:sector`, cada `li.task` recibe `desde` y `hasta` del sector, y el icono SVG según `icono`. Copia el contenido de los SVG de las pestañas por sector del `index.html` anterior al rediseño (`git show main:index.html`, bloque `.md-sector-tabs`) a un `const ICONOS = { … }` en este módulo, con las claves `cal`, `calx`, `box`, `doc`, `chart`, `star`, `clock`, `gift`, `ticket`, `food`, `receipt`, `cart`, `truck`, `mail`, `bell` y `user`, y con los mismos `path`.
- [ ] **Step 2: Selector compacto:** botones `data-sector` (mismo patrón de *roving tabindex* que el hero, con su propio grupo) → `sectorState.set(id)`.
- [ ] **Step 3: Escritorio sin RM:** fijar `.noche-pin` (`end: '+=200%'`, `scrub: true`).
  - **0–60 %:** las tareas empiezan dispersas (`x/y/rotation` aleatorias pero deterministas por índice, por ejemplo `rotation: [-6, 4, -3, 5][i]`, `x: [-40, 30, -20, 50][i]`) y un contador `.noche-perdido` sube ("horas a mano esta semana"). La línea `.noche-line` (SVG `path` con `stroke-dasharray`) se dibuja conectándolas; cada tarea pasa a `data-estado=auto` al alcanzarla (cambio de texto con cruce de opacidad y un check menta), y se colocan en línea.
  - **60–100 %:** la calculadora (`#calculadora`) entra desde abajo.
- [ ] **Step 4: Móvil sin RM:** sin fijar; cada tarea pasa de "mano" a "auto" al entrar en pantalla (`once: true`, `stagger`). **RM y sin JS:** todas en `auto`, ya en el HTML (`data-estado="auto"` por defecto; el JS solo lo pone en `mano` al inicio de la animación de escritorio o móvil).
- [ ] **Step 5: Verificar**
  - en escritorio, capturas a 0, 40 y 100 % del recorrido de la escena;
  - "Clínica" en el selector compacto → el hero también cambia (`.hero-picker [aria-checked=true]` es "Clínica"), los flujos muestran "Alguien cancela a última hora", y la calculadora pasa a 5 h y 25 € si no se había tocado;
  - el CTA "Quiero mi diagnóstico gratis" abre el formulario en el paso 2 con "Automatizar tareas" y el mensaje empezado;
  - contraste del texto sobre noche ≥ 4,5 (texto `#E8ECF1` sobre `#0F161F`, y menta `#6EC6B4` solo para elementos grandes o no textuales);
  - RM: todo en estado final.
- [ ] **Step 6: Commit**

```bash
git add js/escena-automatizacion.js taller.css
git commit -m "Rediseño: escena nocturna de automatización con tareas que se automatizan y calculadora"
```

---

### Task 10: Vitrina de proyectos

**Files:**
- Create: `js/vitrina.js`
- Modify: `taller.css`

**Interfaces:**
- Consumes: `escenas` y `gsapListo`.
- Produces: en escritorio sin RM, desplazamiento horizontal ligado al scroll. En el resto, carrusel nativo con los botones Anterior y Siguiente.

- [ ] **Step 1: Botones** (siempre): `button[data-dir]` hace `track.scrollBy({ left: ±panel.offsetWidth + gap, behavior: reduce.matches ? 'auto' : 'smooth' })` y se desactiva en los extremos (`aria-disabled`). Además, `track` admite flechas izquierda y derecha cuando tiene el foco (`tabindex="0"`, `aria-label="Proyectos"`).
- [ ] **Step 2: Escritorio sin RM:** quita el `overflow` nativo (clase `.is-pinned` en `.esc-vitrina`) y, con `gsap.to(track, { x: () => -(track.scrollWidth - innerWidth + gutter), ease: 'none', scrollTrigger: { trigger: '.esc-vitrina', pin: true, scrub: 1, end: () => '+=' + (track.scrollWidth - innerWidth), invalidateOnRefresh: true } })`, cada imagen se revela con `clipPath: inset(0 0 100% 0) → inset(0)` al entrar su panel (`containerAnimation`). Hay un paralaje suave en el texto del panel (`x: 40 → 0`). Los botones se ocultan en este modo. La limpieza ([RF 2]) quita `.is-pinned` y deja `x` en 0.
- [ ] **Step 3: Verificar**
  - en escritorio, al bajar recorren los 4 paneles y el último es "Tu proyecto, aquí" con CTA al contacto;
  - en móvil, el deslizamiento con `scroll-snap` y los botones funcionan, con `aria-disabled` en los extremos;
  - con teclado: Tab hasta la vitrina y flechas;
  - **[RF 5]** el CTA "Tu proyecto, aquí" lleva a `#contacto` y, al terminar, `#contacto` está en pantalla (la escena fijada no lo impide).
- [ ] **Step 4: Commit**

```bash
git add js/vitrina.js taller.css
git commit -m "Rediseño: vitrina horizontal de proyectos reales"
```

---

### Task 11: Interacciones premium y escena 08

**Files:**
- Create: `js/interacciones.js`
- Modify: `taller.css`

**Interfaces:**
- Consumes: `reduce`, `gsapListo` y `escenas`.
- Produces: comportamiento sobre `.btn`, `header#top`, `.md-head-progress`, `.ficha`, `.dias`, `.rev-url`, `.rev-list` y el cursor de demo `.cursor-demo` (creado por JS).

- [ ] **Step 1: Botones magnéticos** (solo con `(hover: hover) and (pointer: fine)` y sin RM): en `pointermove` sobre `.btn`, aplica un desplazamiento hacia el cursor (máximo 6 px) con `gsap.quickTo(el, 'x'|'y', { duration: .4, ease: 'power3' })`. Vuelve a 0 en `pointerleave`. La flecha `svg` del botón se desliza 4 px en hover (CSS).
- [ ] **Step 2: Cabecera:** con `ScrollTrigger` (o `scroll` con `requestAnimationFrame` si no hay GSAP), `header#top` recibe `.is-compact` cuando `scrollY > 80`. `.md-head-progress > span` usa `transform: scaleX(progreso)` del documento entero. Los enlaces del menú llevan un subrayado que se dibuja (`background-size` transicionado en CSS).
- [ ] **Step 3: Cursor de demo** (solo puntero fino y sin RM): un `div.cursor-demo` (punto de 10 px más una etiqueta mono) que sigue al cursor con `quickTo` **solo** dentro de `#demo`, `.serv-stage` y `.noche-pin`. La etiqueta usa `data-cursor` del elemento bajo el puntero ("prueba" en el selector, "añade" en `.shop-add`, "reserva" en `.app-slot`). El cursor del sistema **no** se oculta (es un acompañante, no un sustituto).
- [ ] **Step 4: Escena 02 (ficha) y escena 08** (con GSAP y sin RM; si no, estado final):
  - **ficha:** las líneas `.ficha-row::before` (escala X de 0 a 1) se dibujan en secuencia al entrar en pantalla;
  - **7 días:** `.dias-bar > span` hace `scaleX` ligado al scroll de `.dias` (`scrub`), y cada `li.dia` recibe `.is-on` al alcanzarlo;
  - **revisión:** `.rev-url` se escribe letra a letra ("tunegocio.com", 60 ms por letra) al entrar, y cada `li` de `.rev-list` aparece con su icono de "problema" tachado y sustituido por la mejora.
- [ ] **Step 5: Verificar**
  - magnetismo: el botón se mueve al acercar el ratón y vuelve a su sitio;
  - la cabecera se compacta al bajar y la barra de progreso avanza;
  - el cursor de demo aparece solo en las 3 zonas, con su etiqueta correcta;
  - la ficha, los 7 días y la revisión se animan;
  - con RM, todo estático y en su estado final;
  - en móvil, sin magnetismo ni cursor.
- [ ] **Step 6: Commit**

```bash
git add js/interacciones.js taller.css
git commit -m "Rediseño: microinteracciones, cabecera compacta, cursor de demos y animaciones de ficha, 7 días y revisión"
```

---

### Task 12: Verificación completa y presupuestos

**Files:**
- Ninguno nuevo. Solo correcciones donde fallen las comprobaciones (cada corrección, con su commit).

- [ ] **Step 1: Pruebas automáticas:** `node --test tests/` → todas pasan.
- [ ] **Step 2: Capturas** en Chrome a 1440, 834, 390 y 360 px de ancho, una por escena (8 × 4). Guárdalas en el scratchpad para la Task 13. En cada ancho comprueba `document.documentElement.scrollWidth === innerWidth`.
- [ ] **Step 3: Teclado**, de principio a fin:
  - Tab recorre cabecera → selector del hero → CTA → ficha → servicios (demos) → selector nocturno → calculadora → vitrina → planes → revisión → FAQ → formulario → pie;
  - el foco siempre es visible y nunca queda en un elemento oculto ([RF 3]);
  - Enter y Espacio activan.
- [ ] **Step 4: RM, sin JS y zoom.** Con RM emulado, recorrido con capturas: todo en su estado final y sin escenas fijadas. Sin JS (desactivado en DevTools o ajustes del sitio): todo el contenido visible y el formulario se muestra (aunque no envía). Zoom al 200 %: sin solapes.
- [ ] **Step 5: Lighthouse**, en móvil y escritorio, con `npx --yes lighthouse@12 http://127.0.0.1:8787/ --preset=desktop --output=json --output-path="$TEMP/lh-desk.json" --chrome-flags="--headless"` y la variante móvil (sin `--preset`). Extrae las 4 puntuaciones, LCP, CLS y TBT. Si algo queda por debajo de los presupuestos de Global Constraints, se corrige y se repite.
- [ ] **Step 6: Peso del JS:** suma los tamaños comprimidos (`curl -s -H 'Accept-Encoding: gzip' -o /dev/null -w '%{size_download}'` de cada `.js` de la home) < 150 KB.
- [ ] **Step 7: Recorridos del formulario:**
  - los 6 servicios por los 3 pasos;
  - Atrás y Enter;
  - validación de campos vacíos y web mal escrita;
  - los 7 CTA con `data-servicio`;
  - `?servicio=` desde las 3 guías;
  - el envío simulado con `Sector:` en el email;
  - el mensaje de error con los enlaces de WhatsApp y email (simulando `fetch` rechazado).
- [ ] **Step 8: Commit** de cualquier corrección pendiente: `git commit -m "Rediseño: correcciones de la verificación completa"`.

---

### Task 13: Segunda iteración visual (quitar lo que parezca plantilla)

**Files:**
- Modify: `taller.css`, `index.html` y los módulos que haga falta.

- [ ] **Step 1: Revisión crítica.** Con las 32 capturas delante, escribe en `docs/superpowers/plans/2026-10-19-rediseno-taller-iteracion-2.md` una lista numerada de todo lo que aún parezca plantilla, repetitivo o genérico. Para cada punto: la escena, qué se ve, por qué resulta genérico y el cambio concreto que lo arregla. Comprueba al menos:
  - espaciados repetidos sección tras sección;
  - tarjetas con la misma sombra en todas partes;
  - titulares con el mismo tamaño y posición en cada escena;
  - animaciones que se sienten iguales;
  - zonas muertas en tablet;
  - textos genéricos;
  - jerarquía de las CTA.
- [ ] **Step 2: Aplicar las correcciones**, un commit por grupo coherente.
- [ ] **Step 3: Repetir** los Steps 2–5 de la Task 12 sobre lo cambiado.
- [ ] **Step 4: Commit** de la lista y los cambios.

---

### Task 14: Documentación y entrega

**Files:**
- Modify: `CLAUDE.md`, `README.md`

- [ ] **Step 1: `CLAUDE.md`.** Actualiza:
  - el Stack (`taller.css`, módulos `js/`, GSAP alojado, `node --test tests/`);
  - la tipografía (Bricolage Grotesque para titulares en la home, JetBrains Mono para anotaciones, Poppins para texto);
  - el orden de las escenas (01 hero, 02 ficha, 03–05 servicios, 06 automatización, 07 proyectos, 08 planes/revisión/FAQ/contacto), que sustituye a la frase del orden de secciones y a la de las pestañas por sector;
  - el modelo de sector (`js/sectores.js` como fuente única, `md:sector` y el campo `sector` del formulario y del Worker);
  - la calculadora (`js/calculadora.js`, `PRICE_FROM`);
  - la nota de que guías, legales y 404 siguen con `styles.css` hasta la fase 2;
  - las reglas de movimiento (RM, estado final en el CSS, solo `transform`/`opacity`, el H1 nunca con `opacity: 0`).
- [ ] **Step 2: `README.md`.** Añade la estructura de archivos nueva y cómo pasar las pruebas (`node --test tests/`).
- [ ] **Step 3: Commit**: `git commit -m "Rediseño: documentación de las convenciones nuevas"`.
- [ ] **Step 4: Entrega:**
  - subir la rama (`git push -u origin rediseno-taller`; no publica en la web porque Cloudflare solo despliega `main`, compruébalo en el historial de builds tras el push);
  - dejar `wrangler dev` en marcha y enseñar a la persona usuaria la home en local, con capturas clave y los resultados de Lighthouse y presupuestos;
  - **pedir autorización expresa** antes de cualquier merge a `main`.
