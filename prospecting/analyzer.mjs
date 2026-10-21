// Revisa solo la portada de la web de una clínica. Guarda señales técnicas (sí/no, tiempos,
// año del pie): nunca emails, teléfonos, nombres de personas ni texto copiado de la página.
export const USER_AGENT = 'MentaDevRevision/1.0 (+https://mentadev.com)';
const MAX_BYTES = 2_000_000;
const TIMEOUT_MS = 15_000;

// Cada problema suma puntos: cuanto peor está la web, mejor candidata es la clínica.
// Los textos van sin tecnicismos porque acaban en el guion de llamada.
export const PROBLEMS = {
  sinweb: { points: 10, reason: 'No tiene web', fix: 'Tener web propia: hoy quien os busca en internet no encuentra una página vuestra con lo que hacéis y cómo pedir cita.' },
  caida: { points: 9, reason: 'La web no carga', fix: 'Volver a tener la web en marcha: ahora mismo quien os busca en internet no encuentra nada.' },
  inseguro: { points: 3, reason: 'Sin conexión segura', fix: 'Activar la conexión segura: el navegador marca la web como «No segura» y eso echa para atrás a los pacientes.' },
  movil: { points: 2, reason: 'No adaptada al móvil', fix: 'Adaptarla al móvil: la mayoría de pacientes os buscan desde el teléfono y ahora tienen que hacer zoom para leerla.' },
  cita: { points: 2, reason: 'Sin cita online', fix: 'Añadir cita online: que el paciente pida hora a cualquier hora sin tener que llamar.' },
  lenta: { points: 1, reason: 'Tarda en cargar', fix: 'Hacerla más rápida: si tarda, mucha gente se va antes de verla.' },
  contacto: { points: 1, reason: 'Sin formulario ni WhatsApp', fix: 'Poner WhatsApp o un formulario corto para resolver dudas sin llamar.' },
  legal: { points: 1, reason: 'Sin textos legales visibles', fix: 'Añadir aviso legal, privacidad y cookies: en una clínica es obligatorio y da confianza.' },
  google: { points: 1, reason: 'Poco preparada para Google', fix: 'Mejorar cómo aparece en Google: un título y una descripción que digan qué hacéis y dónde.' },
  antigua: { points: 1, reason: 'Parece sin actualizar', fix: 'Actualizar los contenidos: un pie de página con un año antiguo da sensación de abandono.' },
};

const BOOKING = /(pedir|solicitar|reservar|coger|concertar)\s+(una\s+)?cita|cita\s+(online|previa)|reserva\s+online|doctoralia|booksy|treatwell|reservio|calendly|bookings?\b/i;

function attr(tag, name) {
  return tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, 'i'))?.[1]?.trim() ?? '';
}
function metaContent(html, name) {
  const tag = html.match(new RegExp(`<meta[^>]+name\\s*=\\s*["']?${name}["']?[^>]*>`, 'i'))?.[0];
  return tag ? attr(tag, 'content') : '';
}

