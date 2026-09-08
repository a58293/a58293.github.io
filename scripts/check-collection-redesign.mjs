import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {loadSource} from './test-source-loader.mjs';

let checks=0;
const check=(name,fn)=>{fn(); checks++; console.log('PASS '+name);};
const media=loadSource('src/media-library.ts');
// Unit tests do not depend on generated decoration availability.
const testingMedia={...media,requiredImage:id=>id==='flowerPavilion'||id==='angelScroll'?'/media/test-decoration.png':media.requiredImage(id)};
const model=loadSource('src/flower-carousel.ts');
const {flowerGods}=loadSource('src/flower-gods-catalog.ts');
check('One real deity plus two explicitly unpublished seats',()=>{
  assert.equal(model.flowerSeats.length,3);
  assert.equal(model.flowerSeats.filter(x=>x.deity).length,1);
  assert.equal(model.flowerSeats[model.firstPublishedSeat].deity.slug,'jingxin');
});
check('Future catalogs with 2, 3 and 7 deities automatically reserve or expand seats',()=>{
  for(const count of [2,3,7]){
    const sample=Array.from({length:count},(_,i)=>({...flowerGods[0],slug:'test-'+i}));
    const seats=model.createFlowerSeats(sample);
    assert.equal(seats.length,Math.max(3,count));
    assert.equal(seats.filter(x=>x.deity).length,count);
  }
});
check('Circular positions always expose three distinct seats with stable adjacent keys',()=>{
  for(let index=-120;index<=120;index++){
    const window=model.carouselWindow(index,model.flowerSeats);
    const visible=window.filter(x=>Math.abs(x.offset)<=1);
    assert.equal(new Set(visible.map(x=>x.seat.id)).size,3);
    const next=model.carouselWindow(index+1,model.flowerSeats);
    assert.equal(window.filter(x=>next.some(n=>n.key===x.key)).length,4);
  }
});
check('Swipe ignores taps and predominantly vertical scrolling',()=>{
  assert.equal(model.swipeDirection(-70,5),1);
  assert.equal(model.swipeDirection(70,-4),-1);
  assert.equal(model.swipeDirection(20,0),0);
  assert.equal(model.swipeDirection(50,80),0);
});
check('Drag follows short movement directly and resists before the track edge',()=>{
  assert.equal(model.dragDisplacement(-70,300),-70);
  assert.equal(model.dragDisplacement(70,300),70);
  assert.ok(model.dragDisplacement(500,300)<300);
  assert.ok(model.dragDisplacement(5000,300)<300);
  assert.ok(model.dragDisplacement(500,300)>model.dragDisplacement(300,300));
});
const Collection=loadSource('src/FlowerGodsCollection.tsx',{'./media-library':testingMedia}).default;
check('Single hall contains a real image entry and matching text entry, never fake pending links',()=>{
  const html=renderToStaticMarkup(createElement(Collection));
  assert.equal((html.match(/class="flower-seat-art deity-image-entry"/g)||[]).length,1);
  assert.match(html,/<a class="flower-seat-art deity-image-entry"[^>]*>[\s\S]*?<img[^>]*alt="荷花女神镜昕角色设定"/);
  assert.match(html,/data-composition="single-hall"/);
  assert.match(html,/class="flower-character-enter"/);
  assert.match(html,/href="\/series\/flower-gods\/jingxin"/);
  assert.doesNotMatch(html,/href="(?:#|[^"]*awaiting[^"]*)"/);
  assert.equal((html.match(/class="flower-seat"/g)||[]).length,5);
  assert.equal((html.match(/inert=""/g)||[]).length,4);
});
const Scrolls=loadSource('src/SeriesScrolls.tsx',{'./media-library':{...testingMedia,siteMedia:{...media.siteMedia,angelScroll:{alt:'羽翼装饰'}}}}).default;
check('Unrevealed seats use their own silhouette, not the released lotus portrait',()=>{
  const html=renderToStaticMarkup(createElement(Collection));
  const pending=[...html.matchAll(/class="flower-seat-silhouette"[^>]*><img[^>]*src="([^"]+)"/g)];
  assert.equal(pending.length,4);
  for(const [,src] of pending){
    assert.equal(src,media.requiredImage('flowerPendingSilhouette'));
    assert.notEqual(src,media.requiredImage('jingxinPortrait'));
  }
});
check('Both series have a heading; angel is an article with no clickable entrance',()=>{
  const html=renderToStaticMarkup(createElement(Scrolls));
  assert.match(html,/花神卷/);assert.match(html,/天使卷/);assert.match(html,/尚未开启/);
  assert.equal((html.match(/<a /g)||[]).length,1);
  assert.match(html,/href="\/series\/flower-gods"/);
  assert.match(html,/<article class="volume-panel volume-angel"/);
});

