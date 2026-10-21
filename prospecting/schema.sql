PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  permission_ref TEXT NOT NULL,
  reviewed_by TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  enabled INTEGER NOT NULL CHECK(enabled IN (0,1))
);
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY,
  identity TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  municipality TEXT NOT NULL,
  province TEXT NOT NULL CHECK(province = '03'),
  sector TEXT NOT NULL CHECK(sector IN ('health_clinic','aesthetic_clinic')),
  website TEXT NOT NULL,
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
