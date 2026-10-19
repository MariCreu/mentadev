// Solo para la home (módulo ES): formulario por pasos, calculadora y su relación con el sector elegido.
// Usa CONTACT_EMAIL, WHATSAPP_NUMBER y waUrl de site.js, que se carga antes.
import { sectorState } from './js/sector-state.js';
import { sectorPorId } from './js/sectores.js';
import { calcularAhorro, textoAmortizacion } from './js/calculadora.js';

// Formulario por pasos: 1) qué necesitas, 2) cuéntanos más (se adapta al servicio), 3) tus datos.
const form = document.getElementById('contact-form');
const status = form.querySelector('.md-form-status');
const steps = [...form.querySelectorAll('.md-step')];
const backBtn = form.querySelector('[data-back]');
const nextBtn = form.querySelector('[data-next]');
const submitBtn = form.querySelector('button[type="submit"]');
const REVISION = 'Revisión gratis de mi web';
const isWeb = (value) => /^(https?:\/\/)?[^\s/]+\.[^\s]{2,}$/i.test(value); // igual que en worker/index.js
let currentStep = 1;

// Título y ejemplo del cuadro de texto según el servicio; las webs y tiendas preguntan si ya tienes web.
const SERVICE_COPY = {
  'Web o landing': ['Cuéntanos tu idea', 'A qué se dedica tu negocio y qué te gustaría que hiciera tu web…'],
  'Tienda online': ['Cuéntanos tu idea', 'Qué vendes, cuántos productos tienes más o menos y si ya vendes en algún sitio…'],
  'App o plataforma': ['Cuéntanos tu idea', 'Qué problema quieres resolver y quién la usaría…'],
  'Automatización de procesos': ['¿Qué te quita tiempo?', 'Qué tareas repites cada semana y qué programas usas…'],
  [REVISION]: ['¿Algo en especial? (opcional)', 'Por ejemplo: no me llegan contactos, se ve mal en el móvil…'],
  'Otro / No lo tengo claro': ['Cuéntanos tu idea', 'Qué haces, qué te gustaría conseguir o qué tareas te quitan tiempo…'],
};
const ASK_TIENE_WEB = ['Web o landing', 'Tienda online'];

const checked = (name) => form.querySelector(`[name="${name}"]:checked`);
const selectedService = () => checked('servicio')?.value || '';
const block = (key) => form.querySelector(`[data-if="${key}"]`);

// Texto que la web pone sola en el mensaje (sector, calculadora). Solo se sustituye mientras
// el mensaje esté vacío o siga siendo ese mismo texto automático.
let autoMensaje = '';
const rellenarMensaje = (texto) => {
  const campo = form.elements.mensaje;
  if (!texto || (campo.value.trim() !== '' && campo.value !== autoMensaje)) return;
  campo.value = texto;
  autoMensaje = texto;
};
const prefijoSector = () => {
  const s = sectorPorId(sectorState.get());
  return s && sectorState.elegido() ? `Tengo ${s.articulo}. ` : '';
};

const showStatus = (text, type) => {
  status.textContent = text;
  status.className = `md-form-status${type ? ` ${type}` : ''}`;
};

const updateStep2 = () => {
  const servicio = selectedService();
  const askTieneWeb = ASK_TIENE_WEB.includes(servicio);
  block('tiene-web').hidden = !askTieneWeb;
  block('url').hidden = !(servicio === REVISION || (askTieneWeb && checked('tieneWeb')?.value === 'Sí'));
  form.elements.web.required = servicio === REVISION;
  form.elements.mensaje.required = servicio !== REVISION;
  const [label, placeholder] = SERVICE_COPY[servicio] || SERVICE_COPY['Otro / No lo tengo claro'];
  form.querySelector('[data-mensaje-label]').textContent = label;
  form.elements.mensaje.placeholder = placeholder;
  form.querySelector('[data-chosen]').textContent = checked('servicio')?.closest('label').querySelector('strong').textContent || '';
};

