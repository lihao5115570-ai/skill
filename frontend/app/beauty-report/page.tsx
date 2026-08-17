"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { BeautyAnalysis, BloggerRecommendation } from "../../lib/api";
import { buildFaceReport } from "../../lib/faceRules";

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
  recommendations: [
    {
      name: "大娜娜 Nana",
      match: 92,
      avatar_url: "https://pic.kaogujia.com/author/62739255052.jpeg?auth_key=1786678183-0-0-4fb09623b63459822dee2a23a3de0193",
      source_id: "Sunny99nana",
      source_url: "https://www.douyin.com/search/Sunny99nana",
      reasons: ["脸型长宽比接近，整体轮廓走向更相似。", "眼距和眼型比例接近，眼妆放大方式可参考。", "唇宽与眉唇比例接近，适合学习唇腮同色处理。"],
      learn: ["淡颜轮廓", "低饱和眼妆", "干净底妆"],
    },
  ],
};

const metricLabels: [keyof BeautyAnalysis["metrics"], string][] = [
  ["face_length_width_ratio", "\u8138\u90e8\u957f\u5bbd\u6bd4"],
  ["jaw_cheekbone_width_ratio", "\u4e0b\u988c / \u98a7\u9aa8\u5bbd\u5ea6"],
  ["upper_face_cheekbone_ratio", "\u4e0a\u5ead / \u98a7\u9aa8\u5bbd\u5ea6"],
  ["lower_face_ratio", "\u4e0b\u5ead\u957f\u5ea6\u5360\u6bd4"],
  ["eye_spacing_face_width_ratio", "\u773c\u95f4\u8ddd\u5360\u8138\u5bbd"],
  ["eye_aspect_ratio", "\u53cc\u773c\u957f\u5bbd\u6bd4"],
  ["nose_width_ratio", "\u9f3b\u7ffc\u5bbd\u5ea6\u5360\u6bd4"],
  ["lip_width_ratio", "\u5507\u5bbd\u5360\u6bd4"],
  ["brow_lip_ratio", "\u7709\u539a / \u5507\u5bbd"],
];

const metricStatus: Record<keyof BeautyAnalysis["metrics"], "good" | "weak" | "mid"> = {
  face_length_width_ratio: "good",
  jaw_cheekbone_width_ratio: "good",
  upper_face_cheekbone_ratio: "mid",
  lower_face_ratio: "weak",
  eye_spacing_face_width_ratio: "mid",
  eye_aspect_ratio: "good",
  nose_width_ratio: "mid",
  lip_width_ratio: "good",
  brow_lip_ratio: "weak",
};

