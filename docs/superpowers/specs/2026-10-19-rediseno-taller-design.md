# Rediseño de mentadev.com · Dirección "Taller en directo"

- **Fecha:** 19 de octubre de 2026
- **Rama:** `rediseno-taller` (no se publica: Cloudflare solo despliega `main`)
- **Estado:** diseño aprobado por partes en conversación; pendiente de revisión de este documento
- **Maquetas de referencia:** sesión del compañero visual (`direcciones.html`, `sistema-visual.html`, `storyboard.html`), fuera del repo

## 1. Objetivo y criterios de éxito

Convertir la home de mentadev.com en la mejor pieza de portfolio del estudio. Cuando un posible cliente la vea debe pensar: "si hacen una web así, quiero que diseñen la mía".

Se considera conseguido cuando:

1. La home deja de parecer una plantilla. No usa "hero centrado + tarjetas", no repite el mismo fade-in en todas las secciones y no presenta los servicios todos iguales.
2. El visitante **ve** la capacidad del estudio en vez de leerla: una web que se diseña sola para su tipo de negocio y que luego se transforma en tienda, en app y en automatización.
3. La automatización destaca como servicio estrella, con su propia escena.
4. Se entiende en 5 segundos qué se ofrece (webs, tiendas, apps, automatización para negocios), cuánto cuesta (desde 349 €) y cómo contactar ("Hablemos de tu proyecto" siempre a mano).
5. Calidad técnica:
   - Lighthouse ≥ 90 en Rendimiento, Accesibilidad, Buenas prácticas y SEO, en móvil y en escritorio;
   - CLS ≈ 0;
   - menos de 150 KB de JavaScript comprimido;
   - funciona con teclado, con "reducir movimiento" y sin JavaScript (el contenido sigue ahí).
6. El formulario y su envío siguen funcionando igual (mismos campos y Worker), además del sector elegido.

## 2. Alcance

**Fase 1 (este documento):** solo `index.html`.

**Fase 2 (después, con su propio diseño):** guías (`diseno-web-alicante`, `automatizacion-de-procesos`, `cuanto-cuesta-una-web`), legales y 404 adoptan el nuevo sistema. Hasta entonces conservan su estilo actual. Logo, paleta y Poppins garantizan una coherencia básica.

**Se mantiene sin cambios de fondo:**
- el Worker (`worker/index.js`), salvo el campo opcional `sector`;
- el envío y los campos del formulario;
- el JSON-LD;
- las metaetiquetas y el SEO;
- la analítica (Cloudflare Web Analytics);
- los textos legales;
- los precios y las condiciones;
- `site.js` (menú, barra del móvil, WhatsApp).

**Fuera de alcance:** WebGL/Three.js, scroll suavizado, modo oscuro automático, nuevas páginas, cambios de precios o de la oferta.

## 3. Contenido que se conserva

Todo el contenido comercial actual sigue en la home, reorganizado:

- **Eslogan y descriptor:** "Tu idea, hecha realidad." (H1), "Web, apps y soluciones digitales.".
- **Oferta:**
  - precio "desde 349 € + IVA", garantía de 7 días laborables o se devuelve el primer plazo, pago en 2 plazos, alojamiento del primer año, 2 meses de soporte;
  - mantenimiento 15 €/mes;
  - automatización desde 490 €, con diagnóstico gratis de 30 min y mantenimiento desde 29 €/mes.
- **Garantías:** las 4 actuales.
- **Servicios:** web, tiendas, apps y plataformas, automatización y SEO (este pasa a figurar como "incluido").
- **Automatización:** mensaje de automatización, ejemplos por sector (General, Clínicas, Estética y peluquerías, Restaurantes, Tiendas, Academias) y calculadora.
- **Proyectos reales:** Luna y Papel, InfanApp, Reservas al vuelo.
- **Planes:** plan web, "A medida" y "Cómo son tus 7 días".
- **Revisión gratis:** 3 mejoras en 48 h laborables.
- **FAQ:** las 8 preguntas, idénticas al JSON-LD.
- **Contacto:** formulario por pasos, email, WhatsApp, "en remoto para toda España".
- **Sin comparativas** con otras opciones, sin clientes ni resultados inventados, sin tecnicismos y en primera persona del plural.

