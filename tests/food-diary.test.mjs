import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cleanFoodDiary,emptyFoodDiary,foodTotals,foodPeriod,recipeFromEntries} from '../src/features/nutrition/food-model.mjs';
import {validateBackupField} from '../src/features/backup/backup-fields.mjs';
const food={id:'oats',name:'Label oats',portion:50,calories:370,protein:13,fat:7,carbs:60,source:'User label',favorite:true};
const row={id:'entry1',date:'2026-10-25',meal:'breakfast',grams:50,food};
test('food gram/serving totals and saved recipe preserve the measured composition',()=>{
 assert.deepEqual(foodTotals([row]),{calories:185,protein:6.5,fat:3.5,carbs:30});
 const recipe=recipeFromEntries([row],'Breakfast','recipe1');assert.equal(recipe.portion,50);assert.equal(recipe.calories,370);
 assert.equal(cleanFoodDiary({...emptyFoodDiary(),products:[food],entries:[row]}).entries[0].food.calories,370);
});
test('food backup validates atomically and preserves independent historical snapshots',()=>{
 const state={...emptyFoodDiary(),products:[{...food,calories:400}],entries:[row]};
 const restored=JSON.parse(validateBackupField('foodDiary',JSON.stringify(state)));assert.equal(restored.entries[0].food.calories,370);
 for(const invalid of [{...row,grams:0},{...row,date:'2026-02-30'},{...row,meal:'invalid'},{...row,food:{...food,protein:-1}}])assert.equal(cleanFoodDiary({...state,entries:[row,invalid]}),null);
 assert.equal(cleanFoodDiary({...state,entries:[row,row]}),null);
});
test('food periods use calendar boundaries including month transitions',()=>{
 assert.deepEqual(foodPeriod('2026-11-01','week'),['2026-10-26','2026-11-01']);
 assert.deepEqual(foodPeriod('2024-02-10','month'),['2024-02-01','2024-02-29']);
});
