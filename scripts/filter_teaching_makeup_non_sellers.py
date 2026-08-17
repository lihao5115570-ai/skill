import csv
import json
from pathlib import Path


INPUT = Path("storage/kaogujia_teach_makeup_female_multi_sort.json")
OUTPUT = Path("storage/kaogujia_teaching_makeup_non_sellers.json")
CSV_OUTPUT = Path("storage/kaogujia_teaching_makeup_non_sellers.csv")
REJECT_OUTPUT = Path("storage/kaogujia_teaching_makeup_seller_rejects.csv")

BEAUTY_KEYWORDS = [
    "教化妆",
    "化妆教学",
    "化妆教程",
    "化妆师",
    "化妆",
    "美妆",
    "彩妆",
    "底妆",
    "眼妆",
    "新手",
    "淡妆",
    "变美",
    "护肤",
    "养肤",
]

TEACHING_KEYWORDS = [
    "教",
    "教学",
    "教程",
    "老师",
    "化妆师",
    "新手",
    "技巧",
    "干货",
    "分享",
    "学",
]

SELLER_KEYWORDS = [
    "店",
    "小店",
    "店铺",
    "彩妆店",
    "好物",
    "甄选",
    "严选",
    "优选",
    "清仓",
    "工厂",
    "供应链",
    "现货",
    "专场",
    "品牌",
    "老板娘",
    "源头",
    "商行",
    "电商",
    "团购",
    "折扣",
    "代理",
    "加盟",
    "招商",
    "专卖",
    "直播间",
    "招生",
    "培训",
    "学员",
    "课程",
    "收徒",
    "学徒",
    "学院",
    "学校",
    "美校",
    "校长",
    "创业",
    "副业",
    "变现",
    "同款",
    "橱窗",
]


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


def parse_gmv_floor(value):
    if value is None:
        return 0
    text = str(value).replace(",", "").strip()
    if text in {"", "0", "0-250"}:
        return 0
    left = text.split("-", 1)[0]
    return parse_count(left)


def has_any(text, keywords):
    lowered = text.lower()
    return any(keyword.lower() in lowered for keyword in keywords)


def reject_reasons(row):
    name = str(row.get("nick_name") or "")
    skus = int(row.get("skus") or 0)
    lives = int(row.get("lives") or 0)
    videos = int(row.get("videos") or 0)
    gmv_floor = parse_gmv_floor(row.get("gmv"))
    reasons = []
    if not row.get("display_id"):
        reasons.append("无抖音号")
    if row.get("gender") != 2:
        reasons.append("非女性账号")
    if row.get("is_shop"):
        reasons.append("小店号")
    if has_any(name, SELLER_KEYWORDS):
        reasons.append("昵称像店铺/卖货号")
    if not has_any(name, BEAUTY_KEYWORDS):
        reasons.append("昵称无美妆/化妆教学关键词")
    if skus > 10:
        reasons.append(f"商品数偏多({skus})")
    if lives > 10:
        reasons.append(f"直播偏多({lives})")
    if gmv_floor >= 25_000 and skus > 3:
        reasons.append(f"销售额和商品数偏高({row.get('gmv')}/{skus})")
    if gmv_floor >= 100_000:
        reasons.append(f"销售额过高({row.get('gmv')})")
    if videos == 0 and lives > 0:
        reasons.append("只有直播无视频内容")
    return reasons


def teaching_score(row):
    name = str(row.get("nick_name") or "")
    fans = parse_count(row.get("fans"))
    videos = int(row.get("videos") or 0)
    skus = int(row.get("skus") or 0)
    gmv_floor = parse_gmv_floor(row.get("gmv"))
    score = 0
    if "教化妆" in name or "化妆教学" in name:
        score += 20
    if has_any(name, TEACHING_KEYWORDS):
        score += 8
    if has_any(name, BEAUTY_KEYWORDS):
        score += 8
    if videos >= 20:
        score += 5
    elif videos >= 5:
        score += 3
    if 10_000 <= fans <= 100_000:
        score += 4
    elif 3_000 <= fans < 10_000:
        score += 2
    if skus == 0:
        score += 8
    elif skus <= 3:
        score += 4
    elif skus <= 10:
        score += 1
    if gmv_floor == 0:
        score += 4
    return score


def main():
    rows = json.loads(INPUT.read_text(encoding="utf-8"))
    kept = []
    rejected = []
    seen = set()
    for row in rows:
        source_id = row.get("display_id")
        if source_id in seen:
            continue
        seen.add(source_id)
        reasons = reject_reasons(row)
        if reasons:
            rejected.append((row, reasons))
        else:
            row = dict(row)
            row["teaching_score"] = teaching_score(row)
            kept.append(row)

    kept.sort(key=lambda row: (row["teaching_score"], parse_count(row.get("fans")), int(row.get("videos") or 0)), reverse=True)
    OUTPUT.write_text(json.dumps(kept, ensure_ascii=False, indent=2), encoding="utf-8")

    with CSV_OUTPUT.open("w", encoding="utf-8-sig", newline="") as stream:
        writer = csv.writer(stream)
        writer.writerow(["昵称", "抖音号", "粉丝", "销售额", "直播数", "视频数", "商品数", "教学分"])
        for row in kept:
            writer.writerow([
                row.get("nick_name"),
                row.get("display_id"),
                row.get("fans"),
                row.get("gmv"),
                row.get("lives"),
                row.get("videos"),
                row.get("skus"),
                row.get("teaching_score"),
            ])

    with REJECT_OUTPUT.open("w", encoding="utf-8-sig", newline="") as stream:
        writer = csv.writer(stream)
        writer.writerow(["昵称", "抖音号", "粉丝", "销售额", "直播数", "视频数", "商品数", "剔除原因"])
        for row, reasons in rejected:
            writer.writerow([
                row.get("nick_name"),
                row.get("display_id"),
                row.get("fans"),
                row.get("gmv"),
                row.get("lives"),
                row.get("videos"),
                row.get("skus"),
                "；".join(reasons),
            ])

    print(json.dumps({
        "input": len(rows),
        "kept": len(kept),
        "rejected": len(rejected),
        "json": str(OUTPUT),
        "csv": str(CSV_OUTPUT),
        "rejects": str(REJECT_OUTPUT),
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
