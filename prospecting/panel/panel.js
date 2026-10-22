// Panel local de prospección. Todo el contenido de las clínicas se pinta con textContent (nunca innerHTML).
const $ = (s) => document.querySelector(s);
const TITULOS = {
  porllamar: ['Clínicas por llamar', 'De mejor a peor candidata, según lo que le falta a su web.'],
  interesadas: ['Interesadas', 'Las que han mostrado interés. Prepara su propuesta.'],
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
  const { clinica, ficha } = await api(`/api/clinicas/${id}`);
  fichaActual = { clinica, ficha };
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

  const web = $('#f-web');
  web.hidden = !clinica.website;
  $('#f-sin-web').hidden = Boolean(clinica.website);
  if (clinica.website) { web.textContent = clinica.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''); web.href = clinica.website; }

  const revisada = ficha.estado === 'revisada';
  $('#f-puntuacion').hidden = !revisada;
  $('#f-bloqueada').hidden = ficha.estado !== 'bloqueada';
  $('#f-sin-revisar').hidden = ficha.estado !== 'sin-revisar';
  $('#f-bloque-mejoras').hidden = !revisada || !ficha.mejoras.length;
  $('#f-bloque-guion').hidden = !revisada || !ficha.guion.length;
  if (revisada) {
    const nota = $('#f-score');
    nota.textContent = ficha.score;
    nota.className = `nota-grande ${banda(ficha.score)}`;
    nota.setAttribute('aria-label', `${ficha.score} sobre 10`);
    $('#f-problemas').replaceChildren(...(ficha.problemas.length ? ficha.problemas : ['Su web está bien resuelta']).map((p) => el('li', '', p)));
    $('#f-mejoras').replaceChildren(...ficha.mejoras.map((m) => el('li', '', m)));
    $('#f-guion').replaceChildren(...ficha.guion.map((l) => (l.startsWith('·') ? el('p', 'punto-guion', l) : el('p', '', l))));
  }

  document.querySelectorAll('.acciones [data-estado]').forEach((b) => { b.hidden = clinica.status === 'suppressed' || b.dataset.estado === clinica.status; });
  $('#no-llamar').hidden = clinica.status === 'suppressed';
  if (matchMedia('(max-width: 980px)').matches) $('#ficha').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

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
$('#copiar-guion').addEventListener('click', () => fichaActual && copiar(fichaActual.ficha.guion.join('\n'), 'Guion'));

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
