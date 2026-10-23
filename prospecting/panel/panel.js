// Panel local de prospección. Todo el contenido de las clínicas se pinta con textContent (nunca innerHTML).
const $ = (s) => document.querySelector(s);
const TITULOS = {
  porllamar: ['Clínicas por llamar', 'De mejor a peor candidata, según lo que le falta a su web.'],
  interesadas: ['Interesadas', 'Las que han mostrado interés. Prepara su propuesta.'],
  seguimiento: ['Seguimiento', 'Emails enviados hace 3 días laborables o más y sin respuesta. Llámales.'],
  descartadas: ['Descartadas', 'No encajan ahora. Puedes devolverlas a «por llamar».'],
  nollamar: ['No llamar', 'Han pedido no recibir más llamadas. No vuelven a salir en las búsquedas.'],
  todas: ['Todas las clínicas', 'Todo lo que hay en tu base local.'],
};
const ESTADOS = { new: 'Por llamar', qualified: 'Interesada', rejected: 'Descartada', suppressed: 'No llamar' };
const SECTOR = { health_clinic: 'Salud', aesthetic_clinic: 'Estética' };
let vista = 'porllamar';
let seleccion = null;
let fichaActual = null;
let sondeo = null;

async function api(ruta, cuerpo) {
  const opciones = cuerpo === undefined ? {} : { method: 'POST', headers: { 'content-type': 'application/json', 'x-panel': '1' }, body: JSON.stringify(cuerpo) };
  const res = await fetch(ruta, opciones);
  const datos = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(datos.error || `Error ${res.status}`);
  return datos;
}

function aviso(texto, error = false) {
  const el = document.createElement('div');
  el.className = `aviso${error ? ' es-error' : ''}`;
  el.textContent = texto;
  $('#avisos').append(el);
  setTimeout(() => el.remove(), 3200);
}

const banda = (score) => (score >= 8 ? 'banda-alta' : score >= 5 ? 'banda-media' : '');
const esMovil = (tel) => /^[67]/.test((tel ?? '').replace(/\D/g, '').replace(/^34/, ''));
const enlaceTel = (tel) => `tel:+34${tel.replace(/\D/g, '').replace(/^34/, '')}`;
function el(etiqueta, clase, texto) {
  const e = document.createElement(etiqueta);
  if (clase) e.className = clase;
  if (texto !== undefined) e.textContent = texto;
  return e;
}

// ---------- Lista ----------
async function cargar() {
  const { clinicas, cuentas } = await api(`/api/clinicas?vista=${vista}`);
  for (const [clave, n] of Object.entries(cuentas)) {
    const b = document.querySelector(`[data-cuenta="${clave}"]`);
    if (b) b.textContent = n;
  }
  $('#revisar').hidden = cuentas.pendientes === 0;
  $('#revisar').textContent = `Revisar webs pendientes (${cuentas.pendientes})`;
  const [titulo, sub] = TITULOS[vista];
  $('#titulo').textContent = titulo;
  $('#subtitulo').textContent = sub;

  const lista = $('#lista');
  lista.replaceChildren(...clinicas.map(fila));
  $('#vacio').hidden = clinicas.length > 0;
  if (seleccion && !clinicas.some((c) => c.id === seleccion)) cerrarFicha();
}

function fila(c) {
  const li = el('li');
  const b = el('button', 'fila');
  b.type = 'button';
  b.dataset.id = c.id;
  if (c.id === seleccion) b.setAttribute('aria-current', 'true');
  const nota = el('span', `nota-fila ${c.score !== null && !c.blocked ? banda(c.score) : ''}`);
  if (c.blocked) { nota.append('—', el('small', '', 'a mano')); } else if (c.score === null) { nota.append('—', el('small', '', 'sin revisar')); } else { nota.textContent = c.score; }
  nota.setAttribute('aria-label', c.score === null || c.blocked ? 'Sin puntuación' : `${c.score} sobre 10`);
  const centro = el('span');
  centro.append(el('span', 'fila-nombre', c.name));
  const meta = el('span', 'fila-meta');
  meta.append(el('span', '', `${c.municipality} · ${SECTOR[c.sector] ?? ''}`));
  if (!c.website) meta.append(el('span', 'chip chip-fuerte', 'Sin web'));
  if (vista === 'todas' && c.status !== 'new') meta.append(el('span', `chip ${c.status === 'qualified' ? 'chip-ok' : c.status === 'suppressed' ? 'chip-mal' : ''}`, ESTADOS[c.status]));
  centro.append(meta);
  b.append(nota, centro, el('span', 'fila-tel', c.phone ?? 'sin teléfono'));
  b.addEventListener('click', () => abrir(c.id));
  li.append(b);
  return li;
}

