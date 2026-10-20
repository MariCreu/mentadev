# Rediseño "Taller en directo": segunda iteración visual

Revisión crítica sobre las capturas de la Task 12 (1440, 834, 390 y 360 px; con movimiento, con "reducir movimiento" y sin JS). Para cada punto: escena, qué se ve, por qué resulta genérico o falla, y el cambio.

1. **FAQ: el titular pisa las preguntas (fallo).** A 1440 px, "Lo que suelen preguntarnos" a 76 px desborda su columna (0,7 fr) y se monta sobre la primera pregunta. Además, una FAQ no merece el mismo tamaño que las escenas principales. **Cambio:** titular secundario (máximo 48 px) y columnas 0,6 fr / 1,4 fr.

2. **Todos los titulares iguales.** Todas las escenas abren con el mismo H2 de 76 px arriba a la izquierda, así que la página se lee como una serie de bloques idénticos. **Cambio:** dos escalas con función distinta.
   - **Escenas principales**, a tamaño grande: servicios, automatización, proyectos, planes y contacto.
   - **Escenas de apoyo**, a tamaño medio y pegadas a su contenido: ficha, revisión y FAQ.

3. **Ficha: zona muerta y titular genérico.** A 1440 px, la columna izquierda queda vacía bajo "Así trabajamos contigo" y la sección deja unos 250 px en blanco antes de Servicios. "Así trabajamos contigo" es una frase de plantilla. **Cambio:**
   - el titular pasa a "Lo que firmamos contigo", porque la ficha son compromisos (plazo, precio, trato, después);
   - el titular se queda fijo (sticky) mientras pasan las filas;
   - el espacio inferior baja al 60 % del ritmo general, porque la ficha cierra el hero y no es una escena aparte.

4. **Revisión: kit de tarjeta SaaS.** Panel lavanda, tarjeta blanca con sombra difusa lavanda y, después, otro bloque de espacio doble antes de la FAQ (padding inferior más padding superior). **Cambio:**
   - la demo pasa a ser una hoja con borde fino lavanda, sin sombra, igual que el resto de piezas del taller;
   - el espacio inferior de la sección baja al 60 %.

5. **Flecha "→" en los botones del formulario.** "Siguiente" y "Enviar mensaje" llevan una flecha SVG añadida, el tic típico de plantilla. Ningún otro botón de la página la lleva. **Cambio:** quitar las flechas; el texto del botón ya dice lo que pasa.

6. **Ritmo vertical idéntico.** Todas las secciones usan el mismo `--esc` arriba y abajo. **Cambio:** cubierto por los puntos 3 y 4. Las escenas de apoyo se pegan a la escena que acompañan (ficha → hero, revisión → planes), y las principales mantienen el ritmo completo.

7. **Animaciones.** Revisadas una a una, no se repiten:
   - el hero se construye;
   - Servicios se transforma por tramos;
   - la escena nocturna recoloca las tareas con una línea;
   - la vitrina avanza en horizontal con capturas reveladas;
   - la ficha traza su regla;
   - los 7 días avanzan por hitos;
   - la revisión escribe la dirección.

   No hay fundidos genéricos por sección. **Sin cambios.**

8. **Tablet (834 px).** No hay zonas muertas: las escenas se apilan y la vitrina pasa a carrusel. La nota "6 secciones", que tapaba el titular de la web de ejemplo, ya se corrigió en la Task 12. **Sin más cambios.**

9. **Jerarquía de los CTA.** Hay un único estilo principal: antracita con relieve menta. La versión menta con relieve lavanda se usa solo sobre fondo oscuro. El secundario es el contorno. En cada escena hay como mucho un CTA principal. CLAUDE.md dice "CTA principal en lavanda", pero el sistema visual aprobado en la spec usa la antracita con el relieve menta y lavanda como marcador. **Sin cambios en el diseño; en la Task 14 se actualiza CLAUDE.md para que refleje el sistema vigente.**

10. **Textos genéricos.** Además del titular de la ficha (punto 3), el resto de textos son concretos: plazos, precios, ejemplos por sector y proyectos reales. **Sin más cambios.**
