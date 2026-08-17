import fs from "node:fs";

const input = process.env.KG_INPUT || "storage/kaogujia_female_authors_multi_sort.json";
const output = process.env.KG_FILTER_OUTPUT || "storage/kaogujia_female_authors_priority.json";
const minFans = Number(process.env.KG_MIN_FANS || 10000);
const maxFans = Number(process.env.KG_MAX_FANS || 100000);
const requireGmv = process.env.KG_REQUIRE_GMV !== "0";
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

function hasGmv(row) {
  const gmv = String(row.gmv ?? "").trim();
  return Boolean(gmv && gmv !== "0" && gmv !== "--");
}

const filtered = rows.filter((row) => {
  const fans = parseCount(row.fans);
  if (fans === null || fans < minFans || fans > maxFans) return false;
  if (requireGmv && !hasGmv(row)) return false;
  return true;
});

fs.writeFileSync(output, JSON.stringify(filtered, null, 2), "utf8");
console.log(JSON.stringify({ inputRows: rows.length, outputRows: filtered.length, minFans, maxFans, requireGmv, output }, null, 2));
