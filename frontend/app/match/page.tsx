"use client";

import { Award, BarChart3, Brush, ScanFace, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { getBloggerRecommendations, type BloggerRecommendation } from "../../lib/api";

const fallbackBloggers: BloggerRecommendation[] = [
  {
    name: "\u5927\u5a1c\u5a1c Nana",
    match: 92,
    avatar_url: "https://pic.kaogujia.com/author/62739255052.jpeg?auth_key=1786678183-0-0-4fb09623b63459822dee2a23a3de0193",
    source_id: "Sunny99nana",
    source_url: "https://www.douyin.com/search/Sunny99nana",
    reasons: ["\u8138\u578b\u76f8\u4f3c", "\u773c\u578b\u76f8\u4f3c", "\u98ce\u683c\u4e00\u81f4"],
    learn: ["\u7709\u6bdb", "\u773c\u5986", "\u816e\u7ea2"],
  },
];

export default function MatchPage() {
  const [bloggers, setBloggers] = useState<BloggerRecommendation[]>(fallbackBloggers);

  useEffect(() => {
    getBloggerRecommendations()
      .then((items) => setBloggers(items.length ? items : fallbackBloggers))
      .catch(() => setBloggers(fallbackBloggers));
  }, []);

  return (
    <main className="page-shell content-page match-page">
      <section className="page-header match-header">
        <p className="eyebrow">Step 3 / Creator Match</p>
        <h1>{"\u5973\u8fbe\u4eba\u5339\u914d"}</h1>
        <p className="muted">
          {"\u8d44\u6599\u5e93\u4e2d\u7684\u6bcf\u4e2a\u8fbe\u4eba\u90fd\u4f7f\u7528\u5bfc\u5165\u65f6\u7684\u771f\u5b9e\u62d6\u97f3\u5934\u50cf\uff0c\u540e\u7eed\u518d\u7ed3\u5408\u8138\u578b\u3001\u98ce\u683c\u548c\u5185\u5bb9\u6807\u7b7e\u7cbe\u7ec6\u6392\u5e8f\u3002"}
        </p>
      </section>

      <section className="match-summary">
        <Award aria-hidden className="match-summary-icon" />
        <div>
          <span>{"\u8d44\u6599\u5e93\u5934\u50cf\u5df2\u540c\u6b65"}</span>
          <strong>{bloggers.length ? `Top ${bloggers.length}` : "Top 5"}</strong>
        </div>
      </section>

      <section className="blogger-list" aria-label="top matched creators">
        {bloggers.map((blogger, index) => {
          const profileUrl = blogger.source_url || (blogger.source_id ? `https://www.douyin.com/search/${blogger.source_id}` : undefined);
          return (
            <article className="blogger-match-card" key={`${blogger.name}-${index}`}>
              <div className="blogger-rank">Top {index + 1}</div>
              <a className="blogger-avatar" href={profileUrl || "#"} target="_blank" rel="noreferrer" aria-label={blogger.name}>
                {blogger.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={blogger.avatar_url} alt={blogger.name} />
                ) : (
                  <UserRound aria-hidden />
                )}
              </a>
              <div className="blogger-main">
                <div className="blogger-title-row">
                  <div>
                    <h2>
                      {profileUrl ? (
                        <a href={profileUrl} target="_blank" rel="noreferrer">{blogger.name}</a>
                      ) : (
                        blogger.name
                      )}
                    </h2>
                    {blogger.source_id ? <p>{"\u62d6\u97f3\u53f7"} {blogger.source_id}</p> : null}
                  </div>
                  <span>{blogger.match}%</span>
                </div>
                <div className="match-meter" aria-label={`${blogger.match}%`}>
                  <i style={{ width: `${blogger.match}%` }} />
                </div>

                <dl className="blogger-metrics">
                  <div><dt>{"\u7c89\u4e1d"}</dt><dd>{blogger.raw_data?.fans || "\u672a\u77e5"}</dd></div>
                  <div><dt>{"\u9500\u552e\u989d"}</dt><dd>{blogger.raw_data?.gmv || "\u672a\u77e5"}</dd></div>
                  <div><dt>{"\u4ef6\u5355\u4ef7"}</dt><dd>{blogger.raw_data?.aup || "\u672a\u77e5"}</dd></div>
                  <div><dt>{"\u89c2\u770b"}</dt><dd>{blogger.raw_data?.avg_total_users || "\u672a\u77e5"}</dd></div>
                  <div><dt>{"\u64ad\u653e"}</dt><dd>{blogger.raw_data?.avg_play_count || "\u672a\u77e5"}</dd></div>
                  <div><dt>RPM</dt><dd>{blogger.raw_data?.rpm || "\u672a\u77e5"}</dd></div>
                </dl>

                <div className="match-detail-grid">
                  <div>
                    <h3><ScanFace aria-hidden />{"\u63a8\u8350\u4f9d\u636e"}</h3>
                    <ul>{blogger.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
                  </div>
                  <div>
                    <h3><Brush aria-hidden />{"\u5b66\u4e60\u65b9\u5411"}</h3>
                    <ul className="learn-tags">{blogger.learn.map((item) => <li key={item}>{item}</li>)}</ul>
                  </div>
                </div>
              </div>
              <BarChart3 aria-hidden className="blogger-side-icon" />
            </article>
          );
        })}
      </section>
    </main>
  );
}
