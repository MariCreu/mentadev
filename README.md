# MentaDev

**Diseño web y soluciones digitales a medida.**

Landing de MentaDev para presentar los servicios: diseño web, tiendas online, apps, automatizaciones, SEO y mantenimiento.

## Stack
HTML + CSS + JavaScript (módulos ES), sin dependencias de npm ni build. La home usa GSAP + ScrollTrigger, alojados en `assets/vendor/gsap/`. Se publica con Cloudflare (Workers static assets) en https://mentadev.com.

## Ver en local
```bash
python -m http.server 8080
# abre http://localhost:8080
```
Hace falta un servidor: la home usa módulos ES, que no cargan abriendo `index.html` como archivo.

## Estructura
```
index.html      # Home: hero, ficha, servicios, automatización, proyectos, planes, revisión, FAQ, contacto
taller.css      # Estilos de la home (rediseño "Taller en directo")
styles.css      # Estilos de guías, legales y 404
site.js         # Común: menú y barra del móvil, WhatsApp, animaciones
main.js         # Solo la home (módulo): formulario por pasos y calculadora
js/             # Módulos de la home:
  sectores.js           # Datos por sector (fuente única)
  sector-state.js       # Sector elegido (evento md:sector)
  calculadora.js        # Cálculo del ahorro (PRICE_FROM)
  movimiento.js         # Preferencias de movimiento y utilidades comunes
  hero-build.js, escena-servicios.js, escena-automatizacion.js, vitrina.js, interacciones.js  # Escenas
  iconos.js             # Iconos SVG de trazo
tests/          # Pruebas (node --test)
docs/           # Spec y planes del rediseño (no se publican)
worker/index.js # Worker: envío del formulario por email (/api/contacto)
assets/         # Logo, favicon, fuentes, capturas de proyectos y manual de marca
diseno-web-alicante.html, automatizacion-de-procesos.html, cuanto-cuesta-una-web.html  # Guías (SEO)
aviso-legal.html, privacidad.html, cookies.html  # Textos legales
404.html        # Página de error
robots.txt, sitemap.xml, _headers  # SEO y cabeceras
wrangler.jsonc, .assetsignore      # Despliegue en Cloudflare
```

## Personalizar
- **Email de contacto:** `CONTACT_EMAIL` en `site.js` (enlaces y alternativa si falla el envío).
- **Destino del formulario:** secreto `CONTACT_TO` del Worker en Cloudflare, con una dirección verificada en Email Routing. En local, ponlo en `.dev.vars` (`CONTACT_TO=tu@email.com`); el formulario solo envía de verdad desde `npx wrangler dev`, no con `python -m http.server`.
- **WhatsApp:** pon tu número en `WHATSAPP_NUMBER` (`site.js`), con prefijo y sin `+`, p. ej. `34600111222`. Mientras esté vacío no se muestra ningún botón de WhatsApp.
- **Capturas reales de proyectos:** guarda los archivos con estos nombres y aparecen solos en lugar de las ilustraciones:
  - `assets/proyectos/luna-y-papel.webp` — captura de escritorio (horizontal)
  - `assets/proyectos/infanapp-1.webp` y `infanapp-2.webp` — capturas de móvil (vertical, ~9:19)
  - `assets/proyectos/reservas-al-vuelo.webp` — interfaz (horizontal, 16:10)
- **Colores:** variables de `:root` en `taller.css` (home) y `styles.css` (resto).

## Pruebas

La base local del agente comercial (fase 1, sin envíos) está documentada en
[`prospecting/README.md`](prospecting/README.md). Requiere Node 24 y queda excluida
de los archivos públicos de la web.
```bash
node --test "tests/*.test.mjs"
```

## Despliegue
Cloudflare Workers (static assets): el Worker `mentadev` está conectado a este repo y cada push a `main` se publica en https://mentadev.com.
La configuración está en `wrangler.jsonc` (sin build; se sirve la raíz). Los archivos que no deben publicarse están en `.assetsignore`.

Para probarlo en local igual que en producción: `npx wrangler` con el subcomando `dev`.

## Licencia
MIT
