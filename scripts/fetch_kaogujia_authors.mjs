import crypto from "node:crypto";
import fs from "node:fs";

const token = process.env.KG_TOKEN;
if (!token) {
  console.error("KG_TOKEN is required.");
  process.exit(1);
}

const limit = Number(process.env.KG_LIMIT || 50);
const maxPages = Number(process.env.KG_MAX_PAGES || 100);
const output = process.env.KG_OUTPUT || "storage/kaogujia_female_authors.json";
const sortFields = (process.env.KG_SORT_FIELDS || "gmv").split(",").map((item) => item.trim()).filter(Boolean);
const sortOrders = (process.env.KG_SORT_ORDERS || "0").split(",").map((item) => item.trim()).filter(Boolean);
const body = {
  data_filter: { gender: 2 },
  keyword: process.env.KG_KEYWORD || "   ",
  author_type: 0,
};

const headers = {
  accept: "*/*",
  "accept-language": "zh-CN,zh;q=0.9",
  authorization: token,
  "content-type": "application/json",
  origin: "https://www.kaogujia.com",
  referer: "https://www.kaogujia.com/",
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36",
  version_code: "3.1",
  "x-common": process.env.KG_X_COMMON || "x-device=8fbdaa60cf2d43c6268a20d82e91adf6",
};

function decrypt(url, text) {
  const seed = Buffer.from(encodeURI(url), "binary").toString("base64").repeat(3);
  const key = Buffer.from(seed.slice(0, 16), "utf8");
  const iv = Buffer.from(seed.slice(12, 28), "utf8");
  const decipher = crypto.createDecipheriv("aes-128-cbc", key, iv);
  let plain = decipher.update(text, "base64", "utf8");
  plain += decipher.final("utf8");
  return JSON.parse(plain);
}

function uniqueBy(rows, keyFn) {
  const map = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    if (key) map.set(key, row);
  }
  return [...map.values()];
}

const all = [];
let totalCount = null;

for (const sortField of sortFields) {
  for (const sortOrder of sortOrders) {
    for (let page = 1; page <= maxPages; page += 1) {
      const path = "/api/author/search";
      const url = `https://service.kaogujia.com${path}?limit=${limit}&page=${page}&sort_field=${encodeURIComponent(sortField)}&sort=${encodeURIComponent(sortOrder)}`;
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} on ${sortField}/${sortOrder}/page ${page}`);
      }

      const outer = await response.json();
      if (outer.code !== 200 || !outer.success) {
        throw new Error(`API error on ${sortField}/${sortOrder}/page ${page}: ${outer.message || outer.code}`);
      }

      const data = decrypt(path, outer.data);
      const items = Array.isArray(data.items) ? data.items : [];
      totalCount = data.pagination?.total_count ?? totalCount;
      console.log(`${sortField}/${sortOrder}/page ${page}: ${items.length}`);

      if (!items.length) break;
      all.push(...items);
      if (items.length < limit) break;

      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
}

const unique = uniqueBy(all, (row) => row.uid || row.display_id || row.id);
fs.writeFileSync(output, JSON.stringify(unique, null, 2), "utf8");
console.log(JSON.stringify({ fetched: all.length, unique: unique.length, totalCount, output }, null, 2));
