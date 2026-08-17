import fs from "node:fs";

const input = process.env.KG_INPUT || "storage/kaogujia_female_authors.json";
const payloadOutput = process.env.KG_PAYLOAD_OUTPUT || "storage/kaogujia_bloggers_import_payload.json";
const sqlOutput = process.env.KG_SQL_OUTPUT || "storage/kaogujia_bloggers_upsert.sql";
const rows = JSON.parse(fs.readFileSync(input, "utf8"));

function parseCount(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).replaceAll(",", "").trim();
  const match = text.match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  let number = Number(match[0]);
  if (text.includes("亿")) number *= 100000000;
  else if (text.includes("万") || /w/i.test(text)) number *= 10000;
  else if (/k/i.test(text)) number *= 1000;
  return Math.trunc(number);
}

function sqlString(value) {
  if (value === null || value === undefined || value === "") return "NULL";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function sqlJson(value) {
  return `${sqlString(JSON.stringify(value))}::jsonb`;
}

function sqlArray(values) {
  const clean = values.filter(Boolean).map((value) => `"${String(value).replaceAll('"', '\\"')}"`);
  return `ARRAY[${clean.map((value) => sqlString(value)).join(", ")}]::TEXT[]`;
}

const records = rows.map((row) => ({
  name: row.nick_name,
  platform: "douyin",
  source_id: row.display_id || row.uid,
  source_url: row.display_id ? `https://www.douyin.com/search/${encodeURIComponent(row.display_id)}` : null,
  avatar_url: row.avatar,
  style: "化妆教学",
  tags: ["考古加", "女性达人", "教化妆", row.gmv ? `销售额:${row.gmv}` : "", row.fans ? `粉丝:${row.fans}` : ""].filter(Boolean),
  follower_count: parseCount(row.fans),
  liked_count: null,
  work_count: Number(row.videos || 0) + Number(row.lives || 0) || null,
  location: null,
  bio: null,
  raw_data: row,
}));

const payload = { platform: "douyin", records };
fs.writeFileSync(payloadOutput, JSON.stringify(payload, null, 2), "utf8");

const statements = [
  `-- Generated from ${input}`,
  "-- Run database/migrate_bloggers_selection_fields.sql before this file on existing databases.",
  "CREATE EXTENSION IF NOT EXISTS pgcrypto;",
  "INSERT INTO bloggers (",
  "  id, name, platform, source_id, source_url, avatar_url, style, face_features, tags,",
  "  follower_count, liked_count, work_count, location, bio, raw_data, created_at, updated_at",
  ") VALUES",
  records
    .map((row) =>
      [
        "gen_random_uuid()",
        sqlString(row.name),
        sqlString(row.platform),
        sqlString(row.source_id),
        sqlString(row.source_url),
        sqlString(row.avatar_url),
        sqlString(row.style),
        "'{}'::jsonb",
        sqlArray(row.tags),
        row.follower_count ?? "NULL",
        "NULL",
        row.work_count ?? "NULL",
        "NULL",
        "NULL",
        sqlJson(row.raw_data),
        "NOW()",
        "NOW()",
      ].join(", ")
    )
    .map((line) => `  (${line})`)
    .join(",\n") + "\nON CONFLICT (platform, source_id) DO UPDATE SET",
  "  name = EXCLUDED.name,",
  "  source_url = EXCLUDED.source_url,",
  "  avatar_url = EXCLUDED.avatar_url,",
  "  style = EXCLUDED.style,",
  "  tags = EXCLUDED.tags,",
  "  follower_count = EXCLUDED.follower_count,",
  "  work_count = EXCLUDED.work_count,",
  "  raw_data = EXCLUDED.raw_data,",
  "  updated_at = NOW();",
].join("\n");

fs.writeFileSync(sqlOutput, statements, "utf8");
console.log(JSON.stringify({ records: records.length, payloadOutput, sqlOutput }, null, 2));
