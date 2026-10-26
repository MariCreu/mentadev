// Ficha para la persona que llama. Plantillas fijas a partir de las señales: sin IA y sin
// inventar nada que la revisión no haya comprobado.
// Precios y plazos: los mismos que publica la web (CLAUDE.md, "Precios"). Si cambian allí, cambiarlos aquí.
import { PROBLEMS } from './analyzer.mjs';

const DE_SECTOR = { health_clinic: 'de la clínica', aesthetic_clinic: 'del centro de estética' };
const PRECIO_WEB = '249 € + IVA';
const PLAZO_WEB = '7 días laborables';
// El mismo número que WHATSAPP_NUMBER de site.js. Si cambia allí, cambiarlo aquí.
const WHATSAPP_MENTADEV = '604 52 52 65';

export function improvements(problems) {
  return problems.slice(0, 3).map(key => PROBLEMS[key].fix);
}

export const esMovil = (tel) => /^[67]/.test((tel ?? '').replace(/\D/g, '').replace(/^34/, ''));

// Estructura común para el panel y para el texto de la terminal.
function fichaBase(lead, analysis) {
  if (!analysis) return { estado: 'sin-revisar' };
  if (analysis.blocked) return { estado: 'bloqueada' };
  const sinWeb = analysis.problems.includes('sinweb');
  const mejoras = improvements(analysis.problems);
  const detalle = analysis.problems.map(key => ({ problema: PROBLEMS[key].reason, significa: PROBLEMS[key].significa, mejora: PROBLEMS[key].fix }));
  const base = {
    estado: 'revisada', score: analysis.score, revisada: analysis.analyzed_at?.slice(0, 10) ?? null, sinWeb,
    problemas: analysis.problems.map(key => PROBLEMS[key].reason), mejoras, detalle,
    ...(analysis.signals?.emailWeb ? { emailWeb: analysis.signals.emailWeb } : {}),
  };
  if (!mejoras.length) return { ...base, pasos: [], guion: [], preguntas: [], apuros: [], antes: [], revision: '' };

  const de = DE_SECTOR[lead.sector] ?? 'de la clínica';
  const loQueMandamos = sinWeb ? 'la propuesta con la web de ejemplo' : 'la revisión';

  // En vosotros: sirve para entenderla y para decírsela tal cual a la clínica.
  const revision = sinWeb
    ? `Como no tenéis web, en lugar de revisarla os mandamos por email el enlace a una web de ejemplo con vuestro nombre, que podéis abrir en el móvil, y lo que tendría vuestra web con el precio cerrado (desde ${PRECIO_WEB}, lista en ${PLAZO_WEB}). Es gratis y sin compromiso: si no os convence, no pasa nada.`
    : `Es muy sencillo: miramos vuestra web con calma, como la vería un paciente desde el móvil y desde el ordenador, y en 48 h laborables os mandamos por email 3 mejoras concretas, explicadas sin tecnicismos, para que más pacientes os escriban y pidan cita. Es gratis y sin compromiso: las mejoras son vuestras y las podéis hacer con quien queráis. Si luego queréis que las hagamos nosotros, os damos un precio cerrado antes de empezar.`;

  // Pensado para quien coja el teléfono (casi siempre recepción): no hace falta que te pasen con nadie.
  const pasos = [
    {
      titulo: 'Presentación',
      frases: [`Hola, buenos días. Soy [tu nombre], de MentaDev, un estudio de la Marina Baixa que hace webs para clínicas. Es solo un momento.`],
    },
    {
      titulo: 'Qué les ofreces',
      frases: sinWeb
        ? [
          'Hemos visto que no tenéis web propia y os hemos preparado una web de ejemplo con el nombre de vuestra clínica, para que veáis cómo quedaría.',
          '¿Os mandamos el enlace por email, gratis, para que la vea quien lleve estos temas?',
        ]
        : [
          `Hemos estado mirando vuestra web y hemos visto ${mejoras.length === 1 ? 'una cosa concreta' : `${mejoras.length} cosas concretas`} que se pueden mejorar para que os escriban y pidan cita más pacientes, y una idea de cómo podría verse una web nueva.`,
          `¿Os las mandamos gratis por email, para que las vea quien se encargue de la web ${de}?`,
        ],
    },
    {
      titulo: 'Si dicen que sí',
      frases: [
        base.emailWeb ? `¡Genial! ¿Os lo mandamos a ${base.emailWeb}? ¿Y a la atención de quién?` : `¡Genial! ¿A qué email os lo mandamos? ¿Y a la atención de quién?`,
        '(Repite el email letra a letra para no equivocarte.)',
        `Perfecto: os llegará de MentaDev${sinWeb ? '' : ' en 48 h laborables'}. ¿Me dices tu nombre, para saber con quién he hablado?`,
        'Muchas gracias, que vaya muy bien el día.',
        '(Al colgar, pulsa «Han dicho que sí» y apunta el email y quién te lo ha dado.)',
      ],
    },
    {
      titulo: 'Si dudan o dicen que no',
      frases: [
        `(Si dudan) No os compromete a nada: es un email con ${sinWeb ? 'el enlace a la web de ejemplo y la propuesta' : 'las mejoras'}, lo leéis cuando podáis y, si no os sirve, lo borráis.`,
        '(Si te dicen que se lo tienen que preguntar a alguien) Claro. ¿Te parece que os lo mandemos y así se lo enseñas?',
        '(Si dicen que no) Sin problema, gracias igualmente. ¿Preferís que no os volvamos a llamar? (Si dicen que sí, márcala como «No volver a llamar».)',
      ],
    },
    {
      titulo: 'Si te pasan con el responsable',
      frases: sinWeb
        ? [
          `Hola, soy [tu nombre], de MentaDev. Hemos visto que ${lead.name} no tiene web propia: si alguien os busca en internet, solo encuentra vuestra ficha de Google.`,
          `Hacemos webs para clínicas desde ${PRECIO_WEB}, con precio cerrado y lista en ${PLAZO_WEB}, con el alojamiento del primer año y 2 meses de soporte incluidos.`,
          'Si os parece, os mandamos por email una web de ejemplo con vuestro nombre, gratis, y lo que costaría la vuestra. ¿A qué email?',
        ]
        : [
          `Hola, soy [tu nombre], de MentaDev. Hemos estado mirando webs de clínicas de ${lead.municipality} y, en la vuestra, nos hemos fijado en ${mejoras.length === 1 ? 'una cosa que se puede mejorar' : `${mejoras.length} cosas que se pueden mejorar`} sin mucho esfuerzo:`,
          ...analysis.problems.slice(0, 3).map(key => `· ${PROBLEMS[key].reason}: ${PROBLEMS[key].dicho}`),
          'Os proponemos una revisión gratis: la miramos con calma y en 48 h laborables os mandamos por email 3 mejoras concretas, explicadas sin tecnicismos. ¿A qué email?',
        ],
    },
  ];

  const preguntas = [
    { pregunta: '¿Quiénes sois? ¿De dónde sois?', respuesta: 'Somos MentaDev, un estudio de desarrollo web de la Marina Baixa, en Polop. Hacemos webs, tiendas online y herramientas para negocios pequeños, y siempre habláis con quien hace el trabajo.' },
    { pregunta: '¿Cómo habéis conseguido mi número?', respuesta: 'Está en vuestra ficha pública de Google. Si preferís que no os llamemos más, lo apuntamos ahora mismo y no volvemos a hacerlo.' },
    { pregunta: '¿Qué es eso de la revisión exactamente?', respuesta: revision },
    { pregunta: '¿Cuánto cuesta?', respuesta: `${sinWeb ? 'La web de ejemplo y la propuesta son gratis' : 'La revisión es gratis'}. Si después queréis una web nueva, empieza desde ${PRECIO_WEB} con precio cerrado, y se puede pagar en 2 plazos sin intereses. Cosas como la cita online o una tienda se presupuestan aparte, siempre con precio cerrado antes de empezar.` },
    { pregunta: '¿Cuánto tardaríais en hacerla?', respuesta: `Una web profesional está lista en ${PLAZO_WEB} desde que tenemos vuestros textos y fotos. Si no la publicamos en ese plazo, os devolvemos el primer plazo.` },
    { pregunta: 'Ya tenemos a alguien que nos lleva la web', respuesta: `Perfecto, entonces ${loQueMandamos} os viene aún mejor: se la podéis pasar a esa persona para que haga los cambios. No pretendemos quitarle el trabajo a nadie.` },
    { pregunta: 'No me interesa', respuesta: `Lo entiendo. Solo es un email con ${sinWeb ? 'una web de ejemplo y una propuesta' : '3 cosas concretas'}: lo leéis cuando podáis y, si no os sirve, lo borráis. ¿Os lo mandamos? (Si insisten: «Sin problema, gracias por tu tiempo».)` },
    { pregunta: '¿Esto es una venta?', respuesta: `Para ser claros: ofrecemos ${loQueMandamos} gratis para que nos conozcáis. Si luego queréis que lo hagamos nosotros, os damos un precio cerrado; si no, lo que os mandamos es vuestro igualmente.` },
    { pregunta: 'Ahora no puedo, llámame más tarde', respuesta: '¿A qué hora os viene mejor? (Apunta el día y la hora, y llama a esa hora exacta.) O, si lo preferís, os lo mandamos por email y lo veis con calma.' },
    { pregunta: 'Mándame información por email', respuesta: `¡Claro! ¿A qué email? Os mandamos ${loQueMandamos} de vuestra clínica, que es más útil que un folleto.` },
    { pregunta: 'Estamos hartos de que nos llamen empresas', respuesta: `Lo entiendo, os llaman mucho. Por eso no queremos venderos nada por teléfono: solo mandaros ${loQueMandamos} por email. ¿Os viene bien?` },
    { pregunta: 'Los pacientes nos vienen por recomendación, no necesitamos web', respuesta: 'Tiene sentido: la recomendación es lo que más pesa. Pero quien os recomienda suele buscaros en Google antes de llamar, y lo que ve en ese momento cuenta. Lo que os mandamos os dice si esa primera impresión os ayuda.' },
    { pregunta: '¿Dónde estáis? ¿Podemos vernos?', respuesta: 'Estamos en Polop y trabajamos en remoto. Si os viene mejor, hacemos una videollamada cuando os vaya bien.' },
    { pregunta: 'Pásame un presupuesto', respuesta: `Claro. Para que sea un precio cerrado y real, primero os mandamos ${loQueMandamos} y luego lo ajustamos a lo que necesitéis. Como referencia, una web profesional empieza desde ${PRECIO_WEB}.` },
    { pregunta: 'Te preguntan algo técnico que no sabes', respuesta: 'Buena pregunta. Prefiero no decirte algo inexacto: lo consulto y te lo pongo por escrito en el email.' },
  ];

  const apuros = [
    `Me he liado un poco: lo importante es que os mandamos gratis ${sinWeb ? 'una web de ejemplo y una propuesta para vuestra clínica' : '3 mejoras para vuestra web'}. ¿A qué email os la envío?`,
    'No sé decirte eso ahora mismo, pero lo consulto y te lo pongo en el email.',
    'Si notas que molestas: «Te dejo trabajar. ¿Te lo mando por email y lo miras cuando puedas?»',
    'Si hay un silencio, no lo rellenes: espera. Muchas veces la otra persona está pensando.',
    'Si te dicen que no o te cuelgan de malas maneras: es normal y no es nada personal. Márcala como descartada y a la siguiente.',
  ];

  const antes = [
    sinWeb
      ? (lead.web_verificada
        ? 'Ya has comprobado que no tiene web: ofréceles una web entera, no una revisión.'
        : `Busca «${lead.name} ${lead.municipality}» en Google. Si encuentras una web suya, pulsa «He encontrado su web» y el guion se adapta.`)
      : `Abre su web un minuto en el móvil (${lead.website}): así hablas de lo que has visto con tus propios ojos.`,
    base.emailWeb ? `En su web aparece el email ${base.emailWeb}: confírmalo en la llamada.` : null,
    esMovil(lead.phone) ? 'Su teléfono es un móvil: puede ser de una persona (autónomo). Antes de llamar, consulta la Lista Robinson.' : null,
    'Si sale en la conversación, pregunta qué tratamientos hacen: los marcarás en su web de ejemplo.',
    'No tienes que vender nada por teléfono: el objetivo de la llamada es solo conseguir su email para mandarles lo que les ofreces.',
    'Mejor a media mañana o a media tarde, y no justo al abrir ni a la hora de comer.',
  ].filter(Boolean);

  const guion = pasos.flatMap(p => [p.titulo.toUpperCase(), ...p.frases]);
  return { ...base, revision, pasos, preguntas, apuros, antes, guion };
}