## 4. Sistema visual: "el taller"

La web se presenta como una mesa de trabajo de diseño: se ve el proceso de construcción.

- **Fondo:** papel `#F8FAFB` con una retícula muy suave (líneas lavanda al 7 %, cada 24 px) y marcas de corte en las esquinas de los bloques principales.
- **Anotaciones:** JetBrains Mono a 11–12 px en lavanda oscuro `#6F5BBF`. Indican medidas, nombres de capas y numeración ("01 / Web") y aparecen al entrar en pantalla o al pasar el ratón.
- **Tipografía:**
  - **Bricolage Grotesque** (variable, OFL) para titulares, en peso 700–800, con interletrado negativo (−3 % a −4,5 %). H1 de `clamp(56px, 11vw, 168px)`.
  - **Poppins** (400/500/600) para texto, botones y formularios.
  - **JetBrains Mono**, recortada, solo para anotaciones.
- **Color:** la paleta de marca, con más contraste.
  - Papel `#F8FAFB` y antracita `#1F2937` como base.
  - Menta `#6EC6B4` y lavanda `#BDAEE1` como marcador (subrayado del H1, relieve del botón, luces de la demo).
  - Menta oscuro `#2E8574` y lavanda oscuro `#6F5BBF` para texto y enlaces.
  - Escena nocturna: fondo `#0F161F` con brillo menta.
  - Sin degradados genéricos.
- **Botón principal:** antracita con "relieve" menta (`box-shadow: 0 6px 0 #6EC6B4`). Al pulsarlo se hunde con un muelle corto y la flecha se desliza. En escritorio tiene atracción magnética sutil (máximo 6 px).
- **Botón secundario:** contorno antracita.
- **Cursor propio:** solo en escritorio y solo sobre las demos (escenas 01, 04 y 05). Un punto con una etiqueta contextual ("prueba", "añade"). Nunca sustituye al cursor fuera de las demos.
- **Principio de movimiento: "colocar, no aparecer".** Los elementos se colocan con un muelle corto y un ligero exceso (overshoot), las líneas guía se dibujan y las medidas se escriben. Cada escena tiene su propio gesto; ningún fade-in genérico se repite.

## 5. Modelo de "sector"

Elemento central: el visitante elige su tipo de negocio y toda la página se adapta.

- **Sectores:** Restaurante · Clínica · Peluquería y estética · Tienda · Academia · Otro (equivale al "General" actual).
- **Fuente única de datos:** `js/sectores.js` (módulo ES). Para cada sector define:
  - nombre y etiqueta;
  - color de acento de la web de ejemplo;
  - textos de la web de ejemplo (nombre ficticio claramente genérico, como "Tu restaurante", titular y botón);
  - 3 productos o servicios de ejemplo para la tienda, con precios de ejemplo marcados como tales;
  - datos del panel de la app (reservas o citas del día, huecos libres);
  - los 4 flujos "hoy, a mano → con la automatización" (los mismos textos que las pestañas actuales);
  - valores iniciales sugeridos para la calculadora.
- **Estado:**
  - un pequeño módulo `js/sector-state.js` guarda el sector elegido (en memoria y en `sessionStorage`) y emite `md:sector` en `document` cuando cambia;
  - cada escena escucha ese evento y se actualiza.
- **Por defecto (con JavaScript):**
  - hasta que el visitante elige, la demo del hero recorre los sectores sola (cambia cada ~4 s);
  - se pausa al pasar el ratón, con el foco o con "reducir movimiento", y se detiene al primer clic o pulsación;
  - el sector inicial del resto de escenas es "Restaurante".
