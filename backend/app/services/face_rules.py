from __future__ import annotations


def infer_face_shape(metrics: dict[str, float]) -> str:
    face_ratio = metrics["face_length_width_ratio"]
    jaw_ratio = metrics["jaw_cheekbone_width_ratio"]
    upper_ratio = metrics["upper_face_cheekbone_ratio"]
    lower_ratio = metrics["lower_face_ratio"]

    if face_ratio >= 1.30:
        return "\u957f\u5f62\u8138"
    if face_ratio <= 1.08 and jaw_ratio >= 0.82:
        return "\u77ed\u5706\u8138"
    if jaw_ratio <= 0.68 and upper_ratio >= 1.02:
        return "\u5fc3\u5f62\u8138"
    if jaw_ratio >= 0.88 and lower_ratio >= 0.40:
        return "\u65b9\u5706\u8138"
    if jaw_ratio <= 0.72 and 1.12 <= face_ratio <= 1.26:
        return "\u83f1\u5f62\u8138"
    if jaw_ratio >= 0.86 and lower_ratio <= 0.38:
        return "\u68a8\u5f62\u8138"
    return "\u9e45\u86cb\u8138"


def infer_advantage(metrics: dict[str, float]) -> str:
    eye_ratio = metrics["eye_aspect_ratio"]
    eye_spacing = metrics["eye_spacing_face_width_ratio"]
    lip_ratio = metrics["lip_width_ratio"]
    nose_ratio = metrics["nose_width_ratio"]
    jaw_ratio = metrics["jaw_cheekbone_width_ratio"]
    lower_ratio = metrics["lower_face_ratio"]
    brow_lip_ratio = metrics["brow_lip_ratio"]

    if eye_ratio >= 3.0 and 0.22 <= eye_spacing <= 0.27:
        return "\u773c\u775b\u6709\u8fa8\u8bc6\u5ea6"
    if lip_ratio >= 0.33:
        return "\u5507\u90e8\u5b58\u5728\u611f\u5f3a"
    if nose_ratio <= 0.22:
        return "\u9762\u4e2d\u5e72\u51c0\u7cbe\u81f4"
    if 0.36 <= lower_ratio <= 0.39:
        return "\u4e09\u5ead\u6bd4\u4f8b\u8212\u5c55"
    if 0.74 <= jaw_ratio <= 0.82:
        return "\u4e0b\u988c\u7ebf\u6761\u6e05\u6670"
    if eye_spacing < 0.22 and brow_lip_ratio <= 0.36:
        return "\u5e7c\u6001\u4eb2\u548c\u611f\u5f3a"
    if jaw_ratio <= 0.72 and nose_ratio <= 0.24:
        return "\u9aa8\u76f8\u8f6c\u6298\u660e\u786e"
    return "\u4e94\u5b98\u6bd4\u4f8b\u534f\u8c03"


def infer_improvement(metrics: dict[str, float]) -> str:
    face_ratio = metrics["face_length_width_ratio"]
    jaw_ratio = metrics["jaw_cheekbone_width_ratio"]
    lower_ratio = metrics["lower_face_ratio"]
    eye_spacing = metrics["eye_spacing_face_width_ratio"]
    eye_ratio = metrics["eye_aspect_ratio"]
    nose_ratio = metrics["nose_width_ratio"]
    lip_ratio = metrics["lip_width_ratio"]
    brow_lip_ratio = metrics["brow_lip_ratio"]

    if jaw_ratio <= 0.70:
        return "\u589e\u5f3a\u4e0b\u5ead\u652f\u6491\u611f"
    if lower_ratio >= 0.41:
        return "\u5f31\u5316\u4e0b\u5ead\u91cd\u91cf"
    if brow_lip_ratio >= 0.42:
        return "\u964d\u4f4e\u7709\u6bdb\u6d53\u5ea6"
    if face_ratio >= 1.30:
        return "\u964d\u4f4e\u7eb5\u5411\u62c9\u957f\u611f"
    if nose_ratio >= 0.26:
        return "\u6536\u7a84\u9762\u4e2d\u91cd\u5fc3"
    if eye_spacing >= 0.28 or eye_ratio <= 2.65:
        return "\u589e\u52a0\u773c\u5986\u6a2a\u5411\u5ef6\u5c55"
    if lip_ratio <= 0.28:
        return "\u52a0\u5f3a\u5507\u90e8\u8272\u5f69\u91cd\u5fc3"
    if jaw_ratio <= 0.74 and lower_ratio <= 0.36:
        return "\u67d4\u5316\u9891\u9aa8\u8f6c\u6298"
    return "\u589e\u5f3a\u8f6e\u5ed3\u611f"


def build_report(metrics: dict[str, float]) -> dict[str, str]:
    return {
        "face_shape": infer_face_shape(metrics),
        "advantage": infer_advantage(metrics),
        "improvement": infer_improvement(metrics),
    }
