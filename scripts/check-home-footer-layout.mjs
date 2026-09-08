import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import postcss from 'postcss';

// Source-level regression checks, not a browser layout measurement.
const source = await readFile(new URL('../src/BjdApp.tsx', import.meta.url), 'utf8');
const css = postcss.parse(await readFile(new URL('../src/home-chapter-experience.css', import.meta.url), 'utf8'));
let passed = 0;
function check(name, condition) {
  assert.ok(condition, name);
  console.log(`PASS ${name}`);
  passed += 1;
}
function declaration(selector, property, value, media) {
  let found = false;
  css.walkRules(rule => {
    if (rule.selector !== selector) return;
    if (media !== undefined && rule.parent.params !== media) return;
    rule.walkDecls(property, decl => { if (decl.value === value) found = true; });
  });
  return found;
}

check('Duplicate verification metadata is not rendered over the footer', !source.includes('className="verify-meta"'));
for (const name of ['home-footer-brand', 'home-footer-summary', 'home-footer-copyright']) {
  check(`Footer content has an explicit layout slot: ${name}`, source.includes(`className="${name}"`));
}
check('Footer uses grid instead of wrapping the full footer flex row', declaration('.home-experience .home-chapter-final > footer', 'display', 'grid'));
check('Footer reserves the shared height token', declaration('.home-experience .home-chapter-final > footer', 'min-height', 'var(--home-footer-height)'));
check('Chapter navigation sits above the reserved footer', declaration('[data-home-chapter="verify"] .home-pagination', 'bottom', 'calc(var(--home-footer-height) + 12px)', '(min-width: 641px)'));
check('Chapter caption sits above the reserved footer', declaration('[data-home-chapter="verify"] .home-scene-caption', 'bottom', 'calc(var(--home-footer-height) + 18px)', '(min-width: 641px)'));
check('Tablet footer uses two separate columns', declaration('.home-experience .home-chapter-final > footer', 'grid-template-columns', 'minmax(0, 1fr) auto', '(min-width: 641px) and (max-width: 1100px)'));
check('Tablet removes the redundant footer summary', declaration('.home-experience .home-footer-summary', 'display', 'none', '(min-width: 641px) and (max-width: 1100px)'));
check('Narrow captions leave room for the central navigation', declaration('[data-home-chapter="verify"] .home-scene-caption > small', 'display', 'none', '(max-width: 900px)'));
check('Mobile retains the existing compact footer behavior', declaration('.home-experience .home-chapter-final > footer', 'display', 'none', '(max-width: 640px)'));
check('Chapter navigation and verification entry remain available', source.includes('aria-label="首页章节"') && source.includes('className="light-button home-verify-primary" href="/verify"'));
console.log(`${passed} source/CSS checks passed; browser visual inspection not performed.`);
