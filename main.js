// Email de destino del formulario. Cámbialo por el tuyo.
const CONTACT_EMAIL = 'hola@mentadev.com';

const header = document.querySelector('.header');
const toggle = document.querySelector('.nav-toggle');
const links = document.getElementById('nav-links');

window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 10);
}, { passive: true });

toggle.addEventListener('click', () => {
  const open = links.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(open));
});

links.addEventListener('click', (e) => {
  if (e.target.closest('a')) {
    links.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

document.getElementById('year').textContent = new Date().getFullYear();

// Sin backend: el formulario abre el cliente de correo con el mensaje ya redactado.
const form = document.getElementById('contact-form');
const status = form.querySelector('.form-status');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const fields = [...form.querySelectorAll('[required]')];
  let valid = true;
  fields.forEach((field) => {
    const ok = field.checkValidity() && field.value.trim() !== '';
    field.classList.toggle('invalid', !ok);
    if (!ok) valid = false;
  });

  if (!valid) {
    status.textContent = 'Revisa los campos marcados, por favor.';
    status.className = 'form-status error';
    return;
  }

  const data = new FormData(form);
  const subject = `Nuevo proyecto: ${data.get('servicio')} — ${data.get('nombre')}`;
  const body = `Nombre: ${data.get('nombre')}\nEmail: ${data.get('email')}\nServicio: ${data.get('servicio')}\n\n${data.get('mensaje')}`;
  window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  status.textContent = '¡Gracias! Se abrirá tu correo para enviar el mensaje.';
  status.className = 'form-status ok';
});
