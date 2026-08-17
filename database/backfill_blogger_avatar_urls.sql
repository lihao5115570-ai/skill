UPDATE bloggers
SET
  avatar_url = COALESCE(NULLIF(avatar_url, ''), raw_data ->> 'avatar', raw_data ->> 'avatar_url', raw_data ->> 'Avatar'),
  source_url = COALESCE(NULLIF(source_url, ''), 'https://www.douyin.com/search/' || source_id),
  updated_at = NOW()
WHERE platform = 'douyin'
  AND (
    avatar_url IS NULL
    OR avatar_url = ''
    OR source_url IS NULL
    OR source_url = ''
  );
