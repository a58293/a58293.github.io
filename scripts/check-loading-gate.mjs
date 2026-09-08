import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadSource} from './test-source-loader.mjs';

const {trackInitialAssets} = loadSource('src/initial-assets.ts');
const {requiredImage} = loadSource('src/media-library.ts');
const tick = () => new Promise(resolve => setImmediate(resolve));

for (const route of ['/', '/series/flower-gods', '/series/flower-gods/jingxin', '/verify']) {
  const images = [];
  const decodes = [];
  globalThis.Image = class {
    constructor() { images.push(this); }
    decode() { return new Promise(resolve => decodes.push(resolve)); }
  };
  const tracker = trackInitialAssets(route);
  const progress = [];
  const unsubscribe = tracker.subscribe(value => progress.push(value));
  let ready = false;
  void tracker.ready.then(() => { ready = true; });
  await tick();
  assert.equal(ready, false, 'Slow first-screen images must keep the loader waiting');
  assert.equal(images.length, route === '/series/flower-gods' ? 7 : route === '/verify' ? 3 : 4);
  if (route === '/') assert.ok(images.some(image => image.src === requiredImage('homeHero')));
  if (route === '/series/flower-gods') {
    assert.ok(images.some(image => image.src === requiredImage('jingxinChoice')));
    assert.ok(!images.some(image => image.src === requiredImage('flowerPendingSilhouette')));
    assert.ok(!images.some(image => image.src === requiredImage('flowerPendingScene')));
    for (const id of ['flowerCloudSea', 'flowerColumns', 'jingxinForeground']) {
      assert.ok(images.some(image => image.src === requiredImage(id)));
    }
  }
  if (route === '/series/flower-gods/jingxin') assert.ok(images.some(image => image.src === requiredImage('jingxinPortrait')));
  images[0].onerror();
  for (const image of images.slice(1)) image.onload();
  for (const decode of decodes) decode();
  await tracker.ready;
  await tick();
  unsubscribe();
  assert.equal(ready, true);
  assert.equal(progress.at(-1), 1);
  assert.ok(progress.length > 1 && progress.every((value, index) => !index || value >= progress[index - 1]));
  assert.ok(images.every(image => image.onload === null && image.onerror === null));
}

const component = await readFile('src/BrandLoadingScreen.tsx', 'utf8');
const css = await readFile('src/brand-loading-screen.css', 'utf8');
assert.ok(component.includes('tracker.subscribe'));
assert.ok(component.includes('Math.round(progress * 100)'));
assert.ok(css.includes('transition: transform .3s'));
assert.ok(!css.includes('animation: brand-loader-progress'));
assert.ok(component.includes('20000'), 'Emergency timeout must remain available');
console.log('PASS: progress follows real first-screen image completion; pending assets and fonts do not block; timeout retained.');
