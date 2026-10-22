// Ficha para la persona que llama. Plantillas fijas a partir de las señales: sin IA y sin
// inventar nada que la revisión no haya comprobado.
// Precios y plazos: los mismos que publica la web (CLAUDE.md, "Precios"). Si cambian allí, cambiarlos aquí.
import { PROBLEMS } from './analyzer.mjs';

const DE_SECTOR = { health_clinic: 'de la clínica', aesthetic_clinic: 'del centro de estética' };
const PRECIO_WEB = '349 € + IVA';
const PLAZO_WEB = '7 días laborables';

export function improvements(problems) {
  return problems.slice(0, 3).map(key => PROBLEMS[key].fix);
}

const esMovil = (tel) => /^[67]/.test((tel ?? '').replace(/\D/g, '').replace(/^34/, ''));

// Estructura común para el panel y para el texto de la terminal.
export function ficha(lead, analysis) {
  if (!analysis) return { estado: 'sin-revisar' };
  if (analysis.blocked) return { estado: 'bloqueada' };
  const sinWeb = analysis.problems.includes('sinweb');
  const mejoras = improvements(analysis.problems);
  const detalle = analysis.problems.map(key => ({ problema: PROBLEMS[key].reason, significa: PROBLEMS[key].significa, mejora: PROBLEMS[key].fix }));
  const base = {
    estado: 'revisada', score: analysis.score, revisada: analysis.analyzed_at?.slice(0, 10) ?? null, sinWeb,
    problemas: analysis.problems.map(key => PROBLEMS[key].reason), mejoras, detalle,
  };
  if (!mejoras.length) return { ...base, pasos: [], guion: [], preguntas: [], apuros: [], antes: [], revision: '' };

  const de = DE_SECTOR[lead.sector] ?? 'de la clínica';
  const quien = sinWeb ? 'quien se encarga de la imagen y la presencia en internet' : 'quien lleva la web';
  const loQueMandamos = sinWeb ? 'la propuesta' : 'la revisión';

  // En vosotros: sirve para entenderla y para decírsela tal cual a la clínica.
  const revision = sinWeb
    ? `Como no tenéis web, en lugar de revisarla os mandamos por email una propuesta gratis: qué secciones tendría vuestra web, qué pondríamos en cada una y el precio cerrado (desde ${PRECIO_WEB}, lista en ${PLAZO_WEB}). Es gratis y sin compromiso: si no os convence, no pasa nada.`
    : `Es muy sencillo: miramos vuestra web con calma, como la vería un paciente desde el móvil y desde el ordenador, y en 48 h laborables os mandamos por email 3 mejoras concretas, explicadas sin tecnicismos, para que más pacientes os escriban y pidan cita. Es gratis y sin compromiso: las mejoras son vuestras y las podéis hacer con quien queráis. Si luego queréis que las hagamos nosotros, os damos un precio cerrado antes de empezar.`;

  const pasos = [
    {
      titulo: 'Saludo',
      frases: [
        `Hola, buenos días. Soy [tu nombre], de MentaDev, un estudio de la Marina Baixa que hace webs para clínicas. ¿Hablo con ${quien} ${de}?`,
        '(Si te dicen que sí) Perfecto, te robo solo un minuto.',
      ],
      siRecepcion: [
        `Os llamo por ${sinWeb ? 'la presencia en internet' : 'la web'} ${de}. ¿Con quién podría hablar de eso?`,
        '(Si no está) ¿Cuándo es mejor llamar? ¿Y por quién pregunto?',
        '(Si te piden que lo mandes por email) Claro: ¿a qué email, y a la atención de quién?',
      ],
    },
    {
      titulo: 'Por qué llamas',
      frases: sinWeb
        ? [
          `Hemos visto que ${lead.name} no tiene web propia: si alguien os busca en internet, solo encuentra vuestra ficha de Google.`,
          'Y muchos pacientes, antes de pedir cita, miran la web para ver qué hacéis y cómo es la clínica.',
        ]
        : [
          `Hemos estado mirando webs de clínicas de ${lead.municipality} y, en la vuestra, nos hemos fijado en ${mejoras.length === 1 ? 'una cosa que se puede mejorar' : `${mejoras.length} cosas que se pueden mejorar`} sin mucho esfuerzo:`,
          ...analysis.problems.slice(0, 3).map(key => `· ${PROBLEMS[key].reason}: ${PROBLEMS[key].dicho}`),
        ],
    },
    {
      titulo: 'Qué les ofreces',
      frases: sinWeb
        ? [
          `Hacemos webs para clínicas desde ${PRECIO_WEB}, con precio cerrado y lista en ${PLAZO_WEB}. Incluye el alojamiento del primer año y 2 meses de soporte.`,
          'Si os parece, os mandamos por email una propuesta gratis: qué tendría vuestra web y cuánto costaría exactamente. Sin compromiso.',
        ]
        : [
          'Os proponemos una revisión gratis: la miramos con calma y en 48 h laborables os mandamos por email 3 mejoras concretas, explicadas sin tecnicismos.',
          'Es gratis y sin compromiso: las mejoras son vuestras y las podéis hacer con quien queráis.',
        ],
    },
    {
      titulo: 'Cierre',
      frases: [
        `¿A qué email os mandamos ${loQueMandamos}? ¿Y a la atención de quién?`,
        `(Repite el email letra a letra.) Perfecto: os llegará de MentaDev${sinWeb ? '' : ' en 48 h laborables'}. Muchas gracias por tu tiempo.`,
        '(Si dicen que no) Sin problema, gracias igualmente. ¿Preferís que no os volvamos a llamar? (Si dicen que sí, márcala como «No volver a llamar».)',
      ],
    },
  ];

  const preguntas = [
    { pregunta: '¿Quiénes sois? ¿De dónde sois?', respuesta: 'Somos MentaDev, un estudio de desarrollo web de la Marina Baixa, en Polop. Hacemos webs, tiendas online y herramientas para negocios pequeños, y siempre habláis con quien hace el trabajo.' },
    { pregunta: '¿Cómo habéis conseguido mi número?', respuesta: 'Está en vuestra ficha pública de Google. Si preferís que no os llamemos más, lo apuntamos ahora mismo y no volvemos a hacerlo.' },
    { pregunta: '¿Qué es eso de la revisión exactamente?', respuesta: revision },
    { pregunta: '¿Cuánto cuesta?', respuesta: `${sinWeb ? 'La propuesta' : 'La revisión'} es gratis. Si después queréis una web nueva, empieza desde ${PRECIO_WEB} con precio cerrado, y se puede pagar en 2 plazos sin intereses. Cosas como la cita online o una tienda se presupuestan aparte, siempre con precio cerrado antes de empezar.` },
    { pregunta: '¿Cuánto tardaríais en hacerla?', respuesta: `Una web profesional está lista en ${PLAZO_WEB} desde que tenemos vuestros textos y fotos. Si no la publicamos en ese plazo, os devolvemos el primer plazo.` },
    { pregunta: 'Ya tenemos a alguien que nos lleva la web', respuesta: `Perfecto, entonces ${loQueMandamos} os viene aún mejor: se la podéis pasar a esa persona para que haga los cambios. No pretendemos quitarle el trabajo a nadie.` },
    { pregunta: 'No me interesa', respuesta: `Lo entiendo. Solo es un email con ${sinWeb ? 'una propuesta' : '3 cosas concretas'}: lo leéis cuando podáis y, si no os sirve, lo borráis. ¿Os lo mandamos? (Si insisten: «Sin problema, gracias por tu tiempo».)` },
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
    `Me he liado un poco: lo importante es que os mandamos gratis ${sinWeb ? 'una propuesta para vuestra web' : '3 mejoras para vuestra web'}. ¿A qué email os la envío?`,
    'No sé decirte eso ahora mismo, pero lo consulto y te lo pongo en el email.',
    'Si notas que molestas: «Te dejo trabajar. ¿Te lo mando por email y lo miras cuando puedas?»',
    'Si hay un silencio, no lo rellenes: espera. Muchas veces la otra persona está pensando.',
    'Si te dicen que no o te cuelgan de malas maneras: es normal y no es nada personal. Márcala como descartada y a la siguiente.',
  ];

  const antes = [
    sinWeb
      ? `Busca «${lead.name} ${lead.municipality}» en Google: si encuentras una web suya, no digas que no tienen; usa entonces lo que veas en ella.`
      : `Abre su web un minuto en el móvil (${lead.website}): así hablas de lo que has visto con tus propios ojos.`,
    esMovil(lead.phone) ? 'Su teléfono es un móvil: puede ser de una persona (autónomo). Antes de llamar, consulta la Lista Robinson.' : null,
    'No tienes que vender nada por teléfono: el objetivo de la llamada es solo conseguir su email para mandarles lo que les ofreces.',
    'Mejor a media mañana o a media tarde, y no justo al abrir ni a la hora de comer.',
  ].filter(Boolean);

  const guion = pasos.flatMap(p => [`${p.titulo.toUpperCase()}`, ...p.frases, ...(p.siRecepcion ? ['Si contesta recepción:', ...p.siRecepcion] : [])]);
  return { ...base, revision, pasos, preguntas, apuros, antes, guion };
}

export function report(lead, analysis) {
  const f = ficha(lead, analysis);
  if (f.estado === 'sin-revisar') return `${lead.name} (${lead.municipality})\nSin revisar todavía: ejecuta "analyze ${lead.id}".`;
  if (f.estado === 'bloqueada') return `${lead.name} (${lead.municipality})\nSu web no se ha podido revisar automáticamente (robots.txt, acceso denegado o un certificado que no se pudo verificar). Revisadla a mano en el navegador si os interesa.`;
  const lines = [
    `${lead.name} (${lead.municipality}) · ${lead.website ?? 'sin web'}`,
    `Teléfono: ${lead.phone ?? 'no figura en Google: búscalo en su ficha de Google Maps'}`,
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
    if (p.siRecepcion) lines.push('  Si contesta recepción:', ...p.siRecepcion.map(l => `    - ${l}`));
  }
  lines.push('', 'Si te preguntan…', ...f.preguntas.flatMap(q => [`- «${q.pregunta}»`, `  ${q.respuesta}`]), '');
  lines.push('Si te quedas en blanco', ...f.apuros.map(a => `- ${a}`), '');
  lines.push(`Si piden que no les llamemos más: status ${lead.id} suppressed <tu-nombre>`);
  return lines.join('\n');
}
