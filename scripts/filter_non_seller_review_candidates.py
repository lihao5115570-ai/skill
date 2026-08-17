import csv
import json
from pathlib import Path

from filter_teaching_makeup_bloggers import parse_count, seller_score


INPUT = Path("storage/kaogujia_female_authors_multi_sort.json")
OUTPUT = Path("storage/kaogujia_non_seller_review_candidates.json")
CSV_OUTPUT = Path("storage/kaogujia_non_seller_review_candidates.csv")

EXCLUDE_KEYWORDS = [
    "新闻",
    "晚报",
    "日报",
    "做菜",
    "厨房",
    "小厨",
    "美食",
    "健身",
    "瑜伽",
    "手工",
    "财经",
    "经济",
    "医生",
    "医院",
    "母婴",
    "宝妈",
    "宠物",
    "三农",
    "汽车",
    "音乐",
    "主持",
    "情感",
    "游戏",
    "影视",
    "房产",
    "动漫",
    "历史",
    "教育",
    "培训",
]


def keep(row):
    name = str(row.get("nick_name") or "")
    fans = parse_count(row.get("fans"))
    if row.get("gender") != 2 or not row.get("display_id"):
        return False
    if not 10_000 <= fans <= 100_000:
        return False
    if row.get("is_shop") or seller_score(row) >= 2:
        return False
    if any(keyword in name for keyword in EXCLUDE_KEYWORDS):
        return False
    if int(row.get("lives") or 0) > 2:
        return False
    if int(row.get("skus") or 0) > 8:
        return False
    if int(row.get("videos") or 0) < 5:
        return False
    return True


def main():
    rows = json.loads(INPUT.read_text(encoding="utf-8"))
    filtered = [row for row in rows if keep(row)]
    filtered.sort(key=lambda row: (parse_count(row.get("fans")), int(row.get("videos") or 0)), reverse=True)
    OUTPUT.write_text(json.dumps(filtered, ensure_ascii=False, indent=2), encoding="utf-8")

    with CSV_OUTPUT.open("w", encoding="utf-8-sig", newline="") as stream:
        writer = csv.writer(stream)
        writer.writerow(["昵称", "抖音号", "粉丝", "销售额", "直播数", "视频数", "商品数"])
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
                ]
            )
    print(json.dumps({"input": len(rows), "kept": len(filtered), "json": str(OUTPUT), "csv": str(CSV_OUTPUT)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
