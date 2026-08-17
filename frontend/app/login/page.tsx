"use client";

import { CheckCircle2, LogIn, UserPlus } from "lucide-react";
import Link from "next/link";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { getCurrentUser, isSupabaseConfigured, signInWithEmail, signUpWithEmail } from "../../lib/supabase";

type AuthMode = "register" | "login";

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [currentEmail, setCurrentEmail] = useState("");

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("confirmed")) {
      setMessage("邮箱已确认，可以直接登录。");
    }
    getCurrentUser().then((user) => {
      if (user?.email) setCurrentEmail(user.email);
    }).catch(() => {
      setCurrentEmail("");
    });
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || password.length < 8) {
      setMessage("请填写正确邮箱，并输入至少 8 位密码。");
      return;
    }
    if (!isSupabaseConfigured()) {
      setMessage("Supabase 还没有配置。请先填写 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY。");
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "register") {
        const { error } = await signUpWithEmail(email.trim().toLowerCase(), password);
        if (error) throw error;
        setMessage(`确认邮件已发送到 ${email}，请打开邮箱完成验证。`);
      } else {
        const { data, error } = await signInWithEmail(email.trim().toLowerCase(), password);
        if (error) throw error;
        setCurrentEmail(data.user.email || email);
        setMessage("登录成功。");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "提交失败，请稍后重试。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page-shell compact-page">
      <section className="auth-panel">
        <p className="eyebrow">ACCOUNT / Supabase Auth</p>
        <h1>{mode === "register" ? "邮箱注册" : "邮箱登录"}</h1>
        <p className="muted">注册后会发送邮箱确认邮件。确认完成后可保存分析报告、管理 Plus 资格和查看历史记录。</p>

        <div className="auth-mode-tabs">
          <button className={mode === "register" ? "active" : ""} type="button" onClick={() => setMode("register")}>注册账号</button>
          <button className={mode === "login" ? "active" : ""} type="button" onClick={() => setMode("login")}>登录</button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>邮箱</span>
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="name@example.com" />
          </label>
          <label>
            <span>密码</span>
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="至少 8 位" />
          </label>
          <button className="primary-action auth-action" type="submit" disabled={!email.trim() || password.length < 8 || isSubmitting}>
            {mode === "register" ? <UserPlus aria-hidden className="button-icon" /> : <LogIn aria-hidden className="button-icon" />}
            <span>{isSubmitting ? "处理中" : mode === "register" ? "发送确认邮件" : "登录"}</span>
          </button>
        </form>

        {message ? (
          <div className="auth-result">
            <CheckCircle2 aria-hidden />
            <div>
              <strong>{message}</strong>
              {currentEmail ? <p>{currentEmail} 已登录。</p> : <p><Link href="/plus">返回 Plus 激活会员</Link></p>}
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
