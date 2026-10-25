import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {normalizeText,formatDateLabel,transliterateRu,compareText} from '../src/app/text-utils.mjs';
const original=value=>String(value==null?'':value).toLowerCase().replace(/\u0451/g,'\u0435').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const originalMap={'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ы':'y','э':'e','ю':'yu','я':'ya','ь':'','ъ':''};
const originalTransliteration=value=>original(value).split('').map(character=>Object.hasOwn(originalMap,character)?originalMap[character]:character).join('');

test('fast normalization preserves Unicode, punctuation and scalar behavior',()=>{
 for(const value of [null,undefined,0,-1,123.45,NaN,'A  test, & 123!','ЁЖИК — подъём','Її Єє Іі Ӂӂ \u0482','Été e\u0301','汉字 العربية 𝕒 𝟡 Ⅷ','😀test\u200dtext','\0\r\n Привет\tworld ',{},['а','b']])assert.equal(normalizeText(value),original(value));
});

test('search normalization and transliteration preserve every authored catalog and content string',async()=>{
 let count=0;
 function visit(value){if(typeof value==='string'){assert.equal(normalizeText(value),original(value));assert.equal(transliterateRu(value),originalTransliteration(value));count++;}else if(value&&typeof value==='object')Object.values(value).forEach(visit);}
 for(const file of ['data/exercise-catalog.json','data/content.json'])visit(JSON.parse(await readFile(new URL('../'+file,import.meta.url),'utf8')));
 assert.ok(count>3000);
});

test('cached dates preserve locale, local calendar days and timezone/DST changes',()=>{
 const previous=process.env.TZ;
 try{
  for(const zone of ['UTC','Europe/Minsk','America/New_York','Pacific/Auckland','Asia/Kathmandu']){
   process.env.TZ=zone;
   for(const time of ['2026-03-08T06:30:00Z','2026-03-29T23:30:00Z','2026-10-04T21:30:00Z','2026-11-01T05:30:00Z','2028-02-29T23:45:00Z'])for(const lang of ['ru','en','ru']){
    const date=new Date(time);
    assert.equal(formatDateLabel(lang,date),new Intl.DateTimeFormat(lang==='en'?'en-GB':'ru-RU',{weekday:'long',day:'numeric',month:'long'}).format(date));
   }
  }
  assert.throws(()=>formatDateLabel('ru',new Date(NaN)),RangeError);
 }finally{if(previous===undefined)delete process.env.TZ;else process.env.TZ=previous;}
});

test('cached locale collation preserves the complete exercise name ordering',async()=>{
 const catalog=JSON.parse(await readFile(new URL('../data/exercise-catalog.json',import.meta.url),'utf8'));
 const names=catalog.x.flatMap(record=>[record[1],record[2]]).concat(['A','a','a10','a2','Été','Ёж','Їжак','汉字']);
 for(const lang of ['ru','en','ru'])assert.deepEqual(names.toSorted((a,b)=>compareText(a,b,lang)),names.toSorted((a,b)=>a.localeCompare(b,lang)));
});