export default function BeautyReportPage() {
  const [analysis, setAnalysis] = useState<BeautyAnalysis>(fallbackAnalysis);
  const [image, setImage] = useState("");
  const [fileName, setFileName] = useState("demo-face-reference.png");
  const [testerCount, setTesterCount] = useState("13827");
  const [shareText, setShareText] = useState("\u9080\u8bf7\u95fa\u871c\u5ba1\u7f8ePK");
  const [shareNote, setShareNote] = useState("\u590d\u5236\u5f53\u524d\u5206\u6790\u7f51\u5740\uff0c\u53d1\u7ed9\u95fa\u871c\u4e00\u8d77\u770b\u3002");

  useEffect(() => {
    const storedAnalysis = sessionStorage.getItem("beauty-analysis");
    const storedImage = sessionStorage.getItem("beauty-preview-image");
    const storedName = sessionStorage.getItem("beauty-preview-name");
    if (storedAnalysis) {
      try {
        setAnalysis(JSON.parse(storedAnalysis) as BeautyAnalysis);
      } catch {
        setAnalysis(fallbackAnalysis);
      }
    }
    if (storedImage) setImage(storedImage);
    if (storedName) setFileName(storedName);
    setTesterCount(localStorage.getItem("beauty-test-count") || "13827");
  }, []);

  const photoStyle = useMemo(() => {
    if (!image) return undefined;
    return { backgroundImage: `linear-gradient(rgba(34,34,34,.96), rgba(34,34,34,.96)), url(${image})` };
  }, [image]);
  const faceReport = useMemo(() => buildFaceReport(analysis.metrics), [analysis.metrics]);
  const matchedBloggers = useMemo<BloggerRecommendation[]>(() => {
    return (analysis.recommendations?.length ? analysis.recommendations : fallbackAnalysis.recommendations || []).slice(0, 3);
  }, [analysis.recommendations]);
  const bestMatch = matchedBloggers[0];

  async function copyResultUrl() {
    const url = window.location.href;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = url;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setShareText("\u5df2\u590d\u5236\uff0c\u53d1\u7ed9\u95fa\u871c");
      setShareNote("\u7f51\u5740\u5df2\u590d\u5236\uff0c\u53ef\u4ee5\u76f4\u63a5\u7c98\u8d34\u53d1\u9001\u3002");
      window.setTimeout(() => {
        setShareText("\u9080\u8bf7\u95fa\u871c\u5ba1\u7f8ePK");
        setShareNote("\u590d\u5236\u5f53\u524d\u5206\u6790\u7f51\u5740\uff0c\u53d1\u7ed9\u95fa\u871c\u4e00\u8d77\u770b\u3002");
      }, 1800);
    } catch {
      setShareNote("\u590d\u5236\u5931\u8d25\uff0c\u8bf7\u624b\u52a8\u590d\u5236\u6d4f\u89c8\u5668\u5730\u5740\u680f\u7f51\u5740\u3002");
    }
  }

  return (
    <main className="reference-shell">
      <header className="reference-header upload-reference-header">
        <Link className="reference-brand" href="/"><strong>MAKE UP</strong><span>MAKEUP<br />REFERENCE</span></Link>
        <nav><Link href="/plus">Plus</Link><Link href="/bloggers">{"\u535a\u4e3b\u5165\u9a7b"}</Link><Link href="/privacy">{"\u9690\u79c1"}</Link></nav>
      </header>
      <section className="reference-page">
        <div className="reference-result-title">
          <div><p className="reference-meta">RESULT / {"\u9762\u90e8\u7ed3\u6784\u5206\u6790"}</p><h1>{"\u4f60\u7684\u4e2a\u4eba\u5206\u6790"}</h1></div>
          <Link className="reference-white-button" href="/upload">{"\u21bb \u91cd\u65b0\u9009\u62e9"}</Link>
        </div>
        <section className="reference-result-layout">
          <div className="reference-photo-panel">
            <div className={image ? "reference-photo-demo has-upload" : "reference-photo-demo"} style={photoStyle} />
            <div className="reference-photo-footer"><div><strong>{fileName}</strong><span>local preview</span><em>{`\u4f60\u662f\u7b2c ${testerCount} \u4f4d\u5b8c\u6210\u6d4b\u8bd5\u7684\u5973\u751f`}</em></div><Link className="reference-black-button" href="/upload">{"\u91cd\u65b0\u5206\u6790"}</Link></div>
          </div>
          <aside className="reference-analysis-panel">
            <div className="reference-panel-head"><div><p className="reference-meta">ANALYSIS / {"\u4e13\u4e1a\u6570\u636e"}</p><h2>{"\u7167\u7247\u8d28\u91cf\u4e0e\u9762\u90e8\u6bd4\u4f8b"}</h2></div><span>{analysis.quality.passed ? "\u5206\u6790\u5b8c\u6210" : "\u5efa\u8bae\u91cd\u62cd"}</span></div>
            <div className="reference-success">{analysis.quality.message}</div>
            <div className="reference-metric-grid">
              {metricLabels.map(([key, label]) => <div key={key}><span>{label}</span><strong className={`metric-${metricStatus[key]}`}>{analysis.metrics[key].toFixed(3)}</strong></div>)}
            </div>
            <div className="reference-metric-legend"><span><i className="legend-good" />{"\u8fbe\u6807"}</span><span><i className="legend-weak" />{"\u6b20\u7f3a"}</span><span><i className="legend-mid" />{"\u4e2d\u7b49"}</span></div>
            <div className="reference-result-cards">
              <article><p>{"\u6211\u7684\u8138\u578b"}</p><strong>{faceReport.face_shape}</strong></article>
              <article><p>{"\u6211\u7684\u4f18\u52bf"}</p><strong>{faceReport.advantage}</strong></article>
              <article><p>{"\u63d0\u5347\u65b9\u5411"}</p><strong>{faceReport.improvement}</strong></article>
            </div>
            <div className="reference-usage-block"><p className="reference-meta">WHAT THESE NUMBERS DO</p><ul><li>{"\u7528\u8138\u957f\u5bbd\u6bd4\u3001\u4e0b\u988c\u5bbd\u5ea6\u5224\u65ad\u8138\u578b\u548c\u8f6e\u5ed3\u8def\u7ebf\u3002"}</li><li>{"\u7528\u773c\u8ddd\u3001\u773c\u578b\u6bd4\u4f8b\u5339\u914d\u76f8\u4f3c\u535a\u4e3b\u3002"}</li><li>{"\u7528\u9f3b\u7ffc\u3001\u5507\u5bbd\u3001\u7709\u5507\u6bd4\u4f8b\u51b3\u5b9a\u5986\u5bb9\u8fc1\u79fb\u5f3a\u5f31\u3002"}</li></ul></div>
            <div className="reference-match-block">
              <p className="reference-meta">CREATOR MATCH</p>
              <h3>{"推荐博主 Top 3"}</h3>
              <div className="reference-side-creator-list">
                {matchedBloggers.map((blogger) => {
                  const profileUrl = blogger.source_url || (blogger.source_id ? `https://www.douyin.com/search/${blogger.source_id}` : "#");
                  return (
                    <a href={profileUrl} target="_blank" rel="noreferrer" key={blogger.name}>
                      {blogger.avatar_url ? <img src={blogger.avatar_url} alt={blogger.name} /> : null}
                      <div><strong>{blogger.name}</strong><span>{blogger.source_id ? `抖音 ${blogger.source_id}` : "抖音达人"}</span></div>
                      <b>{blogger.match}%</b>
                    </a>
                  );
                })}
              </div>
              <div className="reference-match-row"><span>{"首选匹配"}</span><b>{bestMatch?.match || 92}%</b></div>
              <div className="reference-match-meter"><i style={{ width: `${bestMatch?.match || 92}%` }} /></div>
              <div className="reference-mini-tags">{(bestMatch?.reasons || ["脸型相似", "眼型相似", "风格一致"]).slice(0, 3).map((reason) => <span key={reason}>{reason.replace("，", "")}</span>)}</div>
              <button className="reference-share-pk-button" type="button" onClick={copyResultUrl}>{shareText}</button>
              <p className="reference-share-note">{shareNote}</p>
            </div>
          </aside>
        </section>
      </section>
    </main>
  );
}
