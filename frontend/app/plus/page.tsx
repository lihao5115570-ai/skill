"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useState } from "react";
import { isSupabaseConfigured, signInWithEmail, signUpWithEmail } from "../../lib/supabase";

type AuthMode = "register" | "login";

export default function PlusPage() {
  const [mode, setMode] = useState<AuthMode>("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("注册后会发送真实邮箱确认邮件。");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || password.length < 8) {
      setStatus("请填写正确邮箱，并输入至少 8 位密码。");
      return;
    }
    if (!isSupabaseConfigured()) {
      setStatus("Supabase 还没有配置。请先填写 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY。");
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "register") {
        const { error } = await signUpWithEmail(email.trim().toLowerCase(), password);
        if (error) throw error;
        setStatus(`确认邮件已发送到 ${email}，请打开邮箱完成验证。`);
      } else {
        const { data, error } = await signInWithEmail(email.trim().toLowerCase(), password);
        if (error) throw error;
        setStatus(data.user.email_confirmed_at ? "登录成功，正在进入 Plus 账号。" : "登录成功，但邮箱还未确认。");
        window.setTimeout(() => {
          window.location.href = "/profile";
        }, 600);
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "提交失败，请稍后重试。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="reference-shell">
      <header className="reference-header upload-reference-header">
        <Link className="reference-brand" href="/"><strong>MAKE UP</strong><span>PLUS EARLY ACCESS</span></Link>
        <nav><Link href="/">免费匹配</Link><Link href="/bloggers">博主入驻</Link><Link href="/privacy">隐私</Link></nav>
      </header>

      <section className="reference-page reference-plus-page">
        <div className="reference-plus-top">
          <div>
            <p className="reference-meta">PLUS / 邀请制内测</p>
            <h1>准备购买后，先添加微信</h1>
            <p>¥9.9 包含 1 份正式报告和 2 次内测重试。付款前会在微信确认本期名额、交付时间和退款方式。</p>
          </div>
          <aside><span>限量付费内测</span><strong>¥9.9</strong><small>/ 早期内测</small></aside>
        </div>

        <div className="reference-plus-process">
          <section className="reference-plus-steps">
            <article><span>01</span><div><h2>添加运营者微信</h2><p>添加时备注“Plus”。网页不会展示付款码，也不会自动判断你是否付款。</p></div></article>
            <article><span>02</span><div><h2>确认后付款并领取邀请码</h2><p>支付 ¥9.9 后获得 1 份正式报告和 2 次内测重试。运营者确认付款后发送邀请码。</p></div></article>
            <article><span>03</span><div><h2>确认邮箱后激活 Plus</h2><p>新用户先注册并确认邮箱，再登录兑换邀请码。邮箱确认由 Supabase Auth 处理。</p></div></article>
          </section>
          <aside className="reference-qr-card"><div>▦</div><p>扫码添加微信好友。</p><strong>准备购买，添加微信</strong></aside>
        </div>

        <div className="reference-account-section">
          <div>
            <p className="reference-meta">ACCOUNT / 账号激活</p>
            <h2>邮箱密码注册与登录</h2>
            <p>已有账号可直接登录并兑换邀请码；没有账号时先注册并完成邮箱确认。正式邮件由 Supabase Auth + 自定义 SMTP 发出。</p>
            <ul>
              <li>早期用户资格：后续 Plus 功能优先体验</li>
              <li>共 3 次报告额度：1 份正式报告 + 2 次内测重试</li>
              <li>免费功能不变：不登录也能继续匹配</li>
            </ul>
          </div>

          <form className="reference-plus-form" onSubmit={handleSubmit}>
            <div className="reference-auth-tabs">
              <button className={mode === "register" ? "active" : ""} type="button" onClick={() => setMode("register")}>注册账号</button>
              <button className={mode === "login" ? "active" : ""} type="button" onClick={() => setMode("login")}>登录</button>
            </div>
            <label>邮箱<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="name@example.com" /></label>
            <label>密码<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="至少 8 位" /></label>
            <button type="submit" disabled={isSubmitting}>{isSubmitting ? "处理中..." : mode === "register" ? "发送确认邮件" : "登录"}</button>
            <p className="reference-form-status">{status}</p>
          </form>
        </div>
      </section>
    </main>
  );
}
