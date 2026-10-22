// Panel local de prospección: http://localhost:4321 (solo en este ordenador).
// Arranque: doble clic en abrir-panel.cmd, o `node prospecting/panel.mjs`.
// - Escucha solo en 127.0.0.1 y rechaza cualquier Host que no sea localhost (protege del DNS rebinding).
// - Las acciones (POST) exigen JSON y la cabecera x-panel, que una web ajena no puede enviar sin permiso.
// - Los datos siguen en private-data/crm.sqlite; nada se publica.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CRM } from './crm.mjs';
import { ficha, borradorEmail } from './report.mjs';
import { buscar, revisar } from './acciones.mjs';
import { TIPOS } from '../demo/enlace.js';
import { CONTENIDO } from '../demo/contenido.js';

const PUERTO = 4321;
const CARPETA = new URL('./panel/', import.meta.url);
const FUENTES = new URL('../assets/fonts/', import.meta.url);
const ESTATICOS = { '/': ['index.html', 'text/html; charset=utf-8'], '/panel.css': ['panel.css', 'text/css; charset=utf-8'], '/panel.js': ['panel.js', 'text/javascript; charset=utf-8'], '/favicon.svg': ['../../assets/favicon.svg', 'image/svg+xml'] };
const DEMO = new URL('../demo/', import.meta.url);
const TIPOS_ARCHIVO = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.webp': 'image/webp', '.woff2': 'font/woff2' };
// Vista previa local de la demo: solo estos archivos de demo/ y las fuentes que usa (nada más de esas carpetas ni de fuera).
const DEMO_ARCHIVOS = /^\/demo\/(?:(?:enlace|horario|contenido|demo)\.js|demo\.css|fotos\/[a-z0-9-]+\.webp)$/;
const FUENTES_DEMO = new Set(['poppins-latin-400-normal.woff2', 'poppins-latin-500-normal.woff2', 'poppins-latin-600-normal.woff2', 'bricolage-grotesque-latin-wght-normal.woff2']);
const PERMITIDAS = new Set(['poppins-latin-400-normal.woff2', 'poppins-latin-500-normal.woff2', 'poppins-latin-600-normal.woff2', 'bricolage-grotesque-latin-wght-normal.woff2']);
// Catálogo de la demo para el formulario: tipos, títulos de tratamientos (en español) y los que se marcan por defecto.
const CATALOGO = {
  tipos: TIPOS.map((id) => ({ id, nombre: CONTENIDO[id].nombre.es })),
  tratamientos: Object.fromEntries(TIPOS.map((id) => [id, CONTENIDO[id].tratamientos.map((x) => x.es.t)])),
  defecto: Object.fromEntries(TIPOS.map((id) => [id, [...CONTENIDO[id].defecto]])),
};
const SECTORES = new Set(['health_clinic', 'aesthetic_clinic']);