const goTo = (n, focus = true) => {
  currentStep = n;
  steps.forEach((step) => { step.hidden = Number(step.dataset.step) !== n; });
  form.querySelector('[data-step-num]').textContent = n;
  form.querySelector('.md-steps-bar span').style.width = `${(n / steps.length) * 100}%`;
  backBtn.hidden = n === 1;
  nextBtn.hidden = n === steps.length;
  submitBtn.hidden = n !== steps.length;
  if (n === 2) { updateStep2(); rellenarMensaje(prefijoSector()); }
  showStatus('');
  if (focus) steps[n - 1].querySelector('.md-step-title').focus({ preventScroll: true });
};

// Solo se validan los campos visibles del paso actual.
const validateStep = (n) => {
  if (n === 1) {
    if (selectedService()) return true;
    showStatus('Elige una opción para continuar.', 'error');
    return false;
  }
  let valid = true;
  steps[n - 1].querySelectorAll('input:not([type="radio"]), textarea').forEach((field) => {
    if (field.closest('[hidden]') || field.name === 'website') return;
    const value = field.value.trim();
    const ok = (!field.required || value !== '') && field.checkValidity() && (field.name !== 'web' || !value || isWeb(value));
    field.classList.toggle('md-invalid', !ok);
    if (!ok) valid = false;
  });
  if (!valid) showStatus('Revisa los campos marcados, por favor.', 'error');
  return valid;
};

nextBtn.addEventListener('click', () => { if (validateStep(currentStep)) goTo(currentStep + 1); });
backBtn.addEventListener('click', () => goTo(currentStep - 1));
form.querySelector('[data-go="1"]').addEventListener('click', () => goTo(1));
form.querySelectorAll('[name="tieneWeb"]').forEach((radio) => radio.addEventListener('change', updateStep2));

// Con ratón o dedo, elegir una tarjeta pasa al paso 2; con teclado se usa "Siguiente" (las flechas cambian la opción).
form.querySelectorAll('.md-choice').forEach((choice) => {
  choice.addEventListener('click', (e) => {
    if (e.detail > 0) setTimeout(() => goTo(2), 150);
  });
});

goTo(1, false);

// Sector elegido en la página: viaja con el formulario y se muestra en el paso 2.
const campoSector = form.querySelector('input[name="sector"]');
const avisoSector = form.querySelector('.form-sector');
const aplicarSector = (id) => {
  const s = sectorPorId(id);
  campoSector.value = s && sectorState.elegido() ? id : '';
  avisoSector.hidden = !campoSector.value;
  if (campoSector.value) avisoSector.querySelector('[data-sector-label]').textContent = s.etiqueta;
};
aplicarSector(sectorState.get());
document.addEventListener('md:sector', ({ detail }) => aplicarSector(detail.id));

// Desde otras páginas se llega con /?servicio=…#contacto: ese servicio queda elegido y se abre el paso 2.
const fromUrl = new URLSearchParams(location.search).get('servicio');
const fromUrlRadio = fromUrl && [...form.querySelectorAll('[name="servicio"]')].find((r) => r.value === fromUrl);
if (fromUrlRadio) {
  fromUrlRadio.checked = true;
  goTo(2, false);
}

// Los CTA con data-servicio llevan al formulario con esa opción ya elegida, directamente en el paso 2.
document.querySelectorAll('[data-servicio]').forEach((link) => {
  link.addEventListener('click', () => {
    const radio = form.querySelector(`[name="servicio"][value="${link.dataset.servicio}"]`);
    if (radio) {
      radio.checked = true;
      goTo(2, false);
    }
  });
});

