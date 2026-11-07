-- Public island snapshots are sourced from Epic's unauthenticated Fortnite Data API.
CREATE TABLE IF NOT EXISTS island_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  island_code TEXT NOT NULL,
  metric TEXT NOT NULL,
  interval TEXT NOT NULL CHECK (interval IN ('minute','hour','day')),
  observed_at TEXT NOT NULL,
  value REAL,
  source TEXT NOT NULL DEFAULT 'epic_fortnite_data_api',
  UNIQUE(island_code, metric, interval, observed_at, source)
);
CREATE INDEX IF NOT EXISTS idx_island_metrics_lookup
  ON island_metrics(island_code, interval, metric, observed_at DESC);

-- Future Creator Portal CSV / approved gameplay-event integration.
CREATE TABLE IF NOT EXISTS track_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  island_code TEXT NOT NULL,
  track_key TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('vote','start','finish','dnf','checkpoint')),
  mode TEXT,
  session_key TEXT,
  checkpoint_key TEXT,
  duration_ms INTEGER,
  occurred_at TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('creator_portal_csv','approved_verse_export','manual_verified')),
  import_batch TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_track_events_track_time
  ON track_events(island_code, track_key, occurred_at);
CREATE INDEX IF NOT EXISTS idx_track_events_session
  ON track_events(session_key, occurred_at);

CREATE TABLE IF NOT EXISTS import_batches (
  batch_id TEXT PRIMARY KEY,
  source_name TEXT NOT NULL,
  imported_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  rows_seen INTEGER NOT NULL DEFAULT 0,
  rows_imported INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'complete'
);
