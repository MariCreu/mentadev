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
No hay API pública, cron, scraping, modelo de IA ni transporte de mensajes.
SQLite local evita introducir una base pública sin control de acceso.

Flujo: autorización por operador → fichero JSON mínimo → validación de alcance →
transacción SQLite → revisión humana → qualified/rejected/suppressed.
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
automática. Solo URLs HTTPS; no se visitan y se eliminan query y fragmento de web.

Se deduplica por nombre normalizado + municipio. Un mismo nombre en municipios
distintos crea fichas distintas; dos sedes con el mismo nombre en el mismo
municipio requieren revisión manual antes de importar. Variantes de nombre o
municipios bilingües pueden generar duplicados. Se conserva cada referencia de
fuente; reutilizar su ID para otra identidad falla. Reimportar no cambia el estado
ni sobreescribe la ficha. La supresión es irreversible en esta fase y bloquea
cambios de estado; no se borra al reimportar. Las actividades guardan actor, fecha
y estado, sin texto libre. El acceso directo a SQLite puede modificar datos: no
es una frontera de seguridad frente al propietario del equipo.

## Descubrimiento desde fuentes autorizadas

No se entrega ningún conector activo ni listado real. Registro de fuentes vacío
por defecto. Candidatas a evaluar, **no aprobadas**:

| Fuente | Uso propuesto | Condición previa |
| --- | --- | --- |
| Exportación propia o datos aportados por una clínica | Alta manual mínima | Documentar procedencia, finalidad y base del tratamiento |
| Catálogo público sanitario de Generalitat/REGCESS | Verificar centro y municipio | Localizar dataset/export oficial, revisar licencia y condiciones de reutilización; público no equivale a reutilizable |
| Directorios con licencia/API contratada | Descubrimiento limitado | Contrato que permita almacenamiento y uso previsto, cuotas y retención |
| Web propia de la clínica | Confirmación humana de actividad y web | Revisar términos y permiso de acceso/reutilización; sin extracción automática |

Un futuro adaptador debe usar una fuente aprobada del registro, comprobar permiso
y caducidad antes de cada ejecución, limitar peticiones según contrato, conservar
ID y fecha de observación y producir el mismo esquema mínimo. Nada de esquivar
restricciones, copiar Google Maps/directorios sin permiso, comprar listas de
procedencia dudosa o interpretar robots.txt como una licencia. Importar un lote
no autoriza enviar publicidad.

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
3. Preparar interfaz privada con autenticación y roles, decidir alojamiento y
   migración versionada; no reutilizar la web pública como panel CRM.
4. Solo tras revisión jurídica y permisos: modelar evidencia por canal, revocación,
   exclusión y aprobación humana. Cualquier envío queda fuera de esta PR.

No ejecutar despliegues ni migraciones de producción. Abrir PR para revisión;
fusionar `main` publicará la web por la conexión existente.
