export const ALGORITHM_VERSION = "face-profile-v1.0.0";

export const MATCHING_WEIGHTS = {
  faceShape: 0.2,
  eyeAndEyelid: 0.18,
  midface: 0.12,
  jawAndCheekbone: 0.1,
  browEye: 0.1,
  visualWeight: 0.1,
  featureConcentration: 0.08,
  softHard: 0.05,
  style: 0.04,
  makeupTags: 0.03,
};

export const NUMERIC_TOLERANCE = {
  face_length_ratio: 0.18,
  jaw_width: 0.18,
  cheekbone_width: 0.18,
  eye_spacing: 0.07,
  brow_eye_distance: 0.12,
};
