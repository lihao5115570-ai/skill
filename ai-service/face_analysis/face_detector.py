class FaceDetector:
    def detect(self, image_url: str) -> dict[str, object]:
        return {
            "image_url": image_url,
            "face_count": 1,
            "bbox": {
                "x": 0.31,
                "y": 0.18,
                "width": 0.38,
                "height": 0.48,
            },
            "quality": "clear",
        }
