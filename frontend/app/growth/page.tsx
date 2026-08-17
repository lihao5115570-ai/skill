"use client";

import { CalendarDays, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { getGrowthRecords, type GrowthRecord } from "../../lib/api";

const fallbackRecords: GrowthRecord[] = [
  {
    date: "2026-08-11",
    title: "第一次AI脸型分析",
    summary: "完成正脸、45度、全身照片分析，确认当前风格方向为清冷感。",
    tags: ["鹅蛋脸", "内双", "清冷感"],
  },
];

export default function GrowthPage() {
  const [records, setRecords] = useState<GrowthRecord[]>(fallbackRecords);

  useEffect(() => {
    getGrowthRecords()
      .then((items) => setRecords(items.length ? items : fallbackRecords))
      .catch(() => setRecords(fallbackRecords));
  }, []);

  return (
    <main className="page-shell content-page growth-page">
      <section className="page-header">
        <p className="eyebrow">V3 · Growth Records</p>
        <h1>{"成长记录"}</h1>
        <p className="muted">{"记录每一次照片分析、妆容学习和风格调整，让变美路径可以持续复盘。"}</p>
      </section>

      <section className="timeline-list">
        {records.map((record) => (
          <article className="timeline-card" key={`${record.date}-${record.title}`}>
            <CalendarDays aria-hidden className="timeline-icon" />
            <div>
              <span>{record.date}</span>
              <h2>{record.title}</h2>
              <p>{record.summary}</p>
              <div className="mini-tags">
                {record.tags.map((tag) => (
                  <i key={tag}>{tag}</i>
                ))}
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="panel next-step-panel">
        <Sparkles aria-hidden className="module-icon" />
        <h2>{"下一步"}</h2>
        <p className="muted">{"结合会员体系和商品推荐，为用户生成长期美丽成长路线。"}</p>
      </section>
    </main>
  );
}
