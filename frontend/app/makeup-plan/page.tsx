"use client";

import { Brush, ImagePlus, Palette, Sparkles } from "lucide-react";
import type { ChangeEvent } from "react";
import { useMemo, useState } from "react";
import { transferMakeup, type MakeupTransfer } from "../../lib/api";

const adjustments = [
  {
    label: "\u7709\u6bdb",
    value: "\u964d\u4f4e10%",
  },
  {
    label: "\u773c\u5f71",
    value: "\u51cf\u5c1130%",
  },
  {
    label: "\u53e3\u7ea2",
    value: "\u9009\u62e9\u5e72\u67af\u73ab\u7470\u8272\u53f7",
  },
];

export default function MakeupPlanPage() {
  const [imageName, setImageName] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [transfer, setTransfer] = useState<MakeupTransfer | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const uploadText = useMemo(() => imageName || "\u4e0a\u4f20\u559c\u6b22\u7684\u535a\u4e3b\u56fe\u7247", [imageName]);

  function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setImageName(file.name);
    setPreviewUrl(URL.createObjectURL(file));
    setTransfer(null);
  }

  async function handleGenerate() {
    if (!previewUrl) {
      return;
    }

    setIsGenerating(true);
    try {
      setTransfer(await transferMakeup());
    } catch {
      setTransfer({
        your_version: "\u4e0d\u8981\u5b8c\u5168\u590d\u5236",
        adjustments: Object.fromEntries(adjustments.map((item) => [item.label, item.value])),
      });
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <main className="page-shell content-page transfer-page">
      <section className="page-header transfer-header">
        <p className="eyebrow">Step 4 · Makeup Transfer</p>
        <h1>{"AI\u5986\u5bb9\u8fc1\u79fb"}</h1>
        <p className="muted">
          {"\u4e0a\u4f20\u4f60\u559c\u6b22\u7684\u535a\u4e3b\u56fe\u7247\uff0cAI \u4f1a\u628a\u5979\u7684\u5986\u5bb9\u903b\u8f91\u8f6c\u6362\u6210\u66f4\u9002\u5408\u4f60\u7684\u7248\u672c\u3002"}
        </p>
      </section>

      <section className="transfer-layout">
        <label className="creator-upload">
          <input type="file" accept="image/*" onChange={handleUpload} />
          {previewUrl ? (
            <span className="creator-preview" style={{ backgroundImage: `url(${previewUrl})` }}>
              <span>{imageName}</span>
            </span>
          ) : (
            <span className="creator-empty">
              <ImagePlus aria-hidden />
              <strong>{uploadText}</strong>
              <small>{"\u652f\u6301 JPG\u3001PNG\u3001WEBP\uff0c\u5efa\u8bae\u4f7f\u7528\u6e05\u6670\u5986\u5bb9\u56fe\u3002"}</small>
            </span>
          )}
        </label>

        <section className="transfer-result">
          <div className="transfer-result-header">
            <Sparkles aria-hidden />
            <div>
              <p>{"AI\u8f93\u51fa"}</p>
              <h2>{"\u4f60\u7684\u7248\u672c"}</h2>
            </div>
          </div>

          <div className="version-card">
            <Palette aria-hidden />
            <div>
              <strong>{transfer?.your_version || "\u4e0d\u8981\u5b8c\u5168\u590d\u5236"}</strong>
              <span>
                {"\u4fdd\u7559\u535a\u4e3b\u5986\u5bb9\u7684\u6c1b\u56f4\uff0c\u4f46\u6839\u636e\u4f60\u7684\u8138\u578b\u3001\u773c\u578b\u548c\u6e05\u51b7\u611f\u98ce\u683c\u505a\u6bd4\u4f8b\u8c03\u6574\u3002"}
              </span>
            </div>
          </div>

          <button
            className="primary-action transfer-action"
            type="button"
            disabled={!previewUrl || isGenerating}
            onClick={handleGenerate}
          >
            <Brush aria-hidden className="button-icon" />
            <span>{isGenerating ? "\u751f\u6210\u4e2d" : "\u751f\u6210\u8c03\u6574\u65b9\u6848"}</span>
          </button>

          {transfer ? (
            <div className="adjustment-panel">
              <h3>{"\u8c03\u6574"}</h3>
              <div className="adjustment-list">
                {Object.entries(transfer.adjustments).map(([label, value]) => (
                  <article key={label}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <div className="adjustment-placeholder">{"\u4e0a\u4f20\u56fe\u7247\u540e\u751f\u6210\u4f60\u7684\u5986\u5bb9\u8fc1\u79fb\u65b9\u6848\u3002"}</div>
          )}
        </section>
      </section>
    </main>
  );
}
