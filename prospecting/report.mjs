// Ficha para la persona que llama. Plantillas fijas a partir de las señales: sin IA y sin
// inventar nada que la revisión no haya comprobado.
import { PROBLEMS } from './analyzer.mjs';

const DE_SECTOR = { health_clinic: 'de la clínica', aesthetic_clinic: 'del centro de estética' };

export function improvements(problems) {
  return problems.slice(0, 3).map(key => PROBLEMS[key].fix);
}

export function report(lead, analysis) {
  if (!analysis) return `${lead.name} (${lead.municipality})\nSin revisar todavía: ejecuta "analyze ${lead.id}".`;
  if (analysis.blocked) return `${lead.name} (${lead.municipality})\nSu web no permite la revisión automática (robots.txt o acceso denegado). Revisadla a mano si os interesa.`;
  const mejoras = improvements(analysis.problems);
  const lines = [
    `${lead.name} (${lead.municipality}) · ${lead.website ?? 'sin web'}`,
    `Puntuación como cliente potencial: ${analysis.score}/10 · revisada el ${analysis.analyzed_at.slice(0, 10)}`,
    `Problemas: ${analysis.problems.map(key => PROBLEMS[key].reason).join(', ') || 'ninguno claro'}`,
    '',
  ];
  if (!mejoras.length) return [...lines, 'La web está bien resuelta: no es buena candidata para llamar ahora.'].join('\n');
  lines.push('Mejoras propuestas', ...mejoras.map((text, i) => `${i + 1}. ${text}`), '');
  lines.push(
    'Guion de llamada',
    `- Hola, buenos días. Os llamamos de MentaDev, un estudio de desarrollo web de la provincia de Alicante. ¿Podemos hablar con quien lleva la web ${DE_SECTOR[lead.sector] ?? 'de la clínica'}?`,
    analysis.problems.includes('sinweb')
      ? `- Hemos visto que ${lead.name} no tiene web propia y creemos que os puede ayudar:`
      : `- Hemos revisado la web de ${lead.name} y hemos visto ${mejoras.length === 1 ? 'una cosa que se puede mejorar' : `${mejoras.length} cosas que se pueden mejorar`} sin mucho esfuerzo:`,
    ...mejoras.map(text => `  · ${text}`),
    '- Si os parece bien, os mandamos la revisión por escrito, sin compromiso. ¿A quién se la hacemos llegar?',
    '- Si no queréis que os volvamos a llamar, lo apuntamos y no os molestamos más.',
    '',
    `Si piden que no les llamemos más: status ${lead.id} suppressed <tu-nombre>`,
  );
  return lines.join('\n');
}
