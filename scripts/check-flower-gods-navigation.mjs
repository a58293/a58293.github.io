import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import ts from 'typescript';

// Exercise route resolution and React event handlers without browser inspection.
const require = createRequire(import.meta.url);
function loadSource(file, overrides = {}) {
  const filename = resolve(file);
  const code = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  const scopedRequire = name => {
    if (name in overrides) return overrides[name];
    if (name.endsWith('.css')) return {};
    if (name.startsWith('.')) {
      const path = resolve(dirname(filename), name);
      const target = [path, `${path}.ts`, `${path}.tsx`].find(existsSync);
      assert.ok(target, `Module exists: ${name}`);
      return loadSource(target, overrides);
    }
    return require(name);
  };
  new Function('require', 'module', 'exports', code)(scopedRequire, module, module.exports);
  return module.exports;
}

let checks = 0;
function check(name, fn) { fn(); checks += 1; console.log(`PASS ${name}`); }
const catalog = loadSource('src/flower-gods-catalog.ts');
const { FLOWER_GODS_PATH, JINGXIN_PATH, resolveSiteRoute, transitionCopy, isPlainNavigation } = catalog;
check('Series URL opens the selection page, not Jingxin', () => assert.equal(resolveSiteRoute(FLOWER_GODS_PATH).view, 'collection'));
check('Character has a separate refreshable URL', () => assert.equal(resolveSiteRoute(`${JINGXIN_PATH}/`).deity.name, '镜昕'));
check('Unknown characters are not silently rendered as Jingxin', () => assert.equal(resolveSiteRoute(`${FLOWER_GODS_PATH}/unknown`).view, 'not-found'));
check('Series transition is about the series', () => assert.equal(transitionCopy(resolveSiteRoute(FLOWER_GODS_PATH)).title, '花神卷'));
check('Character transition is about the selected character', () => assert.equal(transitionCopy(resolveSiteRoute(JINGXIN_PATH)).title, '镜昕'));

const plain = { button: 0, defaultPrevented: false, metaKey: false, ctrlKey: false, altKey: false, shiftKey: false };
check('Modified clicks keep normal browser link behavior', () => {
  assert.equal(isPlainNavigation(plain), true);
  for (const key of ['ctrlKey', 'metaKey', 'shiftKey', 'altKey', 'defaultPrevented']) assert.equal(isPlainNavigation({ ...plain, [key]: true }), false);
  assert.equal(isPlainNavigation({ ...plain, button: 1 }), false);
});

