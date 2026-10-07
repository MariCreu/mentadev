# MentaDev

Landing para ofrecer servicios de diseño web y soluciones digitales.

## Stack
- HTML + CSS + JS vanilla, sin build ni dependencias.
- Despliegue: **Cloudflare Pages** conectado a este repo; cada push a `main` se publica en **mentadev.com** (dominio en Cloudflare). Sin build: se sirve la raíz tal cual.
- Diseño de referencia: lienzo "MentaDev Landing" en claude.ai (https://claude.ai/artifact/JfuyKhtKqb6CTAqTBsaoxm).

## Identidad visual
Manual completo en `assets/brand/manual-de-marca.png`.
- **Logo:** dos hojas superpuestas (lavanda a la izquierda, menta a la derecha). Wordmark "Menta" en antracita + "Dev" en lavanda. Archivos: `assets/logo.svg`, `assets/favicon.svg`.
- **Paleta:**
  - Menta `#6EC6B4` — color principal (confianza, frescura, creatividad)
  - Lavanda `#BDAEE1` — color secundario (equilibrio, innovación, calma)
  - Antracita `#1F2937` — texto principal (y fondo en modo oscuro)
  - Fondo `#F8FAFB`
- **Variantes accesibles** (para texto y botones sobre fondo claro): menta oscuro `#2E8574`, lavanda oscuro `#6F5BBF`. La menta y la lavanda puras no tienen contraste suficiente para texto blanco encima.
- **Tipografía:** Poppins (Light, Regular, Medium, Semibold, Bold).
- **Estilo:** fresco, cercano, limpio. Textos en español, tono directo y sin tecnicismos. CTA principal en lavanda.

## Convenciones
- Tokens de color en `:root` de `styles.css` (prefijo `md-` en las clases). Tema claro con secciones oscuras en antracita; sin modo oscuro automático.
- Sin emojis: iconos SVG de trazo inline.
- Los precios de `#planes` son placeholders `[PRECIO]` hasta que se definan.
- Diseño mobile-first: todo debe verse bien a 360 px de ancho.
- Accesibilidad: contraste suficiente, `alt` en imágenes, foco visible y respeto a `prefers-reduced-motion`.
- El formulario de contacto no tiene backend: abre `mailto:` con `CONTACT_EMAIL` de `main.js`.
