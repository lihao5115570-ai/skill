"use client";

import { useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || "http://localhost:8000/api";

type AdminProfile = {
  email: string;
  role: string;
  permissions: string[];
};

type BloggerApplication = {
  id: string;
  platform: string;
  creator_name: string;
  contact_email: string;
  homepage_url: string;
  tutorial_url?: string | null;
  reference_type: string;
  authorization_confirmed: boolean;
  status: string;
  created_at?: string | null;
};

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json() as Promise<T>;
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) throw new Error(await response.text());
  return response.json() as Promise<T>;
}

export default function BloggersPage() {
  const [email, setEmail] = useState("");
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [applications, setApplications] = useState<BloggerApplication[]>([]);
  const [message, setMessage] = useState("请输入管理员邮箱，验证 blogger_review 权限。");

  const canApprove = admin?.permissions.includes("blogger_review.approve");
  const canReject = admin?.permissions.includes("blogger_review.reject");

  async function loadApplications(nextAdmin = admin) {
    if (!nextAdmin?.permissions.includes("blogger_review.view")) {
      setMessage("当前账号没有查看博主申请权限。");
      return;
    }
    const rows = await getJson<BloggerApplication[]>("/admin/blogger-applications?status=pending");
    setApplications(rows);
    setMessage(rows.length ? `已加载 ${rows.length} 条待审核申请。` : "暂无待审核申请。");
  }

  async function verifyAdmin() {
    try {
      const profile = await postJson<AdminProfile>("/admin/me", { email });
      setAdmin(profile);
      setMessage(`${profile.email} 已验证为 ${profile.role}。`);
      await loadApplications(profile);
    } catch {
      setAdmin(null);
      setApplications([]);
      setMessage("这个邮箱不是有效管理员，或后端还没有创建 admin_profiles 记录。");
    }
  }

  async function reviewApplication(id: string, status: "approved" | "rejected") {
    if (!admin) return;
    const note = status === "approved" ? "资料完整，允许进入博主库。" : "资料不足或授权未确认。";
    try {
      await postJson(`/admin/blogger-applications/${id}/review`, { admin_email: admin.email, status, note });
      setApplications((items) => items.filter((item) => item.id !== id));
      setMessage(status === "approved" ? "已通过申请。" : "已驳回申请。");
    } catch {
      setMessage("审核失败，请确认管理员权限和后端服务。");
    }
  }

  return (
    <main className="admin-page">
      <section className="admin-header">
        <p>Bloggers / Review</p>
        <h1>博主入驻审核</h1>
      </section>

      <section className="admin-panel-card admin-review-gate">
        <div>
          <h2>管理员权限验证</h2>
          <p>正式上线后这里会读取 Supabase Session。当前先用管理员邮箱匹配 `admin_profiles` 和角色权限。</p>
        </div>
        <div className="admin-review-login">
          <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@example.com" />
          <button type="button" onClick={verifyAdmin}>验证并加载申请</button>
        </div>
      </section>

      <section className="admin-status-card">
        <strong>{admin ? `${admin.role} / ${admin.email}` : "未登录管理员"}</strong>
        <span>{message}</span>
      </section>

      <section className="admin-review-list">
        {applications.map((item) => (
          <article className="admin-review-card" key={item.id}>
            <div>
              <p>{item.status} / {item.created_at || "刚刚提交"}</p>
              <h2>{item.creator_name}</h2>
              <dl>
                <div><dt>平台</dt><dd>{item.platform}</dd></div>
                <div><dt>页面</dt><dd>{item.reference_type}</dd></div>
                <div><dt>邮箱</dt><dd>{item.contact_email}</dd></div>
                <div><dt>主页</dt><dd><a href={item.homepage_url} target="_blank" rel="noreferrer">{item.homepage_url}</a></dd></div>
                <div><dt>教程</dt><dd>{item.tutorial_url ? <a href={item.tutorial_url} target="_blank" rel="noreferrer">{item.tutorial_url}</a> : "未填写"}</dd></div>
                <div><dt>授权</dt><dd>{item.authorization_confirmed ? "已确认" : "未确认"}</dd></div>
              </dl>
            </div>
            <div className="admin-review-actions">
              <button type="button" disabled={!canApprove} onClick={() => reviewApplication(item.id, "approved")}>通过</button>
              <button type="button" disabled={!canReject} onClick={() => reviewApplication(item.id, "rejected")}>驳回</button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
