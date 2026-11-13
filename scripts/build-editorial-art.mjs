import { writeFile } from 'node:fs/promises';

// Original, deterministic vector plates. No external images or exercise media.
const plates = {
  home: `<g transform="translate(210 128) rotate(-18)"><path d="M-100 76V-80h32L0 12 68-80h32V76H65V-12L0 67-65-12v88Z" fill="url(#metal)" stroke="#c9d1cd"/><path d="m0 67 14 13 65-79-14-13Z" fill="#bef47d"/></g>`,
  workout: Array.from({length:7},(_,i)=>`<ellipse cx="210" cy="125" rx="${40+i*13}" ry="${78+i*2}" transform="rotate(-32 210 125)" fill="none" stroke="${i===3?'#bef47d':'#8e9995'}" stroke-width="${i===3?8:3}"/>`).join(''),
  library: `<g fill="none" stroke="#aeb9b2" stroke-width="2"><path d="M210 32v176M146 78l64-30 64 30-21 72-43 42-43-42Z"/><ellipse cx="210" cy="124" rx="92" ry="82"/><ellipse cx="210" cy="124" rx="44" ry="104" transform="rotate(40 210 124)"/><path d="M104 124h212M136 62l148 124M136 186 284 62" stroke-dasharray="3 6"/></g><circle cx="210" cy="124" r="12" fill="#bef47d"/>`,
  program: Array.from({length:5},(_,i)=>`<path d="m${92+i*30} ${164-i*20} 65 32 108-105-65-32Z" fill="${i===3?'#bef47d':'url(#metal)'}" stroke="#8e9995" stroke-width="1"/>`).join(''),
  nutrition: `<g transform="translate(210 125) rotate(-25)" fill="none" stroke-width="19"><circle r="78" stroke="#495451"/><circle r="78" stroke="#bcc7bd" stroke-dasharray="210 490"/><circle r="52" stroke="#78857d" stroke-dasharray="220 327"/><circle r="26" stroke="#bef47d" stroke-dasharray="114 164"/></g>`,
  progress: `<g fill="none"><path d="M90 192h240M90 142h240M90 92h240M90 42h240" stroke="#535f59" stroke-dasharray="2 7"/><path d="m92 183 48-22 43 8 47-59 46 10 52-82" stroke="url(#metal)" stroke-width="12"/><path d="m92 183 48-22 43 8 47-59 46 10 52-82" stroke="#bef47d" stroke-width="2"/><circle cx="328" cy="38" r="6" fill="#bef47d"/></g>`,
  labs: `<g transform="translate(210 125) rotate(24)" fill="none" stroke="url(#metal)" stroke-width="10"><ellipse rx="110" ry="42"/><ellipse rx="110" ry="42" transform="rotate(60)"/><ellipse rx="110" ry="42" transform="rotate(120)"/></g><circle cx="210" cy="125" r="12" fill="#bef47d"/>`,
};
for (const [name, art] of Object.entries(plates)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 250"><defs><linearGradient id="metal" x2=".9" y2="1"><stop stop-color="#303b36"/><stop offset=".28" stop-color="#ecf1e9"/><stop offset=".48" stop-color="#73817a"/><stop offset=".7" stop-color="#303c36"/><stop offset=".84" stop-color="#cad3cc"/><stop offset="1" stop-color="#626d67"/></linearGradient></defs><g opacity=".3" stroke="#859287" fill="none"><path d="M20 20h28M20 20v28M400 20h-28M400 20v28M20 230h28M20 230v-28M400 230h-28M400 230v-28"/><path d="M210 12v12M210 226v12M8 125h12M400 125h12"/></g>${art}</svg>`;
  await writeFile(new URL(`../assets/visual/plate-${name}.svg`, import.meta.url), svg);
}
console.log('Seven original editorial plates built.');