// ---------- Ficha ----------
// Lo que va entre paréntesis son indicaciones para quien llama: se pintan aparte.
function frase(etiqueta, texto) {
  const e = el(etiqueta);
  for (const trozo of texto.split(/(\([^)]*\))/)) {
    if (!trozo) continue;
    e.append(/^\(.*\)$/.test(trozo) ? el('em', 'indicacion', trozo.slice(1, -1)) : document.createTextNode(trozo));
  }
  return e;
}
function paso(p) {
  const li = el('li', 'paso');
  li.append(el('h4', '', p.titulo));
  for (const f of p.frases) {
    const linea = frase('p', f);
    if (f.startsWith('·')) linea.className = 'punto-guion';
    li.append(linea);
  }
  if (p.siRecepcion) {
    const caja = el('div', 'recepcion');
    caja.append(el('p', 'recepcion-t', 'Si contesta recepción'), ...p.siRecepcion.map((f) => frase('p', f)));
    li.append(caja);
  }
  return li;
}
function elegirPestana(id, foco = true) {
  for (const t of document.querySelectorAll('.subpestanas [role="tab"]')) {
    const activa = t.id === id;
    t.setAttribute('aria-selected', String(activa));
    t.tabIndex = activa ? 0 : -1;
    $(`#${t.getAttribute('aria-controls')}`).hidden = !activa;
    if (activa && foco) t.focus();
  }
}
document.querySelectorAll('.subpestanas [role="tab"]').forEach((t, i, todas) => {
  t.addEventListener('click', () => elegirPestana(t.id));
  t.addEventListener('keydown', (e) => {
    const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (d) { e.preventDefault(); elegirPestana(todas[(i + d + todas.length) % todas.length].id); }
  });
});
const textoGuion = (f) => [
  ...f.pasos.flatMap((p) => [`${p.titulo.toUpperCase()}`, ...p.frases, ...(p.siRecepcion ? ['Si contesta recepción:', ...p.siRecepcion] : []), '']),
  'SI TE QUEDAS EN BLANCO', ...f.apuros, '',
  'SI TE PREGUNTAN…', ...f.preguntas.flatMap((q) => [`«${q.pregunta}»`, q.respuesta, '']),
].join('\n');
function cerrarFicha() {
  seleccion = null;
  fichaActual = null;
  $('#ficha-detalle').hidden = true;
  $('#ficha-vacia').hidden = false;
}

async function abrir(id) {
  seleccion = id;
  document.querySelectorAll('.fila').forEach((f) => f.toggleAttribute('aria-current', Number(f.dataset.id) === id));
  document.querySelectorAll('.fila[aria-current]').forEach((f) => f.setAttribute('aria-current', 'true'));
  pintar(await api(`/api/clinicas/${id}`));
}

const fechaCorta = (iso) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '');

