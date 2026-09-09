import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from 'react';
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion } from 'motion/react';
import { requiredImage } from './media-library';
import FlowerScene from './FlowerScene';
import { TransparentGoddess } from './TransparentGoddess';
import { flowerGodPath, isPlainNavigation, type FlowerGod } from './flower-gods-catalog';
import { CAROUSEL_SEAT_SPACING, CAROUSEL_SETTLE_MS, carouselWindow, dragDisplacement, firstPublishedSeat, flowerSeats, shortestSeatMove, swipeDirection, wrapSeat } from './flower-carousel';
import SiteSearch from './SiteSearch';
import './flower-gods-collection.css';
import './soft-ui.css';
import './mobile-flower.css';

type Props = { onNavigate?: (href: string) => void };
const followLink = (onNavigate: Props['onNavigate'], href: string) => (event: MouseEvent<HTMLAnchorElement>) => {
  if (!onNavigate || !isPlainNavigation(event)) return;
  event.preventDefault(); onNavigate(href);
};
export function DeityEntry({ deity, onNavigate, visible = true, active = true, canEnter, onSelect }: Props & {
  deity: FlowerGod; visible?: boolean; active?: boolean; canEnter?: () => boolean; onSelect?: () => void;
}) {
  return <a className="flower-seat-art deity-image-entry" href={flowerGodPath(deity)} tabIndex={visible ? 0 : -1}
    draggable={false} onDragStart={event => event.preventDefault()}
    onClick={event => {
      if (!active) { event.preventDefault(); onSelect?.(); return; }
      if (canEnter && !canEnter()) { event.preventDefault(); return; }
      followLink(onNavigate, flowerGodPath(deity))(event);
    }} aria-label={active ? `点击人物，进入${deity.flower}${deity.name}角色展示` : `选择${deity.flower}${deity.name}`}>
    <TransparentGoddess src={deity.image} alt={`${deity.flower}${deity.name}角色设定`} />
  </a>;
}
export default function FlowerGodsCollection({ onNavigate }: Props) {
  const publishedCount = flowerSeats.filter(seat => seat.deity).length;
  const navigationEnabled = flowerSeats.length > 1;
  const [cursor, setCursor] = useState(firstPublishedSeat);
  const [moving, setMoving] = useState(false);
  const [moveDirection, setMoveDirection] = useState<-1 | 0 | 1>(0);
  const [dragging, setDragging] = useState(false);
  const reducedMotion = useReducedMotion();
  const dragX = useMotionValue(0);
  const dragAnimation = useRef<{ stop: () => void } | null>(null);
  const busy = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointer = useRef<{ id: number; x: number; y: number; origin: number; axis: 'x' | 'y' | null; width: number; target: HTMLDivElement } | null>(null);
  const suppressClick = useRef(false);
  const selected = wrapSeat(cursor, flowerSeats.length);
  const active = flowerSeats[selected];
  const visibleWindow = carouselWindow(cursor, flowerSeats);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
    dragAnimation.current?.stop();
  }, []);
  const settleDrag = (changed = false) => {
    dragAnimation.current?.stop();
    if (reducedMotion) dragX.set(0);
    else dragAnimation.current = animate(dragX, 0, { duration: changed ? CAROUSEL_SETTLE_MS / 1000 : .28, ease: [.22, 1, .36, 1] });
    setDragging(false);
  };
  const move = (amount: number) => {
    if (!navigationEnabled || !amount || busy.current || pointer.current) return;
    busy.current = true; setMoving(true); setMoveDirection(amount > 0 ? 1 : -1); setCursor(value => value + amount);
    settleDrag(true);
    timer.current = setTimeout(() => { busy.current = false; setMoving(false); }, reducedMotion ? 0 : CAROUSEL_SETTLE_MS + 20);
  };
  const cancelPointer = () => {
    const start = pointer.current;
    if (!start) return;
    pointer.current = null; suppressClick.current = start.axis === 'x';
    if (start.target.hasPointerCapture(start.id)) start.target.releasePointerCapture(start.id);
    settleDrag();
  };
  const finishPointer = (event: PointerEvent<HTMLDivElement>) => {
    const start = pointer.current;
    if (!start || event.pointerId !== start.id) return;
    pointer.current = null; suppressClick.current = start.axis === 'x';
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    const direction = start.axis === 'x' ? swipeDirection(event.clientX - start.x, event.clientY - start.y) : 0;
    move(direction);
    if (!direction) settleDrag();
  };
  if (window.matchMedia('(max-width: 700px)').matches) return <main className="mf-page mf-collection">
    <header className="mf-header"><a href="/" onClick={followLink(onNavigate, '/')}>← 首页</a><span>LUMEN AURALIS</span><a href="/verify">核验</a></header>
    <section><p className="mf-kicker">THE FLORAL DEITIES</p><h1>花神卷</h1><p>循花而行，遇见每一位花神。</p>
      {flowerSeats.filter(seat=>seat.deity).map(seat=>{const deity=seat.deity!;return <article key={seat.id} className="mf-collection-card"><a href={flowerGodPath(deity)} onClick={followLink(onNavigate,flowerGodPath(deity))}><img src={deity.image} alt={deity.name+'完整造型'} /><div><h2>{deity.name}</h2><p>{deity.flower}</p><span>查看角色 ↗</span></div></a></article>;})}
      <aside className="mf-pending"><span>下一位花神</span><p>花期未至 · 敬请期待</p></aside>
    </section>
  </main>;
  return <div
    className="flower-collection"
    data-composition="single-hall"
    data-seat-state={active.deity ? 'published' : 'pending'}
  >
    <header className="flower-collection-header">
      <a className="flower-collection-brand" href="/" onClick={followLink(onNavigate, '/')} aria-label="返回品牌首页">
        <img src={requiredImage('brandLogo')} alt="" width="34" height="40" />
        <span>LUMEN AURALIS<small>绘屿造物</small></span>
      </a>
      <div className="flower-collection-actions"><SiteSearch tone="dark" /><a className="flower-collection-back" href="/#series" onClick={followLink(onNavigate, '/#series')}>← 返回系列</a></div>
    </header>
    <main className="flower-collection-main">
      <div className="flower-collection-heading">
        <div><h1>花神卷</h1><p className="flower-collection-kicker">THE FLORAL DEITIES</p></div>
      </div>
      <section className="flower-carousel" data-moving={moving} data-direction={moveDirection} aria-roledescription="轮播" aria-label="花神选择" tabIndex={0}
        onKeyDown={event => {
          if (event.key === 'Escape') { cancelPointer(); return; }
          if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
          event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1);
        }}>
        <FlowerScene foreground={active.deity?.foreground} pending={!active.deity}>
        <div className="flower-carousel-window" data-dragging={dragging}
          onPointerDown={event => {
            if (!navigationEnabled || event.button !== 0 || !event.isPrimary || busy.current) return;
            suppressClick.current = false;
            dragAnimation.current?.stop();
            pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY, axis: null,
              origin: dragX.get(), width: event.currentTarget.getBoundingClientRect().width, target: event.currentTarget };
          }}
          onPointerMove={event => {
            const start = pointer.current;
            if (!start || start.id !== event.pointerId) return;
            const dx = event.clientX - start.x, dy = event.clientY - start.y;
            if (!start.axis && Math.max(Math.abs(dx), Math.abs(dy)) > 10) {
              if (Math.abs(dx) > Math.abs(dy) * 1.25) start.axis = 'x';
              else if (Math.abs(dy) > Math.abs(dx)) start.axis = 'y';
            }
            if (start.axis === 'x') {
              event.preventDefault();
              setDragging(true);
              if (!event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.setPointerCapture(event.pointerId);
              const visualDx = dx * (CAROUSEL_SEAT_SPACING / 100);
              dragX.set(dragDisplacement(visualDx + start.origin, start.width * (CAROUSEL_SEAT_SPACING / 100)));
            }
          }}
          onPointerUp={finishPointer}
          onPointerCancel={cancelPointer}
          onLostPointerCapture={cancelPointer}
          onPointerLeave={() => { if (pointer.current?.axis !== 'x') cancelPointer(); }}
          onClickCapture={event => {
            if (suppressClick.current && event.detail !== 0) { event.preventDefault(); event.stopPropagation(); }
            suppressClick.current = false;
          }}>
          <motion.div className="flower-carousel-track" style={{ x: dragX }}>
          {visibleWindow.map(({ key, offset, seat }) => {
            const activeSeat = offset === 0;
            const visible = Math.abs(offset) <= 1;
            return <motion.div key={key} className="flower-seat" data-active={activeSeat} data-visible={visible} data-pending={!seat.deity}
              aria-hidden={!visible} inert={!visible}
              initial={false} animate={{
                x: `${offset * CAROUSEL_SEAT_SPACING}%`,
                scale: activeSeat ? 1 : visible ? .68 : .58,
                opacity: activeSeat ? 1 : visible ? .28 : 0,
              }}
              transition={{ duration: reducedMotion ? 0 : CAROUSEL_SETTLE_MS / 1000, ease: [.22, 1, .36, 1] }}>
              {seat.deity ? <div className="flower-seat-pick">
                <DeityEntry deity={seat.deity} onNavigate={onNavigate} visible={visible} active={activeSeat}
                  onSelect={() => move(offset)} canEnter={() => !busy.current && !pointer.current} />
                <span className="flower-seat-label">{seat.deity.name}<small>{seat.deity.flower}</small></span>
              </div> : <button type="button" className="flower-seat-pick" tabIndex={visible ? 0 : -1}
                aria-pressed={activeSeat} aria-label="查看待启花神席位，角色尚未公开"
                onClick={() => move(offset)}>
                <div className="flower-seat-art flower-seat-art-pending" aria-hidden="true" />
                <span className="flower-seat-label">花期未至</span>
              </button>}
            </motion.div>;
          })}
          </motion.div>
        </div>
        </FlowerScene>
        <AnimatePresence initial={false} mode="sync">
          <motion.div className="flower-character-copy" key={active.id}
            initial={{ opacity: 0, x: moveDirection * 18, y: 8 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: moveDirection * -12, y: -5 }}
            transition={{ duration: reducedMotion ? 0 : .5, delay: reducedMotion ? 0 : .12, ease: [.22, 1, .36, 1] }}>
            {!active.deity && <span className="flower-pending-index">02 · NEXT DEITY</span>}
            <h2>{active.deity?.name || '下一位花神'}</h2>
            <p>{active.deity?.flower || '花期未至'}<small>{active.deity?.englishName || 'TO BE REVEALED'}</small></p>
            {active.deity && <a className="flower-character-enter" href={flowerGodPath(active.deity)}
              onClick={event => {
                if (busy.current || pointer.current) { event.preventDefault(); return; }
                followLink(onNavigate, flowerGodPath(active.deity!))(event);
              }}>进入角色 <span aria-hidden="true">↗</span></a>}
          </motion.div>
        </AnimatePresence>
        {navigationEnabled && <button type="button" className="flower-carousel-arrow flower-carousel-prev" aria-label="上一位花神" aria-disabled={moving} onClick={() => move(-1)}><span aria-hidden="true">←</span><small>上一位</small></button>}
        {navigationEnabled && <button type="button" className="flower-carousel-arrow flower-carousel-next" aria-label="下一位花神" aria-disabled={moving} onClick={() => move(1)}><small>下一位</small><span aria-hidden="true">→</span></button>}
      </section>
      <div className="flower-selection-announcement" aria-live="polite" aria-atomic="true">
        {active.deity ? `${active.deity.name}，${active.deity.flower}，点击人物进入` : '花期未至，尚未开启'}
      </div>
      {publishedCount > 1 && <div className="flower-roster" role="group" aria-label="花神名录">
        <span className="flower-roster-title">花神名录</span>
        {flowerSeats.map((seat, index) => <button type="button" key={seat.id} aria-pressed={index === selected}
          onClick={() => move(shortestSeatMove(selected, index, flowerSeats.length))}
          aria-label={seat.deity ? `选择${seat.label}` : '花期未至'}>
          <span aria-hidden="true">{seat.deity?.number || '·'}</span>{seat.deity ? seat.label : '花期未至'}
        </button>)}
      </div>}
    </main>
  </div>;
}
