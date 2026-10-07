// Email que recibe los mensajes del formulario.
const CONTACT_EMAIL = 'info@mentadev.com';

// Número de WhatsApp con prefijo de país y sin espacios ni "+", p. ej. '34600111222'.
// Mientras esté vacío, los enlaces y el botón flotante de WhatsApp no se muestran.
const WHATSAPP_NUMBER = '34604525265';

const WA_MESSAGES = {
  general: 'Hola, he visto MentaDev y me gustaría información sobre...',
  automatizacion: 'Hola, me gustaría saber qué podría automatizar en mi negocio.',
};

const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.md-reveal').forEach((el) => observer.observe(el));

// Menú del móvil: se cierra al elegir una sección, con Esc o al tocar fuera.
const burger = document.querySelector('.md-burger');
const mobileNav = document.getElementById('menu-movil');
const setMenu = (open) => {
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  mobileNav.hidden = !open;
};
burger.addEventListener('click', () => setMenu(mobileNav.hidden));
mobileNav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !mobileNav.hidden) { setMenu(false); burger.focus(); }
});
document.addEventListener('click', (e) => {
  if (!mobileNav.hidden && !e.target.closest('#top')) setMenu(false);
});

// Barra fija del móvil: se esconde al llegar a Contacto, donde ya están el formulario y WhatsApp.
const mobileBar = document.querySelector('.md-mbar');
new IntersectionObserver(([entry]) => {
  mobileBar.classList.toggle('is-hidden', entry.isIntersecting);
  mobileBar.inert = entry.isIntersecting;
}, { threshold: 0.15 }).observe(document.getElementById('contacto'));

// Capturas reales: si el archivo indicado en data-shot existe, sustituye a la ilustración.
document.querySelectorAll('[data-shot]').forEach((el) => {
  const img = new Image();
  img.onload = () => {
    img.alt = el.dataset.alt || '';
    img.className = 'md-shot-img';
    el.appendChild(img);
    el.classList.add('has-shot');
  };
  img.src = el.dataset.shot;
});

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
  if (n === 2) updateStep2();
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

// Ejemplos de automatización por sector: pestañas accesibles (flechas, Inicio y Fin para moverse).
const sectorTabs = [...document.querySelectorAll('.md-sector-tabs [role="tab"]')];
const selectSector = (tab, focus) => {
  sectorTabs.forEach((t) => {
    const on = t === tab;
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
    document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
  });
  if (focus) tab.focus();
  tab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
};
sectorTabs.forEach((tab, i) => {
  tab.addEventListener('click', () => selectSector(tab, false));
  tab.addEventListener('keydown', (e) => {
    const n = sectorTabs.length;
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1 + n, Home: 0, End: n - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    selectSector(sectorTabs[next % n], true);
  });
});

// Calculadora de automatización: horas y € que se recuperan si se automatiza la mitad del tiempo.
const calc = document.getElementById('calculadora');
if (calc) {
  const AUTOMATABLE = 0.5;
  const PRICE_FROM = 490;
  const WEEKS_PER_MONTH = 52 / 12;
  const num = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0, useGrouping: 'always' });
  const out = (name) => calc.querySelector(`[data-out="${name}"]`);
  const fields = { horas: calc.querySelectorAll('[data-calc="horas"]'), tarifa: calc.querySelectorAll('[data-calc="tarifa"]') };
  const values = { horas: 5, tarifa: 20 };
  let announceTimer;
  let prefill = '';

  const clamp = (input) => Math.min(Number(input.max), Math.max(Number(input.min), Math.round(Number(input.value) || 0)));

  const render = () => {
    const hoursMonth = values.horas * AUTOMATABLE * WEEKS_PER_MONTH;
    const eurosMonth = hoursMonth * values.tarifa;
    const months = PRICE_FROM / eurosMonth;
    out('horas').textContent = `${num.format(hoursMonth)} h`;
    out('euros').textContent = `${num.format(eurosMonth * 12)} €`;
    out('amortiza').textContent =
      months < 1 ? `Una automatización desde ${PRICE_FROM} € + IVA se amortizaría en menos de un mes.`
      : months <= 24 ? `Una automatización desde ${PRICE_FROM} € + IVA se amortizaría en unos ${num.format(Math.ceil(months))} meses.`
      : 'Con tan poco tiempo quizá no compense automatizar. En el diagnóstico te lo diremos con sinceridad.';
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
        values[name] = clamp(input);
        inputs.forEach((other) => { if (other !== input) other.value = values[name]; });
        render();
      });
      input.addEventListener('change', () => { input.value = values[name]; });
    });
  });

  // El CTA lleva al formulario con el mensaje empezado, sin pisar lo que ya haya escrito el usuario.
  calc.querySelector('[data-calc-cta]').addEventListener('click', () => {
    const mensaje = form.elements.mensaje;
    if (mensaje.value.trim() === '' || mensaje.value === prefill) {
      prefill = `Calculo que dedico unas ${values.horas} h a la semana a tareas repetitivas. Me gustaría saber qué se puede automatizar en mi negocio: `;
      mensaje.value = prefill;
    }
  });

  render();
}

// WhatsApp: el mensaje inicial depende de si el usuario viene de la sección de automatización.
let waContext = 'general';
const autoSection = document.getElementById('automatizacion');
new IntersectionObserver(([entry]) => {
  if (entry.isIntersecting) waContext = 'automatizacion';
}, { threshold: 0.35 }).observe(autoSection);
['servicios', 'proyectos', 'planes'].forEach((id) => {
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) waContext = 'general';
  }, { threshold: 0.5 }).observe(document.getElementById(id));
});

const waUrl = (context) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WA_MESSAGES[context] || WA_MESSAGES.general)}`;

if (WHATSAPP_NUMBER) {
  document.querySelectorAll('[data-wa]').forEach((link) => {
    link.hidden = false;
    link.target = '_blank';
    link.rel = 'noopener';
    const fixed = link.dataset.wa !== 'float';
    link.href = waUrl(fixed ? link.dataset.wa : 'general');
    if (!fixed) {
      // El flotante decide el mensaje en el momento del clic.
      link.addEventListener('click', () => {
        const context = selectedService() === 'Automatización de procesos' ? 'automatizacion' : waContext;
        link.href = waUrl(context);
      });
    }
  });
}

// El formulario se envía al Worker (/api/contacto), que manda el mensaje por email.
// Si el envío falla, se ofrecen WhatsApp y el correo directo para no perder el contacto.
const loadedAt = performance.now();

const fallbackLinks = (data) => {
  const subject = `Nuevo proyecto: ${data.servicio} — ${data.nombre}`;
  const extra = [data.tieneWeb && `¿Tiene web?: ${data.tieneWeb}`, data.web && `Web: ${data.web}`].filter(Boolean);
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