// Seguimiento del email enviado: toca a los 3 días laborables (lunes a viernes, sin festivos) desde el envío.
const dia = (iso) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 86_400_000;
const laborable = (d) => { const s = new Date(d * 86_400_000).getUTCDay(); return s !== 0 && s !== 6; };
export function diasLaborablesDesde(iso, ahora) {
  const fin = dia(new Date(ahora).toISOString());
  let n = 0;
  for (let d = dia(new Date(iso).toISOString()) + 1; d <= fin; d++) if (laborable(d)) n++;
  return n;
}
export function fechaSeguimiento(iso) {
  let d = dia(new Date(iso).toISOString()), n = 0;
  while (n < 3) { d++; if (laborable(d)) n++; }
  return new Date(d * 86_400_000).toISOString().slice(0, 10);
}

// Con el email enviado y sin respuesta apuntada, la ficha lleva el guion de seguimiento.
export function ficha(lead, analysis, seguimiento = null, demo = null) {
  const base = fichaBase(lead, analysis);
  if (!seguimiento || seguimiento.resultado) return base;
  const nombre = demo?.nombre ?? lead.name;
  return { ...base, seguimiento: {
    enviado: seguimiento.enviado, desde: seguimiento.desde, toca: Boolean(seguimiento.toca),
    guion: [
      `Hola, soy [tu nombre], de MentaDev. El ${seguimiento.enviado.slice(8, 10)}/${seguimiento.enviado.slice(5, 7)} os mandamos por email la web de ejemplo de ${nombre}. ¿Pudisteis echarle un vistazo?`,
      '(Si no lo han visto) ¿Os lo reenvío? A veces se cuela en Promociones o en spam.',
      '(Si les gusta) ¡Genial! ¿Os viene bien que hablemos 10 minutos para ver vuestras fotos y textos?',
      '(Si no les interesa) Sin problema, gracias por mirarlo. (Márcala como «No le interesa».)',
    ],
  } };
}

