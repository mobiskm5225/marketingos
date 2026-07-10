-- Migration 007: Blog Tracker (Notion) sync fields on blog_drafts
-- Drafts imported from the Notion Blog Tracker database carry their source
-- page id (dedup key) plus tracker metadata.

ALTER TABLE blog_drafts ADD COLUMN IF NOT EXISTS notion_page_id   VARCHAR(50);
ALTER TABLE blog_drafts ADD COLUMN IF NOT EXISTS category         VARCHAR(50);
ALTER TABLE blog_drafts ADD COLUMN IF NOT EXISTS seo_keywords     TEXT;
ALTER TABLE blog_drafts ADD COLUMN IF NOT EXISTS notion_status    VARCHAR(30);
ALTER TABLE blog_drafts ADD COLUMN IF NOT EXISTS publication_date TIMESTAMPTZ;

-- Multiple NULLs allowed (drafts not sourced from Notion); one row per Notion page.
CREATE UNIQUE INDEX IF NOT EXISTS blog_drafts_notion_page_idx ON blog_drafts(notion_page_id);
