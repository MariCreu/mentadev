# MentaDev

Landing para ofrecer servicios de diseño web y soluciones digitales.

## Stack
- HTML + CSS + JS vanilla, sin build ni dependencias.
- Despliegue: **Cloudflare Pages** conectado a este repo; cada push a `main` se publica en **mentadev.com** (dominio en Cloudflare). Sin build: se sirve la raíz tal cual.
- Diseño de referencia inicial: lienzo "MentaDev Landing" en claude.ai (https://claude.ai/artifact/JfuyKhtKqb6CTAqTBsaoxm). La versión vigente es la del repo.

## Posicionamiento
Estudio de desarrollo para pequeños negocios: **webs profesionales, apps/herramientas a medida y automatización de procesos**, con trato directo (Creu desarrolla cada proyecto). No competir solo por precio.
- **Producto de entrada:** web profesional desde **349 € + IVA** (alcance cerrado: hasta 6 secciones, contenidos editables, SEO y analítica, textos legales básicos, 1 mes de soporte). Ese precio solo aplica a la web profesional; tiendas, apps y automatizaciones van con presupuesto personalizado.
- **Mensaje diferencial:** "Cuéntame cómo trabajas. Yo busco qué podemos automatizar." Se vende el beneficio (ahorrar tiempo, menos tareas repetitivas y errores, herramientas conectadas), nunca tecnologías concretas (IA, APIs, n8n…).
- Voz en primera persona del singular ("te acompaño", "me encargo yo").

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
- Orden de secciones: hero → garantías → servicios → automatización → proyectos → planes → cómo trabajo + detrás de MentaDev → FAQ → contacto.
- Los CTA con `data-servicio="…"` preseleccionan esa opción en el formulario (debe coincidir con un `<option>` de `#servicio`).
- WhatsApp: `WHATSAPP_NUMBER` en `main.js`. Vacío = enlaces y botón flotante ocultos. Mensaje inicial según contexto (`WA_MESSAGES`).
- Capturas reales: los elementos con `data-shot="assets/…"` sustituyen su ilustración por la imagen si el archivo existe (proyectos en `assets/proyectos/`). "Detrás de MentaDev" va sin foto, con el símbolo de la marca.
- Diseño mobile-first: todo debe verse bien a 360 px de ancho.
- Accesibilidad: contraste suficiente, `alt` en imágenes, foco visible y respeto a `prefers-reduced-motion`.
- El formulario de contacto no tiene backend: abre `mailto:` con `CONTACT_EMAIL` de `main.js`.
- Páginas legales: `aviso-legal.html`, `privacidad.html`, `cookies.html` (titular, NIF y domicilio en el bloque `<dl>` de cada una). Si se añade un servicio externo (analítica, formulario con backend, mapas…), actualizar privacidad y cookies; si pone cookies no técnicas, hace falta banner de consentimiento.
- SEO: `og-image.png` (1200×630) para compartir, datos estructurados JSON-LD en `index.html` (negocio, web y FAQ), `robots.txt`, `sitemap.xml` y `404.html` (rutas absolutas, porque se sirve en cualquier URL). Si cambian las preguntas frecuentes o los precios, actualizar también el JSON-LD; si se añade una página, añadirla al sitemap.
- `_headers` (Cloudflare Pages): caché larga para fuentes y assets.