export function crearPanel({ crm, clave = null, fetchImpl, pausa = 2000 }) {
  // Todo lo que la ficha necesita de una clínica: datos, guion, sí apuntado y borrador del email.
  const detalleDe = (id) => {
    const clinica = crm.lead(id);
    const analisis = crm.latestAnalysis(id);
    const consentimiento = crm.consentimiento(id) ?? null;
    const demo = crm.demo(id) ?? null;
    const demoPorDefecto = { ...crm.demoPorDefecto(id) };
    demoPorDefecto.tratamientos = [...demoPorDefecto.tratamientos];
    return { clinica, ficha: ficha(clinica, analisis), consentimiento, email: borradorEmail(clinica, analisis, consentimiento, demo), demo, demoPorDefecto, catalogo: CATALOGO };
  };
  let trabajo = { activo: false, tipo: null, hecho: 0, total: 0, mensaje: '', error: null };
  const lanzar = (tipo, tarea) => {
    trabajo = { activo: true, tipo, hecho: 0, total: 0, mensaje: tipo === 'buscar' ? 'Buscando en Google…' : 'Preparando la revisión…', error: null };
    const avance = ({ hecho, total, nombre }) => { trabajo = { ...trabajo, hecho, total, mensaje: nombre ? `Revisando ${hecho + 1} de ${total}: ${nombre}` : trabajo.mensaje }; };
    tarea(avance)
      .then((mensaje) => { trabajo = { ...trabajo, activo: false, mensaje }; })
      .catch((error) => { trabajo = { ...trabajo, activo: false, error: error.message }; });
  };

  return createServer(async (req, res) => {
    const responder = (estado, cuerpo, tipo = 'application/json; charset=utf-8') => {
      res.writeHead(estado, { 'content-type': tipo, 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer' });
      res.end(typeof cuerpo === 'string' || Buffer.isBuffer(cuerpo) ? cuerpo : JSON.stringify(cuerpo));
    };
    try {
      const host = (req.headers.host ?? '').replace(/:\d+$/, '');
      if (!['localhost', '127.0.0.1', '[::1]'].includes(host)) return responder(403, { error: 'Solo desde este ordenador' });
      const url = new URL(req.url, 'http://localhost');
      const ruta = url.pathname;

      if (req.method === 'GET') {
        if (ESTATICOS[ruta]) {
          const [archivo, tipo] = ESTATICOS[ruta];
          return responder(200, await readFile(new URL(archivo, CARPETA)), tipo);
        }
        if (ruta === '/demo/' || DEMO_ARCHIVOS.test(ruta)) {
          const relativa = ruta === '/demo/' ? 'index.html' : ruta.slice('/demo/'.length);
          return responder(200, await readFile(new URL(relativa, DEMO)), TIPOS_ARCHIVO[relativa.slice(relativa.lastIndexOf('.'))]);
        }
        if (ruta.startsWith('/assets/fonts/')) {
          const nombre = ruta.slice('/assets/fonts/'.length);
          if (!FUENTES_DEMO.has(nombre)) return responder(404, { error: 'No existe' });
          return responder(200, await readFile(new URL(nombre, FUENTES)), 'font/woff2');
        }
        if (ruta.startsWith('/fuentes/')) {
          const nombre = ruta.slice('/fuentes/'.length);
          if (!PERMITIDAS.has(nombre)) return responder(404, { error: 'No existe' });
          return responder(200, await readFile(new URL(nombre, FUENTES)), 'font/woff2');
        }
        if (ruta === '/api/clinicas') {
          const vista = url.searchParams.get('vista') ?? 'porllamar';
          return responder(200, { clinicas: crm.vista(vista), cuentas: crm.cuentas() });
        }
        const detalle = ruta.match(/^\/api\/clinicas\/(\d+)$/);
        if (detalle) {
          const clinica = crm.lead(Number(detalle[1]));
          if (!clinica) return responder(404, { error: 'Esa clínica no existe' });
          return responder(200, detalleDe(clinica.id));
        }
        if (ruta === '/api/trabajo') return responder(200, trabajo);
        if (ruta === '/api/estado') return responder(200, { clave: Boolean(clave) });
        return responder(404, { error: 'No existe' });
      }

      if (req.method === 'POST') {
        if (req.headers['x-panel'] !== '1' || !String(req.headers['content-type']).startsWith('application/json')) return responder(403, { error: 'Petición no permitida' });
        let texto = '';
        for await (const trozo of req) { texto += trozo; if (texto.length > 10_000) return responder(413, { error: 'Demasiado grande' }); }
        let datos;
        try { datos = JSON.parse(texto || '{}'); } catch { return responder(400, { error: 'JSON no válido' }); }

        const marca = ruta.match(/^\/api\/clinicas\/(\d+)\/estado$/);
        if (marca) {
          const id = Number(marca[1]);
          if (!crm.lead(id)) return responder(404, { error: 'Esa clínica no existe' });
          if (datos.estado === 'suppressed' && datos.confirmar !== true) return responder(400, { error: 'Confirma que no quieres volver a llamar: no se puede deshacer' });
          try { crm.setStatus(id, datos.estado, 'panel'); } catch (error) { return responder(400, { error: error.message }); }
          return responder(200, { clinica: crm.lead(id) });
        }
        const si = ruta.match(/^\/api\/clinicas\/(\d+)\/si$/);
        if (si) {
          const id = Number(si[1]);
          if (!crm.lead(id)) return responder(404, { error: 'Esa clínica no existe' });
          try { crm.registrarSi(id, { email: datos.email, quien: datos.quien, atencion: datos.atencion }); } catch (error) { return responder(400, { error: error.message }); }
          return responder(200, detalleDe(id));
        }
        const demo = ruta.match(/^\/api\/clinicas\/(\d+)\/demo$/);
        if (demo) {
          const id = Number(demo[1]);
          if (!crm.lead(id)) return responder(404, { error: 'Esa clínica no existe' });
          try { crm.guardarDemo(id, { nombre: datos.nombre, tipo: datos.tipo, tratamientos: datos.tratamientos, whatsapp: datos.whatsapp }); } catch (error) { return responder(400, { error: error.message }); }
          return responder(200, detalleDe(id));
        }
        // Web comprobada a mano: se guarda y se vuelve a revisar al momento, para que el guion se adapte.
        const web = ruta.match(/^\/api\/clinicas\/(\d+)\/web$/);
        if (web) {
          const id = Number(web[1]);
          if (!crm.lead(id)) return responder(404, { error: 'Esa clínica no existe' });
          const direccion = typeof datos.web === 'string' && datos.web.trim() ? datos.web.trim().replace(/^(?!https?:\/\/)/i, 'https://') : null;
          try { crm.setWebsite(id, direccion); } catch (error) { return responder(400, { error: error.message }); }
          await revisar(crm, [id], { pageSpeedKey: clave, fetchImpl, pausa: 0 });
          return responder(200, detalleDe(id));
        }
        if (ruta === '/api/buscar') {
          const consulta = typeof datos.consulta === 'string' ? datos.consulta.trim() : '';
          if (!consulta || consulta.length > 120) return responder(400, { error: 'Escribe qué buscar, por ejemplo «clínica dental Altea»' });
          if (!SECTORES.has(datos.sector)) return responder(400, { error: 'Sector no válido' });
          if (!clave) return responder(400, { error: 'Falta GOOGLE_MAPS_API_KEY en private-data/.env' });
          if (trabajo.activo) return responder(409, { error: 'Ya hay una búsqueda o revisión en marcha' });
          lanzar('buscar', async (avance) => {
            crm.purge();
            const r = await buscar(crm, { consulta, sector: datos.sector, clave, fetchImpl });
            const nuevas = r.ids.filter((id) => !crm.latestAnalysis(id));
            await revisar(crm, nuevas, { pageSpeedKey: clave, fetchImpl, pausa, alAvanzar: avance });
            return `${r.encontradas} ${r.encontradas === 1 ? 'encontrada' : 'encontradas'}, ${r.sinWeb} sin web, ${nuevas.length} ${nuevas.length === 1 ? 'web revisada' : 'webs revisadas'}`;
          });
          return responder(202, trabajo);
        }
        if (ruta === '/api/revisar') {
          if (trabajo.activo) return responder(409, { error: 'Ya hay una búsqueda o revisión en marcha' });
          const ids = crm.pendientes();
          lanzar('revisar', async (avance) => {
            await revisar(crm, ids, { pageSpeedKey: clave, fetchImpl, pausa, alAvanzar: avance });
            return `${ids.length} ${ids.length === 1 ? 'web revisada' : 'webs revisadas'}`;
          });
          return responder(202, trabajo);
        }
        return responder(404, { error: 'No existe' });
      }
      return responder(405, { error: 'Método no permitido' });
    } catch (error) {
      return responder(500, { error: error.message });
    }
  });
}

// Arranque directo: lee la clave de private-data/.env, abre la base y el navegador.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const env = new URL('../private-data/.env', import.meta.url);
  if (existsSync(env)) process.loadEnvFile(fileURLToPath(env));
  const crm = new CRM(fileURLToPath(new URL('../private-data/crm.sqlite', import.meta.url)));
  crm.purge();
  const servidor = crearPanel({ crm, clave: process.env.GOOGLE_MAPS_API_KEY || null });
  const direccion = `http://localhost:${PUERTO}`;
  const abrirNavegador = () => {
    if (!process.argv.includes('--sin-navegador') && process.platform === 'win32') import('node:child_process').then(({ exec }) => exec(`start "" ${direccion}`));
  };
  servidor.listen(PUERTO, '127.0.0.1', () => {
    console.log(`Panel de prospección en ${direccion}`);
    console.log('Deja esta ventana abierta mientras lo uses; ciérrala para pararlo.');
    abrirNavegador();
  });
  servidor.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      // Ya hay un panel abierto (otra ventana): se abre el navegador en él.
      console.log(`El panel ya estaba abierto en ${direccion}: lo abro en el navegador.`);
      abrirNavegador();
      setTimeout(() => process.exit(0), 1500);
      return;
    }
    console.error(error.message);
    process.exit(1);
  });
}
