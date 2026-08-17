import json
import sqlite3
from pathlib import Path


INPUT = Path("storage/kaogujia_female_authors_priority.json")
OUTPUT = Path("storage/bloggers_priority.sqlite")


def parse_count(value):
    if value is None:
        return None
    text = str(value).replace(",", "").strip()
    number = ""
    dot_seen = False
    for char in text:
        if char.isdigit():
            number += char
        elif char == "." and not dot_seen:
            number += char
            dot_seen = True
        elif number:
            break
    if not number:
        return None
    result = float(number)
    if "亿" in text:
        result *= 100_000_000
    elif "万" in text or "w" in text.lower():
        result *= 10_000
    elif "k" in text.lower():
        result *= 1_000
    return int(result)


def main():
    rows = json.loads(INPUT.read_text(encoding="utf-8"))
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    with sqlite3.connect(OUTPUT) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS bloggers (
              source_id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              platform TEXT NOT NULL DEFAULT 'douyin',
              avatar_url TEXT,
              follower_count INTEGER,
              follower_label TEXT,
              gmv TEXT,
              avg_unit_price TEXT,
              avg_total_users TEXT,
              avg_play_count TEXT,
              rpm TEXT,
              live_count INTEGER,
              video_count INTEGER,
              product_count INTEGER,
              raw_data TEXT NOT NULL
            )
            """
        )
        conn.execute("DELETE FROM bloggers")
        conn.executemany(
            """
            INSERT INTO bloggers (
              source_id, name, platform, avatar_url, follower_count, follower_label,
              gmv, avg_unit_price, avg_total_users, avg_play_count, rpm,
              live_count, video_count, product_count, raw_data
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [
                (
                    row.get("display_id") or row.get("uid"),
                    row.get("nick_name") or "未知达人",
                    "douyin",
                    row.get("avatar"),
                    parse_count(row.get("fans")),
                    row.get("fans"),
                    row.get("gmv"),
                    row.get("aup"),
                    row.get("avg_total_users"),
                    row.get("avg_play_count"),
                    row.get("rpm"),
                    row.get("lives"),
                    row.get("videos"),
                    row.get("skus"),
                    json.dumps(row, ensure_ascii=False),
                )
                for row in rows
            ],
        )
        total = conn.execute("SELECT COUNT(*) FROM bloggers").fetchone()[0]
        print(json.dumps({"sqlite": str(OUTPUT), "rows": total}, ensure_ascii=False))


if __name__ == "__main__":
    main()
