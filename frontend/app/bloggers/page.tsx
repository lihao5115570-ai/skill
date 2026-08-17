"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useState } from "react";
import { submitBloggerApplication } from "../../lib/api";

export default function BloggersApplyPage() {
  const [creatorName, setCreatorName] = useState("");
  const [email, setEmail] = useState("");
  const [homepageUrl, setHomepageUrl] = useState("");
  const [tutorialUrl, setTutorialUrl] = useState("");
  const [platform, setPlatform] = useState("douyin");
  const [referenceType, setReferenceType] = useState("female_makeup");
  const [agreed, setAgreed] = useState(false);
  const [status, setStatus] = useState("提交后会进入管理员后台的博主审核列表。");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!creatorName || !email || !homepageUrl || !agreed) {
      setStatus("请填写博主名称、邮箱、主页链接，并确认授权。");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitBloggerApplication({
        reference_type: referenceType,
        platform,
        creator_name: creatorName,
        contact_email: email,
        homepage_url: homepageUrl,
        tutorial_url: tutorialUrl || undefined,
        selected_content_direction: referenceType === "female_makeup" ? ["makeup", "face_reference"] : ["style_reference"],
        authorization_confirmed: agreed,
      });
      setStatus(`申请已提交，编号 ${result.id}，当前状态：${result.status}。`);
      setCreatorName("");
      setEmail("");
      setHomepageUrl("");
      setTutorialUrl("");
      setAgreed(false);
    } catch {
      setStatus("提交失败，请确认后端服务已启动，或稍后重试。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="reference-shell">
      <header className="reference-header upload-reference-header">
        <Link className="reference-brand" href="/"><strong>MAKE UP</strong><span>MAKEUP<br />REFERENCE</span></Link>
        <nav><Link href="/plus">Plus</Link><Link href="/bloggers">博主入驻</Link><Link href="/privacy">隐私</Link></nav>
      </header>
      <section className="reference-page reference-blogger-apply">
        <div>
          <p className="reference-meta">CREATOR / 博主入驻</p>
          <h1>成为形象参考的一部分</h1>
          <p>如果你愿意让自己的公开妆容、发型或形象内容被更多相似面部结构的用户找到，可以提交资料申请加入。</p>
        </div>

        <form className="reference-application-form" onSubmit={handleSubmit}>
          <div className="reference-form-grid">
            <label><span>加入页面</span><select value={referenceType} onChange={(event) => setReferenceType(event.target.value)}><option value="female_makeup">女生妆容</option><option value="male_style">男生形象参考</option></select></label>
            <label><span>平台</span><select value={platform} onChange={(event) => setPlatform(event.target.value)}><option value="douyin">抖音</option><option value="xiaohongshu">小红书</option></select></label>
          </div>
          <label><span>博主名称</span><input value={creatorName} onChange={(event) => setCreatorName(event.target.value)} /></label>
          <label><span>联系邮箱</span><input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="仅用于审核联系" /></label>
          <label><span>主页链接</span><input value={homepageUrl} onChange={(event) => setHomepageUrl(event.target.value)} placeholder="https://www.douyin.com/user/..." /></label>
          <label><span>代表教程 选填</span><input value={tutorialUrl} onChange={(event) => setTutorialUrl(event.target.value)} placeholder="https://www.douyin.com/video/..." /></label>
          <label className="reference-check-row"><input checked={agreed} onChange={(event) => setAgreed(event.target.checked)} type="checkbox" /><span>我确认本人为该主页博主或已获得明确授权，并同意用于公开相似匹配。</span></label>
          <button className="reference-apply-button" type="submit" disabled={isSubmitting}>{isSubmitting ? "提交中..." : "提交入驻申请"}</button>
          <p className="reference-form-status">{status}</p>
        </form>
      </section>
    </main>
  );
}
