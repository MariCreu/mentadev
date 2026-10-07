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
assets/         # Logo, favicon y manual de marca (assets/brand/)
```

## Personalizar
- **Email de contacto:** cambia `CONTACT_EMAIL` en `main.js`.
- **Proyectos:** edita la sección `#proyectos` de `index.html`.
- **Precios:** sustituye los `[PRECIO]` de la sección `#planes`.
- **Colores:** variables de `:root` en `styles.css`.

## Despliegue
Cloudflare Pages está conectado a este repo: cada push a `main` se publica solo en https://mentadev.com.

Configuración del proyecto en Cloudflare: framework **None**, sin comando de build, directorio de salida `/`. Dominios `mentadev.com` y `www.mentadev.com` en *Custom domains*.

## Licencia
MIT
