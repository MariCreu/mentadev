// Datos de los sectores de la home "Taller en directo". Fuente única para el hero,
// la tienda, el panel, la automatización, la calculadora y el formulario.
// Los productos, precios y citas son EJEMPLOS (la interfaz los marca como tales).
// Precio en céntimos; 0 = "Gratis".
// `reserva`: la web de ejemplo del hero (horas que ofrece, cómo se llama la entrada nueva en la agenda,
// el aviso al reservar y, si no vale `web.boton`, el texto del botón de reserva).
export const SECTOR_POR_DEFECTO = 'clinica';

export const SECTORES = [
  {
    id: 'clinica', etiqueta: 'Clínica', articulo: 'una clínica', acento: '#22688A',
    web: { nombre: 'Tu clínica', titular: 'Tu salud, en buenas manos.', boton: 'Pedir cita' },
    productos: [{ nombre: 'Valoración inicial', precio: 3000 }, { nombre: 'Sesión de fisioterapia', precio: 4000 }, { nombre: 'Bono de 5 sesiones', precio: 18000 }],
    reserva: { elige: 'Elige hora', horas: ['11:00', '16:00', '18:30'], nueva: 'Nueva cita', hecha: 'Cita reservada' },
    panel: { titulo: 'Citas de hoy', unidad: 'huecos', libres: 3, citas: [
      { hora: '09:00', texto: 'Primera valoración' }, { hora: '10:30', texto: 'Sesión de seguimiento' },
      { hora: '12:00', texto: 'Revisión' }, { hora: '17:30', texto: 'Sesión de fisioterapia' }] },
    flujos: [
      { icono: 'cal', desde: 'Un paciente pide cita', hasta: 'Confirmación y recordatorio automáticos' },
      { icono: 'calx', desde: 'Alguien cancela a última hora', hasta: 'Se avisa a la lista de espera y el hueco se llena' },
      { icono: 'star', desde: 'Termina un tratamiento', hasta: 'Se le pide su opinión y se programa la revisión' },
      { icono: 'receipt', desde: 'Llega fin de mes', hasta: 'Las facturas se generan y se envían solas' }],
    calculadora: { horas: 5, tarifa: 25 },
  },
  {
    id: 'restaurante', etiqueta: 'Restaurante', articulo: 'un restaurante', acento: '#27725F',
    web: { nombre: 'Tu restaurante', titular: 'Cocina de casa, mesa reservada.', boton: 'Reservar mesa' },
    productos: [{ nombre: 'Menú del día', precio: 1450 }, { nombre: 'Parrillada para dos', precio: 3200 }, { nombre: 'Tarta casera', precio: 450 }],
    reserva: { elige: 'Elige hora', horas: ['14:30', '15:00', '21:30'], nueva: 'Nueva reserva', hecha: 'Mesa reservada' },
    panel: { titulo: 'Reservas de hoy', unidad: 'mesas', libres: 3, citas: [
      { hora: '13:30', texto: 'Mesa 4 · 2 personas' }, { hora: '14:00', texto: 'Mesa 7 · 4 personas' },
      { hora: '20:30', texto: 'Mesa 2 · 3 personas' }, { hora: '21:00', texto: 'Mesa 9 · 6 personas' }] },
    flujos: [
      { icono: 'cal', desde: 'Entra una reserva online', hasta: 'Confirmación y recordatorio para que no falle' },
      { icono: 'food', desde: 'Llega un pedido para llevar', hasta: 'Pasa a cocina ordenado y sin errores' },
      { icono: 'receipt', desde: 'Un proveedor envía su factura', hasta: 'Queda registrada y lista para la gestoría' },
      { icono: 'chart', desde: 'Cierras el día', hasta: 'Te llega al móvil el resumen de ventas' }],
    calculadora: { horas: 6, tarifa: 18 },
  },
  {
    id: 'estetica', etiqueta: 'Peluquería y estética', articulo: 'una peluquería o centro de estética', acento: '#9A3B6B',
    web: { nombre: 'Tu salón', titular: 'Tu mejor versión, con cita en un minuto.', boton: 'Reservar cita' },
    productos: [{ nombre: 'Corte y peinado', precio: 2200 }, { nombre: 'Color', precio: 4500 }, { nombre: 'Manicura', precio: 1800 }],
    reserva: { elige: 'Elige hora', horas: ['12:30', '17:00', '19:00'], nueva: 'Nueva cita', hecha: 'Cita reservada' },
    panel: { titulo: 'Citas de hoy', unidad: 'huecos', libres: 4, citas: [
      { hora: '10:00', texto: 'Corte y peinado' }, { hora: '11:15', texto: 'Color' },
      { hora: '16:30', texto: 'Manicura' }, { hora: '18:00', texto: 'Corte' }] },
    flujos: [
      { icono: 'cal', desde: 'Un cliente reserva', hasta: 'Recordatorio el día antes y menos citas perdidas' },
      { icono: 'clock', desde: 'Pasan 6 semanas desde su última visita', hasta: 'Se le invita a volver a reservar' },
      { icono: 'gift', desde: 'Es su cumpleaños', hasta: 'Le llega una felicitación con un detalle' },
      { icono: 'ticket', desde: 'Vendes un bono de sesiones', hasta: 'Las sesiones se descuentan y se avisa al acabar' }],
    calculadora: { horas: 4, tarifa: 18 },
  },
  {
    id: 'tienda', etiqueta: 'Tienda', articulo: 'una tienda', acento: '#6F5BBF',
    web: { nombre: 'Tu tienda', titular: 'Lo que te gusta, a un clic.', boton: 'Ver productos' },
    productos: [{ nombre: 'Taza de cerámica', precio: 950 }, { nombre: 'Camiseta', precio: 1990 }, { nombre: 'Pack regalo', precio: 2900 }],
    reserva: { elige: 'Recógelo hoy', horas: ['12:00', '17:00', '19:00'], nueva: 'Recogida en tienda', hecha: 'Recogida reservada', boton: 'Reservar recogida' },
    panel: { titulo: 'Pedidos de hoy', unidad: 'envíos', libres: 5, citas: [
      { hora: '09:12', texto: 'Pedido · 2 productos' }, { hora: '11:40', texto: 'Pedido · 1 producto' },
      { hora: '13:05', texto: 'Pedido · 3 productos' }, { hora: '18:22', texto: 'Pedido · 1 producto' }] },
    flujos: [
      { icono: 'cart', desde: 'Vendes un producto online', hasta: 'El stock se actualiza en todos tus canales' },
      { icono: 'truck', desde: 'Envías un pedido', hasta: 'El cliente recibe el aviso con el seguimiento' },
      { icono: 'mail', desde: 'Alguien deja el carrito a medias', hasta: 'Le llega un recordatorio amable' },
      { icono: 'bell', desde: 'Queda poco stock', hasta: 'Te avisa para reponer a tiempo' }],
    calculadora: { horas: 6, tarifa: 20 },
  },
  {
    id: 'academia', etiqueta: 'Academia', articulo: 'una academia', acento: '#3F49A6',
    web: { nombre: 'Tu academia', titular: 'Aprende con quien sabe enseñar.', boton: 'Apuntarme' },
    productos: [{ nombre: 'Clase de prueba', precio: 0 }, { nombre: 'Matrícula', precio: 3000 }, { nombre: 'Mensualidad', precio: 7500 }],
    reserva: { elige: 'Clase de prueba', horas: ['16:30', '18:30', '20:00'], nueva: 'Clase de prueba', hecha: 'Plaza reservada' },
    panel: { titulo: 'Clases de hoy', unidad: 'plazas', libres: 6, citas: [
      { hora: '16:00', texto: 'Inglés · nivel inicial' }, { hora: '17:00', texto: 'Refuerzo escolar' },
      { hora: '18:00', texto: 'Inglés · nivel medio' }, { hora: '19:30', texto: 'Preparación de examen' }] },
    flujos: [
      { icono: 'user', desde: 'Se apunta un alumno nuevo', hasta: 'Alta, bienvenida y cobro, todo en orden' },
      { icono: 'receipt', desde: 'Llega el recibo del mes', hasta: 'Se cobra y se avisa solo' },
      { icono: 'bell', desde: 'Un alumno falta a clase', hasta: 'Se avisa a la familia al momento' },
      { icono: 'doc', desde: 'Acaba el trimestre', hasta: 'Cada alumno recibe su informe' }],
    calculadora: { horas: 5, tarifa: 20 },
  },
  {
    id: 'otro', etiqueta: 'Otro', articulo: 'un negocio', acento: '#1F2937',
    web: { nombre: 'Tu negocio', titular: 'Tu negocio, por fin en internet.', boton: 'Contactar' },
    productos: [{ nombre: 'Servicio básico', precio: 5000 }, { nombre: 'Servicio completo', precio: 12000 }, { nombre: 'Bono mensual', precio: 9000 }],
    reserva: { elige: 'Elige hora', horas: ['10:00', '12:30', '18:30'], nueva: 'Nueva cita', hecha: 'Cita reservada', boton: 'Pedir cita' },
    panel: { titulo: 'Agenda de hoy', unidad: 'huecos', libres: 3, citas: [
      { hora: '09:30', texto: 'Reunión con cliente' }, { hora: '11:00', texto: 'Presupuesto pendiente' },
      { hora: '16:00', texto: 'Entrega de trabajo' }, { hora: '17:30', texto: 'Llamada de seguimiento' }] },
    flujos: [
      { icono: 'cal', desde: 'Un cliente reserva', hasta: 'Confirmación y recordatorio automáticos' },
      { icono: 'box', desde: 'Entra un pedido', hasta: 'Se registra y se avisa automáticamente' },
      { icono: 'doc', desde: 'Recibes un formulario', hasta: 'Los datos llegan ordenados y empieza el seguimiento' },
      { icono: 'chart', desde: 'Haces el mismo informe cada semana', hasta: 'Se genera y se envía solo' }],
    calculadora: { horas: 5, tarifa: 20 },
  },
];

export const sectorPorId = (id) => SECTORES.find((s) => s.id === id);

export const formatearPrecio = (centimos) =>
  centimos === 0 ? 'Gratis' : new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(centimos / 100);
