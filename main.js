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

const form = document.getElementById('contact-form');
const serviceSelect = document.getElementById('servicio');
const status = form.querySelector('.md-form-status');

// Los CTA con data-servicio llevan al formulario con esa opción ya elegida.
document.querySelectorAll('[data-servicio]').forEach((link) => {
  link.addEventListener('click', () => {
    serviceSelect.value = link.dataset.servicio;
  });
});

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
        const context = serviceSelect.value === 'Automatización de procesos' ? 'automatizacion' : waContext;
        link.href = waUrl(context);
      });
    }
  });
}

// El formulario se envía al Worker (/api/contacto), que manda el mensaje por email.
// Si el envío falla, se ofrecen WhatsApp y el correo directo para no perder el contacto.
const loadedAt = performance.now();
const submitBtn = form.querySelector('button[type="submit"]');

const fallbackLinks = (data) => {
  const subject = `Nuevo proyecto: ${data.servicio} — ${data.nombre}`;
  const body = `Nombre: ${data.nombre}\nEmail: ${data.email}\nServicio: ${data.servicio}\n\n${data.mensaje}`;
  const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const links = [`<a href="${mailto}">enviarlo por email</a>`];
  if (WHATSAPP_NUMBER) links.unshift(`<a href="${waUrl('general')}" target="_blank" rel="noopener">escribirnos por WhatsApp</a>`);
  return links.join(' o ');
};

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  let valid = true;
  form.querySelectorAll('[required]').forEach((field) => {
    const ok = field.checkValidity() && field.value.trim() !== '';
    field.classList.toggle('md-invalid', !ok);
    if (!ok) valid = false;
  });

  if (!valid) {
    status.textContent = 'Revisa los campos marcados, por favor.';
    status.className = 'md-form-status error';
    return;
  }

  const data = Object.fromEntries(new FormData(form));
  data.elapsed = Math.round(performance.now() - loadedAt);

  const label = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Enviando…';
  status.textContent = '';
  status.className = 'md-form-status';

  try {
    const res = await fetch('/api/contacto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    form.reset();
    status.textContent = '¡Mensaje enviado! Te respondemos en menos de 24 h laborables.';
    status.className = 'md-form-status ok';
  } catch {
    status.innerHTML = `No hemos podido enviarlo. Puedes ${fallbackLinks(data)}.`;
    status.className = 'md-form-status error';
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = label;
  }
});