- **Formulario:**
  - si hay un sector elegido, el paso 2 muestra "Para: [sector]";
  - el mensaje se rellena con "Tengo un/una [sector]…" solo si está vacío (mismo criterio que la calculadora);
  - se envía el campo opcional `sector`. El Worker lo valida contra la lista y lo añade al email ("Sector: …"). Si no viene o no es válido, se ignora.
- **Sin JavaScript:** el HTML muestra el sector por defecto ("Clínica" desde el 22/10/2026; antes "Restaurante") en la web de ejemplo, la tienda y el panel, y también los ejemplos de automatización de ese mismo sector (ya no hay sector "General"; su papel lo hace "Otro").

## 6. Escenas

En cada escena se indica su comportamiento en escritorio (≥ 1024 px), tablet (768–1023), móvil (< 768), con "reducir movimiento" (RM) y sin JS.

### 01 · Hero: "Elige tu negocio"

- **Composición:** a la izquierda, el H1 enorme en dos líneas ("Tu idea," / "hecha realidad.", esta última con el subrayado menta). Debajo, el selector de sector y la línea de oferta "Desde 349 € + IVA · lista en 7 días laborables · precio cerrado" con el CTA "Hablemos de tu proyecto". A la derecha, la ventana de navegador con la **web de ejemplo**.
- **Entrada (coreografía, ~1,6 s):**
  1. aparecen la retícula y las marcas de corte;
  2. el H1 se coloca palabra a palabra (sube desde una máscara, con muelle);
  3. el subrayado menta se dibuja;
  4. aparece el selector;
  5. la web de ejemplo se monta: primero las guías, luego los bloques, el color, los textos y la foto, y al final el botón "Reservar".
  - El H1 está visible desde el primer fotograma (sin `opacity: 0` inicial): es el elemento LCP.
- **Interacción:**
  - al elegir otro sector, la web de ejemplo se **reconstruye**: los bloques se desmontan y se vuelven a montar con los textos y el color nuevos (~0,8 s);
  - las anotaciones ("h1 · 48px", "botón: Reservar") se escriben y desaparecen.
- **Selector:** grupo de botones de opción (`role="radiogroup"`), navegable con flechas. El cambio se anuncia con `aria-live` ("Web de ejemplo para restaurante").
- **Tablet y móvil:** el H1 arriba y la web de ejemplo debajo, a todo el ancho. El selector es una fila desplazable. Sin cursor propio.
- **RM:** sin coreografía de entrada; el cambio de sector es un cambio directo de contenido.
- **Sin JS:** el H1 y la web de ejemplo "Restaurante" estáticos. El selector se oculta (`html:not(.js)`).

### 02 · Garantías: "Ficha técnica"

- **Composición:** bloque titulado `// especificaciones` con 4 filas tipo hoja técnica (etiqueta mono + valor grande + nota):
  - "Plazo — 7 días laborables — o te devolvemos el primer plazo";
  - "Precio — cerrado — en 2 plazos";
  - "Trato — directo — con quien diseña y programa";
  - "Después — te acompañamos — 2 meses de soporte".
- **Movimiento:** al entrar, las líneas separadoras se dibujan de izquierda a derecha y los valores se "escriben".
- **Móvil:** filas apiladas. **RM y sin JS:** estado final.

### 03–05 · Servicios: la maqueta que se transforma (escena fijada)

- **Escritorio:** una escena fijada (`ScrollTrigger pin`) de unas 3 pantallas de recorrido. A la derecha, la misma ventana del hero (ya montada con el sector elegido). A la izquierda, un texto que cambia por pasos con un índice "01 Web · 02 Tienda · 03 Apps" que marca el paso activo.
  - **01 Web:** la maqueta tal cual, con anotaciones de lo que incluye (hasta 6 secciones, contenidos editables, SEO, textos legales, analítica). Texto y CTA "Quiero mi web".
  - **02 Tienda:** la web **se convierte** en tienda: los bloques se reorganizan en una rejilla de 3 productos del sector, aparece el carrito.
    - **Demo:** el visitante pulsa "Añadir" en un producto, el carrito se anima (contador con muelle, total actualizado) y aparece el botón "Pagar" con la nota "Pago de prueba".
    - Texto: tiendas con pagos seguros y gestión sencilla. CTA "Quiero mi tienda".
  - **03 Apps:** la tienda se pliega en un **panel de gestión**: barra lateral, reservas o citas del día del sector y huecos libres.
    - **Demo:** al pulsar un hueco libre, este se marca como "reservado" y se actualiza el contador.
    - El lenguaje visual cambia a interfaz de app (más densa, mono). Texto: apps y herramientas internas a medida. CTA "Cuéntanos tu idea".
  - Los productos, los precios de ejemplo y las reservas llevan la nota visible "Ejemplo".
