-- ==============================================================================
-- PokeForge - Turso SQLite Database Schema
-- Run this in Turso CLI (turso db shell <db-name>) or Turso Web Console
-- ==============================================================================

CREATE TABLE IF NOT EXISTS sync_vaults (
  code TEXT PRIMARY KEY,
  secret_key TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sync_vaults_updated ON sync_vaults(updated_at);
