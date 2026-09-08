import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve, dirname} from 'node:path';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import postcss from 'postcss';

// Source, SSR and palette checks only; this does not perform browser visual QA.
const require = createRequire(import.meta.url);
function load(file) {
  const filename = resolve(file);
  const code = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022},
  }).outputText;
  const module = {exports: {}};
  new Function('require', 'module', 'exports', code)(name => {
    if (name.endsWith('.css')) return {};
    if (!name.startsWith('.')) return require(name);
    const path = resolve(dirname(filename), name);
    const target = [path, `${path}.ts`, `${path}.tsx`].find(existsSync);
    assert.ok(target, name);
    return load(target);
  }, module, module.exports);
  return module.exports;
}
let count = 0;
function check(label, callback) { callback(); count++; console.log(`PASS ${label}`); }
const {currentProductTheme: theme, currentProductThemeStyle: style} = load('src/current-product-theme.ts');
const {flowerGods} = load('src/flower-gods-catalog.ts');
const css = readFileSync('src/home-product-theme.css', 'utf8');
const parsed = postcss.parse(css);
const main = readFileSync('src/main.tsx', 'utf8');
check('当期主题对应已公开的镜昕', () => assert.equal(flowerGods.find(x => x.slug === theme.product)?.name, '镜昕'));
check('每个主题色都绑定到首页变量', () => {
  for (const [role, color] of Object.entries(theme.colors)) {
    assert.match(color, /^#[\da-f]{6}$/i);
    assert.equal(style[`--current-${role}`], color);
    assert.ok(css.includes(`var(--current-${role})`));
  }
});
check('所有覆盖均限制在首页，不改变角色页或核验中心', () => parsed.walkRules(rule => {
  assert.ok(rule.selector.split(/,\s*\n/).every(selector => selector.trim().startsWith('.home-experience[data-product-theme]')), rule.selector);
}));
check('不再在首页主题中散落粉色、金色或其他固定色值', () => assert.doesNotMatch(css, /#[\da-f]{3,8}\b|\brgba?\s*\(/i));
check('主题文件仅改颜色与对比度，不改布局、字体、尺寸和动画', () => {
  const allowed = new Set(['color', 'background', 'background-size', 'background-image', 'border-color', 'box-shadow', 'text-shadow', 'filter', 'opacity', 'outline', 'outline-offset', 'outline-color']);
  parsed.walkDecls(decl => assert.ok(decl.prop.startsWith('--') || allowed.has(decl.prop), decl.prop));
});
check('浅色导航变量不会在 site-shell 中覆盖深色章节变量', () => parsed.walkRules(rule => {
  if (rule.selector.includes('.site-shell')) assert.ok(!rule.nodes.some(node => node.prop === '--home-chrome'));
}));
check('主题晚于旧配色、早于用户自定义字体', () => {
  const imports = [...main.matchAll(/import ['"]([^'"]+\.css)['"]/g)].map(match => match[1]);
  assert.equal(imports.at(-2), './home-product-theme.css');
  assert.equal(imports.at(-1), './custom-fonts.css');
});
const App = load('src/BjdApp.tsx').default;
for (const chapter of ['top', 'series', 'archive', 'collectors', 'verify']) {
  check(`首页 ${chapter} 章节渲染相同的当期产品主题`, () => {
    globalThis.window = {location: {hash: `#${chapter}`}};
    const html = renderToStaticMarkup(createElement(App));
    assert.ok(html.includes(`data-home-chapter="${chapter}"`));
    assert.ok(html.includes(`data-product-theme="${theme.product}"`));
    for (const [property, value] of Object.entries(style)) assert.ok(html.includes(`${property}:${value}`));
  });
}
delete globalThis.window;
const luminance = hex => hex.slice(1).match(/../g).map(value => parseInt(value, 16) / 255)
  .map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4)
  .reduce((total, value, index) => total + value * [.2126, .7152, .0722][index], 0);
const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + .05) / (Math.min(luminance(a), luminance(b)) + .05);
for (const [text, background, minimum] of [
  ['ink', 'paper', 4.5], ['ink', 'mist', 4.5], ['ink', 'main', 4.5],
  ['muted', 'paper', 4.5], ['muted', 'mist', 4.5], ['muted', 'soft', 4.5],
  ['accent', 'paper', 4.5], ['accent', 'mist', 4.5],
  ['light', 'middle', 4.5], ['soft', 'middle', 4.5], ['soft', 'deep', 4.5],
  ['main', 'middle', 3], // Large hero heading, not body copy.
]) {
  check(`色阶对比度 ${text}/${background} ≥ ${minimum}:1`, () => {
    const ratio = contrast(theme.colors[text], theme.colors[background]);
    assert.ok(ratio >= minimum, `${ratio.toFixed(2)}:1`);
  });
}
console.log(`${count} checks passed; browserInspection=false`);