- **Tablet y móvil:** sin fijar. Tres bloques apilados, cada uno con su propia maqueta (web, tienda, panel) y sus demos por toque. La transformación se sustituye por la entrada propia de cada maqueta.
- **RM:** sin fijar; los tres bloques apilados en su estado final y con las demos operativas.
- **Sin JS:** los tres bloques apilados y estáticos (los botones de demo, ocultos).
- **Accesibilidad:** las demos son botones reales. Los cambios del carrito y del panel se anuncian con `aria-live="polite"`.

### 06 · Automatización: "Lo que pasa cuando no miras" (escena nocturna)

- **Composición:** fondo `#0F161F`. Arriba, el mensaje de automatización ("Cuéntanos cómo trabajas. Buscamos qué puedes dejar de hacer a mano.") y el titular de escena.
- **Escritorio (fijada, ~2 pantallas):**
  1. a la izquierda, "Hoy, a mano": 4 tareas del sector (los flujos actuales) como tarjetas desordenadas que "se acumulan", con un contador de tiempo perdido;
  2. al avanzar, una línea luminosa menta recorre las tareas y cada una pasa a "Con la automatización" (texto del flujo, check menta). Las tarjetas se ordenan en una línea conectada;
  3. al final aparece la **calculadora** integrada (misma lógica y textos que ahora): horas al mes, euros al año, amortización. Los números se animan al cambiar.
  - CTA "Quiero mi diagnóstico gratis" (preselecciona Automatización y rellena el mensaje, como ahora).
- **Sector:** los 4 flujos cambian con el sector elegido. Hay un selector de sector compacto en la propia escena, sincronizado con el del hero.
- **Tablet y móvil:** sin fijar; las tareas se transforman una a una al entrar en pantalla. Calculadora debajo.
- **RM y sin JS:** los flujos en su estado final ("hoy → con la automatización"), igual que ahora, con la calculadora operativa si hay JS.

### 07 · Proyectos: vitrina horizontal

- **Escritorio:** escena fijada con desplazamiento horizontal ligado al scroll. Hay 4 paneles a ~70 % del ancho: Luna y Papel, InfanApp, Reservas al vuelo y, al final, "Tu proyecto, aquí" (CTA al contacto).
  - Cada captura real se revela con una máscara que se abre.
  - El título, la etiqueta (E-commerce, App móvil…) y la descripción actual se colocan en capas con un ligero paralaje.
- **Tablet y móvil:** carrusel horizontal nativo con `scroll-snap`, deslizable con el dedo y navegable con teclado (flechas en botones "Anterior / Siguiente").
- **RM:** carrusel nativo sin paralaje. **Sin JS:** carrusel nativo.
- Sin clientes, resultados ni cifras inventados.

### 08 · Planes, revisión gratis, FAQ y contacto

- **Planes:**
  - el plan "Web profesional" con el precio grande (349 € con el "+ IVA" anotado), sus 9 características y el mantenimiento de 15 €/mes;
  - a su lado, "A medida" (tiendas, apps, herramientas, automatizaciones desde 490 €);
  - debajo, "Cómo son tus 7 días" como una **barra de progreso** que se llena con el scroll y enciende los hitos Día 1 · Días 2–5 · Día 6 · Día 7;
  - **RM y sin JS:** la barra llena y los hitos visibles.