export function report(lead, analysis) {
  const f = ficha(lead, analysis);
  if (f.estado === 'sin-revisar') return `${lead.name} (${lead.municipality})\nSin revisar todavía: ejecuta "analyze ${lead.id}".`;
  if (f.estado === 'bloqueada') return `${lead.name} (${lead.municipality})\nSu web no se ha podido revisar automáticamente (robots.txt, acceso denegado o un certificado que no se pudo verificar). Revisadla a mano en el navegador si os interesa.`;
  const lines = [
    `${lead.name} (${lead.municipality}) · ${lead.website ?? 'sin web'}`,
    `Teléfono: ${lead.phone ?? 'no figura en Google: búscalo en su ficha de Google Maps'}`,
    ...(f.emailWeb ? [`Email en su web: ${f.emailWeb} (confírmalo en la llamada)`] : []),
    `Puntuación como cliente potencial: ${f.score}/10 · revisada el ${f.revisada}`,
    `Problemas: ${f.problemas.join(', ') || 'ninguno claro'}`,
    '',
  ];
  if (!f.mejoras.length) return [...lines, 'La web está bien resuelta: no es buena candidata para llamar ahora.'].join('\n');
  lines.push('Antes de llamar', ...f.antes.map(a => `- ${a}`), '');
  lines.push('Lo que hemos visto', ...f.detalle.map(d => `- ${d.problema}: ${d.significa}`), '');
  lines.push('Mejoras propuestas', ...f.mejoras.map((text, i) => `${i + 1}. ${text}`), '');
  lines.push('Qué es la revisión (para que lo expliques)', f.revision, '');
  lines.push('Guion de llamada');
  for (const p of f.pasos) {
    lines.push(`${p.titulo}:`, ...p.frases.map(l => (l.startsWith('·') ? `    ${l}` : `  - ${l}`)));
  }
  lines.push('', 'Si te preguntan…', ...f.preguntas.flatMap(q => [`- «${q.pregunta}»`, `  ${q.respuesta}`]), '');
  lines.push('Si te quedas en blanco', ...f.apuros.map(a => `- ${a}`), '');
  lines.push(`Si piden que no les llamemos más: status ${lead.id} suppressed <tu-nombre>`);
  return lines.join('\n');
}

