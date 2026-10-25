import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createJournalWriter,beginJournalView} from '../src/features/journals/view-lifecycle.mjs';
test('failed journal writes roll back staged memory and allow a durable retry',async()=>{
 const values=new Map([['labs','[{"value":10}]']]);let fail=true;
 const save=createJournalWriter({read:key=>values.get(key),write:(key,value)=>{values.set(key,value);return true;},remove:key=>values.delete(key),flush:async()=>{if(fail){fail=false;throw Error('quota');}},persistent:()=>true});
 const operation=save('labs',[{value:20}]);await save.pending('labs');assert.equal(await operation,false);assert.equal(values.get('labs'),'[{"value":10}]');
 assert.equal(await save('labs',[{value:30}]),true);assert.equal(values.get('labs'),'[{"value":30}]');
});
test('memory-only journals cannot claim success and obsolete view listeners abort',async()=>{
 const values=new Map();const save=createJournalWriter({read:key=>values.get(key),write:(key,value)=>{values.set(key,value);return true;},remove:key=>values.delete(key),flush:async()=>{},persistent:()=>false});
 assert.equal(await save('food',{entries:[]}),false);assert.equal(values.has('food'),false);
 const host={},first=beginJournalView(host),second=beginJournalView(host);assert.equal(first.aborted,true);assert.equal(second.aborted,false);
});
