class RecommendService:
    def top_bloggers(self) -> list[dict[str, object]]:
        return [
            {
                "name": "博主A",
                "match": 92,
                "reasons": ["脸型相似", "眼型相似", "风格一致"],
                "learn": ["眉毛", "眼妆", "腮红"],
            }
        ]
