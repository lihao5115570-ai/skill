const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function createCode() {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(array[0] % 1000000).padStart(6, "0");
}

async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hashCode(email, code, env) {
  const salt = env.RESEND_API_KEY || env.AI_API_KEY || "bianmei";
  return sha256Hex(`${email}:${code}:${salt}`);
}

async function writeCodeToD1(env, email, codeHash, now) {
  const date = todayKey();

  const latest = await env.DB.prepare("SELECT created_at FROM email_codes WHERE email = ? ORDER BY created_at DESC LIMIT 1")
    .bind(email)
    .first();

  if (latest?.created_at && now - Number(latest.created_at) < 60) {
    return { ok: false, status: 429, detail: "验证码发送太频繁，请 60 秒后再试" };
  }

  await env.DB.prepare("INSERT INTO email_limits (email, date, send_count) VALUES (?, ?, 0) ON CONFLICT(email, date) DO NOTHING")
    .bind(email, date)
    .run();

  const limit = await env.DB.prepare("SELECT send_count FROM email_limits WHERE email = ? AND date = ?")
    .bind(email, date)
    .first();

  if (Number(limit?.send_count || 0) >= 10) {
    return { ok: false, status: 429, detail: "这个邮箱今天验证码发送次数已达上限，请明天再试" };
  }

  await env.DB.prepare(
    "INSERT INTO email_codes (id, email, code_hash, expires_at, verified, attempts, created_at) VALUES (?, ?, ?, ?, 0, 0, ?)"
  )
    .bind(crypto.randomUUID(), email, codeHash, now + 600, now)
    .run();

  return { ok: true, date };
}

async function sendByResend(env, email, code) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [email],
      subject: "MAKE UP 变美测试验证码",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.7;color:#171717">
          <h2>MAKE UP 变美测试验证码</h2>
          <p>你的验证码是：</p>
          <p style="font-size:28px;font-weight:700;letter-spacing:4px">${code}</p>
          <p>验证码 10 分钟内有效。若不是你本人操作，可以忽略这封邮件。</p>
        </div>
      `,
      text: `你的 MAKE UP 变美测试验证码是：${code}。验证码 10 分钟内有效。`,
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    return { ok: false, detail: "Resend 发送失败: " + text };
  }

  return { ok: true };
}

export async function onRequestPost(context) {
  try {
    const { request, env } = context;

    if (!env.RESEND_API_KEY) return jsonResponse({ ok: false, detail: "RESEND_API_KEY 未配置" }, 500);
    if (!env.EMAIL_FROM) return jsonResponse({ ok: false, detail: "EMAIL_FROM 未配置" }, 500);
    if (!env.DB) return jsonResponse({ ok: false, detail: "D1 DB 未绑定" }, 500);

    let input;
    try {
      input = await request.json();
    } catch {
      return jsonResponse({ ok: false, detail: "请求格式异常，请提交 JSON" }, 400);
    }

    const email = normalizeEmail(input.email);
    if (!isValidEmail(email)) {
      return jsonResponse({ ok: false, detail: "请填写正确的邮箱地址" }, 400);
    }

    const now = Math.floor(Date.now() / 1000);
    const code = createCode();
    const codeHash = await hashCode(email, code, env);

    let d1Result;
    try {
      d1Result = await writeCodeToD1(env, email, codeHash, now);
    } catch (err) {
      console.error("send-code error", err);
      return jsonResponse({ ok: false, detail: "D1 写入失败: " + (err?.message || String(err)) }, 500);
    }

    if (!d1Result.ok) {
      return jsonResponse({ ok: false, detail: d1Result.detail }, d1Result.status || 400);
    }

    const resendResult = await sendByResend(env, email, code);
    if (!resendResult.ok) {
      return jsonResponse({ ok: false, detail: resendResult.detail }, 502);
    }

    try {
      await env.DB.prepare("UPDATE email_limits SET send_count = send_count + 1 WHERE email = ? AND date = ?")
        .bind(email, d1Result.date)
        .run();
    } catch (err) {
      console.error("send-code error", err);
      return jsonResponse({ ok: false, detail: "D1 写入失败: " + (err?.message || String(err)) }, 500);
    }

    return jsonResponse({ ok: true, message: "验证码已发送" });
  } catch (err) {
    console.error("send-code error", err);
    return jsonResponse({ ok: false, detail: err?.message || String(err) }, 500);
  }
}

export function onRequest() {
  return jsonResponse({ ok: false, detail: "Method Not Allowed" }, 405);
}
