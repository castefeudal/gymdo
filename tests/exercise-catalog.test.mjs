import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {decodeCompactExercises} from '../src/data/exercise-repository.mjs';
test('light catalog and deferred instructions exactly reconstruct all source exercises',async()=>{
 const read=async file=>JSON.parse(await readFile(new URL('../data/'+file,import.meta.url),'utf8'));
 const full=await read('exercises-compact.json'),catalog=await read('exercise-catalog.json'),details=await read('exercise-details.json');
 const decoded=decodeCompactExercises(catalog);
 assert.equal(decoded.length,1324);
 for(const ex of decoded){[ex.stepsEn,ex.stepsRu]=details[ex.id];}
 assert.deepEqual(decoded,decodeCompactExercises(full));
 assert.ok(JSON.stringify(catalog).length<JSON.stringify(full).length/4);
});
