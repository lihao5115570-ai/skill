import csv
import json
from collections import Counter
from pathlib import Path


INPUT = Path("storage/kaogujia_female_authors_priority.json")
OUTPUT = Path("storage/kaogujia_priority_analysis.md")
TOP_CSV = Path("storage/kaogujia_priority_top50.csv")


def parse_count(value):
    if value is None:
        return 0
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
        return 0
    result = float(number)
    if "亿" in text:
        result *= 100_000_000
    elif "万" in text or "w" in text.lower():
        result *= 10_000
    elif "k" in text.lower():
        result *= 1_000
    return int(result)


def bucket_fans(count):
    if count < 20_000:
        return "1万-2万"
    if count < 50_000:
        return "2万-5万"
    return "5万-10万"


def score(row):
    fans = parse_count(row.get("fans"))
    gmv = str(row.get("gmv") or "")
    rpm = parse_count(row.get("rpm"))
    points = 0
    if "1000万" in gmv:
        points += 45
    elif "500万" in gmv:
        points += 35
    elif "250万" in gmv or "100万" in gmv:
        points += 25
    else:
        points += 15
    points += min(25, fans // 4_000)
    points += min(20, rpm // 500)
    points += min(10, int(row.get("lives") or 0) + int(row.get("videos") or 0))
    return points


def main():
    rows = json.loads(INPUT.read_text(encoding="utf-8"))
    ranked = sorted(rows, key=score, reverse=True)
    fans_counter = Counter(bucket_fans(parse_count(row.get("fans"))) for row in rows)
    gmv_counter = Counter(row.get("gmv") or "未知" for row in rows)
    shop_counter = Counter("小店号" if row.get("is_shop") else "达人号" for row in rows)

    lines = [
        "# 考古加女达人优先名单分析",
        "",
        f"- 样本数：{len(rows)}",
        "- 筛选口径：女性、粉丝 1万-10万、销售额不为 0",
        "- 建议用法：先从 Top50 做人工复核，再入库为第一批推荐达人。",
        "",
        "## 粉丝分布",
        "",
        *[f"- {name}：{count}" for name, count in fans_counter.most_common()],
        "",
        "## 销售额分布",
        "",
        *[f"- {name}：{count}" for name, count in gmv_counter.most_common()],
        "",
        "## 账号类型",
        "",
        *[f"- {name}：{count}" for name, count in shop_counter.most_common()],
        "",
        "## Top 20",
        "",
        "| 排名 | 昵称 | 抖音号 | 粉丝 | 销售额 | 件单价 | 观看 | 播放 | RPM |",
        "|---:|---|---|---:|---:|---:|---:|---:|---:|",
    ]
    for index, row in enumerate(ranked[:20], start=1):
        lines.append(
            "| {index} | {name} | {douyin} | {fans} | {gmv} | {aup} | {users} | {play} | {rpm} |".format(
                index=index,
                name=str(row.get("nick_name") or "").replace("|", " "),
                douyin=row.get("display_id") or "",
                fans=row.get("fans") or "",
                gmv=row.get("gmv") or "",
                aup=row.get("aup") or "",
                users=row.get("avg_total_users") or "",
                play=row.get("avg_play_count") or "",
                rpm=row.get("rpm") or "",
            )
        )
    OUTPUT.write_text("\n".join(lines) + "\n", encoding="utf-8-sig")

    with TOP_CSV.open("w", encoding="utf-8-sig", newline="") as stream:
        writer = csv.writer(stream)
        writer.writerow(["排名", "昵称", "抖音号", "粉丝", "销售额", "件单价", "观看", "播放", "RPM", "评分"])
        for index, row in enumerate(ranked[:50], start=1):
            writer.writerow(
                [
                    index,
                    row.get("nick_name"),
                    row.get("display_id"),
                    row.get("fans"),
                    row.get("gmv"),
                    row.get("aup"),
                    row.get("avg_total_users"),
                    row.get("avg_play_count"),
                    row.get("rpm"),
                    score(row),
                ]
            )
    print(json.dumps({"analysis": str(OUTPUT), "top50": str(TOP_CSV), "rows": len(rows)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
