import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createElement, Fragment} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {loadSource} from './test-source-loader.mjs';

const media={'./media-library':{requiredImage:id=>`/test/${id}.png`}};
const {sceneDepth,scenePointer}=loadSource('src/flower-scene-motion.ts');
assert.deepEqual(scenePointer(500,300,{left:0,top:0,width:1000,height:600}),{x:0,y:0});
assert.deepEqual(scenePointer(-100,900,{left:0,top:0,width:1000,height:600}),{x:-1,y:1});
assert.ok(sceneDepth.clouds>0 && sceneDepth.clouds<sceneDepth.stage);
assert.ok(sceneDepth.stage<sceneDepth.flowers);
assert.ok(sceneDepth.flowers<32,'Overscan must exceed all horizontal travel');

const Scene=loadSource('src/FlowerScene.tsx',media).default;
const html=renderToStaticMarkup(createElement(Scene,{foreground:'/test/lotus.png'},createElement('a',{href:'/real-character'},'角色')));
assert.deepEqual([...html.matchAll(/data-scene-layer="([^"]+)"/g)].map(x=>x[1]),['clouds','stage','deity','columns','flowers']);
assert.match(html,/flower-stage-floor/);
assert.match(html,/data-lighting="flat"/);
assert.match(html,/href="\/real-character"/);
assert.match(html,/src="\/test\/lotus.png"/);
const waiting=renderToStaticMarkup(createElement(Scene,null,'待启'));
assert.doesNotMatch(waiting,/lotus\.png/,'Unpublished characters must not borrow a flower identity');

let reduced=false;
const values=[],cleanups=[];
const Harness=loadSource('src/FlowerScene.tsx',{
  ...media,
  react:{useEffect:fn=>cleanups.push(fn())},
  'motion/react':{
    AnimatePresence:Fragment,motion:{div:'div',img:'img'},useReducedMotion:()=>reduced,
    useMotionValue(value){const v={value,set(n){this.value=n;},get(){return this.value;},stop(){this.stopped=true;}};values.push(v);return v;},
    useSpring:value=>value,useTransform:(value,fn)=>({get:()=>fn(value.get())}),
  },
}).default;
let tree=Harness({children:'角色'});
const target={getBoundingClientRect:()=>({left:0,top:0,width:1000,height:600})};
const event={pointerType:'mouse',buttons:0,clientX:1000,clientY:600,currentTarget:target};
tree.props.onPointerMove(event);
assert.equal(values[0].get(),1);assert.equal(values[1].get(),1);
const layers=tree.props.children;
for(const layer of layers) {
  assert.equal(layer.type(layer.props).props.style.x.get(),-sceneDepth[layer.props.name]);
  assert.equal(layer.type(layer.props).props.style.y.get(),-sceneDepth[layer.props.name]*.25);
}
const stage=layers[1];
assert.equal(stage.props.name,'stage');
assert.deepEqual(stage.props.children.map(child=>child.props.className),['flower-stage-floor','flower-depth-layer flower-depth-deity','flower-depth-layer flower-depth-columns']);
assert.ok(stage.props.children.every(child=>!child.props.style),'Floor, figure and columns share the parent transform, never slide independently');
tree.props.onPointerDownCapture();assert.equal(values[0].get(),0);
tree.props.onPointerMove({...event,buttons:1});assert.equal(values[0].get(),0,'Drag cannot move the camera');
tree.props.onPointerMove({...event,pointerType:'touch'});assert.equal(values[0].get(),0,'Touch is reserved for carousel swipes');
tree.props.onPointerMove(event);tree.props.onPointerLeave();assert.equal(values[0].get(),0);
tree.props.onPointerMove(event);tree.props.onKeyDownCapture();assert.equal(values[0].get(),0);
tree.props.onPointerMove(event);tree.props.onPointerCancel();assert.equal(values[0].get(),0);
reduced=true;tree=Harness({children:'角色'});tree.props.onPointerMove(event);
assert.equal(values[2].get(),0,'Reduced motion disables parallax');
for(const cleanup of cleanups)cleanup?.();assert.ok(values.every(v=>v.stopped));
const css=readFileSync('src/flower-gods-collection.css','utf8');
for(const [name,z] of Object.entries({clouds:0,deity:1,columns:2,flowers:3})){
  assert.match(css,new RegExp(`\\.flower-depth-${name} \\{[^}]*z-index: ${z};`));
}
assert.match(css,/flower-depth-layer:not\(\.flower-depth-deity\):not\(\.flower-depth-stage\) \{ pointer-events: none/);
assert.doesNotMatch(css,/flower-carousel-light|radial-gradient/);
assert.doesNotMatch(readFileSync('src/FlowerGodsCollection.tsx','utf8'),/flowerPavilion|flower-carousel-light/);
console.log('PASS rigid floor/figure/column stage, depth order, no backlight, bounded parallax, mouse/touch/drag isolation, reduced motion, cleanup and per-character flowers.');
