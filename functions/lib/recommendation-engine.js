import { ALGORITHM_VERSION, MATCHING_WEIGHTS, NUMERIC_TOLERANCE } from "./matching-weights.js";
import { normalizeFaceProfile, ordinalDistance } from "./face-profile-schema.js";

const compatibleFaceShapes = {
  oval: ["oval_round", "oval_long", "heart"],
  oval_round: ["oval", "round", "heart"],
  oval_long: ["oval", "long", "diamond"],
  round: ["oval_round", "square", "heart"],
  square: ["round", "oval_round", "oval"],
  long: ["oval_long", "diamond", "oval"],
  heart: ["oval", "oval_round", "diamond"],
  diamond: ["heart", "oval_long", "long"],
};

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function categorySimilarity(a, b, compatible = []) {
  if (!a || !b) return 0.55;
  if (a === b) return 1;
  if (compatible.includes(b)) return 0.72;
  const distance = ordinalDistance(a, b);
  if (distance <= 0.5) return 0.82;
  if (distance <= 1) return 0.62;
  return 0.28;
}

function numericSimilarity(a, b, tolerance) {
  const left = Number(a);
  const right = Number(b);
  if (!Number.isFinite(left) || !Number.isFinite(right)) return 0.55;
  return Math.max(0, 1 - Math.min(Math.abs(left - right) / tolerance, 1));
}