export function analyzeHtml(html, { url, ms = null, pageSpeed = null }) {
  const final = new URL(url);
  const years = [...html.matchAll(/(?:©|&copy;|&#169;|copyright)\D{0,40}?((?:19|20)\d{2})(?:\s*[-–]\s*((?:19|20)\d{2}))?/gi)]
    .map(m => Number(m[2] ?? m[1]));
  return {
    reachable: true,
    https: final.protocol === 'https:',
    viewport: /<meta[^>]+name\s*=\s*["']?viewport/i.test(html),
    title: /<title[^>]*>\s*[^<\s][^<]*<\/title>/i.test(html),
    description: metaContent(html, 'description').length > 0,
    booking: BOOKING.test(html),
    form: /<form[\s>]/i.test(html),
    whatsapp: /wa\.me\/|api\.whatsapp\.com|whatsapp:\/\//i.test(html),
    legal: /aviso[\s-]+legal|pol[ií]tica[\s-]+de[\s-]+privacidad|privacidad/i.test(html),
    copyrightYear: years.length ? Math.max(...years) : null,
    generator: metaContent(html, 'generator').slice(0, 60).replace(/[^\p{L}\p{N} .\-]/gu, '') || null,
    ms,
    kb: Math.round(Buffer.byteLength(html) / 1024),
    pageSpeed,
  };
}

export function score(signals, year = new Date().getUTCFullYear()) {
  const found = [];
  if (signals.website === false) found.push('sinweb');
  else if (!signals.reachable) found.push('caida');
  else {
    if (!signals.https) found.push('inseguro');
    if (!signals.viewport) found.push('movil');
    if (!signals.booking) found.push('cita');
    if (signals.pageSpeed !== null ? signals.pageSpeed < 50 : signals.ms > 3000) found.push('lenta');
    if (!signals.form && !signals.whatsapp) found.push('contacto');
    if (!signals.legal) found.push('legal');
    if (!signals.title || !signals.description) found.push('google');
    if (signals.copyrightYear && signals.copyrightYear <= year - 3) found.push('antigua');
  }
  const problems = found.sort((a, b) => PROBLEMS[b].points - PROBLEMS[a].points);
  return { score: Math.min(10, problems.reduce((sum, key) => sum + PROBLEMS[key].points, 0)), problems };
}

// Respeta "Disallow: /" para todos los robots o para el nuestro. No interpreta reglas parciales:
// solo pedimos la portada, así que lo único que nos frena es que la prohíban entera.
export function robotsBlocks(text) {
  let applies = false, inAgents = false, blocked = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim();
    const [key, ...rest] = line.split(':');
    const value = rest.join(':').trim();
    if (/^user-agent$/i.test(key)) {
      if (!inAgents) applies = false;
      inAgents = true;
      if (value === '*' || /mentadev/i.test(value)) applies = true;
    } else if (key) {
      inAgents = false;
      if (applies && /^disallow$/i.test(key) && value === '/') blocked = true;
    }
  }
  return blocked;
}

async function readCapped(response) {
  const reader = response.body.getReader(), chunks = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > MAX_BYTES) { await reader.cancel(); break; }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString('utf8');
}

export async function pageSpeedScore(url, key, fetchImpl = fetch) {
  const api = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
  api.search = new URLSearchParams({ url, strategy: 'mobile', category: 'performance', key });
  const response = await fetchImpl(api, { signal: AbortSignal.timeout(60_000) });
  if (!response.ok) return null;
  const value = (await response.json())?.lighthouseResult?.categories?.performance?.score;
  return typeof value === 'number' ? Math.round(value * 100) : null;
}

// Dos peticiones como máximo por clínica: robots.txt y la portada.
export async function analyzeSite(url, { fetchImpl = fetch, pageSpeedKey = null, now = Date.now } = {}) {
  const target = new URL(url);
  const headers = { 'User-Agent': USER_AGENT, Accept: 'text/html' };
  try {
    const robots = await fetchImpl(new URL('/robots.txt', target), { headers, signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (robots.ok && robotsBlocks(await robots.text())) return { url: target.href, blocked: true };
  } catch { /* sin robots.txt accesible se sigue con la portada */ }
  const start = now();
  let response, html;
  try {
    response = await fetchImpl(target, { headers, redirect: 'follow', signal: AbortSignal.timeout(TIMEOUT_MS) });
    // 401/403/429: el servidor rechaza robots, no está caído. No se puntúa.
    if ([401, 403, 429].includes(response.status)) return { url: target.href, blocked: true };
    if (!response.ok) return { url: target.href, signals: { reachable: false } };
    html = await readCapped(response);
  } catch {
    return { url: target.href, signals: { reachable: false } };
  }
  const ms = now() - start;
  const finalUrl = response.url || target.href;
  const pageSpeed = pageSpeedKey ? await pageSpeedScore(finalUrl, pageSpeedKey, fetchImpl).catch(() => null) : null;
  return { url: finalUrl, signals: analyzeHtml(html, { url: finalUrl, ms, pageSpeed }) };
}
