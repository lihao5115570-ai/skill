import Link from "next/link";

export default function HomePage() {
  return (
    <main className="reference-shell">
      <header className="reference-header">
        <Link className="reference-brand" href="/">
          <strong>MAKE UP</strong>
          <span>
            MAKEUP
            <br />
            REFERENCE
          </span>
        </Link>
        <nav>
          <Link href="/plus">Plus</Link>
          <Link href="/bloggers">博主入驻</Link>
          <Link href="/privacy">隐私</Link>
        </nav>
      </header>

      <section className="reference-home">
        <div className="reference-start-block">
          <p className="reference-meta">AI FOR YOUR LOOK / 2026</p>
          <Link className="reference-start-button" href="/upload">
            <span>Start</span>
            <b>→</b>
          </Link>
        </div>
        <div className="reference-copy">
          <h1>
            找到更适合你
            <br />
            参考的美妆博主
          </h1>
          <p>上传一张正面照片，从面部结构出发寻找更接近的博主。</p>
          <p>不是评价长相，而是让妆容参照更具体；照片与个人比例只在当前设备完成分析。</p>
        </div>
      </section>
      <div className="reference-bottom-line">
        <i />
        <i />
        <i />
        <i />
      </div>
    </main>
  );
}
