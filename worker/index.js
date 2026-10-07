// Worker de MentaDev: la web es estática (Workers Assets) y este código solo atiende
// /api/* (ver run_worker_first en wrangler.jsonc). Hoy, únicamente el formulario de contacto.
//
// El mensaje se envía por email a CONTACT_TO (secreto de Cloudflare, una dirección
// verificada en Email Routing) desde una dirección @mentadev.com. No se guarda nada.

const FROM = { email: 'formulario@mentadev.com', name: 'Web MentaDev' };

// Deben coincidir con las opciones del paso 1 del formulario (name="servicio") en index.html.
const REVISION = 'Revisión gratis de mi web';
const SERVICIOS = [
  'Web o landing',
  'Tienda online',
  'App o plataforma',
  'Automatización de procesos',
  REVISION,
  'Otro / No lo tengo claro',
];

const LIMITS = { nombre: 100, email: 200, mensaje: 5000, web: 200 };

// Dirección de una web tal y como la escribe la gente: con o sin https://, sin espacios.
const isWeb = (value) => /^(https?:\/\/)?[^\s/]+\.[^\s]{2,}$/i.test(value);

// Menos tiempo que esto entre cargar la página y enviar = bot.
const MIN_ELAPSED_MS = 3000;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

const oneLine = (value) => value.replace(/[\r\n]+/g, ' ').trim();

const escapeHtml = (value) =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

async function handleContacto(request, env) {
  if (request.method !== 'POST') {
    return json({ ok: false, error: 'method' }, 405);
  }

  // Solo se aceptan envíos desde la propia web.
  const origin = request.headers.get('Origin');
  if (!origin || new URL(origin).host !== new URL(request.url).host) {
    return json({ ok: false, error: 'origin' }, 403);
  }

  let data;
  try {
    data = await request.json();
  } catch {
    return json({ ok: false, error: 'invalid' }, 400);
  }
  if (!data || typeof data !== 'object') {
    return json({ ok: false, error: 'invalid' }, 400);
  }

  // Antispam: campo trampa relleno o envío demasiado rápido. Se responde como si
  // hubiera ido bien para no dar pistas al bot.
  if (data.website || !(Number(data.elapsed) >= MIN_ELAPSED_MS)) {
    return json({ ok: true });
  }

  const nombre = oneLine(String(data.nombre ?? ''));
  const email = oneLine(String(data.email ?? ''));
  const servicio = String(data.servicio ?? '');
  const mensaje = String(data.mensaje ?? '').trim();
  const tieneWeb = ['Sí', 'No'].includes(data.tieneWeb) ? data.tieneWeb : '';
  const web = oneLine(String(data.web ?? ''));
  const esRevision = servicio === REVISION;

  // En la revisión la web es obligatoria y el mensaje opcional; en el resto, al revés.
  const valid =
    nombre && nombre.length <= LIMITS.nombre &&
    isEmail(email) && email.length <= LIMITS.email &&
    SERVICIOS.includes(servicio) &&
    (esRevision || mensaje) && mensaje.length <= LIMITS.mensaje &&
    (!esRevision || web) && (!web || (isWeb(web) && web.length <= LIMITS.web));
  if (!valid) {
    return json({ ok: false, error: 'invalid' }, 400);
  }

  if (!env.CONTACT_TO) {
    console.error('Falta el secreto CONTACT_TO');
    return json({ ok: false, error: 'server' }, 500);
  }

  const extra = [tieneWeb && `¿Tiene web?: ${tieneWeb}`, web && `Web: ${web}`].filter(Boolean);
  const text = [`Nombre: ${nombre}`, `Email: ${email}`, `Servicio: ${servicio}`, ...extra].join('\n') +
    (mensaje ? `\n\n${mensaje}` : '');
  const html =
    `<p><strong>Nombre:</strong> ${escapeHtml(nombre)}<br>` +
    `<strong>Email:</strong> ${escapeHtml(email)}<br>` +
    `<strong>Servicio:</strong> ${escapeHtml(servicio)}` +
    extra.map((line) => `<br>${escapeHtml(line)}`).join('') + '</p>' +
    (mensaje ? `<p style="white-space:pre-wrap">${escapeHtml(mensaje)}</p>` : '');

  try {
    await env.EMAIL.send({
      to: env.CONTACT_TO,
      from: FROM,
      replyTo: email,
      subject: `Nuevo proyecto: ${servicio} — ${nombre}`,
      text,
      html,
    });
  } catch (err) {
    console.error('Error al enviar el formulario', err);
    return json({ ok: false, error: 'send' }, 502);
  }

  return json({ ok: true });
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/contacto') {
      return handleContacto(request, env);
    }
    if (pathname.startsWith('/api/')) {
      return json({ ok: false, error: 'not_found' }, 404);
    }
    return env.ASSETS.fetch(request);
  },
};
