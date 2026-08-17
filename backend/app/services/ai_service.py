class AIService:
    def analyze_beauty(self) -> dict[str, str]:
        return {
            "face_shape": "鹅蛋脸",
            "eye_shape": "内双",
            "skin": "偏白",
            "style": "清冷感",
        }

    def transfer_makeup(self) -> dict[str, object]:
        return {
            "version": "你的版本",
            "note": "不要完全复制",
            "adjustments": {
                "眉毛": "降低10%",
                "眼影": "减少30%",
                "口红": "选择干枯玫瑰色号",
            },
        }
