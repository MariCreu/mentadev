// Email que recibe los mensajes del formulario.
const CONTACT_EMAIL = 'hola@mentadev.com';

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

// Sin backend: el formulario abre el cliente de correo con el mensaje ya redactado.
const form = document.getElementById('contact-form');
const status = form.querySelector('.md-form-status');

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
