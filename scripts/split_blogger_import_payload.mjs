import fs from "node:fs";
import path from "node:path";

const input = process.env.IMPORT_PAYLOAD || "storage/kaogujia_bloggers_import_payload_multi_sort.json";
const outputDir = process.env.IMPORT_BATCH_DIR || "storage/blogger_import_batches";
const batchSize = Number(process.env.IMPORT_BATCH_SIZE || 500);

const payload = JSON.parse(fs.readFileSync(input, "utf8"));
const records = Array.isArray(payload.records) ? payload.records : [];
fs.mkdirSync(outputDir, { recursive: true });

let batchCount = 0;
for (let index = 0; index < records.length; index += batchSize) {
  batchCount += 1;
  const batch = {
    platform: payload.platform || "douyin",
    records: records.slice(index, index + batchSize),
  };
  const filename = path.join(outputDir, `bloggers_batch_${String(batchCount).padStart(3, "0")}.json`);
  fs.writeFileSync(filename, JSON.stringify(batch, null, 2), "utf8");
}

console.log(JSON.stringify({ records: records.length, batchSize, batchCount, outputDir }, null, 2));
