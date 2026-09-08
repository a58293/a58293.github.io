import { useEffect } from "react";
import { SplitColorText } from "./components/HoverColorText";
import { ParticlePortrait } from "./ParticlePortrait";
import "./flower-gods-total.css";

const conceptImage = "/images/bjd/lotus-goddess-concept.png";

const detailItems = [
  { key: "face", number: "01", title: "妆面", subtitle: "FACEUP", description: "眉眼、唇色与面部光泽", alt: "荷花女神镜昕妆面细节" },
  { key: "headdress", number: "02", title: "头饰", subtitle: "HEADDRESS", description: "荷花冠饰与薄纱层次", alt: "荷花女神镜昕头饰细节" },
  { key: "ornament", number: "03", title: "饰件", subtitle: "ORNAMENT", description: "颈饰、胸前莲花与垂坠珠链", alt: "荷花女神镜昕饰件细节" },
  { key: "dress", number: "04", title: "衣装", subtitle: "COSTUME", description: "衣褶、刺绣、薄纱与裙摆", alt: "荷花女神镜昕衣装细节" },
];

function TotalHeader() {
  return (
    <header className="total-header">
      <a className="total-brand" href="/" aria-label="返回品牌首页">
        <span className="total-brand-mark">LA</span>
        <span><strong><SplitColorText text="LUMEN AURALIS" /></strong><small>绘屿造物</small></span>
      </a>
      <div className="total-header-title">花神总图谱 · OFFICIAL ARCHIVE</div>
      <nav aria-label="花神总图谱导航">
        <a href="#atlas">花神图谱</a>
        <a href="#details">造型细节</a>
        <a className="total-verify-link" href="/verify">防伪验证</a>
      </nav>
    </header>
  );
}

function TotalHero() {
  return (
    <section className="total-hero">
      <div className="total-orbits" aria-hidden="true"><span /><span /><span /></div>
      <div className="total-hero-copy">
        <p className="total-kicker">THE FLORAL DEITIES · OFFICIAL COLLECTION</p>
        <h1><SplitColorText text="花神总图谱" /><small>每一位花神，都有可被收藏与核验的身份</small></h1>
        <p className="total-lead">在这里查看花神的完整造型、创作细节与官方身份。第一位花神从散落的水光中凝聚，显出荷花女神镜昕的形态。</p>
        <div className="total-hero-actions">
          <a className="total-primary-action" href="#details">查看造型细节 <span>↓</span></a>
          <a className="total-secondary-action" href="/verify">进入防伪验证 <span>↗</span></a>
        </div>
      </div>

      <div className="total-particle-stage">
        <ParticlePortrait src={conceptImage} alt="由粒子凝聚而成的荷花女神镜昕设定形象" />
      </div>

      <div className="total-hero-index" aria-hidden="true">
        <span>01</span>
        <p>LOTUS DEITY</p>
      </div>
      <div className="total-scroll-hint" aria-hidden="true">SCROLL · EXPLORE <span /></div>
    </section>
  );
}

function AtlasDirectory() {
  return (
    <section className="atlas-directory" id="atlas">
      <div className="total-section-title">
        <p>THE DEITIES</p>
        <h2><SplitColorText text="花神图谱" /></h2>
        <span>系列中的全部花神集中在同一图谱中，逐位公开、逐位核验。</span>
      </div>

      <div className="atlas-records">
        <article className="atlas-record atlas-record-active">
          <div className="atlas-record-image"><img src={conceptImage} alt="荷花女神镜昕图谱封面" /></div>
          <div className="atlas-record-overlay">
            <span className="atlas-number">01</span>
            <div><p>LOTUS DEITY · 荷花女神</p><h3><SplitColorText text="镜昕" /></h3></div>
            <dl><div><dt>代表花</dt><dd>荷花</dd></div><div><dt>主题色</dt><dd>天水碧</dd></div><div><dt>状态</dt><dd>已公开</dd></div></dl>
          </div>
        </article>

        <article className="atlas-record atlas-record-coming">
          <div className="atlas-coming-ring" aria-hidden="true"><span /><span /></div>
          <div className="atlas-coming-copy"><span>02</span><p>NEXT BLOOM</p><h3>下一位花神</h3><small>等待花期</small></div>
        </article>
      </div>
    </section>
  );
}

function DetailGallery() {
  return (
    <section className="total-details" id="details">
      <div className="total-section-title total-detail-title">
        <p>FORM & DETAIL</p>
        <h2><SplitColorText text="造型细节" /></h2>
        <span>妆面、头饰、饰件与衣装分别查看；后续可直接替换为实物近景照片。</span>
      </div>

      <div className="total-detail-grid">
        {detailItems.map((item) => (
          <figure className={"total-detail-card total-detail-" + item.key} key={item.key}>
            <img src={conceptImage} alt={item.alt} />
            <figcaption>
              <span>{item.number}</span>
              <div><p>{item.subtitle}</p><h3>{item.title}</h3><small>{item.description}</small></div>
              <b>查看细节 ↗</b>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function AuthenticationGateway() {
  return (
    <section className="authentication-gateway" id="authentication">
      <div className="authentication-watermark" aria-hidden="true">AUTHENTIC</div>
      <div className="authentication-copy">
        <p>OFFICIAL IDENTITY · PRIVATE VERIFICATION</p>
        <h2><SplitColorText text="从作品细节，进入官方身份核验" /></h2>
        <span>每一只正式发行的娃都拥有独立娃证编号。使用娃证编号与淘宝订单号进行双重核对，订单内容不会被公开。</span>
      </div>
      <div className="authentication-panel">
        <div className="authentication-formula"><span>娃证编号</span><i>+</i><span>淘宝订单号</span></div>
        <a href="/verify">进入防伪验证 <b>↗</b></a>
        <small>OFFICIAL DATABASE · PRIVATE LOOKUP</small>
      </div>
    </section>
  );
}

export default function FlowerGodsTotalPage() {
  useEffect(() => {
    document.body.classList.add("flower-total-active");
    return () => document.body.classList.remove("flower-total-active");
  }, []);

  return (
    <div className="flower-total-world">
      <TotalHeader />
      <main><TotalHero /><AtlasDirectory /><DetailGallery /><AuthenticationGateway /></main>
      <footer className="total-footer"><a href="/">LUMEN AURALIS · 绘屿造物</a><span>花神总图谱 · 镜昕 / 荷花女神</span><span>© 2026</span></footer>
    </div>
  );
}
