# MentaDev

Landing para ofrecer servicios de diseño web y soluciones digitales.

## Stack
- HTML + CSS + JS vanilla, sin build ni dependencias. `site.js` (común a todas las páginas con la cabecera de la web: menú y barra del móvil, WhatsApp, animaciones, capturas) y `main.js` (solo la home: formulario, pestañas por sector, calculadora); la home carga los dos, en ese orden.
- Despliegue: **Cloudflare Workers (static assets)**, Worker `mentadev` conectado a este repo; cada push a `main` se publica en **mentadev.com**. Config en `wrangler.jsonc` (sirve la raíz tal cual, sin build; el Worker `worker/index.js` solo atiende `/api/*`). Lo que no debe publicarse va en `.assetsignore`.
- Diseño de referencia inicial: lienzo "MentaDev Landing" en claude.ai (https://claude.ai/artifact/JfuyKhtKqb6CTAqTBsaoxm). La versión vigente es la del repo.

## Jerarquía de mensajes
Cada mensaje tiene una función y no deben competir visualmente:
1. **Marca:** MentaDev
2. **Descriptor de marca** (qué es, uso secundario y estable): "Web, apps y soluciones digitales." Va bajo el logo en el pie, en `<title>`, meta description, Open Graph, imagen para compartir y JSON-LD (`description`). En la cabecera no se muestra para mantener limpio el logo.
3. **Eslogan comercial** (mensaje principal): "Tu idea, hecha realidad." Es el H1 del hero, `og:title` y `slogan` del JSON-LD. No sustituirlo.
4. **Mensaje de automatización:** "Cuéntanos cómo trabajas. Buscamos qué puedes dejar de hacer a mano." Solo en la sección de automatización.

## Posicionamiento
Estudio de desarrollo para pequeños negocios: **webs profesionales, apps/herramientas a medida y automatización de procesos**, con trato directo con el equipo que desarrolla cada proyecto. Debe percibirse como empresa, no como profesional autónomo: sin secciones personales ni nombres propios en el contenido comercial (los datos de la titular solo en los textos legales, donde son obligatorios). No competir solo por precio.
- **Precios (deliberadamente bajos para captar los primeros clientes):**
  - Web profesional: desde **349 € + IVA**, lista en **7 días**. Incluye hasta 6 secciones, contenidos editables, SEO y analítica, textos legales básicos, ayuda con los textos, **alojamiento del primer año** y **2 meses de soporte**. Pago en **2 plazos** sin intereses. El dominio lo paga el cliente a su nombre.
  - **Garantía de plazo:** si la web no está publicada en **7 días laborables** desde que tenemos los contenidos, se devuelve el primer plazo. Aparece en la franja de garantías, el plan web, la FAQ y el JSON-LD.
  - Mantenimiento web: **15 € + IVA/mes**, sin permanencia (alojamiento, certificado, copias, revisiones y pequeños cambios).
  - Automatizaciones: **diagnóstico gratis de 30 min** y desde **490 € + IVA** con presupuesto cerrado; mantenimiento desde **29 € + IVA/mes**. Las herramientas que usen (Make, Zapier…) van a nombre del cliente.
  - Tiendas, apps y proyectos grandes: presupuesto personalizado.
  - El precio de la web no debe hacer parecer que todo es barato: la automatización es el servicio de más valor.
- **Mensaje diferencial:** "Cuéntanos cómo trabajas. Buscamos qué puedes dejar de hacer a mano." Se vende el beneficio (ahorrar tiempo, menos tareas repetitivas y errores, herramientas conectadas), nunca tecnologías concretas (IA, APIs, n8n…).
- Voz en primera persona del plural ("te acompañamos", "nos encargamos nosotros"). Nunca en singular.

## Identidad visual
Manual completo en `assets/brand/manual-de-marca.png`.
- **Logo:** dos hojas superpuestas (lavanda a la izquierda, menta a la derecha). Wordmark "Menta" en antracita + "Dev" en lavanda. Archivos: `assets/logo.svg`, `assets/favicon.svg`.
- **Paleta:**
  - Menta `#6EC6B4` — color principal (confianza, frescura, creatividad)
  - Lavanda `#BDAEE1` — color secundario (equilibrio, innovación, calma)
  - Antracita `#1F2937` — texto principal (y fondo en modo oscuro)
  - Fondo `#F8FAFB`
- **Variantes accesibles** (para texto y botones sobre fondo claro): menta oscuro `#2E8574`, lavanda oscuro `#6F5BBF`. La menta y la lavanda puras no tienen contraste suficiente para texto blanco encima.
- **Tipografía:** Poppins (Light, Regular, Medium, Semibold, Bold), alojada en `assets/fonts/` (sin Google Fonts: la web no carga servicios externos).
- **Estilo:** fresco, cercano, limpio. Textos en español, tono directo y sin tecnicismos. CTA principal en lavanda.

## Convenciones
- Tokens de color en `:root` de `styles.css` (prefijo `md-` en las clases). Tema claro con secciones oscuras en antracita; sin modo oscuro automático.
- Sin emojis: iconos SVG de trazo inline.
- Sin comparativas con otras opciones (Wix, cuotas mensuales, agencias): se quitó a propósito.
- Orden de secciones: hero → garantías → servicios → automatización → proyectos → planes → FAQ → contacto. Sin sección de proceso ni "sobre mí". Excepción acordada: el bloque "Cómo son tus 7 días" (`.md-days`) dentro de Planes, bajo las tarjetas.
- Ejemplos de automatización por sector: pestañas `.md-sector-tabs` (General, Clínicas, Estética y peluquerías, Restaurantes, Tiendas, Academias) con 4 ejemplos "hoy, a mano → con la automatización" cada una, en lenguaje de beneficio y sin nombrar tecnologías.
- Calculadora de automatización (`#calculadora`, dentro de Automatización): supone que se automatiza la mitad del tiempo (`AUTOMATABLE`) y compara con `PRICE_FROM` (490 €) en `main.js`; si cambia el precio, actualizarlo ahí. Su CTA rellena el mensaje del formulario sin pisar lo que haya escrito el usuario.
- Formulario de contacto por pasos (`.md-steps`): 1) qué necesitas (tarjetas `name="servicio"`), 2) cuéntanos más (se adapta al servicio: web y tienda preguntan "¿Tienes ya web?"; la revisión pide la web y el mensaje es opcional), 3) nombre y email. Textos de cada servicio en `SERVICE_COPY` de `main.js`.
- Los CTA con `data-servicio="…"` eligen ese servicio y abren el formulario en el paso 2. El valor debe coincidir con una tarjeta del paso 1 y con `SERVICIOS` de `worker/index.js`.
- Revisión gratis de la web: compromiso de enviar **3 mejoras concretas por email en 48 h laborables**.
- WhatsApp: `WHATSAPP_NUMBER` en `site.js`. Vacío = enlaces y botón flotante ocultos. Por debajo de 960 px el botón flotante se sustituye por la barra fija `.md-mbar` ("Hablemos" + WhatsApp), que se oculta en Contacto; la cabecera muestra el menú `.md-burger` en lugar de "Hablemos". Mensaje inicial según contexto (`WA_MESSAGES`).
- Capturas reales: los elementos con `data-shot="assets/…"` sustituyen su ilustración por la imagen si el archivo existe (proyectos en `assets/proyectos/`).
- Diseño mobile-first: todo debe verse bien a 360 px de ancho.
- Accesibilidad: contraste suficiente, `alt` en imágenes, foco visible y respeto a `prefers-reduced-motion`.
- El formulario de contacto se envía a `POST /api/contacto`: el Worker (`worker/index.js`) manda el mensaje por email (binding `EMAIL`) a `CONTACT_TO`, un secreto de Cloudflare con una dirección verificada en Email Routing (nunca en el repo). No se guarda nada. Antispam: campo trampa `website` y tiempo mínimo. Si el envío falla, el formulario ofrece WhatsApp y `mailto:` con `CONTACT_EMAIL` de `site.js`. En local: `npx wrangler dev` con `CONTACT_TO` en `.dev.vars` (el envío es simulado; si se recarga en bucle, añade `--persist-to` con una carpeta fuera del repo).
- Páginas legales: `aviso-legal.html`, `privacidad.html`, `cookies.html` (titular, NIF y domicilio en el bloque `<dl>` de cada una). Si se añade un servicio externo (analítica, formulario con backend, mapas…), actualizar privacidad y cookies; si pone cookies no técnicas, hace falta banner de consentimiento.
- SEO: `og-image.png` (1200×630) para compartir, datos estructurados JSON-LD en `index.html` (negocio, web y FAQ), `robots.txt`, `sitemap.xml` y `404.html` (rutas absolutas, porque se sirve en cualquier URL). Si cambian las preguntas frecuentes o los precios, actualizar también el JSON-LD (y, si son precios, la calculadora); si se añade una página, añadirla al sitemap.
- Páginas de SEO (guías): `diseno-web-alicante.html` (local, Alicante y Marina Baixa, sin inventar presencia fuera de donde estamos), `automatizacion-de-procesos.html` y `cuanto-cuesta-una-web.html` (guía de precios, sin comparar con otras opciones). Cada una con su `title`, descripción, `canonical`, Open Graph y JSON-LD (`Service` o `Article` + `FAQPage` + `BreadcrumbList`). Cargan solo `site.js`, usan rutas absolutas (`/styles.css`, `/assets/…`) y sus CTA llevan a `/?servicio=…#contacto`. Su cabecera, pie y barra del móvil son copia de los de `index.html`: si cambian allí, cambiarlos también en ellas. El pie de todas las páginas (home, legales, 404 y guías) lleva la fila `.md-foot-guides`. No crear páginas casi iguales cambiando solo la ciudad.
- `_headers`: caché larga para fuentes e imágenes de proyectos. Las URL sin `.html` (`/privacidad`) las resuelve Cloudflare; las 404 sirven `404.html`.
- Redes: Instagram [@menta_dev](https://www.instagram.com/menta_dev/), enlazado en el pie de todas las páginas y en `sameAs` del JSON-LD. Al añadir otra red, hacer lo mismo.
