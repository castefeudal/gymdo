/* Brand asset generator for MARKOV MADE GYM.
   Outputs SVG marks + HTML raster pages; PNGs are captured by scripts/brand-render.mjs. */
import { writeFile, mkdir } from 'node:fs/promises';

const dir = 'assets/brand';
const rasterDir = 'tools/brand';
await mkdir(dir, { recursive: true });
await mkdir(rasterDir, { recursive: true });

const INK = '#080C11';
const PAPER = '#F4F7F5';
const LIME = '#BEF47D';
const STEEL = '#8BBFD1';

// Geometric M on a 64x64 grid: two mirrored halves split on the centre axis.
const M_LEFT = 'M14 50V14h7.2L32 34.6V45L20.6 28.4V50Z';
const M_RIGHT = 'M50 50V14h-7.2L32 34.6V45l11.4-16.6V50Z';

const mark = ({ paper = PAPER, lime = LIME, steel = null } = {}) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="MARKOV MADE GYM"><title>MARKOV MADE GYM</title><path d="${M_LEFT}" fill="${steel || paper}"/><path d="${M_RIGHT}" fill="${lime}"/>${steel ? `<path d="M32 34.6V45L20.6 28.4" fill="${paper}"/>` : ''}</svg>`;

const plate = (size = 512) => {
  const r = size * 0.225;
  const inner = size * 0.58;
  const off = (size - inner) / 2;
  const scale = inner / 64;
  const stroke = Math.max(1, size * 0.006);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#141C26"/><stop offset="1" stop-color="${INK}"/></linearGradient></defs>
  <rect width="${size}" height="${size}" rx="${r}" fill="url(#g)"/>
  <rect x="${stroke / 2}" y="${stroke / 2}" width="${size - stroke}" height="${size - stroke}" rx="${r - stroke / 2}" fill="none" stroke="rgba(244,247,245,.14)" stroke-width="${stroke}"/>
  <g transform="translate(${off} ${off}) scale(${scale})"><path d="${M_LEFT}" fill="${PAPER}"/><path d="${M_RIGHT}" fill="${LIME}"/></g>
</svg>`;
};

const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><rect width="64" height="64" rx="14" fill="${INK}"/><g transform="translate(6.4 6.4) scale(0.8)"><path d="${M_LEFT}" fill="${PAPER}"/><path d="${M_RIGHT}" fill="${LIME}"/></g></svg>`;

const lockup = ({ paper = PAPER, sub = STEEL } = {}) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 88" width="420" height="88" role="img" aria-label="MARKOV MADE GYM">
  <g transform="translate(8 20) scale(0.75)"><path d="${M_LEFT}" fill="${paper}"/><path d="${M_RIGHT}" fill="${LIME}"/></g>
  <text x="84" y="45" fill="${paper}" font-family="Inter, 'Segoe UI', system-ui, sans-serif" font-size="30" font-weight="760" letter-spacing="-0.6">MARKOV MADE</text>
  <text x="84" y="72" fill="${sub}" font-family="Inter, 'Segoe UI', system-ui, sans-serif" font-size="17" font-weight="620" letter-spacing="7.4">GYM</text>
</svg>`;

await writeFile(`${dir}/mark.svg`, mark());
await writeFile(`${dir}/mark-on-dark.svg`, mark());
await writeFile(`${dir}/mark-on-light.svg`, mark({ paper: '#111A22', lime: '#3F7A18' }));
await writeFile(`${dir}/mark-analytics.svg`, mark({ steel: STEEL }));
await writeFile(`${dir}/lockup.svg`, lockup());
await writeFile(`${dir}/lockup-dark.svg`, lockup());
await writeFile(`${dir}/lockup-light.svg`, lockup({ paper: '#111A22', sub: '#4C6070' }));
await writeFile(`${dir}/favicon.svg`, favicon);
await writeFile(`${dir}/icon-512.svg`, plate(512));

const html = (body, w, h, transparent = false) => `<!doctype html><html><head><meta charset="utf-8"><style>
  html,body{margin:0;padding:0;width:${w}px;height:${h}px;background:${transparent ? 'transparent' : INK};overflow:hidden}
  svg{display:block;width:100%;height:100%}
</style></head><body>${body}</body></html>`;

await writeFile(`${rasterDir}/_raster-512.html`, html(plate(512), 512, 512));
await writeFile(`${rasterDir}/_raster-192.html`, html(plate(192), 192, 192));
await writeFile(`${rasterDir}/_raster-maskable.html`, html(plate(512), 512, 512));
await writeFile(`${rasterDir}/_raster-180.html`, html(plate(180), 180, 180));

const og = `<!doctype html><html><head><meta charset="utf-8"><style>
  html,body{margin:0;width:1200px;height:630px;background:${INK};overflow:hidden;
    font-family:Inter,'Segoe UI',system-ui,sans-serif;color:${PAPER}}
  .wrap{position:relative;width:100%;height:100%;box-sizing:border-box;padding:62px 84px 150px;
    background:
      radial-gradient(760px 420px at 82% 8%, rgba(190,244,125,.12), transparent 68%),
      radial-gradient(620px 420px at 4% 106%, rgba(139,191,209,.10), transparent 66%),
      ${INK}}
  .grid{position:absolute;inset:0;background-image:linear-gradient(rgba(244,247,245,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(244,247,245,.05) 1px,transparent 1px);background-size:60px 60px;mask-image:linear-gradient(160deg,#000,transparent 62%)}
  .row{position:relative;display:flex;align-items:center;gap:22px}
  .mark{width:74px;height:74px}
  .name{font-size:29px;font-weight:780;letter-spacing:-.4px;line-height:1}
  .name span{display:block;margin-top:9px;font-size:15px;font-weight:640;letter-spacing:8px;color:${STEEL}}
  h1{position:relative;margin:58px 0 0;font-size:64px;line-height:1.02;letter-spacing:-2.6px;font-weight:790;max-width:880px}
  h1 em{font-style:normal;color:${LIME}}
  p{position:relative;margin:26px 0 0;font-size:23px;line-height:1.45;color:#C7D2DC;max-width:700px;font-weight:480}
  .foot{position:absolute;left:84px;right:84px;bottom:62px;display:flex;justify-content:space-between;align-items:center;font-size:20px;color:#8FA0AF}
  .bar{display:flex;gap:8px}
  .bar i{display:block;width:44px;height:6px;border-radius:3px;background:${LIME}}
  .bar i:nth-child(2){opacity:.55}.bar i:nth-child(3){opacity:.28}
</style></head><body><div class="wrap"><div class="grid"></div>
  <div class="row"><svg class="mark" viewBox="0 0 64 64"><path d="${M_LEFT}" fill="${PAPER}"/><path d="${M_RIGHT}" fill="${LIME}"/></svg>
    <div class="name">MARKOV MADE<span>GYM</span></div></div>
  <h1>Тренировки, питание<br>и анализы — <em>в одном</em><br>браузерном приложении</h1>
  <p>1 324 упражнения, Run Mode, прогрессия и анализы.<br>Без аккаунта — данные остаются на устройстве.</p>
  <div class="foot"><span>castefeudal.github.io/gymdo</span><div class="bar"><i></i><i></i><i></i></div></div>
</div></body></html>`;
await writeFile(`${rasterDir}/_raster-og.html`, og);
console.log('brand sources written');