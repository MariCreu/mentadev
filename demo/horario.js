// Horario de la clínica: abierto/cerrado ahora, en hora de Madrid. Módulo puro (navegador y Node).
const DIAS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export const hhmm = (minutos) => String(Math.floor(minutos / 60)).padStart(2, '0') + ':' + String(minutos % 60).padStart(2, '0');

export function ahoraEnMadrid(fecha) {
  const p = {};
  for (const x of new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(fecha)) p[x.type] = x.value;
  return { dia: DIAS[p.weekday], minutos: Number(p.hour) * 60 + Number(p.minute) };
}

// horario: 7 días (0 = domingo), cada uno con tramos [inicio, fin] en minutos.
export function estadoHorario(horario, ahora) {
  const hoy = horario[ahora.dia] || [];
  const tramo = hoy.find(([a, b]) => ahora.minutos >= a && ahora.minutos < b);
  const hasta = tramo ? tramo[1] : null;
  let abre = null;
  if (!tramo) {
    const mas = hoy.find(([a]) => a > ahora.minutos);
    if (mas) abre = { dia: ahora.dia, minutos: mas[0] };
    for (let i = 1; i <= 7 && !abre; i++) {
      const dia = (ahora.dia + i) % 7;
      const t = horario[dia] && horario[dia][0];
      if (t) abre = { dia, minutos: t[0] };
    }
  }
  return { abierto: !!tramo, hasta, abre };
}
