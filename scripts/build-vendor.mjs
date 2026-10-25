import { mkdir, copyFile, readdir, readFile, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
const copy = async (from, to) => { await mkdir(to.slice(0,to.lastIndexOf('/')), {recursive:true}); await copyFile(from,to); };
for(const subset of ['latin','cyrillic','latin-ext']) await copy(`node_modules/@fontsource-variable/inter/files/inter-${subset}-wght-normal.woff2`,`assets/fonts/inter-${subset}.woff2`);
await copy('node_modules/@fontsource-variable/inter/LICENSE','assets/fonts/OFL.txt');
for(const file of ['pdf.mjs','pdf.worker.mjs']) await copy(`node_modules/pdfjs-dist/build/${file}`,`assets/vendor/pdfjs/${file}`);
await copy('node_modules/pdfjs-dist/LICENSE','assets/vendor/pdfjs/LICENSE');
for(const file of ['tesseract.esm.min.js','tesseract.min.js','worker.min.js','tesseract.min.js.LICENSE.txt','worker.min.js.LICENSE.txt']) await copy(`node_modules/tesseract.js/dist/${file}`,`assets/vendor/tesseract/${file}`);
await copy('node_modules/tesseract.js/LICENSE.md','assets/vendor/tesseract/LICENSE.md');
for(const file of await readdir('node_modules/tesseract.js-core')) if(/-lstm\.wasm\.js$/.test(file))await copy(`node_modules/tesseract.js-core/${file}`,`assets/vendor/tesseract/${file}`);
await copy('node_modules/tesseract.js-core/LICENSE','assets/vendor/tesseract/CORE-LICENSE');
// Language data is pinned in the repository; never download models during a user session.
for(const lang of ['eng','rus']) {
  const file=`assets/vendor/tessdata/${lang}.traineddata.gz`;
  try{await readFile(file);}catch{
    const response=await fetch(`https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/main/${lang}.traineddata`);
    if(!response.ok)throw Error('Cannot obtain OCR language data');
    await mkdir('assets/vendor/tessdata',{recursive:true});
    await writeFile(file,gzipSync(Buffer.from(await response.arrayBuffer())));
  }
}
await copy('node_modules/tesseract.js-core/LICENSE','assets/vendor/tessdata/LICENSE');
console.log('Local fonts, PDF and OCR assets ready.');
