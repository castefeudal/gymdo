import {test} from 'node:test';
import assert from 'node:assert/strict';
import {reportSuggestions} from '../src/features/lab/report-import.mjs';
import {labTrend,labChange,freeTestosterone} from '../src/features/lab/trend-model.mjs';
test('report suggestions require exact values and known units, never coerce inequalities',()=>{
 assert.deepEqual(reportSuggestions('Total testosterone 13.1 nmol/L\nГлюкоза 5,2 mmol/L').map(row=>row.value),[13.1,5.2]);
 assert.equal(reportSuggestions('Testosterone <0.1 nmol/L\nTestosterone 5 unknown').length,0);
 assert.equal(reportSuggestions('Testosterone: <0.1 nmol/L\nGlucose 5 unknown; reference mmol/L\nALTITUDE 5 U/L').length,0);
 assert.equal(reportSuggestions('Free testosterone 15 pg/mL')[0].marker,'freeTestosterone');
 assert.equal(reportSuggestions('Calculated free testosterone 15 pg/mL\nРасчётный свободный тестостерон 15 pg/mL').length,0);
 assert.equal(reportSuggestions('Testosterone 5 nmol/Lextra').length,0);
});
test('lab trend separates methods/laboratories and does not convert incompatible assays',()=>{
 const rows=[{marker:'prolactin',value:10,unit:'ng/mL',laboratory:'A',method:'x',date:'2026-10-01',time:''},{marker:'prolactin',value:200,unit:'mIU/L',laboratory:'A',method:'x',date:'2026-10-02',time:''}];
 assert.equal(labTrend(rows,'prolactin').length,2);
 const unknown=rows.map((row,i)=>({...row,id:String(i),unit:'ng/mL',laboratory:'',method:''}));
 assert.equal(labTrend(unknown,'prolactin').length,2);
});
test('Vermeulen estimate agrees with published ISSAM example and rejects missing inputs',()=>{
 assert.ok(Math.abs(freeTestosterone(13.1,50,43)-202)<2);
 for(const inputs of [[0,50,43],[13.1,0,43],[13.1,50,NaN],[13.1,50,0]])assert.equal(freeTestosterone(...inputs),null);
});
test('relative change requires comparable provenance and a nonzero baseline',()=>{
 const before={marker:'glucose',value:100,unit:'mg/dL',laboratory:'A',method:'x'};
 const after={...before,value:6.66,unit:'mmol/L'};
 const change=labChange(after,before);
 assert.ok(Math.abs(change.absolute-1.11)<1e-9);
 assert.ok(Math.abs(change.relative-20)<1e-9);
 assert.equal(labChange({...after,laboratory:''},before),null);
 assert.equal(labChange({...after,method:'other'},before),null);
 assert.equal(labChange({...before,value:2},{...before,value:0}).relative,null);
 assert.equal(labChange({...before,marker:'prolactin',unit:'ng/mL'},{...before,marker:'prolactin',unit:'mIU/L'}),null);
});
