import { build } from 'esbuild';
import { readFile, writeFile, mkdir, readdir, unlink } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';
import { CORE_TRANSLATIONS, LEGACY_ENGLISH } from '../src/app/catalog.mjs';

// Audited retired markup keys. Keep source compatibility, omit them only when
// neither the generated view nor the application uses them anymore.
const retiredKeys = new Set('nav.muscles mnav.muscles mnav.library mnav.workout mnav.nutrition mnav.program mnav.faq mnav.contact hero.panelEyebrow hero.panelTitle hero.panelText mfb.found lead.goalPh lead.context lead.contextPh lead.contextHint lead.copy modal.steps musnav.frontAria musnav.backAria nav.gTools nav.gMethod nav.gAuthor nav.libraryS nav.workoutS nav.nutritionS nav.programS nav.progressS nav.methodS nav.knowledgeS nav.howS nav.aboutS nav.contactS nav.faqS mnav.progress mnav.method mnav.knowledge mnav.about console.disclaimer console.hint onb.eyebrow onb.title onb.text onb.skip onb.back modal.dose modal.swapT'.split(' '));
const activeCopy = await readFile(new URL('../ui.html', import.meta.url), 'utf8') + await readFile(new URL('../app.js', import.meta.url), 'utf8');
const retiredCoreKeys = new Set('leadTitle leadName leadContact leadFormat leadStart leadContext'.split(' '));
const productionCore = Object.fromEntries(Object.entries(CORE_TRANSLATIONS).filter(([key]) => !retiredCoreKeys.has(key) || activeCopy.includes(key)));
const productionEnglish = Object.fromEntries(Object.entries(LEGACY_ENGLISH).filter(([key]) => !Object.hasOwn(CORE_TRANSLATIONS, key) && (!retiredKeys.has(key) || activeCopy.includes(key))));

const directory = resolve('assets/runtime');
await mkdir(directory, { recursive: true });
// Delete only files produced by this build in the verified output directory.
for (const name of await readdir(directory)) {
  const target = resolve(directory, name);
  if (relative(directory, target).startsWith('..') || target === directory) throw new Error('Unsafe build path');
  if (/\.js$/.test(name)) await unlink(target);
}
const result = await build({
  entryPoints: { application: 'app.js' }, outdir: directory,
  bundle: true, splitting: true, format: 'esm', target: 'es2022',
  minify: true, metafile: true, legalComments: 'eof', charset: 'utf8',
  plugins: [{ name: 'resolved-catalog', setup(build) {
    // Resolve historical Object.assign overrides once during build. Runtime
    // receives exactly the same final entries without shipping superseded copy.
    build.onLoad({ filter: /[\\/]src[\\/]app[\\/]catalog\.mjs$/ }, () => ({
      contents: `export const CORE_TRANSLATIONS=Object.freeze(${JSON.stringify(productionCore)});export const LEGACY_ENGLISH=Object.freeze(${JSON.stringify(productionEnglish)});`,
      loader: 'js',
    }));
  } }, { name: 'shared-bootstrap', setup(build) {
    // Entry registers bootstrap first. Keep its ES module singleton, including
    // the service worker listeners, outside the application bundle.
    build.onResolve({ filter: /^\.\/bootstrap\.js$/ }, () => ({ path: '../../bootstrap.js', external: true }));
  } }],
});
const files = Object.keys(result.metafile.outputs).map(file => `./${relative(process.cwd(), file).split(sep).join('/')}`).sort();
const initial = new Set();
function visit(file){if(initial.has(file))return;initial.add(file);for(const dep of result.metafile.outputs[file]?.imports||[])if(!dep.external&&dep.kind!=='dynamic-import')visit(dep.path);}
visit('assets/runtime/application.js');
await writeFile('assets/runtime-metrics.json',JSON.stringify({initialFiles:[...initial].sort(),initialBytes:[...initial].reduce((sum,file)=>sum+(result.metafile.outputs[file]?.bytes||0),0),totalBytes:Object.values(result.metafile.outputs).reduce((sum,file)=>sum+file.bytes,0)},null,2)+'\n');
const template = await readFile(new URL('../src/app/service-worker.js', import.meta.url), 'utf8');
await writeFile(new URL('../sw.js', import.meta.url), template.replace('// GENERATED_RUNTIME_ASSETS', files.map(file => `  '${file}',`).join('\n')));
await writeFile(new URL('../assets/runtime-manifest.json', import.meta.url), JSON.stringify(files, null, 2) + '\n');
console.log(`Runtime built: ${files.length} modules, ${Object.values(result.metafile.outputs).reduce((sum, file) => sum + file.bytes, 0)} bytes`);