- **Revisión gratis:** franja con un campo de dirección que se escribe solo ("tunegocio.com") y 3 mejoras que aparecen tachando problemas. CTA "Quiero la revisión gratis". Mismo texto y compromiso (48 h laborables).
- **FAQ:** las 8 preguntas en dos columnas en escritorio, con `<details>` accesible y animación de altura breve. El texto, idéntico al JSON-LD.
- **Contacto:** el panel antracita actual se rediseña como "brief de proyecto".
  - A la izquierda, el titular "¿Empezamos tu proyecto?", email, WhatsApp y "en remoto, para toda España".
  - A la derecha, el formulario por pasos actual con la estética nueva. Indicador de pasos como regla con marcas.
  - Toda la lógica de `main.js` se mantiene, más el sector (sección 5).

### Navegación y pie

- **Cabecera:** logo, 4 enlaces (Servicios, Automatización, Proyectos, Planes) y "Hablemos".
  - Al bajar se compacta (menos alto, fondo papel opaco) y muestra un indicador fino del progreso de lectura.
  - Los enlaces llevan un subrayado que se dibuja al pasar el ratón.
- **Móvil:** el menú desplegable y la barra fija "Hablemos + WhatsApp" de ahora, con el estilo nuevo.
- **Pie:** el actual (marca, descriptor, Instagram, enlaces, legales, fila "Guías") con el estilo nuevo.

## 7. Arquitectura técnica

- **Sin build ni dependencias de npm,** como ahora.
- **Librerías:** GSAP y ScrollTrigger, copiados en `assets/vendor/gsap/` (versión fijada, con su licencia), unos 45 KB comprimidos. Se cargan con `defer` solo en la home. Ninguna otra librería.
- **Tipografías nuevas,** en `assets/fonts/`:
  - `bricolage-grotesque-latin-var.woff2`, subconjunto latino, unos 60 KB;
  - `jetbrains-mono-latin-400.woff2`, subconjunto mínimo, unos 10 KB.
  - Con su licencia OFL y `@font-face` con `font-display: swap` y métricas de reserva (`size-adjust`, `ascent-override`) para evitar CLS.
  - Se precarga solo Bricolage.
- **Archivos:**
  - `index.html`: contenido completo y semántico de las 8 escenas, el JSON-LD y la analítica (sin cambios).
  - `taller.css`: estilos de la nueva home (tokens, retícula, componentes, escenas). `styles.css` se queda para guías, legales y 404.
  - `site.js`: sin cambios funcionales (menú, barra del móvil, WhatsApp, capturas `data-shot`, revelado). Se retira el revelado genérico de la home.
  - `main.js`: la lógica del formulario por pasos y la calculadora, adaptada a los nuevos selectores, más la integración con el sector.
  - `js/sectores.js`: datos de los sectores (sección 5).
  - `js/sector-state.js`: estado del sector y evento `md:sector`.
  - `js/hero-build.js`: montaje y reconstrucción de la web de ejemplo.
  - `js/escena-servicios.js`: escena fijada web → tienda → app, carrito y panel.
  - `js/escena-automatizacion.js`: transformación de tareas y la calculadora animada.
  - `js/vitrina.js`: escena horizontal de proyectos.
  - `js/interacciones.js`: botones magnéticos, cursor de las demos, cabecera compacta y barra de progreso.
  - `js/movimiento.js`: utilidades comunes (detectar RM y tamaño, registro de ScrollTrigger, muelles).
  - Los módulos se cargan con `<script type="module">`. Si un módulo falla, el contenido HTML sigue visible y usable.
- **Mejora progresiva:**
  - `site.js` añade la clase `js` a `<html>`;
  - los estados iniciales de animación solo se aplican bajo `html.js` y fuera de `prefers-reduced-motion: reduce`;
  - el contenido nunca depende de una animación para verse.
