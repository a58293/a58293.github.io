import type {Plugin} from 'vite';
import path from 'node:path';
import {collectMedia, collectPublicSupport} from './media-library.mjs';
import {prepareMedia} from './prepare-media.mjs';

export async function mediaAssetsPlugin(project: string): Promise<Plugin> {
  // Keep direct Vite invocations in sync as well as the npm prebuild/predev hooks.
  await prepareMedia(project);
  const {files} = await collectMedia(project);
  const assets = [...files, ...await collectPublicSupport(project)];
  const byUrl = new Map(assets.map(asset => [asset.url, asset]));
  return {
    name: 'curated-media-library',
    configureServer(server) {
      server.middlewares.use((req,res,next) => {
        let pathname: string;
        try { pathname = decodeURIComponent(new URL(req.url || '/', 'http://localhost').pathname); }
        catch { res.statusCode=400; res.end(); return; }
        const asset=byUrl.get(pathname);
        if (!asset) {
          if (pathname.startsWith('/media/') || pathname.startsWith('/images/')) { res.statusCode=404; res.end(); return; }
          next(); return;
        }
        if (req.method !== 'GET' && req.method !== 'HEAD') { res.statusCode=405; res.end(); return; }
        res.setHeader('Content-Type',asset.mime);
        res.setHeader('Content-Length',asset.bytes.length);
        res.setHeader('Cache-Control','no-cache');
        res.end(req.method==='HEAD'?undefined:asset.bytes);
      });
    },
    buildStart() {
      for (const asset of assets) this.addWatchFile(path.resolve(asset.file));
    },
    generateBundle() {
      for (const asset of assets) this.emitFile({type:'asset', fileName:asset.url.slice(1), source:asset.bytes});
    },
  };
}
