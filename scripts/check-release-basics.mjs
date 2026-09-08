import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [indexHtml, robots, metadataSource] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../public/robots.txt', import.meta.url), 'utf8'),
  readFile(new URL('../src/site-metadata.ts', import.meta.url), 'utf8'),
]);

assert.match(indexHtml, /<html lang="zh-CN">/, '页面语言应标记为简体中文');
assert.match(indexHtml, /rel="icon"/, '应提供网站图标');
assert.match(indexHtml, /name="description"/, '应提供基础搜索摘要');
assert.match(indexHtml, /viewport-fit=cover/, '应适配 iPhone 与微信安全区');
assert.match(robots, /User-agent:\s*\*/i, '应提供 robots.txt');

for (const route of ['花神卷｜选择花神', '官方防伪核验', '页面未收录', 'noindex, nofollow']) {
  assert.ok(metadataSource.includes(route), `页面元信息缺少：${route}`);
}

console.log('基础上线检查通过：语言、图标、搜索摘要、页面标题与爬虫规则均已配置。');
