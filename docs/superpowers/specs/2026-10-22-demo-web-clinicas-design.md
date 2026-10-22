# Demo de web para cada clínica — diseño

Fecha: 2026-10-22 · Estado: aprobado por la titular

> **Cambio del 2026-10-22 (decisión de la titular):** se quitó la «Pedir cita» en 3 pasos y todos los botones «Pedir cita». La demo se centra en dar confianza cuando un paciente busca a la clínica; los CTA son «Llamar» (solo con teléfono) y «Contacto». La reserva de citas desde la web se ofrece solo como extra opcional en el email, presupuestada aparte. Las menciones a la cita en 3 pasos de más abajo quedan como histórico.

## Para qué

Cuando una clínica dice que sí por teléfono, hoy le mandamos un email con texto: qué tendría su web
(o 3 mejoras si ya tiene) y el precio. La titular quiere que **lo vean, no solo leerlo**: un enlace a
una web de ejemplo con el nombre de su clínica, que puedan abrir, recorrer y probar en el móvil, para
que se hagan una idea real. «La idea es dejárselo lo mejor posible.» La primera será la del
doctor Soler (#29, Benidorm, sin web).

## Objetivos

- Una **plantilla** de web de clínica que se rellena con el nombre, el teléfono, el municipio y el
  tipo de cada clínica. **El horario y la dirección son de ejemplo** (inventados) y se avisa de ello.
- En el panel, botón **«Preparar demo»** en la ficha: genera el enlace al momento.
- El enlace va en el **borrador del email** de las clínicas que han dicho que sí, con o sin web.
- Tres cosas que tienen que lucir (elegidas por la titular):
  1. **«Abierto ahora · cierra a las 20:00»** calculado con el horario de ejemplo (hora de Madrid),
     junto a **llamar** y **WhatsApp** en un toque.
  2. **Selector de idioma ES / EN** con todo el contenido traducido de verdad (en la Marina
     Baixa muchos pacientes son extranjeros).
  3. **Pedir cita en 3 pasos:** motivo → franja preferida → datos, con «os confirmamos por teléfono».
- Lo básico de una web de clínica: portada con nombre y «Pedir cita» siempre visible, tratamientos,
  «sobre la clínica», primera visita / cómo trabajamos, contacto con horario y cómo llegar.
- **Fotos ficticias** de bancos con licencia libre (Unsplash, Pexels…), alojadas por nosotros.

## No objetivos

- No es la web definitiva ni se publica como web de la clínica.
- Sin presupuesto orientativo, sin antes/después, sin simulador, sin tour virtual (descartados).
- La cita no se envía a ningún sitio.
- No se genera nada automáticamente para clínicas que no han dicho que sí.
- No se piden datos nuevos a Google Places: no hacen falta.
- Neerlandés y alemán, por ahora (ver Idiomas).

## Lo que haría que fracase aunque funcione

- Que parezca que mentimos: reseñas, casos o precios inventados, o una cara de otro médico
  presentada como el doctor. **En «sobre el doctor/la clínica» no sale ninguna persona** (consulta,
  instrumental, manos); las caras solo en fotos de ambiente.
- Que alguien que recibe el enlace reenviado crea que es la web real: cada foto lleva la etiqueta
  pequeña **«Foto de ejemplo»**, el horario y la dirección llevan **«Ejemplo»**, y la página una franja
  discreta «Web de ejemplo preparada por MentaDev para [clínica]. Fotos, horario, dirección y textos
  son orientativos».
- Que la dirección de ejemplo sea la de otro negocio real: tiene que ser claramente ficticia
  (p. ej. «Calle Ejemplo, 1 · Benidorm»), con el municipio real.
- Que aparezca en Google o que quede publicado algo de una clínica concreta.
- Que se vea pobre en el móvil: tiene que impresionar a 360 px.

## Restricciones

- **Datos de cada clínica dentro del enlace**, no en el servidor: una sola página pública genérica
  en `mentadev.com/demo/` y los datos en el fragmento (`#…`, que el navegador no envía al
  servidor), codificados (JSON → base64url). Nada que publicar por clínica y nada que borrar fuera
  del ordenador si una clínica pide no saber más de nosotros.
- La página trata lo que lee del enlace como texto (nunca `innerHTML`), valida y recorta cada campo,
  y si el enlace falta o está roto muestra la demo con «Vuestra clínica» y datos de ejemplo.
- `noindex` (meta y `X-Robots-Tag` en `_headers`), fuera de `sitemap.xml`, `Disallow: /demo/` en
  `robots.txt`. Sin el script de Cloudflare Web Analytics: el enlace lleva datos de la clínica y no deben salir del navegador.
- Igual que mentadev.com: sin servicios externos (fotos y fuentes propias; nada de mapa incrustado:
  «cómo llegar» es una ilustración o foto de ejemplo), sin cookies, HTML/CSS/JS vanilla,
  mobile-first, contraste, foco visible y `prefers-reduced-motion`.
- La demo es la web **de la clínica**, no de MentaDev: estilo propio de clínica (limpio, luminoso,
  con fotos), no `taller.css`. MentaDev solo aparece en la franja de aviso y en el pie
  («Web de ejemplo hecha por MentaDev»). Sin emojis.
- **Prospección:** el código nuevo del panel vive en `prospecting/` y la web pública no importa nada
  de ahí (el panel solo construye el enlace). La plantilla `demo/` sí se publica.

## Decidido con la titular

- Demo con enlace clicable, no capturas.
- Las 3 funciones de arriba; fotos ficticias en lugar de «tu foto aquí», explicadas en el email y
  etiquetadas en la demo.
- Plantilla + botón en el panel (no hecha a mano por clínica).
- **Horario y dirección inventados**, avisados como ejemplo (en la demo y en el email).
- **Idiomas:** solo español e inglés; neerlandés y alemán quedan para más adelante, cuando alguien
  pueda revisarlos (la plantilla debe permitir añadirlos sin rehacerla).

## Decisiones mías (revisables)

- **Para todas las que digan que sí:** sin web → la propuesta lleva la demo como pieza central;
  con web → se mantienen las 3 mejoras y se añade «así podría verse vuestra web nueva».
- **Tipos de clínica:** dental, fisioterapia, médica (general/especialista) y estética, más uno
  genérico. El tipo decide tratamientos, textos, fotos y el horario de ejemplo. Se **elige en el
  panel** al preparar la demo (la titular lo sabe tras la llamada); por defecto, genérico.
- **Horario de ejemplo:** uno típico por tipo (p. ej. dental L–V 9:00–14:00 y 16:00–20:00), para
  que el «abierto ahora» funcione y tenga sentido.
- **Nombre en la demo:** el guardado por defecto, pero editable en el panel antes de generar el
  enlace (Google tiene «Soler Domínguez Rafael»; queda mejor «Consulta del Dr. Soler»). No cambia el
  nombre guardado.
- **Tratamientos:** cada tipo trae una lista amplia; en el panel se marcan los que hace esa clínica
  (por defecto, los más habituales del tipo) y viajan en el enlace como índices. Así no le
  atribuimos a una clínica algo que no hace (la titular puede preguntarlo en la llamada).
- **Lo editado se guarda:** tabla `demos` (una fila por clínica: nombre mostrado, tipo, tratamientos,
  WhatsApp sí/no, fecha), con nueva versión del esquema, el mismo plazo de conservación que el resto
  de datos de la clínica y borrado al anonimizar. El borrador del email lee de ahí el enlace y el
  nombre.
- **WhatsApp y llamar:** usan el teléfono real de la clínica (es su web). Como no sabemos si ese
  número tiene WhatsApp, el botón de WhatsApp se puede quitar desde el panel.
- **Cita en 3 pasos:** al terminar enseña un resumen y «En vuestra web, esta solicitud os llegaría al
  momento por email». No envía nada.
- **Idiomas:** textos fijos de cada tipo escritos a mano en español e inglés, sin traducción
  automática. El idioma inicial sigue al del navegador; el nombre no se traduce.
- **Orden de construcción:** primero lo que necesita la demo del doctor Soler (plantilla con todos
  los tipos, panel, email sin web); después el guion y el email de las clínicas con web.
- **Guion de llamada:** la oferta pasa a ser «os hemos preparado una web de ejemplo con el nombre de
  vuestra clínica; ¿os mandamos el enlace por email?». Para clínicas con web: «una revisión con 3
  mejoras y una idea de cómo podría verse». Las respuestas que mencionan «la propuesta» se adaptan.
  Añadir a «Antes de llamar»: preguntar, si sale, qué tratamientos hacen.
- **Email:** enlace con texto («Ver la web de ejemplo de [clínica]») y la explicación: «Las fotos, el
  horario y la dirección son de ejemplo y los textos, orientativos: es una idea para que veáis cómo
  quedaría. La adaptaríamos a vuestra clínica con vuestras fotos, tratamientos y datos.» Se mantienen
  precio, plazo, garantía, origen del email y la baja.
- **Pruebas:** codificar/leer el enlace (ida y vuelta, campos maliciosos, enlace roto), cálculo de
  «abierto ahora» (incluido cierre a mediodía y fin de semana), borrador del email con enlace, y que la
  demo tenga `noindex`, las etiquetas de ejemplo y el aviso.

## Lo que queda para quien lo construya

- Diseño visual concreto de la plantilla (dentro de las restricciones), estructura de archivos de
  `demo/` y elección de las fotos (que encajen con cada tipo, con licencia que permita uso
  comercial, y se apunte su origen en un archivo de créditos).
- Cómo se muestra en el panel (botón, campos editables, copiar enlace, previsualizar).