const state=[],effects=[],timeouts=new Map();
let cursor=0,serial=0,reduced=false;
const realSetTimeout=globalThis.setTimeout,realClearTimeout=globalThis.clearTimeout;
const hooks={
  useState(initial){const i=cursor++;if(!(i in state))state[i]=typeof initial==='function'?initial():initial;return[state[i],value=>{state[i]=typeof value==='function'?value(state[i]):value;}];},
  useRef(initial){const i=cursor++;if(!(i in state))state[i]={current:initial};return state[i];},
  useEffect(effect){const i=cursor++;if(!(i in state)){state[i]=true;effects.push(effect);}},
};
const animations=[];
const motionMock={
  motion:{div:'div'},useReducedMotion:()=>reduced,
  useMotionValue(initial){return hooks.useRef({value:initial,set(value){this.value=value;},get(){return this.value;}}).current;},
  animate(value,to,options){const control={value,to,options,stopped:false,stop(){this.stopped=true;}};animations.push(control);return control;},
};
const Harness=loadSource('src/FlowerGodsCollection.tsx',{
  react:hooks,'motion/react':motionMock,'./media-library':testingMedia,
}).default;
function all(node,predicate){
  if(!node||typeof node!=='object')return[];
  if(Array.isArray(node))return node.flatMap(x=>all(x,predicate));
  return[...(predicate(node)?[node]:[]),...all(node.props?.children,predicate)];
}
let tree;const cleanups=[],navigations=[];
function render(){cursor=0;tree=Harness({onNavigate:href=>navigations.push(href)});while(effects.length){const cleanup=effects.shift()();if(cleanup)cleanups.push(cleanup);}return tree;}
const find=label=>all(tree,node=>node.props?.['aria-label']===label)[0];
const activeEntry=()=>all(all(tree,node=>node.props?.['data-active']===true)[0],node=>node.props?.deity)[0];
const visibleEntries=()=>all(tree,node=>node.props?.deity&&node.props?.visible);
const plainClick=()=>({button:0,detail:1,defaultPrevented:false,ctrlKey:false,altKey:false,metaKey:false,shiftKey:false,preventDefault(){this.defaultPrevented=true;},stopPropagation(){this.stopped=true;}});
function settle(){for(const a of animations.splice(0))if(!a.stopped)a.value.set(a.to);for(const [id,fn] of [...timeouts])if(timeouts.delete(id))fn();render();}
const trackX=()=>all(tree,n=>n.props?.className==='flower-carousel-track')[0].props.style.x;
let captured=false;
const pointerTarget={getBoundingClientRect:()=>({width:900}),hasPointerCapture:()=>captured,setPointerCapture(){captured=true;},releasePointerCapture(){captured=false;}};
const pointerEvent={button:0,isPrimary:true,pointerId:3,clientX:170,clientY:30,currentTarget:pointerTarget,preventDefault(){}};
try{
  globalThis.setTimeout=(fn)=>{timeouts.set(++serial,fn);return serial;};
  globalThis.clearTimeout=id=>timeouts.delete(id);
  render();
  check('Clicking the central character image enters its detail directly',()=>{
    const entry=activeEntry(),link=entry.type(entry.props),event=plainClick();
    link.props.onClick(event);assert.equal(event.defaultPrevented,true);
    assert.deepEqual(navigations,['/series/flower-gods/jingxin']);navigations.length=0;
  });
  check('Next click selects unpublished seat without routing; rapid duplicate is ignored',()=>{
    const initial=state[0];find('下一位花神').props.onClick();find('下一位花神').props.onClick();
    render();assert.equal(state[0],initial+1);assert.equal(activeEntry(),undefined);
    assert.equal(timeouts.size,1);settle();
  });
  check('Offscreen published images are inert and waiting state has no text entrance',()=>{
    assert.equal(visibleEntries().length,0);
    assert.equal(all(tree,node=>node.props?.className==='flower-character-enter').length,0);
    assert.equal(navigations.length,0);
  });
  check('Previous click restores real detail entry',()=>{
    find('上一位花神').props.onClick();settle();assert.equal(activeEntry().props.deity.slug,'jingxin');
  });
  check('Keyboard arrows switch; unrelated keys do not',()=>{
    let prevented=0;find('花神选择').props.onKeyDown({key:'ArrowLeft',preventDefault(){prevented++;}});
    settle();assert.equal(prevented,1);assert.equal(activeEntry(),undefined);
    const previous=state[0];find('花神选择').props.onKeyDown({key:'Enter',preventDefault(){assert.fail();}});assert.equal(state[0],previous);
  });
  check('Roster selects Jingxin with shortest circular movement',()=>{
    all(tree,n=>n.type==='button'&&n.props?.['aria-label']==='选择镜昕')[0].props.onClick();
    settle();assert.equal(activeEntry().props.deity.slug,'jingxin');
  });
  check('Horizontal pointer drag advances once and suppresses accidental click',()=>{
    const surface=all(tree,n=>n.props?.className==='flower-carousel-window')[0];
    const entry=activeEntry(),imageLink=entry.type(entry.props);
    let capture=false,prevented=false,stopped=false;
    const target={...pointerTarget,hasPointerCapture:()=>capture,setPointerCapture(){capture=true;},releasePointerCapture(){capture=false;}};
    const ev={...pointerEvent,currentTarget:target};
    const before=state[0];surface.props.onPointerDown(ev);
    surface.props.onPointerMove({...ev,clientX:100,clientY:32});assert.equal(capture,true);
    assert.equal(trackX().get(),-70,'Track moves before pointer release');
    surface.props.onPointerUp({...ev,clientX:100,clientY:32});assert.equal(capture,false);
    surface.props.onClickCapture({preventDefault(){prevented=true;},stopPropagation(){stopped=true;}});
    const click=plainClick();surface.props.onClickCapture(click);
    imageLink.props.onClick(click);assert.equal(navigations.length,0,'Moving image cannot trigger navigation');
    assert.equal(prevented&&stopped,true);assert.equal(state[0],before+1);settle();
    assert.equal(trackX().get(),0);
  });
  check('Cancelled pointer leaves selection unchanged',()=>{
    const surface=all(tree,n=>n.props?.className==='flower-carousel-window')[0],before=state[0];
    surface.props.onPointerDown({...pointerEvent,pointerId:2,clientX:100,clientY:0});
    surface.props.onPointerCancel();surface.props.onPointerUp({pointerId:2,clientX:0,clientY:0});
    assert.equal(state[0],before);
  });
  check('Short drag settles back without changing the selected deity',()=>{
    const surface=all(tree,n=>n.props?.className==='flower-carousel-window')[0],before=state[0];
    surface.props.onPointerDown(pointerEvent);
    surface.props.onPointerMove({...pointerEvent,clientX:150});
    assert.equal(trackX().get(),-20);
    surface.props.onPointerUp({...pointerEvent,clientX:150});
    const click=plainClick();surface.props.onClickCapture(click);
    assert.equal(click.stopped,true,'Short drags must not follow an image link either');
    assert.equal(state[0],before);assert.equal(animations.at(-1).options.duration,.28);
    settle();assert.equal(trackX().get(),0);
  });
  check('Vertical scroll cannot become a carousel swipe midway',()=>{
    const surface=all(tree,n=>n.props?.className==='flower-carousel-window')[0],before=state[0];
    surface.props.onPointerDown(pointerEvent);
    surface.props.onPointerMove({...pointerEvent,clientY:80});
    surface.props.onPointerMove({...pointerEvent,clientX:50,clientY:80});
    assert.equal(trackX().get(),0);assert.equal(captured,false);
    surface.props.onPointerUp({...pointerEvent,clientX:50,clientY:80});
    assert.equal(state[0],before);settle();
  });
  check('Escape cancels a drag and keyboard clicks are not swallowed',()=>{
    const surface=all(tree,n=>n.props?.className==='flower-carousel-window')[0],before=state[0];
    surface.props.onPointerDown(pointerEvent);
    surface.props.onPointerMove({...pointerEvent,clientX:90});
    find('花神选择').props.onKeyDown({key:'Escape'});
    assert.equal(captured,false);assert.equal(state[0],before);
    surface.props.onClickCapture({detail:0,preventDefault(){assert.fail();},stopPropagation(){assert.fail();}});
    settle();assert.equal(trackX().get(),0);
  });
  check('Reduced motion restores drag immediately without animated settling',()=>{
    reduced=true;
    render();const surface=all(tree,n=>n.props?.className==='flower-carousel-window')[0];
    surface.props.onPointerDown(pointerEvent);
    surface.props.onPointerMove({...pointerEvent,clientX:150});
    surface.props.onPointerUp({...pointerEvent,clientX:150});
    assert.equal(trackX().get(),0);reduced=false;render();
  });
  check('Animation timers are cleaned up on unmount',()=>{
    find('下一位花神').props.onClick();assert.equal(timeouts.size,1);
    cleanups.forEach(fn=>fn());assert.equal(timeouts.size,0);
    assert.equal(animations.at(-1).stopped,true);
  });
}finally{globalThis.setTimeout=realSetTimeout;globalThis.clearTimeout=realClearTimeout;}
check('Styles create one full-stage portrait, overlay navigation and uncropped image',()=>{
  const css=readFileSync('src/flower-gods-collection.css','utf8');
  assert.match(css,/\.flower-seat \{[^}]*width: 100%/);assert.match(css,/object-fit: contain/);
  assert.match(css,/prefers-reduced-motion/);assert.match(css,/touch-action: pan-y/);
  assert.doesNotMatch(css,/bottom: -116px|min-height: 116px|\.flower-selection-info/);
  assert.match(css,/\.flower-roster button \{ display: flex;/);
  assert.match(css,/\.flower-collection-header \{ position: absolute/);
  assert.match(css,/\.flower-character-copy \{[^}]*left: 74%/);
  assert.match(css,/\.flower-seat:not\(\[data-active="true"\]\) \{ pointer-events: none/);
  assert.doesNotMatch(css,/33\.333333%/);
  assert.match(css,/max-height: none/);
  assert.doesNotMatch(css,/max-height: (?:calc\(clamp|236px)/);
  assert.match(css,/\.flower-seat\[data-active="true"\] \{ z-index: 2;/);
  const home=readFileSync('src/series-scrolls.css','utf8');
  assert.match(home,/repeat\(2, minmax\(0, 1fr\)\)/);assert.match(home,/object-fit: contain/);
  assert.doesNotMatch(home,/clip-path/);
});
console.log(checks+' component/model checks passed; no browser or visual QA performed.');
