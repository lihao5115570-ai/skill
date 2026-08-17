"use client";

import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ImagePlus, Loader2 } from "lucide-react";

import { type BeautyAnalysisResult, analyzeBeautyPhotos } from "../api/client";

type UploadSlotId = "frontFace" | "angle45" | "fullBody";

type UploadSlot = {
  id: UploadSlotId;
  title: string;
  description: string;
};

const slots: UploadSlot[] = [
  {
    id: "frontFace",
    title: "\u6b63\u8138",
    description: "\u7528\u4e8e\u5224\u65ad\u8138\u578b\u3001\u4e94\u5b98\u6bd4\u4f8b\u548c\u773c\u578b\u3002",
  },
  {
    id: "angle45",
    title: "45\u5ea6",
    description: "\u7528\u4e8e\u8f85\u52a9\u5224\u65ad\u9aa8\u76f8\u3001\u8f6e\u5ed3\u548c\u4fa7\u9762\u7acb\u4f53\u5ea6\u3002",
  },
  {
    id: "fullBody",
    title: "\u5168\u8eab",
    description: "\u7528\u4e8e\u8f85\u52a9\u5224\u65ad\u6574\u4f53\u6c14\u8d28\u3001\u7a7f\u642d\u548c\u98ce\u683c\u3002",
  },
];

export default function UploadBox() {
  const [files, setFiles] = useState<Partial<Record<UploadSlotId, File>>>({});
  const [result, setResult] = useState<BeautyAnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const previews = useMemo(() => {
    const entries = Object.entries(files).map(([id, file]) => [id, URL.createObjectURL(file)]);
    return Object.fromEntries(entries) as Partial<Record<UploadSlotId, string>>;
  }, [files]);

  useEffect(() => {
    return () => {
      Object.values(previews).forEach((preview) => {
        if (preview) {
          URL.revokeObjectURL(preview);
        }
      });
    };
  }, [previews]);

  function handleFileChange(id: UploadSlotId, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setFiles((current) => ({ ...current, [id]: file }));
    setResult(null);
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const frontFace = files.frontFace;
    const angle45 = files.angle45;
    const fullBody = files.fullBody;

    if (!frontFace || !angle45 || !fullBody) {
      setError("\u8bf7\u5148\u4e0a\u4f20\u6b63\u8138\u300145\u5ea6\u548c\u5168\u8eab\u4e09\u5f20\u7167\u7247\u3002");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const analysis = await analyzeBeautyPhotos({ frontFace, angle45, fullBody });
      setResult(analysis);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "\u7167\u7247\u5206\u6790\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="upload-flow">
      <form className="upload-grid" onSubmit={handleSubmit}>
        {slots.map((slot) => (
          <label key={slot.id} className="upload-slot">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => handleFileChange(slot.id, event)}
            />
            {previews[slot.id] ? (
              <img src={previews[slot.id]} alt={`${slot.title}\u9884\u89c8`} className="upload-preview" />
            ) : (
              <span className="upload-placeholder">
                <ImagePlus aria-hidden className="module-icon" />
              </span>
            )}
            <span className="upload-slot-copy">
              <strong>{slot.title}</strong>
              <span>{slot.description}</span>
            </span>
            {files[slot.id] ? <CheckCircle2 aria-label="\u5df2\u9009\u62e9" className="upload-check" /> : null}
          </label>
        ))}

        <div className="upload-actions">
          <button type="submit" className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 aria-hidden className="button-icon spinning" /> : null}
            {isSubmitting ? "AI Vision \u5206\u6790\u4e2d" : "\u5f00\u59cb\u5206\u6790"}
          </button>
          {error ? <p className="error-text">{error}</p> : null}
        </div>
      </form>

      {result ? (
        <article className="analysis-result">
          <h2>AI Vision \u8f93\u51fa</h2>
          <dl>
            <div>
              <dt>face_shape</dt>
              <dd>{result.face_shape}</dd>
            </div>
            <div>
              <dt>eye_shape</dt>
              <dd>{result.eye_shape}</dd>
            </div>
            <div>
              <dt>skin</dt>
              <dd>{result.skin}</dd>
            </div>
            <div>
              <dt>style</dt>
              <dd>{result.style}</dd>
            </div>
          </dl>
        </article>
      ) : null}
    </section>
  );
}
