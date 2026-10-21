# Prospección MentaDev — fase 1

Base local de CRM para clínicas de salud y estética de la provincia de Alicante
(código INE de provincia `03`). Node 24, SQLite integrado, sin paquetes ni servicios
externos. `node:sqlite` aún emite un aviso experimental en Node 24.

## Decisión de arquitectura

Revisión del repositorio al 21/10/2026: HTML/CSS/JS sin build, pruebas `node --test`,
Worker `worker/index.js` para `/api/contacto`, binding de correo `EMAIL`, sin base
de datos ni autenticación. `wrangler.jsonc` publica la raíz; cada push a `main`
despliega la web. Por ello este módulo vive en `prospecting/`, excluido de assets,
sin imports desde la web y sin tocar el Worker, sus bindings ni el formulario.
No hay API pública, cron, modelo de IA ni transporte de mensajes. La única
conexión a internet es la revisión de la portada de cada clínica (ver más abajo).
SQLite local evita introducir una base pública sin control de acceso.

Flujo: autorización por operador → fichero JSON mínimo → validación de alcance →
transacción SQLite → revisión de la web → ranking y ficha de llamada →
decisión humana → qualified/rejected/suppressed.
`qualified` significa interés comercial interno, nunca permiso de contacto.

## Probar y usar

Desde la raíz del repositorio:

```sh
node --test "tests/*.test.mjs"
mkdir private-data
node prospecting/cli.mjs private-data/crm.sqlite source private-data/source.json
node prospecting/cli.mjs private-data/crm.sqlite import manual private-data/leads.json
node prospecting/cli.mjs private-data/crm.sqlite list
node prospecting/cli.mjs private-data/crm.sqlite status 1 qualified operador
node prospecting/cli.mjs private-data/crm.sqlite status 1 suppressed operador
```

Ejemplo **ficticio**, no constituye autorización para reutilizar una fuente real.
`source.json` (el operador debe obtener y documentar permiso antes de activarlo):

```json
{"id":"manual","url":"https://example.com/dataset","permissionRef":"Referencia al permiso o licencia revisada","reviewedBy":"operador","expiresAt":"2026-11-01T00:00:00Z","enabled":false}
```

`leads.json`:

```json
[{"name":"Clínica Ejemplo","municipality":"Alicante","province":"03","sector":"health_clinic","website":"https://example.com/","sourceRecordId":"clinic-001","observedAt":"2026-10-21T09:00:00Z"}]
```

Sectores: `health_clinic`, `aesthetic_clinic`. Máximo 100 registros por lote,
rechazo completo si uno falla. No se admiten campos adicionales, emails,
teléfonos, personas, pacientes, reseñas ni datos de salud. El código de provincia
es una declaración del importador: el operador debe comprobar municipio y
actividad contra la fuente antes de importar. No hay verificación geográfica
automática. Webs de clínicas con http o https, o vacías si no tienen (las que siguen
en http o no tienen web son justo buenas candidatas); fuentes solo https. Se eliminan query y fragmento de la web.

Se deduplica por nombre normalizado + municipio. Un mismo nombre en municipios
distintos crea fichas distintas; dos sedes con el mismo nombre en el mismo
municipio requieren revisión manual antes de importar. Variantes de nombre o
municipios bilingües pueden generar duplicados. Se conserva cada referencia de
fuente; reutilizar su ID para otra identidad falla. Reimportar no cambia el estado
ni sobreescribe la ficha. La supresión es irreversible en esta fase y bloquea
cambios de estado; no se borra al reimportar. Las actividades guardan actor, fecha
y estado, sin texto libre. El acceso directo a SQLite puede modificar datos: no
es una frontera de seguridad frente al propietario del equipo.

## Revisión de webs y ficha de llamada

```sh
node prospecting/cli.mjs check https://example.com/              # prueba sin guardar nada
node prospecting/cli.mjs private-data/crm.sqlite analyze 1       # o "all": todas menos descartadas y excluidas
node prospecting/cli.mjs private-data/crm.sqlite ranking         # de mejor a peor candidata
node prospecting/cli.mjs private-data/crm.sqlite report 1        # problemas, 3 mejoras y guion de llamada
```

