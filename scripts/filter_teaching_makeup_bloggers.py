import csv
import json
from pathlib import Path


INPUT = Path("storage/kaogujia_female_authors_multi_sort.json")
OUTPUT = Path("storage/kaogujia_teaching_makeup_bloggers.json")
CSV_OUTPUT = Path("storage/kaogujia_teaching_makeup_bloggers.csv")

BEAUTY_KEYWORDS = [
    "化妆",
    "美妆",
    "彩妆",
    "护肤",
    "养肤",
    "变美",
    "妆",
    "底妆",
    "眼妆",
    "口红",
    "面膜",
    "美容",
    "美肤",
    "面部美学",
    "皮肤",
    "素颜",
    "教程",
    "新手",
    "淡妆",
    "痘",
    "抗老",
]

SELLER_KEYWORDS = [
    "清仓",
    "工厂",
    "甄选",
    "好物",
    "严选",
    "优选",
    "供应链",
    "现货",
    "专场",
    "品牌",
    "老板娘",
    "水贝",
    "珠宝",
    "女装",
    "穿搭",
    "服饰",
    "服装",
    "鞋",
    "包",
    "家纺",
    "数码",
    "家居",
    "食品",
    "母婴",
    "滋补",
    "黄金",
    "奢",
    "团购",
    "折扣",
    "电商",
    "营销",
    "招商",
    "代理",
    "加盟",
    "专卖",
    "中心",
    "源头",
    "仓",
    "店",
    "商行",
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


def has_any(text, keywords):
    return any(keyword.lower() in text.lower() for keyword in keywords)


def seller_score(row):
    name = str(row.get("nick_name") or "")
    market = row.get("market_type") or {}
    lives = int(row.get("lives") or 0)
    videos = int(row.get("videos") or 0)
    skus = int(row.get("skus") or 0)
    score = 0
    if row.get("is_shop"):
        score += 5
    if has_any(name, SELLER_KEYWORDS):
        score += 4
    if (market.get("live_ratio") or 0) >= 0.7:
        score += 3
    if market.get("is_pure") == 1 and (market.get("market_type") == 2):
        score += 3
    if skus >= 50:
        score += 2
    if lives > videos and lives >= 5:
        score += 2
    if str(row.get("gmv") or "") == "1000万+":
        score += 1
    return score


def teaching_score(row):
    name = str(row.get("nick_name") or "")
    market = row.get("market_type") or {}
    videos = int(row.get("videos") or 0)
    lives = int(row.get("lives") or 0)
    fans = parse_count(row.get("fans"))
    score = 0
    if has_any(name, BEAUTY_KEYWORDS):
        score += 8
    if not row.get("is_shop"):
        score += 3
    if videos >= lives:
        score += 3
    if (market.get("video_ratio") or 0) >= 0.5:
        score += 3
    if 10_000 <= fans <= 500_000:
        score += 2
    if seller_score(row) == 0:
        score += 2
    return score


def keep(row):
    name = str(row.get("nick_name") or "")
    if not row.get("display_id"):
        return False
    if row.get("gender") != 2:
        return False
    if seller_score(row) >= 5:
        return False
    beauty_name = has_any(name, BEAUTY_KEYWORDS)
    if not beauty_name:
        return False
    if row.get("is_shop"):
        return False
    if parse_count(row.get("fans")) < 1_000 and int(row.get("videos") or 0) == 0:
        return False
    return True


def main():
    rows = json.loads(INPUT.read_text(encoding="utf-8"))
    filtered = [row for row in rows if keep(row)]
    filtered.sort(key=lambda row: (teaching_score(row), -seller_score(row), parse_count(row.get("fans"))), reverse=True)

    OUTPUT.write_text(json.dumps(filtered, ensure_ascii=False, indent=2), encoding="utf-8")
    with CSV_OUTPUT.open("w", encoding="utf-8-sig", newline="") as stream:
        writer = csv.writer(stream)
        writer.writerow(["昵称", "抖音号", "粉丝", "销售额", "直播数", "视频数", "商品数", "教学倾向分", "卖货倾向分"])
        for row in filtered:
            writer.writerow(
                [
                    row.get("nick_name"),
                    row.get("display_id"),
                    row.get("fans"),
                    row.get("gmv"),
                    row.get("lives"),
                    row.get("videos"),
                    row.get("skus"),
                    teaching_score(row),
                    seller_score(row),
                ]
            )
    print(json.dumps({"input": len(rows), "kept": len(filtered), "json": str(OUTPUT), "csv": str(CSV_OUTPUT)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
