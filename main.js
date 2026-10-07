// Email que recibe los mensajes del formulario.
const CONTACT_EMAIL = 'hola@mentadev.com';

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

// Sin backend: el formulario abre el cliente de correo con el mensaje ya redactado.
form.addEventListener('submit', (e) => {
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

  const data = new FormData(form);
  const subject = `Nuevo proyecto: ${data.get('servicio')} — ${data.get('nombre')}`;
  const body = `Nombre: ${data.get('nombre')}\nEmail: ${data.get('email')}\nServicio: ${data.get('servicio')}\n\n${data.get('mensaje')}`;
  window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  status.textContent = '¡Gracias! Se abrirá tu correo para enviar el mensaje.';
  status.className = 'md-form-status ok';
});
