import Link from "next/link";

const sections = [
  ["使用免费匹配与邀请权益时", "女生流程前 3 次成功匹配只在当前浏览器计数，不上传照片、面部比例或匹配结果；分析失败和同一张已加载照片重新分析不计次数。"],
  ["默认匹配仍然完全在本地完成", "不主动开启任何 AI 功能时，普通用户选择的照片只在当前浏览器中处理，不会上传。"],
  ["暂时隐藏的男生 AI 面部报告", "未来如重新开放，只会在用户主动选择并确认后处理，不会默认上传照片或报告。"],
  ["主动使用 AI 联网推荐时", "请求只包含必要的结构比例、场景和方向，不会把原始照片作为推荐检索条件。"],
  ["进入 Plus 限量付费内测时", "Plus 仅展示付费入口和账号激活，不自动确认付款。购买、邀请码、报告生成和售后会分开处理。"],
  ["访问公开创作者库时", "公开创作者资料用于形象参考，不会用于身份识别、颜值评分或医学判断。"],
  ["撤回、下架与删除", "你可以要求删除账号和公开资料。为防止他人冒充申请，我们可能通过联系邮箱或主页归属重新核验身份。"],
];

export default function PrivacyPage() {
  return (
    <main className="reference-shell">
      <header className="reference-header upload-reference-header">
        <Link className="reference-brand" href="/"><strong>MAKE UP</strong><span>MAKEUP<br />REFERENCE</span></Link>
        <nav><Link href="/plus">Plus</Link><Link href="/bloggers">博主入驻</Link><Link href="/privacy">隐私</Link></nav>
      </header>
      <section className="reference-privacy-page">
        <div className="reference-privacy-head">
          <div><p className="reference-meta">PRIVACY / 最后更新：2026-08-13</p><h1>隐私说明</h1></div>
          <p>本地分析、邀请权益、AI 报告、Plus 账号、AI 推荐与博主申请相互独立。</p>
        </div>
        <div className="reference-privacy-list">
          {sections.map(([title, body]) => <article key={title}><h2>{title}</h2><p>{body}</p></article>)}
        </div>
      </section>
    </main>
  );
}