const fechaCorta = (iso) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
const dominio = (web) => web.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

// Email para la clínica que ha dicho que sí por teléfono. Se revisa y se envía a mano desde el correo.
const AVISO_EJEMPLO = 'Es solo un mini adelanto, hecho para que os hagáis una idea: las fotos, el horario y la dirección son de muestra. Vuestra web irá mucho más allá, con vuestras fotos, vuestro equipo, vuestros tratamientos bien explicados y todo lo que os haga falta.';

export function borradorEmail(lead, analysis, consentimiento, demo = null) {
  if (!consentimiento || !analysis || analysis.blocked) return null;
  const sinWeb = analysis.problems.includes('sinweb');
  const saludo = consentimiento.atencion ? `Hola, ${consentimiento.atencion}:` : 'Hola:';
  const pie = [
    '',
    // La firma (logo, nombre y web) la pone Gmail al enviar desde info@mentadev.com.
    'Un saludo,',
    '',
    `Os escribimos porque nos disteis este email por teléfono el ${fechaCorta(consentimiento.fecha)} para recibir ${sinWeb ? (demo ? 'esta propuesta con una web de ejemplo' : 'esta propuesta') : 'esta revisión'}. Si no queréis recibir más emails nuestros, respondednos «baja» y no os escribiremos más.`,
  ];
  if (sinWeb) {
    return {
      para: consentimiento.email,
      asunto: demo ? `${demo.nombre}: así os verían vuestros próximos pacientes` : `${lead.name}: vuestra web, lista en 7 días`,
      cuerpo: [
        saludo, '',
        ...(demo
          ? [`Como os contamos por teléfono, aquí tenéis un adelanto de lo que podría ser la web de ${demo.nombre}. Abridla en el móvil: es ahí donde os buscan vuestros pacientes.`, '', demo.enlace, '', AVISO_EJEMPLO, '']
          : [`Como os contamos por teléfono, os mandamos la propuesta para la web de ${lead.name}.`, '']),
        'Antes de pedir cita, mucha gente busca la clínica en Google. Lo que encuentra en ese momento decide si llama… o si sigue buscando. Hoy, quien os busca solo ve una ficha con un teléfono. Con una web propia, ese primer vistazo juega a vuestro favor: transmitís confianza antes incluso de que suene el teléfono.', '',
        'Lo que os llevaríais:',
        '- Una web con vuestro nombre, que se ve perfecta en el móvil y en el ordenador.',
        '- Quiénes sois, vuestro equipo y vuestros tratamientos, explicados con palabras sencillas.',
        '- Preparada para que os encuentren en Google, con el mapa, el horario y el teléfono a un toque.',
        '- Y cuando os apetezca, más: reserva de citas con confirmación de la clínica o lo que os haga el día a día más fácil.', '',
        `Todo por ${PRECIO_WEB}, con precio cerrado y en 2 plazos sin intereses. Lista en ${PLAZO_WEB} desde que tengamos vuestros textos y fotos (os ayudamos con ellos), con el alojamiento del primer año y 2 meses de soporte incluidos. Si no está publicada en ese plazo, os devolvemos el primer plazo. El dominio, a vuestro nombre.`, '',
        `¿Os la imagináis ya con vuestras fotos? Respondednos a este email o escribidnos por WhatsApp al ${WHATSAPP_MENTADEV} y nos ponemos con ella. Y si no es el momento, sin problema.`,
        ...pie,
      ].join('\n'),
    };
  }
  const tres = analysis.problems.slice(0, 3);
  return {
    para: consentimiento.email,
    asunto: `${lead.name}: ${tres.length === 1 ? 'una mejora' : `${tres.length} mejoras`} para vuestra web (revisión gratis)`,
    cuerpo: [
      saludo, '',
      `Como hablamos por teléfono, os mandamos la revisión gratis de vuestra web (${dominio(lead.website)}). La hemos mirado como la vería un paciente, desde el móvil y desde el ordenador. Estas son las mejoras que os proponemos:`, '',
      ...tres.flatMap((key, i) => [`${i + 1}. ${PROBLEMS[key].fix}`, `   Lo que hemos visto: ${PROBLEMS[key].significa}`, '']),
      ...(demo ? ['Y para que veáis cómo podría verse una web nueva, os hemos preparado una de ejemplo con vuestro nombre:', '', demo.enlace, '', AVISO_EJEMPLO, ''] : []),
      `Son vuestras: podéis hacerlas con quien queráis. Si preferís que nos encarguemos nosotros, os damos un precio cerrado antes de empezar; como referencia, una web profesional nueva parte de ${PRECIO_WEB} y está lista en ${PLAZO_WEB}.`, '',
      'Si tenéis cualquier duda, respondednos a este email.',
      ...pie,
    ].join('\n'),
  };
}
