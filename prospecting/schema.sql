PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  permission_ref TEXT NOT NULL,
  reviewed_by TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  enabled INTEGER NOT NULL CHECK(enabled IN (0,1)),
  max_age_days INTEGER CHECK(max_age_days IS NULL OR max_age_days > 0)
);
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY,
  identity TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  municipality TEXT NOT NULL,
  province TEXT NOT NULL CHECK(province = '03'),
  sector TEXT NOT NULL CHECK(sector IN ('health_clinic','aesthetic_clinic')),
  website TEXT,
  phone TEXT,
  web_verificada TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','qualified','rejected','suppressed')),
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS observations (
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  source_id TEXT NOT NULL REFERENCES sources(id),
  source_record_id TEXT NOT NULL,
  observed_at TEXT NOT NULL,
  PRIMARY KEY(source_id, source_record_id)
);
CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  actor TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS analyses (
  id INTEGER PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  analyzed_at TEXT NOT NULL,
  final_url TEXT,
  blocked INTEGER NOT NULL CHECK(blocked IN (0,1)),
  score INTEGER CHECK(score BETWEEN 0 AND 10),
  problems TEXT NOT NULL,
  signals TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS analyses_lead ON analyses(lead_id, analyzed_at);
-- Clínicas que han dicho que sí a recibir algo por email (consentimiento previo, LSSI art. 21).
CREATE TABLE IF NOT EXISTS consentimientos (
  id INTEGER PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  quien TEXT NOT NULL,
  atencion TEXT,
  canal TEXT NOT NULL,
  que TEXT NOT NULL,
  fecha TEXT NOT NULL
);
-- Versión 5: demo de cada clínica (los datos del enlace; teléfono y municipio salen de la ficha).
CREATE TABLE IF NOT EXISTS demos (
  lead_id INTEGER PRIMARY KEY REFERENCES leads(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL,
  tratamientos TEXT NOT NULL,
  whatsapp INTEGER NOT NULL CHECK(whatsapp IN (0,1)),
  fecha TEXT NOT NULL
);
