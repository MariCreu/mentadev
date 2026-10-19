// Ahorro estimado de automatizar: se supone que se automatiza la mitad del tiempo.
// Si cambia el precio de la automatización, cambiar PRICE_FROM (y la web).
export const AUTOMATABLE = 0.5;
export const PRICE_FROM = 490;
const SEMANAS_MES = 52 / 12;

export function calcularAhorro(horasSemana, tarifaHora) {
  const horasMes = horasSemana * AUTOMATABLE * SEMANAS_MES;
  const eurosMes = horasMes * tarifaHora;
  const mesesExactos = PRICE_FROM / eurosMes;
  const caso = mesesExactos < 1 ? 'menos-de-un-mes' : mesesExactos <= 24 ? 'meses' : 'no-compensa';
  return { horasMes, eurosAno: eurosMes * 12, meses: Math.ceil(mesesExactos), caso };
}

export function textoAmortizacion({ caso, meses }) {
  if (caso === 'menos-de-un-mes') return `Una automatización desde ${PRICE_FROM} € + IVA se amortizaría en menos de un mes.`;
  if (caso === 'meses') return `Una automatización desde ${PRICE_FROM} € + IVA se amortizaría en unos ${meses} meses.`;
  return 'Con tan poco tiempo quizá no compense automatizar. En el diagnóstico te lo diremos con sinceridad.';
}