// Calculadora de automatización: horas y € que se recuperan si se automatiza la mitad del tiempo.
const calc = document.getElementById('calculadora');
if (calc) {
  const num = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0, useGrouping: 'always' });
  const out = (name) => calc.querySelector(`[data-out="${name}"]`);
  const fields = { horas: calc.querySelectorAll('[data-calc="horas"]'), tarifa: calc.querySelectorAll('[data-calc="tarifa"]') };
  const values = { horas: Number(fields.horas[0].value), tarifa: Number(fields.tarifa[0].value) };
  let calcTocada = false;
  let announceTimer;

  const clamp = (input) => Math.min(Number(input.max), Math.max(Number(input.min), Math.round(Number(input.value) || 0)));

  const render = () => {
    const r = calcularAhorro(values.horas, values.tarifa);
    out('horas').textContent = `${num.format(r.horasMes)} h`;
    out('euros').textContent = `${num.format(r.eurosAno)} €`;
    out('amortiza').textContent = textoAmortizacion(r);
    calc.dispatchEvent(new CustomEvent('md:calc', { detail: r }));
    // El lector de pantalla oye el resultado cuando se dejan de mover los valores, no en cada paso.
    clearTimeout(announceTimer);
    announceTimer = setTimeout(() => {
      out('anuncio').textContent = `Recuperarías unas ${out('horas').textContent} al mes, ${out('euros').textContent} al año. ${out('amortiza').textContent}`;
    }, 700);
  };

  Object.entries(fields).forEach(([name, inputs]) => {
    inputs.forEach((input) => {
      input.addEventListener('input', () => {
        if (input.value === '') return; // dejar borrar la casilla para escribir otro número
        calcTocada = true;
        values[name] = clamp(input);
        inputs.forEach((other) => { if (other !== input) other.value = values[name]; });
        render();
      });
      input.addEventListener('change', () => { input.value = values[name]; });
    });
  });

  // Con otro sector, la calculadora propone sus valores, mientras el usuario no los haya tocado.
  document.addEventListener('md:sector', ({ detail }) => {
    if (calcTocada) return;
    const { horas, tarifa } = sectorPorId(detail.id).calculadora;
    values.horas = horas;
    values.tarifa = tarifa;
    fields.horas.forEach((i) => { i.value = horas; });
    fields.tarifa.forEach((i) => { i.value = tarifa; });
    render();
  });

  // El CTA lleva al formulario con el mensaje empezado, sin pisar lo que ya haya escrito el usuario.
  document.querySelector('[data-calc-cta]')?.addEventListener('click', () => {
    rellenarMensaje(`${prefijoSector()}Calculo que dedico unas ${values.horas} h a la semana a tareas repetitivas. Me gustaría saber qué se puede automatizar en mi negocio: `);
  });

  render();
}

// El formulario se envía al Worker (/api/contacto), que manda el mensaje por email.
// Si el envío falla, se ofrecen WhatsApp y el correo directo para no perder el contacto.
const loadedAt = performance.now();

const fallbackLinks = (data) => {
  const subject = `Nuevo proyecto: ${data.servicio} — ${data.nombre}`;
  const extra = [data.sector && `Sector: ${sectorPorId(data.sector)?.etiqueta ?? ''}`, data.tieneWeb && `¿Tiene web?: ${data.tieneWeb}`, data.web && `Web: ${data.web}`].filter(Boolean);
  const body = [`Nombre: ${data.nombre}`, `Email: ${data.email}`, `Servicio: ${data.servicio}`, ...extra].join('\n') +
    (data.mensaje ? `\n\n${data.mensaje}` : '');
  const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const links = [`<a href="${mailto}">enviarlo por email</a>`];
  if (WHATSAPP_NUMBER) links.unshift(`<a href="${waUrl('general')}" target="_blank" rel="noopener">escribirnos por WhatsApp</a>`);
  return links.join(' o ');
};

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  // Enter en un paso intermedio avanza en lugar de enviar.
  if (currentStep < steps.length) {
    if (validateStep(currentStep)) goTo(currentStep + 1);
    return;
  }
  if (!validateStep(currentStep)) return;

  const data = Object.fromEntries(new FormData(form));
  // No enviar lo que se escribió en una parte que luego quedó oculta (p. ej. la web tras marcar "No").
  if (block('url').hidden) delete data.web;
  if (block('tiene-web').hidden) delete data.tieneWeb;
  data.elapsed = Math.round(performance.now() - loadedAt);

  const label = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Enviando…';
  showStatus('');

  try {
    const res = await fetch('/api/contacto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    form.reset();
    autoMensaje = '';
    aplicarSector(sectorState.get());
    goTo(1, false);
    showStatus(data.servicio === REVISION
      ? '¡Recibido! En 48 h laborables te enviamos por email 3 mejoras concretas para tu web.'
      : '¡Mensaje enviado! Te respondemos en menos de 24 h laborables.', 'ok');
  } catch {
    status.innerHTML = `No hemos podido enviarlo. Puedes ${fallbackLinks(data)}.`;
    status.className = 'md-form-status error';
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = label;
  }
});