`analyzer.mjs` hace como máximo dos peticiones por clínica, identificándose como
`MentaDevRevision/1.0 (+https://mentadev.com)`: `robots.txt` (si prohíbe la web
entera, no se revisa) y la portada (si responde 401, 403 o 429 tampoco se puntúa:
rechaza robots, no está caída), con 15 s de tiempo límite, 2 MB como máximo
y 2 s de pausa entre webs. No sigue enlaces ni abre otras páginas. Solo guarda
señales técnicas en la tabla `analyses`: conexión segura, adaptación al móvil,
título y descripción, cita online, formulario o WhatsApp (solo si existen),
textos legales, año del pie, gestor de contenidos, tiempo de respuesta y peso.
Nunca emails, teléfonos, nombres ni texto de la página; `crm.mjs` rechaza
cualquier otra señal.

Cada problema suma puntos (tabla `PROBLEMS` de `analyzer.mjs`): cuanto peor está la
web, más alta la puntuación (máximo 10). `report.mjs` genera las 3 mejoras de más
peso y un guion de llamada con plantillas fijas, sin IA y sin afirmar nada que la
revisión no haya comprobado. El guion ofrece no volver a llamar; si lo piden, la
ficha pasa a `suppressed`.

Con `GOOGLE_MAPS_API_KEY` en el entorno (clave restringida a Places API y PageSpeed
Insights API), la velocidad se mide con PageSpeed en móvil (lenta: < 50/100) en lugar
del tiempo de respuesta. En la sesión en la nube de Claude Code, abrir las webs de
las clínicas requiere que la política de red del entorno lo permita.

## Descubrimiento desde fuentes autorizadas

No se entrega ningún listado real y el registro de fuentes está vacío por defecto.
Hay un adaptador para Google Places (abajo); el resto son candidatas a evaluar,
**no aprobadas**:

| Fuente | Uso propuesto | Condición previa |
| --- | --- | --- |
| Exportación propia o datos aportados por una clínica | Alta manual mínima | Documentar procedencia, finalidad y base del tratamiento |
| Catálogo público sanitario de Generalitat/REGCESS | Verificar centro y municipio | Localizar dataset/export oficial, revisar licencia y condiciones de reutilización; público no equivale a reutilizable |
| Google Places API (New), con clave propia | Descubrimiento (`discover`) | Condiciones de Google Maps Platform vigentes: plazo de conservación (`maxAgeDays`), cuotas y presupuesto |
| Otros directorios con licencia/API contratada | Descubrimiento limitado | Contrato que permita almacenamiento y uso previsto, cuotas y retención |
| Web propia de la clínica | Revisión técnica de la portada (`analyze`) y confirmación humana de actividad | Solo señales técnicas; nunca se copian contenidos ni datos de contacto |

Todo adaptador debe usar una fuente aprobada del registro, comprobar permiso
y caducidad antes de cada ejecución, limitar peticiones según contrato, conservar
ID y fecha de observación y producir el mismo esquema mínimo. Nada de esquivar
restricciones, copiar Google Maps/directorios sin permiso, comprar listas de
procedencia dudosa o interpretar robots.txt como una licencia. Importar un lote
no autoriza enviar publicidad.

### Google Places

```sh
# source-google.json: {"id":"google-places","url":"https://cloud.google.com/maps-platform/terms",
#   "permissionRef":"Condiciones de Google Maps Platform revisadas el <fecha>","reviewedBy":"operador",
#   "expiresAt":"<fecha de la próxima revisión>","enabled":true,"maxAgeDays":30}
node prospecting/cli.mjs private-data/crm.sqlite source private-data/source-google.json
node prospecting/cli.mjs private-data/crm.sqlite discover google-places "clínica dental Benidorm" health_clinic
node prospecting/cli.mjs private-data/crm.sqlite purge
```

