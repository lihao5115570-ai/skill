import fs from "node:fs";

const input = process.env.KG_INPUT || "storage/kaogujia_female_authors_priority.json";
const output = process.env.KG_VIEWER_OUTPUT || "storage/blogger_priority_viewer.html";
const rows = JSON.parse(fs.readFileSync(input, "utf8"));

function parseCount(value) {
  if (!value) return 0;
  const text = String(value).replaceAll(",", "");
  const match = text.match(/\d+(?:\.\d+)?/);
  if (!match) return 0;
  let number = Number(match[0]);
  if (text.includes("亿")) number *= 100000000;
  else if (text.includes("万") || /w/i.test(text)) number *= 10000;
  else if (/k/i.test(text)) number *= 1000;
  return Math.trunc(number);
}

const data = rows.map((row) => ({
  name: row.nick_name || "",
  douyin: row.display_id || "",
  avatar: row.avatar || "",
  fans: row.fans || "",
  fansCount: parseCount(row.fans),
  gmv: row.gmv || "",
  avgPrice: row.aup || "",
  avgUsers: row.avg_total_users || "",
  avgPlay: row.avg_play_count || "",
  rpm: row.rpm || "",
  lives: row.lives || 0,
  videos: row.videos || 0,
  skus: row.skus || 0,
  score: row.teaching_score || "",
}));

const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>教化妆达人严格筛选名单</title>
  <style>
    :root { color-scheme: light; --line:#e7ebf3; --text:#162033; --muted:#66728a; --blue:#315cf6; --bg:#f5f7fb; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Arial, "Microsoft YaHei", sans-serif; color: var(--text); background: var(--bg); }
    header { position: sticky; top: 0; z-index: 2; background: rgba(255,255,255,.96); border-bottom: 1px solid var(--line); }
    .bar { max-width: 1280px; margin: 0 auto; padding: 14px 20px; display: grid; grid-template-columns: 1fr auto auto; gap: 12px; align-items: center; }
    h1 { margin: 0; font-size: 20px; font-weight: 700; }
    .meta { color: var(--muted); font-size: 13px; margin-top: 4px; }
    input, select { height: 36px; border: 1px solid var(--line); border-radius: 6px; padding: 0 10px; background: white; color: var(--text); }
    main { max-width: 1280px; margin: 18px auto; padding: 0 20px 32px; }
    table { width: 100%; border-collapse: collapse; background: white; border: 1px solid var(--line); }
    th, td { padding: 11px 12px; border-bottom: 1px solid var(--line); text-align: left; font-size: 14px; white-space: nowrap; }
    th { color: var(--muted); font-weight: 600; background: #fbfcff; position: sticky; top: 65px; z-index: 1; }
    tr:hover td { background: #f8faff; }
    .author { display: flex; align-items: center; gap: 10px; min-width: 260px; white-space: normal; }
    img { width: 42px; height: 42px; border-radius: 50%; object-fit: cover; background: #edf1f7; }
    .name { font-weight: 700; line-height: 1.3; }
    .id { color: var(--muted); font-size: 12px; margin-top: 3px; }
    .gmv { color: var(--blue); font-weight: 700; }
    .empty { padding: 36px; color: var(--muted); text-align: center; background: white; border: 1px solid var(--line); }
    @media (max-width: 900px) {
      .bar { grid-template-columns: 1fr; }
      main { overflow-x: auto; }
      th { top: 126px; }
    }
  </style>
</head>
<body>
  <header>
    <div class="bar">
      <div>
        <h1>教化妆达人严格筛选名单</h1>
        <div class="meta"><span id="count"></span> / ${data.length} 条，已剔除小店号、商品数多、直播多、店铺/课程转化倾向账号</div>
      </div>
      <input id="q" type="search" placeholder="搜索昵称或抖音号" />
      <select id="sort">
        <option value="scoreDesc">教学分从高到低</option>
        <option value="fansDesc">粉丝数从高到低</option>
        <option value="fansAsc">粉丝数从低到高</option>
        <option value="name">昵称排序</option>
      </select>
    </div>
  </header>
  <main>
    <table>
      <thead>
        <tr>
          <th>达人</th>
          <th>粉丝数</th>
          <th>销售额</th>
          <th>平均件单价</th>
          <th>平均观看人次</th>
          <th>平均播放量</th>
          <th>RPM</th>
          <th>直播/视频/商品</th>
          <th>教学分</th>
        </tr>
      </thead>
      <tbody id="tbody"></tbody>
    </table>
    <div id="empty" class="empty" hidden>没有匹配结果</div>
  </main>
  <script>
    const rows = ${JSON.stringify(data)};
    const tbody = document.getElementById("tbody");
    const count = document.getElementById("count");
    const empty = document.getElementById("empty");
    const q = document.getElementById("q");
    const sort = document.getElementById("sort");

    function esc(value) {
      return String(value ?? "").replace(/[&<>"']/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[char]));
    }

    function render() {
      const term = q.value.trim().toLowerCase();
      let view = rows.filter(row => !term || row.name.toLowerCase().includes(term) || row.douyin.toLowerCase().includes(term));
      if (sort.value === "scoreDesc") view.sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
      if (sort.value === "fansDesc") view.sort((a, b) => b.fansCount - a.fansCount);
      if (sort.value === "fansAsc") view.sort((a, b) => a.fansCount - b.fansCount);
      if (sort.value === "name") view.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
      count.textContent = view.length;
      empty.hidden = view.length > 0;
      tbody.innerHTML = view.map(row => \`
        <tr>
          <td><div class="author"><img src="\${esc(row.avatar)}" alt="" loading="lazy" /><div><div class="name">\${esc(row.name)}</div><div class="id">\${esc(row.douyin)}</div></div></div></td>
          <td>\${esc(row.fans)}</td>
          <td class="gmv">\${esc(row.gmv)}</td>
          <td>\${esc(row.avgPrice)}</td>
          <td>\${esc(row.avgUsers)}</td>
          <td>\${esc(row.avgPlay)}</td>
          <td>\${esc(row.rpm)}</td>
          <td>\${esc(row.lives)} / \${esc(row.videos)} / \${esc(row.skus)}</td>
          <td>\${esc(row.score)}</td>
        </tr>\`).join("");
    }
    q.addEventListener("input", render);
    sort.addEventListener("change", render);
    render();
  </script>
</body>
</html>`;

fs.writeFileSync(output, html, "utf8");
console.log(JSON.stringify({ rows: data.length, output }, null, 2));
