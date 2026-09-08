import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const secret = randomBytes(48).toString('base64url');
const outputName = process.argv[2];
if (!outputName) {
  console.log(secret);
} else {
  const outputPath = resolve(outputName);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${secret}\n`, { encoding: 'utf8', flag: 'wx' });
  console.log(`密钥已保存到：${outputPath}`);
}
