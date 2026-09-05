export const FACE_ENUMS = {
  face_shape: ["oval", "round", "square", "long", "heart", "diamond", "oval_round", "oval_long"],
  forehead_width: ["narrow", "medium", "wide"],
  forehead_height: ["short", "medium", "long"],
  cheekbone_width: ["narrow", "medium", "wide"],
  jaw_width: ["narrow", "medium", "wide"],
  jaw_type: ["soft", "straight", "angular"],
  chin_type: ["short", "rounded", "pointed", "square"],
  eye_shape: ["round", "almond", "slender", "upturned", "downturned"],
  eyelid_type: ["single", "inner_double", "double"],
  eye_spacing: ["close", "medium", "wide"],
  eye_size: ["small", "medium", "large"],
  brow_eye_distance: ["close", "medium", "wide"],
  midface_length: ["short", "medium", "long"],
  nose_type: ["small_straight", "soft", "defined", "wide", "long"],
  lip_type: ["thin", "medium", "full"],
  facial_visual_weight: ["light", "medium", "heavy"],
  feature_concentration: ["low", "medium", "medium_high", "high"],
  soft_hard_tendency: ["soft", "balanced", "hard"],
};

const zhFaceShapeMap = {
  "鹅蛋脸": "oval",
  "椭圆脸": "oval",
  "圆脸": "round",
  "短圆脸": "round",
  "方脸": "square",
  "方圆脸": "square",
  "长脸": "long",
  "长形脸": "long",
  "心形脸": "heart",
  "菱形脸": "diamond",
  "梨形脸": "square",
};

const zhEyeShapeMap = {
  "圆眼": "round",
  "杏眼": "almond",
  "细长眼": "slender",
  "上挑眼": "upturned",
  "下垂眼": "downturned",
};

const zhEyelidMap = {
  "单眼皮": "single",
  "内双": "inner_double",
  "双眼皮": "double",
};

const orderValues = {
  narrow: 0,
  close: 0,
  short: 0,
  small: 0,
  thin: 0,
  low: 0,
  light: 0,
  soft: 0,
  medium: 1,
  balanced: 1,
  rounded: 1,
  straight: 1,
  medium_high: 1.5,
  wide: 2,
  long: 2,
  large: 2,
  full: 2,
  high: 2,
  heavy: 2,
  angular: 2,
  hard: 2,
  pointed: 2,
  square: 2,
};

