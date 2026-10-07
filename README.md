# MentaDev

**Diseño web y soluciones digitales a medida.**

Landing de MentaDev para presentar los servicios: diseño web, tiendas online, apps, automatizaciones, SEO y mantenimiento.

## Stack
HTML + CSS + JavaScript, sin dependencias ni build. Se publica en GitHub Pages en https://mentadev.com.

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
CNAME           # Dominio personalizado (mentadev.com)
assets/         # Logo, favicon y manual de marca (assets/brand/)
```

## Personalizar
- **Email de contacto:** cambia `CONTACT_EMAIL` en `main.js`.
- **Proyectos:** edita la sección `#proyectos` de `index.html`.
- **Precios:** sustituye los `[PRECIO]` de la sección `#planes`.
- **Colores:** variables de `:root` en `styles.css`.

## Publicar en GitHub Pages + dominio
El workflow `.github/workflows/pages.yml` publica la web en cada push a `main`.

Primera vez:
1. *Settings → Pages → Source: GitHub Actions*.
2. *Settings → Pages → Custom domain*: `mentadev.com` y activar **Enforce HTTPS** cuando esté disponible.
3. En Cloudflare (DNS de mentadev.com), registros en modo **DNS only** (nube gris):
   - `A @` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `CNAME www` → `maricreu.github.io`

## Licencia
MIT
