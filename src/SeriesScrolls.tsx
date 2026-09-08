import { requiredImage, siteMedia } from './media-library';
import { FLOWER_GODS_PATH, isPlainNavigation } from './flower-gods-catalog';

export default function SeriesScrolls({ onOpenFlowerGods }: { onOpenFlowerGods?: () => void }) {
  return <section className="section series-section series-diptych" id="series" aria-labelledby="series-heading" data-home-scroll>
    <div className="volume-heading">
      <div><p>THE COLLECTIONS</p><h2 id="series-heading">选择一个世界</h2></div>
      <p>循花入境，向光而生。<span>每一卷，都是一个独立的世界。</span></p>
    </div>
    <div className="volume-gallery">
      <a className="volume-panel volume-floral" href={FLOWER_GODS_PATH} aria-label="进入花神卷，选择花神"
        onClick={event => {
          if (!onOpenFlowerGods || !isPlainNavigation(event)) return;
          event.preventDefault(); onOpenFlowerGods();
        }}>
        <div className="volume-art"><img src={requiredImage('homeSeries')} alt={siteMedia.homeSeries.own ? siteMedia.homeSeries.alt : siteMedia.jingxinConcept.alt} width="1024" height="1536" loading="lazy" decoding="async" draggable={false} /></div>
        <div className="volume-caption"><div><p>01 / THE FLORAL DEITIES</p><h3>花神卷</h3></div><span className="volume-action">选择花神 <b aria-hidden="true">↗</b></span></div>
      </a>
      <article className="volume-panel volume-angel" aria-label="天使卷，尚未开启">
        <div className="volume-art">{siteMedia.angelScroll.src ? <img src={siteMedia.angelScroll.src} alt={siteMedia.angelScroll.alt} width="1024" height="1536" loading="lazy" decoding="async" draggable={false} /> : <div className="volume-art-pending" aria-hidden="true"><span>TO BE REVEALED</span></div>}</div>
        <div className="volume-caption"><div><p>02 / THE ANGELIC CHAPTER</p><h3>天使卷</h3></div><span className="volume-awaiting">尚未开启</span></div>
      </article>
    </div>
  </section>;
}