export function compactSentence(value, fallback = "") {
  const text = Array.isArray(value) ? value.join("。") : String(value || fallback || "");
  return text
    .replace(/[，,]\s*/g, "，")
    .split(/[。；;]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join("。");
}

export function normalizeList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (!value) return [];
  return String(value)
    .split(/[、,，;；\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function enumValue(field, value, fallback) {
  const raw = String(value || "").trim();
  const mapped = {
    face_shape: zhFaceShapeMap,
    eye_shape: zhEyeShapeMap,
    eyelid_type: zhEyelidMap,
  }[field]?.[raw];
  const normalized = mapped || raw;
  return FACE_ENUMS[field]?.includes(normalized) ? normalized : fallback;
}

function categoryFromMetric(value, low, high) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "medium";
  if (number < low) return "short";
  if (number > high) return "long";
  return "medium";
}

function widthFromMetric(value, low, high) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "medium";
  if (number < low) return "narrow";
  if (number > high) return "wide";
  return "medium";
}

export function inferFaceShape(metrics = {}, source = {}) {
  const explicit = enumValue("face_shape", source.face_shape, "");
  if (explicit) return explicit;
  const faceRatio = Number(metrics.face_length_width_ratio || source.face_length_ratio);
  const jawRatio = Number(metrics.jaw_cheekbone_width_ratio);
  if (Number.isFinite(faceRatio) && faceRatio >= 1.28) return "long";
  if (Number.isFinite(faceRatio) && faceRatio <= 1.08) return "round";
  if (Number.isFinite(jawRatio) && jawRatio >= 0.87) return "square";
  if (Number.isFinite(jawRatio) && jawRatio <= 0.72) return "diamond";
  return "oval";
}

export function normalizeFaceProfile(source = {}, metrics = {}) {
  const profile = {
    face_shape: inferFaceShape(metrics, source),
    face_length_ratio: Number(source.face_length_ratio || metrics.face_length_width_ratio || 1.18),
    forehead_width: enumValue("forehead_width", source.forehead_width, widthFromMetric(metrics.upper_face_cheekbone_ratio, 0.96, 1.04)),
    forehead_height: enumValue("forehead_height", source.forehead_height, categoryFromMetric(metrics.upper_face_cheekbone_ratio, 0.96, 1.04)),
    cheekbone_width: enumValue("cheekbone_width", source.cheekbone_width, "medium"),
    jaw_width: enumValue("jaw_width", source.jaw_width, widthFromMetric(metrics.jaw_cheekbone_width_ratio, 0.74, 0.86)),
    jaw_type: enumValue("jaw_type", source.jaw_type, Number(metrics.jaw_cheekbone_width_ratio) >= 0.86 ? "straight" : "soft"),
    chin_type: enumValue("chin_type", source.chin_type, Number(metrics.lower_face_ratio) >= 0.41 ? "square" : "rounded"),
    eye_shape: enumValue("eye_shape", source.eye_shape, Number(metrics.eye_aspect_ratio) >= 3.08 ? "slender" : "almond"),
    eyelid_type: enumValue("eyelid_type", source.eyelid_type, "inner_double"),
    eye_spacing: enumValue("eye_spacing", source.eye_spacing, widthFromMetric(metrics.eye_spacing_face_width_ratio, 0.23, 0.27).replace("narrow", "close")),
    eye_size: enumValue("eye_size", source.eye_size, Number(metrics.eye_aspect_ratio) >= 3.05 ? "large" : "medium"),
    brow_eye_distance: enumValue("brow_eye_distance", source.brow_eye_distance, widthFromMetric(metrics.brow_lip_ratio, 0.34, 0.42).replace("narrow", "close")),
    midface_length: enumValue("midface_length", source.midface_length, categoryFromMetric(metrics.lower_face_ratio, 0.36, 0.41)),
    nose_type: enumValue("nose_type", source.nose_type, Number(metrics.nose_width_ratio) >= 0.255 ? "wide" : "soft"),
    lip_type: enumValue("lip_type", source.lip_type, widthFromMetric(metrics.lip_width_ratio, 0.3, 0.34).replace("wide", "full").replace("narrow", "thin")),
    facial_visual_weight: enumValue("facial_visual_weight", source.facial_visual_weight, Number(metrics.eye_aspect_ratio) >= 3.08 ? "medium" : "light"),
    feature_concentration: enumValue("feature_concentration", source.feature_concentration, Number(metrics.eye_spacing_face_width_ratio) <= 0.23 ? "medium_high" : "medium"),
    soft_hard_tendency: enumValue("soft_hard_tendency", source.soft_hard_tendency, Number(metrics.jaw_cheekbone_width_ratio) >= 0.87 ? "hard" : "soft"),
    style_tendency: normalizeList(source.style_tendency || source.style_type || source.style),
    makeup_suitable_tags: normalizeList(source.makeup_suitable_tags || source.blogger_match_tags || source.focus || source.tags),
  };

  if (!Number.isFinite(profile.face_length_ratio)) profile.face_length_ratio = 1.18;
  return profile;
}

export function validateFaceProfile(profile) {
  const errors = [];
  for (const [field, allowed] of Object.entries(FACE_ENUMS)) {
    if (!allowed.includes(profile[field])) errors.push(`${field} 非法或缺失`);
  }
  if (!Number.isFinite(Number(profile.face_length_ratio))) errors.push("face_length_ratio 非法或缺失");
  return { ok: errors.length === 0, errors };
}

export function ordinalDistance(a, b) {
  const left = orderValues[a] ?? 1;
  const right = orderValues[b] ?? 1;
  return Math.abs(left - right);
}