function jaccard(a = [], b = []) {
  const left = new Set(a);
  const right = new Set(b);
  if (!left.size && !right.size) return 0.55;
  const intersection = [...left].filter((item) => right.has(item)).length;
  const union = new Set([...left, ...right]).size || 1;
  return intersection / union;
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function evidenceItem(label, userValue, bloggerValue, score, type = "matched") {
  return { label, user_value: userValue, blogger_value: bloggerValue, score: clampScore(score * 100), type };
}

function labelProfileValue(value, field = "") {
  if (field === "face_shape" && value === "round") return "圆脸";
  if (field === "eye_shape" && value === "round") return "圆眼";
  const map = {
    oval: "鹅蛋脸",
    round: "圆脸",
    square: "方圆脸",
    long: "长形脸",
    heart: "心形脸",
    diamond: "菱形脸",
    oval_round: "鹅蛋偏圆",
    oval_long: "鹅蛋偏长",
    single: "单眼皮",
    inner_double: "内双",
    double: "双眼皮",
    almond: "杏眼",
    slender: "细长眼",
    upturned: "上挑眼",
    close: "偏近",
    medium: "适中",
    wide: "偏宽",
    light: "轻量感",
    heavy: "重量感",
    soft: "柔和",
    hard: "利落",
    balanced: "均衡",
    low: "分散",
    medium_high: "略集中",
    high: "集中",
    short: "偏短",
    long: "偏长",
  };
  return map[value] || value || "未识别";
}

function buildMatchedFeatures(parts) {
  return parts
    .filter((item) => item.score >= 0.62)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((item) => evidenceItem(item.label, item.user, item.blogger, item.score, "matched"));
}

function buildDifferentFeatures(parts) {
  return parts
    .filter((item) => item.score < 0.62)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((item) => evidenceItem(item.label, item.user, item.blogger, item.score, "different"));
}

function makeExplanation(recommendation) {
  const matched = recommendation.matched_features.map((item) => item.label).slice(0, 3);
  const caution = recommendation.different_features[0]?.label || "妆面浓度";
  const learn = recommendation.learn_points.slice(0, 3);
  return {
    why: `更适合参考她的${matched.join("、")}。这是妆容参考，不是长相对比。`,
    learn: `可以优先看${learn.join("、")}。`,
    caution: `${caution}不建议完全照搬，按自己的比例减量调整。`,
  };
}

export function scoreBlogger(userProfileInput, blogger) {
  const user = normalizeFaceProfile(userProfileInput);
  const profile = normalizeFaceProfile(blogger.profile || blogger);

  const faceShapeScore = categorySimilarity(user.face_shape, profile.face_shape, compatibleFaceShapes[user.face_shape] || []);
  const faceLengthScore = numericSimilarity(user.face_length_ratio, profile.face_length_ratio, NUMERIC_TOLERANCE.face_length_ratio);
  const eyeShapeScore = categorySimilarity(user.eye_shape, profile.eye_shape);
  const eyelidScore = categorySimilarity(user.eyelid_type, profile.eyelid_type);
  const eyeSpacingScore = categorySimilarity(user.eye_spacing, profile.eye_spacing);
  const midfaceScore = categorySimilarity(user.midface_length, profile.midface_length);
  const jawScore = categorySimilarity(user.jaw_width, profile.jaw_width);
  const cheekboneScore = categorySimilarity(user.cheekbone_width, profile.cheekbone_width);
  const browEyeScore = categorySimilarity(user.brow_eye_distance, profile.brow_eye_distance);
  const visualWeightScore = categorySimilarity(user.facial_visual_weight, profile.facial_visual_weight);
  const featureScore = categorySimilarity(user.feature_concentration, profile.feature_concentration);
  const softHardScore = categorySimilarity(user.soft_hard_tendency, profile.soft_hard_tendency);
  const styleScore = Math.max(jaccard(user.style_tendency, profile.style_tendency), 0.3);
  const tagScore = Math.max(jaccard(user.makeup_suitable_tags, profile.makeup_suitable_tags), 0.28);

  const overall =
    MATCHING_WEIGHTS.faceShape * average([faceShapeScore, faceLengthScore]) +
    MATCHING_WEIGHTS.eyeAndEyelid * average([eyeShapeScore, eyelidScore, eyeSpacingScore]) +
    MATCHING_WEIGHTS.midface * midfaceScore +
    MATCHING_WEIGHTS.jawAndCheekbone * average([jawScore, cheekboneScore]) +
    MATCHING_WEIGHTS.browEye * browEyeScore +
    MATCHING_WEIGHTS.visualWeight * visualWeightScore +
    MATCHING_WEIGHTS.featureConcentration * featureScore +
    MATCHING_WEIGHTS.softHard * softHardScore +
    MATCHING_WEIGHTS.style * styleScore +
    MATCHING_WEIGHTS.makeupTags * tagScore;

  const dimension_scores = {
    overall_match: clampScore(58 + overall * 40),
    eye_makeup_match: clampScore(55 + average([eyeShapeScore, eyelidScore, eyeSpacingScore]) * 43),
    eyebrow_match: clampScore(55 + average([browEyeScore, featureScore]) * 43),
    contour_match: clampScore(55 + average([faceShapeScore, faceLengthScore, jawScore, cheekboneScore]) * 43),
    style_match: clampScore(55 + average([styleScore, tagScore, softHardScore, visualWeightScore]) * 43),
  };

  const parts = [
    { label: "脸型比例", user: labelProfileValue(user.face_shape, "face_shape"), blogger: labelProfileValue(profile.face_shape, "face_shape"), score: average([faceShapeScore, faceLengthScore]) },
    { label: "眼型眼皮", user: `${labelProfileValue(user.eye_shape, "eye_shape")} / ${labelProfileValue(user.eyelid_type)}`, blogger: `${labelProfileValue(profile.eye_shape, "eye_shape")} / ${labelProfileValue(profile.eyelid_type)}`, score: average([eyeShapeScore, eyelidScore]) },
    { label: "眼距关系", user: labelProfileValue(user.eye_spacing), blogger: labelProfileValue(profile.eye_spacing), score: eyeSpacingScore },
    { label: "中庭比例", user: labelProfileValue(user.midface_length), blogger: labelProfileValue(profile.midface_length), score: midfaceScore },
    { label: "轮廓边界", user: labelProfileValue(user.jaw_width), blogger: labelProfileValue(profile.jaw_width), score: average([jawScore, cheekboneScore]) },
    { label: "眉眼距离", user: labelProfileValue(user.brow_eye_distance), blogger: labelProfileValue(profile.brow_eye_distance), score: browEyeScore },
    { label: "五官量感", user: labelProfileValue(user.facial_visual_weight), blogger: labelProfileValue(profile.facial_visual_weight), score: visualWeightScore },
    { label: "风格倾向", user: user.style_tendency.join("、"), blogger: profile.style_tendency.join("、"), score: styleScore },
  ];

  const matched_features = buildMatchedFeatures(parts);
  const different_features = buildDifferentFeatures(parts);
  const learn_points = [...new Set([
    ...(profile.makeup_suitable_tags || []),
    "眼妆参考",
    "眉型参考",
    "轮廓参考",
  ])].slice(0, 5);

  return {
    blogger_id: blogger.id,
    name: blogger.name,
    platform: blogger.platform || "douyin",
    handle: blogger.handle || blogger.source_id || blogger.name,
    style: blogger.style || "妆容参考",
    source: blogger.source_url || "",
    tutorial: blogger.tutorial_url || blogger.source_url || "",
    avatar: blogger.avatar_url || "",
    cover: blogger.cover_url || blogger.avatar_url || "",
    score: dimension_scores.overall_match,
    dimension_scores,
    matched_features,
    different_features,
    learn_points,
    reasons: matched_features.slice(0, 3).map((item) => `${item.label}适合参考`),
    explanation: null,
    algorithm_version: ALGORITHM_VERSION,
  };
}

export function rankBloggers(userProfile, bloggers, topN = 5) {
  return bloggers
    .map((blogger) => {
      const scored = scoreBlogger(userProfile, blogger);
      scored.explanation = makeExplanation(scored);
      return scored;
    })
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, "zh-Hans-CN"))
    .slice(0, topN);
}

export function categoryRecommendations(recommendations) {
  const pick = (key) => [...recommendations].sort((a, b) => b.dimension_scores[key] - a.dimension_scores[key])[0] || null;
  return {
    overall: pick("overall_match"),
    eye_makeup: pick("eye_makeup_match"),
    eyebrow: pick("eyebrow_match"),
    contour: pick("contour_match"),
    style: pick("style_match"),
  };
}
