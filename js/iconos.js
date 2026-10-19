// Trazos SVG (viewBox 24, trazo 1.8) de los iconos de los flujos de automatización.
// Claves usadas en js/sectores.js (flujos[].icono).
export const ICONOS = {
  "cal": "<rect x=\"3\" y=\"5\" width=\"18\" height=\"16\" rx=\"2\"></rect><path d=\"M3 10h18M8 3v4M16 3v4\"></path>",
  "food": "<path d=\"M7 3v18M4 3v5a3 3 0 0 0 6 0V3M17 21V3c-2.5 1.5-3.5 4.5-3.5 9H17\"></path>",
  "receipt": "<path d=\"M6 3h12v18l-3-2-3 2-3-2-3 2z\"></path><path d=\"M9 8h6M9 12h6\"></path>",
  "chart": "<path d=\"M4 20V10M10 20V4M16 20v-7M22 20H2\"></path>",
  "calx": "<rect x=\"3\" y=\"5\" width=\"18\" height=\"16\" rx=\"2\"></rect><path d=\"M3 10h18M8 3v4M16 3v4M10 13.5l4 4M14 13.5l-4 4\"></path>",
  "star": "<path d=\"M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z\"></path>",
  "clock": "<circle cx=\"12\" cy=\"12\" r=\"9\"></circle><path d=\"M12 7v5l3 2\"></path>",
  "gift": "<rect x=\"3\" y=\"8\" width=\"18\" height=\"13\" rx=\"2\"></rect><path d=\"M3 12h18M12 8v13M12 8C10 4 6 4 6 6.5S12 8 12 8zM12 8c2-4 6-4 6-1.5S12 8 12 8z\"></path>",
  "ticket": "<rect x=\"3\" y=\"6\" width=\"18\" height=\"12\" rx=\"2\"></rect><path d=\"M9 6v2M9 11v2M9 16v2\"></path>",
  "cart": "<circle cx=\"9\" cy=\"20\" r=\"1.5\"></circle><circle cx=\"17\" cy=\"20\" r=\"1.5\"></circle><path d=\"M3 4h2l2.4 11h11l2-8H6.2\"></path>",
  "truck": "<path d=\"M3 6h11v10H3zM14 10h4l3 3v3h-7\"></path><circle cx=\"7\" cy=\"18\" r=\"2\"></circle><circle cx=\"17\" cy=\"18\" r=\"2\"></circle>",
  "mail": "<rect x=\"3\" y=\"5\" width=\"18\" height=\"14\" rx=\"2\"></rect><path d=\"M3 7l9 6 9-6\"></path>",
  "bell": "<path d=\"M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9\"></path><path d=\"M10 21a2 2 0 0 0 4 0\"></path>",
  "user": "<circle cx=\"9\" cy=\"8\" r=\"4\"></circle><path d=\"M2 21a7 7 0 0 1 14 0M19 8v6M16 11h6\"></path>",
  "doc": "<path d=\"M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6z\"></path><path d=\"M14 3v6h6M8 13h8M8 17h5\"></path>",
  "box": "<path d=\"M21 8l-9-5-9 5v8l9 5 9-5V8z\"></path><path d=\"M3 8l9 5 9-5M12 13v8\"></path>"
};

export const iconoSvg = (clave) =>
  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONOS[clave] ?? ''}</svg>`;
