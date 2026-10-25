import { createReadStream, statSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
const port = Number(process.env.PORT || 4173);
// Reuse unchanged public bytes during parallel browser QA. Browser requests still
// use no-store; file changes and the connection-loss fixture remain observable.
const fileCache=new Map();let fileCacheBytes=0;
function publicBytes(file,info){
  if(!/\.(?:html|css|js|mjs|json|woff2|svg)$/.test(file)||info.size>3*1024*1024)return null;
  const signature=info.mtimeMs+':'+info.size,hit=fileCache.get(file);
  if(hit?.signature===signature)return hit;
  if(hit){fileCacheBytes-=hit.body.length;fileCache.delete(file);}
  const body=readFileSync(file),entry={signature,body,gzip:null};
  while(fileCacheBytes+body.length>8*1024*1024&&fileCache.size){const key=fileCache.keys().next().value;fileCacheBytes-=fileCache.get(key).body.length;fileCache.delete(key);}
  fileCache.set(file,entry);fileCacheBytes+=body.length;return entry;
}
const contentTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.gif', 'image/gif'],
  ['.html', 'text/html; charset=utf-8'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.mp4', 'video/mp4'],
  ['.webm', 'video/webm'],
  ['.woff2', 'font/woff2'],
  ['.wasm', 'application/wasm'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.webmanifest', 'application/manifest+json; charset=utf-8'],
  ['.webp', 'image/webp'],
]);

createServer((request, response) => {
  // Per-context connection-loss simulation; this helper is not deployed.
  const lostConnection = /(?:^|;\s*)mmg-offline-test=([12])(?:;|$)/.exec(request.headers.cookie || '');
  if (lostConnection) {
    if (lostConnection[1] === '2') {
      const timer = setTimeout(() => request.socket.destroy(), 5000);
      response.on('close', () => clearTimeout(timer));
    } else request.socket.destroy();
    return;
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  } catch {
    response.writeHead(400).end('Bad request');
    return;
  }

  const relativePath = pathname.replace(/^\/+/, '') || 'index.html';
  const file = resolve(root, relativePath);
  if (file !== root && !file.startsWith(`${root}${sep}`)) {
    response.writeHead(403).end('Forbidden');
    return;
  }

  let info;
  try {
    info = statSync(file);
  } catch {
    response.writeHead(404).end('Not found');
    return;
  }
  if (!info.isFile()) {
    response.writeHead(404).end('Not found');
    return;
  }
  const cached=publicBytes(file,info);
  // Optional production-like compression for local Lighthouse, not an audit bypass.
  if(process.env.MMG_COMPRESS==='1' && /\.(?:css|js|mjs|html|json)$/.test(file) && /gzip/.test(request.headers['accept-encoding']||'')){
    const body=cached?(cached.gzip||=gzipSync(cached.body)):gzipSync(readFileSync(file));
    response.writeHead(200,{'Content-Type':contentTypes.get(extname(file))||'application/octet-stream','Content-Encoding':'gzip','Content-Length':body.length,'Cache-Control':'no-store','Vary':'Accept-Encoding'});
    response.end(request.method==='HEAD'?undefined:body);return;
  }

  response.writeHead(200, {
    'Cache-Control': 'no-store',
    'Content-Length': info.size,
    'Content-Type': contentTypes.get(extname(file).toLowerCase()) || 'application/octet-stream',
    'X-Content-Type-Options': 'nosniff',
  });
  if (request.method === 'HEAD') response.end();
  else if(cached)response.end(cached.body);
  else createReadStream(file).pipe(response);
}).listen(port, '127.0.0.1', () => {
  process.stdout.write(`Static test server listening at http://127.0.0.1:${port}\n`);
});