function pintar({ clinica, ficha, consentimiento, seguimiento, email, demo, demoPorDefecto, catalogo }) {
  fichaActual = { clinica, ficha, consentimiento, email, demo, catalogo };
  $('#ficha-vacia').hidden = true;
  $('#ficha-detalle').hidden = false;

  $('#f-lugar').textContent = `${clinica.municipality} · ${SECTOR[clinica.sector] ?? ''}`;
  $('#f-nombre').textContent = clinica.name;
  $('#f-estado').textContent = ESTADOS[clinica.status];
  $('#f-estado').dataset.estado = clinica.status;

  const tel = $('#f-tel');
  tel.hidden = !clinica.phone;
  $('#copiar-tel').hidden = !clinica.phone;
  $('#f-sin-tel').hidden = Boolean(clinica.phone);
  if (clinica.phone) { tel.textContent = clinica.phone; tel.href = enlaceTel(clinica.phone); }
  $('#f-movil').hidden = !esMovil(clinica.phone);
  $('#f-email-web').hidden = !ficha.emailWeb;
  $('#f-email-web').textContent = ficha.emailWeb ? `Email en su web: ${ficha.emailWeb} (confírmalo en la llamada)` : '';

  const web = $('#f-web');
  web.hidden = !clinica.website;
  $('#f-sin-web').hidden = Boolean(clinica.website);
  if (clinica.website) { web.textContent = clinica.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''); web.href = clinica.website; }
  // Comprobación a mano: el guion se adapta a lo que encuentres.
  $('#f-verificada').hidden = !clinica.web_verificada;
  $('#f-verificada').textContent = clinica.web_verificada ? `Comprobado por ti el ${fechaCorta(clinica.web_verificada)}` : '';
  $('#f-sin-web').hidden = Boolean(clinica.website) || Boolean(clinica.web_verificada);
  $('#f-comprobar').hidden = clinica.status === 'suppressed';
  $('#f-comprobar-t').textContent = clinica.website ? '¿No es la suya, o ya no la tiene?' : (clinica.web_verificada ? '¿Al final sí tiene web?' : '¿Seguro que no tiene web? Búscala en Google y dímelo:');
  $('#b-sin-web').hidden = !clinica.website && Boolean(clinica.web_verificada);
  $('#b-sin-web').textContent = clinica.website ? 'No tiene web' : 'Confirmado: no tiene web';
  $('#b-otra-web').textContent = clinica.website ? 'Es otra dirección' : 'He encontrado su web';
  $('#form-web').hidden = true;

  const revisada = ficha.estado === 'revisada';
  $('#f-puntuacion').hidden = !revisada;
  $('#f-bloqueada').hidden = ficha.estado !== 'bloqueada';
  $('#f-sin-revisar').hidden = ficha.estado !== 'sin-revisar';
  $('#f-pestanas').hidden = !revisada || !ficha.mejoras.length;
  if (revisada) {
    const nota = $('#f-score');
    nota.textContent = ficha.score;
    nota.className = `nota-grande ${banda(ficha.score)}`;
    nota.setAttribute('aria-label', `${ficha.score} sobre 10`);
    $('#f-problemas').replaceChildren(...(ficha.problemas.length ? ficha.problemas : ['Su web está bien resuelta']).map((p) => el('li', '', p)));
  }
  if (revisada && ficha.mejoras.length) {
    $('#f-antes').replaceChildren(...ficha.antes.map((a) => el('li', '', a)));
    $('#f-detalle').replaceChildren(...ficha.detalle.flatMap((d) => [el('dt', '', d.problema), el('dd', '', d.significa)]));
    $('#f-mejoras').replaceChildren(...ficha.mejoras.map((m) => el('li', '', m)));
    $('#f-revision-t').textContent = ficha.sinWeb ? 'Qué les mandamos gratis (díselo así)' : 'Qué es la revisión gratis (díselo así)';
    $('#f-revision').textContent = ficha.revision;
    $('#f-pasos').replaceChildren(...ficha.pasos.map(paso));
    $('#f-apuros').replaceChildren(...ficha.apuros.map((a) => el('li', '', a)));
    $('#f-preguntas').replaceChildren(...ficha.preguntas.map((q) => {
      const d = el('details', 'pregunta');
      const s = el('summary', '', q.pregunta);
      d.append(s, frase('p', q.respuesta));
      return d;
    }));
    elegirPestana('t-resumen', false);
  }

  document.querySelectorAll('.acciones [data-estado]').forEach((b) => { b.hidden = clinica.status === 'suppressed' || b.dataset.estado === clinica.status; });
  $('#no-llamar').hidden = clinica.status === 'suppressed';
  $('#han-dicho-si').hidden = clinica.status === 'suppressed' || Boolean(consentimiento);
  pintarDemo(clinica, demo ?? demoPorDefecto, demo, catalogo);
  // Email para enviar a quien ha dicho que sí.
  $('#f-correo').hidden = !email;
  if (email) {
    $('#f-consentido').textContent = `Dijo que sí ${consentimiento.quien}, el ${fechaCorta(consentimiento.fecha)}.`;
    $('#e-para').textContent = email.para;
    $('#e-asunto').textContent = email.asunto;
    $('#e-cuerpo').textContent = email.cuerpo;
    const sinDemo = demo ? '' : ' Prepara la web de ejemplo para añadirla al email.';
    $('#e-nota').textContent = (ficha.sinWeb ? 'Repásalo antes de enviarlo.' : 'Antes de enviarlo, mira su web un momento para confirmar lo que dice. Lo prometimos en 48 h laborables.') + ' Comprueba que en «De» pone info@mentadev.com y que sale la firma.' + sinDemo;
    // Redacción de Gmail ya rellenada; el remitente y la firma son los predeterminados de Gmail (info@mentadev.com).
    $('#e-abrir').href = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email.para)}&su=${encodeURIComponent(email.asunto)}&body=${encodeURIComponent(email.cuerpo)}`;
    pintarSeguimiento(seguimiento, ficha);
  }
  if (matchMedia('(max-width: 980px)').matches) $('#ficha').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ---------- Web de ejemplo ----------
// «Abrir demo» abre la vista previa de este ordenador (mismo fragmento #d=); «Copiar enlace» copia el de mentadev.com.
const enlaceLocal = (enlace) => `${location.origin}/demo/${new URL(enlace).hash}`;
function casillasDemo(tipo, marcados) {
  const titulos = fichaActual.catalogo.tratamientos[tipo];
  $('#d-trat').replaceChildren(...titulos.map((t, i) => {
    const l = el('label');
    const c = el('input');
    c.type = 'checkbox';
    c.value = i;
    c.checked = marcados.includes(i);
    l.append(c, el('span', '', t));
    return l;
  }));
}
function pintarDemo(clinica, valores, guardada, catalogo) {
  $('#f-demo').hidden = clinica.status === 'suppressed';
  if (clinica.status === 'suppressed') return;
  $('#d-nombre').value = valores.nombre;
  $('#d-tipo').replaceChildren(...catalogo.tipos.map((t) => { const o = el('option', '', t.nombre); o.value = t.id; return o; }));
  $('#d-tipo').value = valores.tipo;
  casillasDemo(valores.tipo, valores.tratamientos);
  const hayTel = Boolean(clinica.phone);
  $('#d-wa').disabled = !hayTel;
  $('#d-wa').checked = hayTel && valores.whatsapp;
  $('#d-wa-t').textContent = hayTel ? 'Con WhatsApp' : 'Con WhatsApp (no tiene teléfono)';
  $('#d-guardar').textContent = guardada ? 'Guardar cambios' : 'Preparar demo';
  $('#d-abrir').hidden = !guardada;
  $('#d-copiar').hidden = !guardada;
  if (guardada) $('#d-abrir').href = enlaceLocal(guardada.enlace); else $('#d-abrir').removeAttribute('href');
  $('#d-fecha').hidden = !guardada;
  $('#d-fecha').textContent = guardada ? `Guardada el ${fechaCorta(guardada.fecha)}. Si cambias algo, pulsa «Guardar cambios» para actualizar el enlace.` : '';
}
// Al cambiar de tipo se marcan los tratamientos que suelen encajar con él.
$('#d-tipo').addEventListener('change', () => {
  if (fichaActual) casillasDemo($('#d-tipo').value, fichaActual.catalogo.defecto[$('#d-tipo').value]);
});
$('#form-demo').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!fichaActual) return;
  const tratamientos = [...document.querySelectorAll('#d-trat input:checked')].map((c) => Number(c.value));
  if (tratamientos.length === 0) return aviso('Marca al menos un tratamiento', true);
  const boton = $('#d-guardar');
  boton.disabled = true;
  try {
    const datos = await api(`/api/clinicas/${fichaActual.clinica.id}/demo`, {
      nombre: $('#d-nombre').value,
      tipo: $('#d-tipo').value,
      tratamientos,
      whatsapp: $('#d-wa').checked,
    });
    pintar(datos);
    aviso('Demo preparada: ya puedes abrirla o copiar el enlace');
  } catch (error) { aviso(error.message, true); } finally { boton.disabled = false; }
});
$('#d-copiar').addEventListener('click', () => fichaActual?.demo && copiar(fichaActual.demo.enlace, 'Enlace'));

async function marcar(estado, confirmar = false) {
  if (!fichaActual) return;
  const { clinica } = fichaActual;
  try {
    await api(`/api/clinicas/${clinica.id}/estado`, { estado, confirmar });
    aviso(`${clinica.name}: ${ESTADOS[estado].toLowerCase()}`);
    await cargar();
    if (seleccion) await abrir(clinica.id);
  } catch (error) { aviso(error.message, true); }
}

document.querySelectorAll('.acciones [data-estado]').forEach((b) => b.addEventListener('click', () => marcar(b.dataset.estado)));
$('#no-llamar').addEventListener('click', () => {
  $('#confirmar-nombre').textContent = fichaActual?.clinica.name ?? '';
  $('#confirmar').showModal();
});
$('#confirmar').addEventListener('close', () => { if ($('#confirmar').returnValue === 'si') marcar('suppressed', true); });

async function copiar(texto, que) {
  try { await navigator.clipboard.writeText(texto); aviso(`${que} copiado`); } catch { aviso('No se ha podido copiar', true); }
}
$('#copiar-tel').addEventListener('click', () => fichaActual?.clinica.phone && copiar(fichaActual.clinica.phone, 'Teléfono'));
$('#copiar-guion').addEventListener('click', () => fichaActual && copiar(textoGuion(fichaActual.ficha), 'Guion'));

// ---------- Pestañas ----------
document.querySelectorAll('[data-vista]').forEach((b) => b.addEventListener('click', () => {
  vista = b.dataset.vista;
  document.querySelectorAll('[data-vista]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
  cerrarFicha();
  cargar();
}));

// ---------- Buscar y revisar (trabajos largos con progreso) ----------
function pintarTrabajo(t) {
  const caja = $('#trabajo');
  const visible = t.activo || t.error || t.mensaje;
  caja.hidden = !visible;
  caja.classList.toggle('es-error', Boolean(t.error));
  $('#trabajo-mensaje').textContent = t.error ? `No se ha podido completar: ${t.error}` : t.mensaje;
  $('#trabajo-barra').style.width = t.total ? `${Math.round((t.hecho / t.total) * 100)}%` : t.activo ? '8%' : '100%';
  $('#buscar').disabled = t.activo;
  $('#revisar').disabled = t.activo;
}

async function seguir() {
  clearTimeout(sondeo);
  const t = await api('/api/trabajo');
  pintarTrabajo(t);
  if (t.activo) { sondeo = setTimeout(seguir, 800); return; }
  await cargar();
  if (!t.error && t.mensaje) { aviso(t.mensaje); setTimeout(() => { if (!$('#buscar').disabled) $('#trabajo').hidden = true; }, 6000); }
}

$('#buscador').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    pintarTrabajo(await api('/api/buscar', { consulta: $('#consulta').value, sector: $('#sector').value }));
    seguir();
  } catch (error) { aviso(error.message, true); }
});
$('#revisar').addEventListener('click', async () => {
  try { pintarTrabajo(await api('/api/revisar', {})); seguir(); } catch (error) { aviso(error.message, true); }
});

// ---------- Arranque ----------
(async () => {
  const { clave } = await api('/api/estado');
  if (!clave) {
    $('#clave').hidden = false;
    $('#clave').textContent = 'Falta la clave de Google en private-data/.env: puedes ver y gestionar, pero no buscar';
    $('#buscar').disabled = true;
  }
  await cargar();
  const t = await api('/api/trabajo');
  if (t.activo) { pintarTrabajo(t); seguir(); }
})();

// ---------- Comprobar la web ----------
async function guardarWeb(web) {
  if (!fichaActual) return;
  const boton = $('#form-web button');
  boton.disabled = true;
  try {
    aviso(web ? 'Revisando su web…' : 'Apuntado: no tiene web');
    pintar(await api(`/api/clinicas/${fichaActual.clinica.id}/web`, { web }));
    if (web) aviso('Web revisada: el guion ya está adaptado');
    await cargar();
  } catch (error) { aviso(error.message, true); } finally { boton.disabled = false; }
}
$('#b-sin-web').addEventListener('click', () => guardarWeb(null));
$('#b-otra-web').addEventListener('click', () => { $('#form-web').hidden = false; $('#i-web').focus(); });
$('#form-web').addEventListener('submit', (e) => { e.preventDefault(); guardarWeb($('#i-web').value); });

// ---------- Han dicho que sí ----------
$('#han-dicho-si').addEventListener('click', () => {
  $('#si-nombre').textContent = fichaActual?.clinica.name ?? '';
  $('#form-si').reset();
  $('#si-email').value = fichaActual?.ficha?.emailWeb ?? '';
  $('#dialogo-si').showModal();
});
$('#si-cancelar').addEventListener('click', () => $('#dialogo-si').close());
$('#form-si').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const datos = await api(`/api/clinicas/${fichaActual.clinica.id}/si`, { email: $('#si-email').value, quien: $('#si-quien').value, atencion: $('#si-atencion').value });
    $('#dialogo-si').close();
    aviso('¡Apuntado! Ya tienes el email preparado');
    await cargar();
    pintar(datos);
    $('#f-correo').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) { aviso(error.message, true); }
});
$('#e-copiar').addEventListener('click', () => fichaActual?.email && copiar(`Para: ${fichaActual.email.para}\nAsunto: ${fichaActual.email.asunto}\n\n${fichaActual.email.cuerpo}`, 'Email'));

// ---------- Seguimiento del email enviado ----------
function pintarSeguimiento(seguimiento, ficha) {
  const respondido = Boolean(seguimiento?.resultado);
  $('#s-enviado').textContent = seguimiento ? 'Lo he vuelto a enviar' : 'Email enviado';
  $('#s-texto').hidden = !seguimiento;
  $('#s-resultados').hidden = !seguimiento || respondido;
  const textos = { contestado: 'Ha contestado', quiere: 'Quiere la web', no_interesa: 'No le interesa' };
  if (seguimiento) {
    $('#s-texto').textContent = respondido
      ? `Enviado el ${fechaCorta(seguimiento.enviado)} · ${textos[seguimiento.resultado]} (${fechaCorta(seguimiento.resultado_fecha)})`
      : `Enviado el ${fechaCorta(seguimiento.enviado)} · seguimiento a partir del ${fechaCorta(seguimiento.desde)}`;
  }
  const guion = ficha.seguimiento;
  $('#s-guion').hidden = !guion?.toca;
  $('#s-frases').replaceChildren(...(guion?.toca ? guion.guion.map((f) => frase('p', f)) : []));
}
$('#s-enviado').addEventListener('click', async () => {
  if (!fichaActual) return;
  try {
    const datos = await api(`/api/clinicas/${fichaActual.clinica.id}/enviado`, {});
    aviso('Apuntado: te avisamos para el seguimiento');
    await cargar();
    pintar(datos);
  } catch (error) { aviso(error.message, true); }
});
document.querySelectorAll('[data-resultado]').forEach((b) => b.addEventListener('click', async () => {
  if (!fichaActual) return;
  const id = fichaActual.clinica.id;
  try {
    const datos = await api(`/api/clinicas/${id}/resultado`, { resultado: b.dataset.resultado });
    aviso('Apuntado');
    await cargar();
    if (seleccion === id) pintar(datos);
  } catch (error) { aviso(error.message, true); }
}));