const {default: Collection, DeityEntry} = loadSource('src/FlowerGodsCollection.tsx');
function findElement(node, predicate) {
  if (!node || typeof node !== 'object') return undefined;
  if (Array.isArray(node)) return node.map(item => findElement(item, predicate)).find(Boolean);
  if (predicate(node)) return node;
  return findElement(node.props?.children, predicate);
}
check('Single-hall selection retains the roster and no unpublished detail routes', () => {
  const html = renderToStaticMarkup(createElement(Collection));
  assert.equal((html.match(/class="flower-seat-art deity-image-entry"/g) || []).length, 1);
  assert.ok(html.includes(`href="${JINGXIN_PATH}"`));
  assert.match(html, /花期未至/);
  assert.ok(!html.includes('href="#"'));
  assert.match(html, /data-composition="single-hall"/);
  assert.match(html, /aria-label="选择镜昕"/);
  assert.match(html, /aria-label="待启席位 3，尚未公开"/);
});
check('Choosing a card calls navigation only for an ordinary click', () => {
  const calls = [];
  const tree = DeityEntry({ deity: catalog.flowerGods[0], onNavigate: href => calls.push(href) });
  const link = findElement(tree, node => node.props?.className === 'flower-seat-art deity-image-entry');
  let prevented = false;
  link.props.onClick({ ...plain, preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.deepEqual(calls, [JINGXIN_PATH]);
  link.props.onClick({ ...plain, ctrlKey: true, preventDefault() { assert.fail('Must not intercept new-tab clicks'); } });
  assert.equal(calls.length, 1);
});

// Minimal hook harness: test the actual navigation callbacks and timer cleanup.
const slots = [];
let cursor = 0;
let effects = [];
const hooks = {
  useState(initial) {
    const index = cursor++;
    if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
    return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
  },
  useRef(initial) {
    const index = cursor++;
    if (!(index in slots)) slots[index] = { current: initial };
    return slots[index];
  },
  useCallback(fn) {
    const index = cursor++;
    if (!(index in slots)) slots[index] = fn;
    return slots[index];
  },
  useEffect(fn) {
    const index = cursor++;
    if (!(index in slots)) { slots[index] = true; effects.push(fn); }
  },
};
let address = new URL('http://localhost:3000/#series');
let serial = 0;
const timers = new Map();
const listeners = new Map();
const history = [];
globalThis.window = {
  get location() { return address; },
  history: { pushState(state, _, href) { address = new URL(href, address); history.push(address.pathname + address.hash); } },
  matchMedia: () => ({ matches: false }),
  scrollTo() {},
  setTimeout(fn, delay) { timers.set(++serial, { fn, delay }); return serial; },
  clearTimeout(id) { timers.delete(id); },
  addEventListener(name, fn) { listeners.set(name, fn); },
  removeEventListener(name) { listeners.delete(name); },
};
const Home = () => null, Detail = () => null, Directory = () => null, NotFound = () => null;
const Unified = loadSource('src/UnifiedBjdSite.tsx', {
  react: hooks,
  './BjdApp': { default: Home },
  './FlowerGodsExperience': { default: Detail },
  './FlowerGodsCollection': { default: Directory },
  './NotFoundPage': { default: NotFound },
}).default;
let tree;
function render() { cursor = 0; tree = Unified(); const pending = effects; effects = []; pending.forEach(fn => fn()); return tree; }
function finishTransition() {
  const pending = [...timers.entries()].sort((a, b) => a[1].delay - b[1].delay);
  for (const [id, timer] of pending) if (timers.delete(id)) { timer.fn(); render(); }
}
render();
check('Home series click navigates to the directory; duplicate clicks do not skip it', () => {
  const home = findElement(tree, node => node.type === Home);
  home.props.onOpenFlowerGods(); home.props.onOpenFeatured();
  render();
  assert.equal(tree.props['data-transition-kind'],'ceremony');
  assert.equal(findElement(tree, node => node.props?.className === 'site-transition-signature').props.children[1].props.children, '花神卷');
  finishTransition();
  assert.equal(tree.props['data-view'], 'collection');
  assert.deepEqual(history, [FLOWER_GODS_PATH]);
});
check('Selection → character → selection → home series preserves distinct destinations', () => {
  findElement(tree, node => node.type === Directory).props.onNavigate(JINGXIN_PATH);
  render();assert.equal(tree.props['data-transition-kind'],'soft');
  assert.deepEqual([...timers.values()].map(t=>t.delay).sort((a,b)=>a-b),[160,420]);
  finishTransition(); assert.equal(tree.props['data-view'], 'character');
  findElement(tree, node => node.type === Detail).props.onBackCollection();
  render();assert.equal(tree.props['data-transition-kind'],'soft');
  finishTransition(); assert.equal(tree.props['data-view'], 'collection');
  findElement(tree, node => node.type === Directory).props.onNavigate('/#series');
  render();assert.equal(tree.props['data-transition-kind'],'ceremony');
  finishTransition(); assert.equal(tree.props['data-view'], 'home'); assert.equal(address.hash, '#series');
});
check('Featured character entry still opens the character directly', () => {
  findElement(tree, node => node.type === Home).props.onOpenFeatured();
  finishTransition(); assert.equal(address.pathname, JINGXIN_PATH);
});
check('Browser back interrupts transitions and restores the directory', () => {
  findElement(tree, node => node.type === Detail).props.onBackCollection();
  address = new URL(FLOWER_GODS_PATH, address);
  listeners.get('popstate')(); render();
  assert.equal(tree.props['data-view'], 'collection');
  assert.equal(tree.props['data-site-transition'], 'idle');
  assert.equal(timers.size, 0);
});
check('Browser forward restores the character route', () => {
  address = new URL(JINGXIN_PATH, address);
  listeners.get('popstate')(); render();
  assert.equal(tree.props['data-view'], 'character');
});
console.log(`${checks} route/component checks passed; no browser visual inspection performed.`);
