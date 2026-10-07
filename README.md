# MentaDev

**Diseño web y soluciones digitales a medida.**

Landing de MentaDev para presentar los servicios: diseño web, tiendas online, apps, automatizaciones, SEO y mantenimiento.

## Stack
HTML + CSS + JavaScript, sin dependencias ni build. Se publica en GitHub Pages.

## Ver en local
```bash
python -m http.server 8080
# abre http://localhost:8080
```
También funciona abriendo `index.html` directamente en el navegador.

## Estructura
```
index.html      # Contenido de la landing (secciones: hero, servicios, proceso, proyectos, FAQ, contacto)
styles.css      # Estilos y tokens de color (modo claro/oscuro)
main.js         # Menú móvil, animaciones al hacer scroll y formulario de contacto
assets/         # Logo, favicon y manual de marca (assets/brand/)
```

## Personalizar
- **Email de contacto:** cambia `CONTACT_EMAIL` en `main.js`.
- **Proyectos:** edita la sección `#proyectos` de `index.html`.
- **Colores:** variables de `:root` en `styles.css`.

## Publicar en GitHub Pages
El workflow `.github/workflows/pages.yml` publica la web en cada push a `main`.
La primera vez: *Settings → Pages → Source: GitHub Actions*.

## Licencia
MIT
