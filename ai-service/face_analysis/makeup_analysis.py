class MakeupAnalyzer:
    def analyze_creator_makeup(self, image_url: str) -> dict[str, object]:
        return {
            "image_url": image_url,
            "makeup_style": "清透冷感妆",
            "focus": ["眉毛", "眼妆", "腮红", "口红"],
            "transfer_advice": {
                "眉毛": "降低10%",
                "眼影": "减少30%",
                "口红": "选择干枯玫瑰色号",
            },
        }
