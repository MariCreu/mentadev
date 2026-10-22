// Ficha para la persona que llama. Plantillas fijas a partir de las señales: sin IA y sin
// inventar nada que la revisión no haya comprobado.
import { PROBLEMS } from './analyzer.mjs';

const DE_SECTOR = { health_clinic: 'de la clínica', aesthetic_clinic: 'del centro de estética' };

export function improvements(problems) {
  return problems.slice(0, 3).map(key => PROBLEMS[key].fix);
}

// Estructura común para el panel y para el texto de la terminal.
export function ficha(lead, analysis) {
  if (!analysis) return { estado: 'sin-revisar' };
  if (analysis.blocked) return { estado: 'bloqueada' };
  const sinWeb = analysis.problems.includes('sinweb');
  const mejoras = improvements(analysis.problems);
  const guion = !mejoras.length ? [] : [
    `Hola, buenos días. Os llamamos de MentaDev, un estudio de desarrollo web de la provincia de Alicante. ¿Podemos hablar con quien ${sinWeb ? 'se encarga de la imagen y la presencia en internet' : 'lleva la web'} ${DE_SECTOR[lead.sector] ?? 'de la clínica'}?`,
    sinWeb
      ? `Hemos visto que ${lead.name} no tiene web propia y creemos que os puede ayudar:`
      : `Hemos revisado la web de ${lead.name} y hemos visto ${mejoras.length === 1 ? 'una cosa que se puede mejorar' : `${mejoras.length} cosas que se pueden mejorar`} sin mucho esfuerzo:`,
    ...mejoras.map(text => `· ${text}`),
    'Si os parece bien, os mandamos la revisión por escrito, sin compromiso. ¿A quién se la hacemos llegar?',
    'Si no queréis que os volvamos a llamar, lo apuntamos y no os molestamos más.',
  ];
  return {
    estado: 'revisada', score: analysis.score, revisada: analysis.analyzed_at?.slice(0, 10) ?? null, sinWeb,
    problemas: analysis.problems.map(key => PROBLEMS[key].reason), mejoras, guion,
  };
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
  lines.push('Mejoras propuestas', ...f.mejoras.map((text, i) => `${i + 1}. ${text}`), '');
  lines.push(
    'Guion de llamada',
    ...f.guion.map(l => (l.startsWith('·') ? `  ${l}` : `- ${l}`)),
    '',
    `Si piden que no les llamemos más: status ${lead.id} suppressed <tu-nombre>`,
  );
  return lines.join('\n');
}