- **Worker:** se acepta el campo opcional `sector` (lista cerrada de 6 valores) y se añade al email. Se amplían las pruebas existentes.
- **CLAUDE.md:** se actualizan las convenciones afectadas:
  - nuevas tipografías y GSAP, alojados en la propia web (no son servicios externos, así que la regla de no cargar servicios externos se mantiene);
  - el orden y los nombres de las escenas;
  - el modelo de sector;
  - `taller.css` y los nuevos módulos;
  - las secciones antiguas que desaparecen (pestañas de sector y bento).

## 8. Rendimiento, accesibilidad y SEO

- **Presupuestos:**
  - JS comprimido < 150 KB (GSAP ~45 KB + código propio ≤ 60 KB);
  - fuentes nuevas ≤ 80 KB;
  - LCP < 2,5 s en móvil (simulado);
  - CLS < 0,05;
  - INP < 200 ms.
- **Imágenes:** las capturas de proyectos en WebP con `width` y `height`, `loading="lazy"` fuera de la primera pantalla y tamaños adecuados.
- **Animación:** solo `transform` y `opacity`; nada de animar `width`, `height` o `top` en escenas fijadas. Los ScrollTrigger se crean con `matchMedia` (escritorio frente a móvil frente a RM) y se recalculan al cambiar de tamaño.
- **Accesibilidad:**
  - contraste AA en todo el texto (la menta y la lavanda puras nunca como color de texto sobre papel);
  - foco visible en todos los controles;
  - orden de tabulación lógico;
  - las demos con botones reales y `aria-live`;
  - las escenas fijadas no atrapan el foco;
  - se respetan `prefers-reduced-motion` y el zoom al 200 %.
- **SEO:** se mantienen el `title`, la descripción, el canonical, Open Graph y el JSON-LD (negocio, web, FAQ). Hay un solo H1 y una jerarquía H2 por escena. El contenido de las demos (sector por defecto) está en el HTML.

## 9. Pruebas y verificación

1. **Local:** `npx wrangler dev` (un solo proceso) y revisión en Chrome real a 1440, 834, 390 y 360 px de ancho, escena por escena, con capturas.
2. **Recorridos:**
   - cambio de sector en el hero y su efecto en la tienda, el panel, la automatización, la calculadora y el formulario;
   - las demos (carrito, panel, calculadora);
   - la vitrina;
   - todos los CTA con `data-servicio`;
   - `?servicio=` desde las guías.
3. **Formulario:**
   - los 6 servicios por los 3 pasos;
   - la validación;
   - "Atrás";
   - Enter;
   - el envío simulado en local, con el email que incluye "Sector";
   - las pruebas del Worker (`test-worker.mjs` ampliado con `sector`).
4. **Accesibilidad:** recorrido completo con teclado, "reducir movimiento" emulado, JavaScript desactivado y zoom al 200 %.
5. **Lighthouse** en móvil y escritorio, contra los presupuestos de la sección 8.
6. **Segunda iteración visual:** con las capturas delante, se hace una lista explícita de lo que aún parezca de plantilla o repetitivo, se corrige y se repiten los pasos 1, 4 y 5.
7. **Entrega:** se presenta la rama para su revisión, con capturas y resultados. El merge a `main` (que publica) se hace **solo con autorización expresa**.

## 10. Riesgos y cómo se mitigan

- **Las escenas fijadas en móvil se sienten pesadas:** en móvil no se fijan; cada escena se apila.
- **El H1 animado retrasa el LCP:** el H1 se pinta visible desde el inicio y solo se anima su posición, nunca su visibilidad.
- **El peso de las fuentes:** subconjuntos latinos, una sola variable para los titulares y precarga solo de Bricolage.
- **La demo parece un producto real o confunde:** los ejemplos llevan la nota "Ejemplo" y los negocios son genéricos ("Tu restaurante").
- **Dos estilos conviviendo** (home nueva y guías antiguas) hasta la fase 2: se comparten el logo, la paleta, Poppins y la estructura de la cabecera y el pie.
- **El mantenimiento del contenido duplicado** (textos de la FAQ y del JSON-LD, flujos por sector): los flujos viven en `js/sectores.js` y en el HTML del sector por defecto. Se documenta en CLAUDE.md.
