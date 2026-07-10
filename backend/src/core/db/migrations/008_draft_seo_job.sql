-- Migration 008: link blog drafts to their latest SEO Analyzer job

ALTER TABLE blog_drafts ADD COLUMN IF NOT EXISTS last_seo_job_id UUID REFERENCES agent_jobs(id) ON DELETE SET NULL;
