CREATE TABLE IF NOT EXISTS email_codes (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  verified INTEGER NOT NULL DEFAULT 0,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_email_codes_email_created
  ON email_codes(email, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_codes_email_verified
  ON email_codes(email, verified, expires_at);

CREATE TABLE IF NOT EXISTS email_limits (
  email TEXT NOT NULL,
  date TEXT NOT NULL,
  send_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (email, date)
);
