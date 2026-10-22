// Descubrimiento con Google Places API (New), Text Search. Solo pide los campos que el CRM
// admite (el teléfono de la clínica, para llamar; nunca reseñas, valoraciones ni fotos) y devuelve un lote
// listo para importBatch. Pedir el teléfono pasa la búsqueda a una categoría de precio superior de Google.
// Las condiciones de Google Maps Platform limitan cuánto tiempo se guardan sus datos (salvo el
// place_id): la fuente se registra con maxAgeDays y el comando "purge" borra lo caducado.
const ENDPOINT = 'https://places.googleapis.com/v1/places:searchText';
const FIELDS = ['places.id', 'places.displayName', 'places.addressComponents', 'places.websiteUri', 'places.businessStatus', 'places.nationalPhoneNumber', 'nextPageToken'];
const PAGE_SIZE = 20;

export async function searchPlaces(query, { key, fetchImpl = fetch, maxPages = 3 } = {}) {
  if (!key) throw new Error('Falta GOOGLE_MAPS_API_KEY');
  const places = [];
  let pageToken;
  for (let page = 0; page < maxPages; page++) {
    const response = await fetchImpl(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': FIELDS.join(',') },
      body: JSON.stringify({ textQuery: query, languageCode: 'es', regionCode: 'ES', pageSize: PAGE_SIZE, ...(pageToken && { pageToken }) }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
      const detail = (await response.json().catch(() => null))?.error?.message;
      throw new Error(`Google Places respondió ${response.status}${detail ? `: ${detail}` : ''}`);
    }
    const data = await response.json();
    places.push(...(data.places ?? []));
    pageToken = data.nextPageToken;
    if (!pageToken) break;
  }
  return places;
}

function component(place, type) {
  return place.addressComponents?.find(item => item.types?.includes(type));
}

// Filtra a la provincia de Alicante por código postal (03xxx): Google devuelve también
// resultados de fuera de la zona buscada.
export function toRecords(places, { sector, observedAt }) {
  const records = [], skipped = [];
  for (const place of places) {
    const name = place.displayName?.text?.trim();
    const postal = component(place, 'postal_code')?.longText ?? '';
    const municipality = (component(place, 'locality') ?? component(place, 'administrative_area_level_3'))?.longText?.trim();
    const reason = !place.id || !name ? 'datos incompletos'
      : place.businessStatus && place.businessStatus !== 'OPERATIONAL' ? 'cerrada'
      : !/^03\d{3}$/.test(postal) ? 'fuera de la provincia de Alicante'
      : !municipality ? 'sin municipio' : null;
    if (reason) { skipped.push({ name: name ?? place.id ?? '?', reason }); continue; }
    const website = place.websiteUri && /^https?:\/\//i.test(place.websiteUri) ? place.websiteUri : null;
    const phone = place.nationalPhoneNumber?.trim() || null;
    records.push({ name: name.slice(0, 200), municipality, province: '03', sector, website, phone, sourceRecordId: place.id, observedAt });
  }
  // Un mismo lugar puede salir en varias páginas: se queda una vez.
  const unique = [...new Map(records.map(record => [record.sourceRecordId, record])).values()];
  return { records: unique, skipped };
}
