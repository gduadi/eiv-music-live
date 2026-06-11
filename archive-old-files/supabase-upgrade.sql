-- ════════════════════════════════════════════════
-- EIV Music — שדרוג טבלת clients
-- להריץ פעם אחת ב-Supabase: SQL Editor → New query → הדבק → Run
-- בטוח לחלוטין: לא מוחק ולא משנה נתונים קיימים
-- ════════════════════════════════════════════════

-- 1) הרשאת נגן לכל לקוח: regular / ai / both
--    כל הלקוחות הקיימים מקבלים אוטומטית 'regular' — אף אחד לא נחסם
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS player_access text NOT NULL DEFAULT 'regular';

-- 2) סטרים ייעודי ללקוח (Default Stream URL)
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS default_stream_url text;

-- 3) הגנה: רק ערכים חוקיים בהרשאת נגן
ALTER TABLE clients
  DROP CONSTRAINT IF EXISTS clients_player_access_check;
ALTER TABLE clients
  ADD CONSTRAINT clients_player_access_check
  CHECK (player_access IN ('regular', 'ai', 'both'));

-- 4) בדיקה שהכל עבר — אמור להציג את הלקוחות עם העמודות החדשות
SELECT code, name, active, player_access, default_stream_url
FROM clients
ORDER BY name;
