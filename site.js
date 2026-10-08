// Común a todas las páginas con cabecera de la web: menú y barra del móvil, WhatsApp,
// animaciones y capturas. Lo propio de la home (formulario, pestañas, calculadora) está en main.js.

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
if (burger && mobileNav) {
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
}

// Barra fija del móvil: se esconde al llegar a Contacto, donde ya están el formulario y WhatsApp.
const mobileBar = document.querySelector('.md-mbar');
const contactSection = document.getElementById('contacto');
if (mobileBar && contactSection) {
  new IntersectionObserver(([entry]) => {
    mobileBar.classList.toggle('is-hidden', entry.isIntersecting);
    mobileBar.inert = entry.isIntersecting;
  }, { threshold: 0.15 }).observe(contactSection);
}

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

// WhatsApp: el mensaje inicial depende de si el usuario viene de la sección de automatización
// (o de una página que lo indique con <body data-wa-context="automatizacion">).
let waContext = document.body.dataset.waContext || 'general';
const autoSection = document.getElementById('automatizacion');
if (autoSection) {
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) waContext = 'automatizacion';
  }, { threshold: 0.35 }).observe(autoSection);
}
['servicios', 'proyectos', 'planes'].forEach((id) => {
  const section = document.getElementById(id);
  if (!section) return;
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) waContext = 'general';
  }, { threshold: 0.5 }).observe(section);
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
        const servicio = document.querySelector('[name="servicio"]:checked')?.value;
        const context = servicio === 'Automatización de procesos' ? 'automatizacion' : waContext;
        link.href = waUrl(context);
      });
    }
  });
}
