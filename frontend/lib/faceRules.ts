import type { FaceMetrics } from "./api";

export type FaceReportSummary = {
  face_shape: string;
  advantage: string;
  improvement: string;
};

export function inferFaceShape(metrics: FaceMetrics): string {
  const faceRatio = metrics.face_length_width_ratio;
  const jawRatio = metrics.jaw_cheekbone_width_ratio;
  const upperRatio = metrics.upper_face_cheekbone_ratio;
  const lowerRatio = metrics.lower_face_ratio;

  if (faceRatio >= 1.3) return "\u957f\u5f62\u8138";
  if (faceRatio <= 1.08 && jawRatio >= 0.82) return "\u77ed\u5706\u8138";
  if (jawRatio <= 0.68 && upperRatio >= 1.02) return "\u5fc3\u5f62\u8138";
  if (jawRatio >= 0.88 && lowerRatio >= 0.4) return "\u65b9\u5706\u8138";
  if (jawRatio <= 0.72 && faceRatio >= 1.12 && faceRatio <= 1.26) return "\u83f1\u5f62\u8138";
  if (jawRatio >= 0.86 && lowerRatio <= 0.38) return "\u68a8\u5f62\u8138";
  return "\u9e45\u86cb\u8138";
}

export function inferAdvantage(metrics: FaceMetrics): string {
  const eyeRatio = metrics.eye_aspect_ratio;
  const eyeSpacing = metrics.eye_spacing_face_width_ratio;
  const lipRatio = metrics.lip_width_ratio;
  const noseRatio = metrics.nose_width_ratio;
  const jawRatio = metrics.jaw_cheekbone_width_ratio;
  const lowerRatio = metrics.lower_face_ratio;
  const browLipRatio = metrics.brow_lip_ratio;

  if (eyeRatio >= 3.0 && eyeSpacing >= 0.22 && eyeSpacing <= 0.27) return "\u773c\u775b\u6709\u8fa8\u8bc6\u5ea6";
  if (lipRatio >= 0.33) return "\u5507\u90e8\u5b58\u5728\u611f\u5f3a";
  if (noseRatio <= 0.22) return "\u9762\u4e2d\u5e72\u51c0\u7cbe\u81f4";
  if (lowerRatio >= 0.36 && lowerRatio <= 0.39) return "\u4e09\u5ead\u6bd4\u4f8b\u8212\u5c55";
  if (jawRatio >= 0.74 && jawRatio <= 0.82) return "\u4e0b\u988c\u7ebf\u6761\u6e05\u6670";
  if (eyeSpacing < 0.22 && browLipRatio <= 0.36) return "\u5e7c\u6001\u4eb2\u548c\u611f\u5f3a";
  if (jawRatio <= 0.72 && noseRatio <= 0.24) return "\u9aa8\u76f8\u8f6c\u6298\u660e\u786e";
  return "\u4e94\u5b98\u6bd4\u4f8b\u534f\u8c03";
}

export function inferImprovement(metrics: FaceMetrics): string {
  const faceRatio = metrics.face_length_width_ratio;
  const jawRatio = metrics.jaw_cheekbone_width_ratio;
  const lowerRatio = metrics.lower_face_ratio;
  const eyeSpacing = metrics.eye_spacing_face_width_ratio;
  const eyeRatio = metrics.eye_aspect_ratio;
  const noseRatio = metrics.nose_width_ratio;
  const lipRatio = metrics.lip_width_ratio;
  const browLipRatio = metrics.brow_lip_ratio;

  if (jawRatio <= 0.7) return "\u589e\u5f3a\u4e0b\u5ead\u652f\u6491\u611f";
  if (lowerRatio >= 0.41) return "\u5f31\u5316\u4e0b\u5ead\u91cd\u91cf";
  if (browLipRatio >= 0.42) return "\u964d\u4f4e\u7709\u6bdb\u6d53\u5ea6";
  if (faceRatio >= 1.3) return "\u964d\u4f4e\u7eb5\u5411\u62c9\u957f\u611f";
  if (noseRatio >= 0.26) return "\u6536\u7a84\u9762\u4e2d\u91cd\u5fc3";
  if (eyeSpacing >= 0.28 || eyeRatio <= 2.65) return "\u589e\u52a0\u773c\u5986\u6a2a\u5411\u5ef6\u5c55";
  if (lipRatio <= 0.28) return "\u52a0\u5f3a\u5507\u90e8\u8272\u5f69\u91cd\u5fc3";
  if (jawRatio <= 0.74 && lowerRatio <= 0.36) return "\u67d4\u5316\u9891\u9aa8\u8f6c\u6298";
  return "\u589e\u5f3a\u8f6e\u5ed3\u611f";
}

export function buildFaceReport(metrics: FaceMetrics): FaceReportSummary {
  return {
    face_shape: inferFaceShape(metrics),
    advantage: inferAdvantage(metrics),
    improvement: inferImprovement(metrics),
  };
}
