CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS agent_jobs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name    VARCHAR(50) NOT NULL,
  notion_page_id VARCHAR(50),
  title         TEXT,
  status        VARCHAR(20) NOT NULL,
  input_tokens  INT,
  output_tokens INT,
  cost_usd      DECIMAL(10,6),
  error_message TEXT,
  source        VARCHAR(30),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent_results (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id      UUID REFERENCES agent_jobs(id),
  result_type VARCHAR(50),
  content     TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kb_cache (
  kb_key      VARCHAR(100) PRIMARY KEY,
  content     TEXT,
  cached_at   TIMESTAMPTZ DEFAULT now(),
  ttl_seconds INT DEFAULT 3600
);
