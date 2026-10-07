# MentaDev

**Diseño web y soluciones digitales a medida.**

Landing de MentaDev para presentar los servicios: diseño web, tiendas online, apps, automatizaciones, SEO y mantenimiento.

## Stack
HTML + CSS + JavaScript, sin dependencias ni build. Se publica con Cloudflare Pages en https://mentadev.com.

## Ver en local
```bash
python -m http.server 8080
# abre http://localhost:8080
```
También funciona abriendo `index.html` directamente en el navegador.

## Estructura
```
index.html      # Contenido de la landing (secciones: hero, servicios, proceso, proyectos, FAQ, contacto)
styles.css      # Estilos y tokens de color de la marca
main.js         # Animaciones al hacer scroll y formulario de contacto
assets/         # Logo, favicon, fuentes, capturas de proyectos y manual de marca
aviso-legal.html, privacidad.html, cookies.html  # Textos legales
404.html        # Página de error
robots.txt, sitemap.xml, _headers  # SEO y cabeceras de Cloudflare Pages
```

## Personalizar
- **Email de contacto:** `CONTACT_EMAIL` en `main.js`.
- **WhatsApp:** pon tu número en `WHATSAPP_NUMBER` (`main.js`), con prefijo y sin `+`, p. ej. `34600111222`. Mientras esté vacío no se muestra ningún botón de WhatsApp.
- **Capturas reales de proyectos:** guarda los archivos con estos nombres y aparecen solos en lugar de las ilustraciones:
  - `assets/proyectos/luna-y-papel.webp` — captura de escritorio (horizontal)
  - `assets/proyectos/infanapp-1.webp` y `infanapp-2.webp` — capturas de móvil (vertical, ~9:19)
  - `assets/proyectos/reservas-al-vuelo.webp` — interfaz (horizontal, 16:10)
- **Colores:** variables de `:root` en `styles.css`.

## Despliegue
Cloudflare Pages está conectado a este repo: cada push a `main` se publica solo en https://mentadev.com.

Configuración del proyecto en Cloudflare: framework **None**, sin comando de build, directorio de salida `/`. Dominios `mentadev.com` y `www.mentadev.com` en *Custom domains*.

## Licencia
MIT
