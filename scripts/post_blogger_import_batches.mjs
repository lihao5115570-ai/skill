import fs from "node:fs";
import path from "node:path";

const inputDir = process.env.IMPORT_BATCH_DIR || "storage/blogger_import_batches";
const backendUrl = process.env.BACKEND_IMPORT_URL || "http://127.0.0.1:8000/api/bloggers/import";
const files = fs
  .readdirSync(inputDir)
  .filter((name) => name.endsWith(".json"))
  .sort()
  .map((name) => path.join(inputDir, name));

let total = 0;
for (const file of files) {
  const body = fs.readFileSync(file, "utf8");
  const response = await fetch(backendUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${file} failed with HTTP ${response.status}: ${text}`);
  }
  const result = JSON.parse(text);
  total += result.imported || 0;
  console.log(`${path.basename(file)} imported ${result.imported || 0}`);
}

console.log(JSON.stringify({ files: files.length, imported: total }, null, 2));
