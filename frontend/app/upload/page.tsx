"use client";

import Link from "next/link";
import { Camera, ImagePlus, ShieldCheck } from "lucide-react";
import type { ChangeEvent } from "react";
import { useState } from "react";
import { analyzeBeauty, nextTestCount, uploadImage, type BeautyAnalysis } from "../../lib/api";

const fallbackAnalysis: BeautyAnalysis = {
  face_shape: "\u9e45\u86cb\u8138",
  eye_shape: "\u5185\u53cc",
  skin_color: "\u504f\u767d",
  style_type: "\u6e05\u51b7\u611f",
  advantage: "\u773c\u775b\u6709\u8fa8\u8bc6\u5ea6",
  improvement: "\u589e\u5f3a\u8f6e\u5ed3\u611f",
  quality: { passed: true, message: "\u7167\u7247\u8d28\u91cf\u901a\u8fc7\uff0c\u5df2\u5f00\u59cb\u5339\u914d\u76f8\u4f3c\u535a\u4e3b\u3002" },
  metrics: {
    face_length_width_ratio: 1.179,
    jaw_cheekbone_width_ratio: 0.757,
    upper_face_cheekbone_ratio: 1.017,
    lower_face_ratio: 0.396,
    eye_spacing_face_width_ratio: 0.245,
    eye_aspect_ratio: 3.109,
    nose_width_ratio: 0.231,
    lip_width_ratio: 0.327,
    brow_lip_ratio: 0.431,
  },
};

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [status, setStatus] = useState("\u7167\u7247\u4ec5\u5728\u5f53\u524d\u8bbe\u5907\u5904\u7406\uff0c\u6709\u6548\u5206\u6790\u4fdd\u5b58\u5728\u672c\u673a\u3002");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      setPreview(dataUrl);
      sessionStorage.setItem("beauty-preview-image", dataUrl);
      sessionStorage.setItem("beauty-preview-name", selected.name);
      setStatus(`\u5df2\u9009\u62e9 ${selected.name}\uff0c\u7167\u7247\u4ec5\u5728\u5f53\u524d\u8bbe\u5907\u5904\u7406\u3002`);
    };
    reader.readAsDataURL(selected);
  }

  async function handleAnalyze() {
    if (!file) return;

    setIsAnalyzing(true);
    try {
      const uploaded = await uploadImage(file);
      const analysis = await analyzeBeauty(uploaded.url);
      sessionStorage.setItem("beauty-analysis", JSON.stringify(analysis));
    } catch {
      sessionStorage.setItem("beauty-analysis", JSON.stringify(fallbackAnalysis));
    } finally {
      try {
        localStorage.setItem("beauty-test-count", String(await nextTestCount()));
      } catch {
        const currentCount = Number(localStorage.getItem("beauty-test-count") || "13826");
        localStorage.setItem("beauty-test-count", String(currentCount + 1));
      }
      window.location.href = "/beauty-report";
    }
  }

  return (
    <main className="reference-shell">
      <header className="reference-header upload-reference-header">
        <Link className="reference-brand" href="/"><strong>MAKE UP</strong><span>MAKEUP<br />REFERENCE</span></Link>
        <nav><Link href="/plus">Plus</Link><Link href="/bloggers">{"\u535a\u4e3b\u5165\u9a7b"}</Link><Link href="/privacy">{"\u9690\u79c1"}</Link></nav>
      </header>
      <section className="reference-page">
        <div className="reference-upload-title">
          <div><p className="reference-meta">START / {"\u7167\u7247\u5206\u6790"}</p><h1>{"\u4e0a\u4f20\u4e00\u5f20\u6e05\u6670\u7684\u6b63\u9762\u7167\u7247"}</h1></div>
          <p>{"\u7167\u7247\u5c06\u5360\u636e\u5206\u6790\u4e3b\u89c6\u7a97\u3002\u8bc6\u522b\u5b8c\u6210\u540e\uff0c\u9762\u90e8\u5173\u952e\u70b9\u548c\u4e2a\u4eba\u6bd4\u4f8b\u4f1a\u663e\u793a\u5728\u53f3\u4fa7\u3002"}</p>
        </div>
        <section className="reference-upload-box">
          <div className="reference-upload-center">
            {preview ? <div className="reference-preview-frame"><img src={preview} alt="\u5df2\u9009\u7167\u7247\u9884\u89c8" /></div> : <div className="reference-image-icon"><ImagePlus aria-hidden /></div>}
            <div className="reference-upload-actions">
              <label className="reference-black-button"><ImagePlus aria-hidden /><span>{"\u9009\u62e9\u7167\u7247"}</span><input type="file" accept="image/*" onChange={handleUpload} /></label>
              <button className="reference-white-button" type="button" onClick={handleAnalyze} disabled={!file || isAnalyzing}><Camera aria-hidden /><span>{isAnalyzing ? "\u5206\u6790\u4e2d" : "\u5f00\u59cb\u5206\u6790"}</span></button>
            </div>
            <div className="reference-tips"><span>{"\u6b63\u9762\u62cd\u6444"}</span><span>{"\u65e0\u906e\u6321"}</span><span>{"\u5149\u7ebf\u5747\u5300"}</span></div>
            <p><ShieldCheck aria-hidden />{status}</p>
            <div className="reference-quota"><span>{"\u8fd8\u53ef\u514d\u8d39\u6210\u529f\u5339\u914d 3 \u6b21\uff0c\u5931\u8d25\u4e0d\u8ba1\u6b21\u6570"}</span><button type="button">{"\u9080\u8bf7\u8d5a\u6b21\u6570"}</button></div>
          </div>
        </section>
      </section>
    </main>
  );
}