`discovery.mjs` usa Text Search con `GOOGLE_MAPS_API_KEY` (como máximo 3 páginas de
20 resultados por búsqueda) y pide solo id, nombre, dirección desglosada, web y
estado: nunca teléfono, reseñas, valoraciones ni fotos. Descarta los cerrados y
los que no tienen código postal 03xxx; las clínicas **sin web** se importan
(`website` vacío) y puntúan 10 en `analyze`. El `place_id` se guarda como
`sourceRecordId`, así que repetir una búsqueda renueva la fecha de observación
en vez de duplicar.

Las condiciones de Google Maps Platform no permiten guardar indefinidamente sus
datos (salvo el `place_id`): comprobad el plazo en la versión vigente y ponedlo
en `maxAgeDays`. `purge` borra las referencias de fuentes con plazo que lo han
superado y las fichas que se quedan sin ninguna. Las excluidas se conservan para
respetar que no quieren contacto, pero anonimizadas: se borran nombre, municipio,
web y revisiones, y solo queda una huella (SHA-256 del nombre y el municipio
normalizados) con su estado, para reconocerlas si vuelven a salir en una búsqueda.
Cada comando del CLI ejecuta antes ese borrado, así que no depende de acordarse;
`purge` lo lanza a mano.

La base guarda su versión de esquema (`PRAGMA user_version`) y se actualiza sola
al abrirla, sin perder datos: una base creada con la primera fase se pone al día
al usarla con esta versión. Si cambia `schema.sql`, subir `SCHEMA_VERSION` y añadir
el paso en `migrate()` de `crm.mjs`.

## Protección de datos y contacto en España

Política deliberadamente restrictiva: esta fase no almacena destinos de contacto
ni consentimientos y no puede enviar email, WhatsApp, SMS o llamadas. No conectar
el binding `EMAIL` del formulario al CRM. Un email publicado, una ficha pública,
interés legítimo para tratar datos o marcar `qualified` no autorizan por sí solos
una comunicación electrónica comercial.

La [LSSI, artículos 21 y 22](https://www.boe.es/buscar/act.php?id=BOE-A-2002-13758#a21)
regula las comunicaciones electrónicas: solicitud/autorización previa o la
excepción acotada de relación contractual previa con requisitos y oposición.
Las [llamadas comerciales tienen reglas propias de la AEPD](https://www.aepd.es/preguntas-frecuentes/5-publicidad-no-deseada/FAQ-0503-llamadas-no-solicitadas-con-fines-comerciales-con-intervencion-humana).
No se habilitan esas excepciones en este MVP ni campañas masivas no solicitadas.

Antes de introducir datos personales o contacto: revisión vigente de normativa,
base jurídica por finalidad y canal, información de los arts. 13/14 RGPD,
oposición art. 21, exclusiones publicitarias cuando proceda, prueba de permisos
y revisión humana. El consentimiento de una consulta entrante no debe convertirse
automáticamente en consentimiento de marketing.

Operación local: guardar DB y ficheros solo en `private-data/` o fuera del repo;
carpeta ignorada tanto por Git como por assets. Restringir acceso con permisos del
equipo y cifrado de disco, sin sincronización pública. SQLite no cifra por sí solo.
No registrar importaciones en logs compartidos. Revisar fichas en 90 días como
política inicial: eliminar las que ya no tengan finalidad/base válida mediante un
procedimiento controlado, incluyendo copias y exportaciones. Retener solo el
mínimo de supresión necesario para respetar oposición, con plazo y base
documentados. El borrado y la revisión de retención son manuales en esta fase.

## Siguientes fases

1. Revisar permisos de una fuente concreta y un lote pequeño, sin contacto.
2. Validar deduplicación con direcciones/ID oficial de sedes y municipios INE;
   añadir corrección, borrado y retención auditables antes de ampliar datos.
3. Preparar interfaz privada con autenticación y roles y decidir alojamiento;
   no reutilizar la web pública como panel CRM.
4. Solo tras revisión jurídica y permisos: modelar evidencia por canal, revocación,
   exclusión y aprobación humana. Cualquier envío queda fuera de esta PR.

No ejecutar despliegues ni migraciones de producción. Abrir PR para revisión;
fusionar `main` publicará la web por la conexión existente.
