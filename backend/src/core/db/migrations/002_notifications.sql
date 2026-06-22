CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type       VARCHAR(30) NOT NULL,
  title      TEXT NOT NULL,
  message    TEXT,
  job_id     UUID REFERENCES agent_jobs(id) ON DELETE CASCADE,
  read       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_read       ON notifications (read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications (created_at DESC);
