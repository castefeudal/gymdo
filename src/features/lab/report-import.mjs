import { LAB_MARKERS } from './results-model.mjs';
const aliases = { testosterone:['общий тестостерон','total testosterone','testosterone','тестостерон'], shbg:['shbg','гспг'], albumin:['albumin','альбумин'], lh:['lh','лг'], fsh:['fsh','фсг'], estradiol:['estradiol','эстрадиол'], prolactin:['prolactin','пролактин'], tsh:['tsh','ттг'], ft4:['free t4','свободный т4'], hemoglobin:['hemoglobin','haemoglobin','гемоглобин'], hematocrit:['hematocrit','гематокрит'], rbc:['rbc','эритроциты'], wbc:['wbc','лейкоциты'], platelets:['platelets','тромбоциты'], glucose:['glucose','глюкоза'], hba1c:['hba1c'], cholesterol:['total cholesterol','холестерин общий','общий холестерин'], ldl:['ldl','лпнп'], hdl:['hdl','лпвп'], triglycerides:['triglycerides','триглицериды'], alt:['alt','алт'], ast:['ast','аст'], creatinine:['creatinine','креатинин'], egfr:['egfr','скф'] };
// Suggestions are deliberately conservative: comparators and missing units are
// left in the raw text, never silently coerced into exact measured values.
export function reportSuggestions(text) {
  const found=[];
  for(const line of text.split(/\n/)) {
    const lower=line.toLocaleLowerCase();
    const matches=Object.entries(aliases).flatMap(([marker,names])=>names.filter(name=>lower.includes(name)).map(name=>({marker,name}))).sort((a,b)=>b.name.length-a.name.length);
    if(!matches.length)continue;
    const {marker,name}=matches[0], definition=LAB_MARKERS.find(item=>item[0]===marker);
    const tail=line.slice(lower.indexOf(name)+name.length).trim();
    if(/^[<>≤≥]/.test(tail))continue;
    const value=/^[\s:]*([0-9]+(?:[.,][0-9]+)?)\s/.exec(tail+' ');
    if(!value)continue;
    const unit=definition[3].find(unit=>tail.toLowerCase().includes(unit.toLowerCase()));
    if(!unit)continue;
    found.push({marker,value:Number(value[1].replace(',','.')),unit,source:line.slice(0,500)});
  }
  return found.slice(0,500);
}
export async function extractReport(file,{ocr=false,progress=()=>{}}={}) {
  if(file.size>15*1024*1024)throw Error('15 MB');
  const base=new URL('assets/vendor/',document.baseURI);
  let worker=null,documentTask=null;
  const recognize=async image=>{
    if(!worker){const api=await import(new URL('tesseract/tesseract.esm.min.js',base).href);worker=await api.default.createWorker('eng+rus',1,{workerPath:new URL('tesseract/worker.min.js',base).href,corePath:new URL('tesseract/',base).href,langPath:new URL('tessdata/',base).href,workerBlobURL:false});}
    return (await worker.recognize(image)).data.text;
  };
  try {
    if(file.type.startsWith('image/')){if(!ocr)throw Error('OCR');return await recognize(file);}
    const pdf=await import(new URL('pdfjs/pdf.mjs',base).href);
    pdf.GlobalWorkerOptions.workerSrc=new URL('pdfjs/pdf.worker.mjs',base).href;
    documentTask=pdf.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false,useSystemFonts:true});
    const doc=await documentTask.promise;
    if(doc.numPages>20)throw Error('20 pages');
    const pages=[];
    for(let index=1;index<=doc.numPages;index++){
      progress(index,doc.numPages);
      const page=await doc.getPage(index),content=await page.getTextContent();
      let text='',y=null;
      for(const item of content.items){if(y!==null&&Math.abs(item.transform[5]-y)>3)text+='\n';text+=item.str+' ';y=item.transform[5];if(item.hasEOL)text+='\n';}
      if(text.trim().length<20&&ocr){if(index>5)throw Error('OCR: 5 pages');const viewport=page.getViewport({scale:1.8}),canvas=document.createElement('canvas');canvas.width=Math.min(2400,viewport.width);canvas.height=Math.round(viewport.height*canvas.width/viewport.width);const scaled=page.getViewport({scale:1.8*canvas.width/viewport.width});await page.render({canvasContext:canvas.getContext('2d'),viewport:scaled}).promise;text=await recognize(canvas);canvas.width=canvas.height=0;}
      pages.push(text);page.cleanup();
    }
    return pages.join('\n\n');
  }finally{if(worker)await worker.terminate();if(documentTask)await documentTask.destroy();}
}
