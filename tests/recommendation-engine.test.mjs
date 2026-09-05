import assert from "node:assert/strict";
import { mapCuratedBloggers } from "../functions/data/curated-bloggers.js";
import { rankBloggers } from "../functions/lib/recommendation-engine.js";

const bloggers = mapCuratedBloggers();

const samples = {
  "圆脸内双": {
    face_shape: "round",
    face_length_ratio: 1.05,
    jaw_width: "wide",
    cheekbone_width: "medium",
    eye_shape: "round",
    eyelid_type: "inner_double",
    eye_spacing: "close",
    eye_size: "medium",
    brow_eye_distance: "medium",
    midface_length: "short",
    facial_visual_weight: "light",
    feature_concentration: "medium",
    soft_hard_tendency: "soft",
    style_tendency: ["sweet", "daily"],
    makeup_suitable_tags: ["under_eye", "blush", "soft_brow"],
  },
  "长脸双眼皮": {
    face_shape: "long",
    face_length_ratio: 1.32,
    jaw_width: "medium",
    cheekbone_width: "wide",
    eye_shape: "slender",
    eyelid_type: "double",
    eye_spacing: "medium",
    eye_size: "large",
    brow_eye_distance: "close",
    midface_length: "long",
    facial_visual_weight: "heavy",
    feature_concentration: "high",
    soft_hard_tendency: "hard",
    style_tendency: ["glam", "stage"],
    makeup_suitable_tags: ["eye_makeup", "strong_brow", "camera"],
  },
  "方圆脸单眼皮": {
    face_shape: "square",
    face_length_ratio: 1.14,
    jaw_width: "wide",
    cheekbone_width: "medium",
    eye_shape: "slender",
    eyelid_type: "single",
    eye_spacing: "medium",
    eye_size: "medium",
    brow_eye_distance: "wide",
    midface_length: "medium",
    facial_visual_weight: "medium",
    feature_concentration: "medium",
    soft_hard_tendency: "hard",
    style_tendency: ["practical", "daily"],
    makeup_suitable_tags: ["contour", "single_eyelid", "soft_brow"],
  },
  "鹅蛋脸内双": {
    face_shape: "oval",
    face_length_ratio: 1.18,
    jaw_width: "medium",
    cheekbone_width: "medium",
    eye_shape: "almond",
    eyelid_type: "inner_double",
    eye_spacing: "medium",
    eye_size: "medium",
    brow_eye_distance: "medium",
    midface_length: "medium",
    facial_visual_weight: "light",
    feature_concentration: "medium_high",
    soft_hard_tendency: "soft",
    style_tendency: ["clean", "natural"],
    makeup_suitable_tags: ["base_makeup", "low_saturation", "daily"],
  },
  "菱形脸双眼皮": {
    face_shape: "diamond",
    face_length_ratio: 1.23,
    jaw_width: "narrow",
    cheekbone_width: "wide",
    eye_shape: "upturned",
    eyelid_type: "double",
    eye_spacing: "medium",
    eye_size: "large",
    brow_eye_distance: "close",
    midface_length: "short",
    facial_visual_weight: "heavy",
    feature_concentration: "high",
    soft_hard_tendency: "hard",
    style_tendency: ["cool", "glam"],
    makeup_suitable_tags: ["contour", "eye_makeup", "camera"],
  },
};

const signatures = Object.entries(samples).map(([name, profile]) => {
  const top = rankBloggers(profile, bloggers, 5);
  assert.equal(top.length, 5, `${name} should return Top 5`);
  top.forEach((item) => {
    assert.ok(item.score >= 0 && item.score <= 100, `${name} score range`);
    assert.ok(item.dimension_scores.eye_makeup_match, `${name} dimension scores`);
    assert.ok(item.matched_features.length, `${name} matched evidence`);
  });
  console.log(`${name}: ${top.map((item) => `${item.name} ${item.score}%`).join(" / ")}`);
  return top.map((item) => item.name).join("|");
});

assert.ok(new Set(signatures).size >= 4, "不同 FaceProfile 的 Top5 不能长期返回同一组结果");
