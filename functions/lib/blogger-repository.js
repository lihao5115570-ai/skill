import { mapCuratedBloggers } from "../data/curated-bloggers.js";
import { normalizeFaceProfile } from "./face-profile-schema.js";

function parseJson(value, fallback) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") return value;
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export async function readUsableBloggers(env) {
  if (!env.DB) {
    return { source: "curated", bloggers: mapCuratedBloggers(), db_available: false };
  }

  try {
    const { results = [] } = await env.DB.prepare(
      `SELECT
        b.id,
        b.name,
        b.platform,
        b.source_id AS handle,
        b.source_url,
        b.avatar_url,
        b.style,
        b.tags,
        p.face_shape,
        p.face_length_ratio,
        p.forehead_width,
        p.forehead_height,
        p.cheekbone_width,
        p.jaw_width,
        p.jaw_type,
        p.chin_type,
        p.eye_shape,
        p.eyelid_type,
        p.eye_spacing,
        p.eye_size,
        p.brow_eye_distance,
        p.midface_length,
        p.nose_type,
        p.lip_type,
        p.facial_visual_weight,
        p.feature_concentration,
        p.soft_hard_tendency,
        p.style_tendency,
        p.makeup_suitable_tags,
        p.analysis_version,
        p.confidence_score
       FROM bloggers b
       JOIN blogger_profiles p ON p.blogger_id = b.id
       WHERE COALESCE(b.enabled, 1) = 1 AND COALESCE(p.review_status, 'approved') = 'approved'
       ORDER BY COALESCE(b.priority, 0) DESC, b.name ASC
       LIMIT 200`
    ).all();

    if (!results.length) {
      return { source: "curated", bloggers: mapCuratedBloggers(), db_available: true, db_count: 0 };
    }

    return {
      source: "d1",
      db_available: true,
      db_count: results.length,
      bloggers: results.map((row) => ({
        id: row.id,
        name: row.name,
        platform: row.platform,
        handle: row.handle,
        source_url: row.source_url,
        tutorial_url: row.source_url,
        avatar_url: row.avatar_url,
        cover_url: row.avatar_url,
        style: row.style,
        tags: parseJson(row.tags, []),
        profile: normalizeFaceProfile({
          ...row,
          style_tendency: parseJson(row.style_tendency, []),
          makeup_suitable_tags: parseJson(row.makeup_suitable_tags, parseJson(row.tags, [])),
        }),
        analysis_version: row.analysis_version,
        confidence_score: row.confidence_score,
      })),
    };
  } catch (error) {
    console.error("read blogger profiles error", error);
    return { source: "curated", bloggers: mapCuratedBloggers(), db_available: false, error: error?.message || String(error) };
  }
}
