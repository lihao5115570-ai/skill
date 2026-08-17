import fs from "node:fs";

const input = process.env.KG_INPUT || "storage/kaogujia_female_authors.json";
const output = process.env.KG_CSV_OUTPUT || "storage/kaogujia_female_authors.csv";
const rows = JSON.parse(fs.readFileSync(input, "utf8"));

const columns = [
  ["nick_name", "昵称"],
  ["uid", "达人UID"],
  ["display_id", "抖音号"],
  ["fans", "粉丝数"],
  ["inc_fans", "新增粉丝"],
  ["gmv", "销售额"],
  ["aup", "平均件单价"],
  ["avg_total_users", "平均观看人次"],
  ["avg_play_count", "平均播放量"],
  ["rpm", "RPM"],
  ["lives", "直播数"],
  ["videos", "视频数"],
  ["skus", "商品数"],
  ["avatar", "头像"],
];

function cell(value) {
  if (value === null || value === undefined) return "";
  const text = Array.isArray(value) || typeof value === "object" ? JSON.stringify(value) : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

const csv = [
  columns.map(([, label]) => cell(label)).join(","),
  ...rows.map((row) => columns.map(([key]) => cell(row[key])).join(",")),
].join("\n");

fs.writeFileSync(output, csv, "utf8");
console.log(JSON.stringify({ rows: rows.length, output }, null, 2));
