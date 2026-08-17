class BloggerRecommender:
    def match(self, beauty_profile: dict[str, str]) -> list[dict[str, object]]:
        return [
            {
                "name": "博主A",
                "match": 92,
                "reasons": ["脸型相似", "眼型相似", "风格一致"],
                "learn": ["眉毛", "眼妆", "腮红"],
            },
            {
                "name": "博主B",
                "match": 89,
                "reasons": ["气质相近", "妆感清透", "五官比例相似"],
                "learn": ["底妆", "高光", "唇妆"],
            },
        ]
