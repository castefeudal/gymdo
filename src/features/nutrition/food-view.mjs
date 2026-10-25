import { MEALS, MACROS, emptyFoodDiary, cleanFoodDiary, foodTotals, recipeFromEntries, foodPeriod } from './food-model.mjs';

export function renderFoodDiary({ host, read, write, lang, esc, today, publishDay, weights, target }) {
  const t = (ru, en) => lang === 'en' ? en : ru;
  host.setAttribute('aria-label',t('Дневник продуктов','Food diary'));
  let state = cleanFoodDiary(read() || emptyFoodDiary());
  if (!state) { host.textContent = t('Данные повреждены. Сохрани резервную копию в настройках.', 'Invalid data. Export a backup in Settings.'); return; }
  const labels = [t('Завтрак', 'Breakfast'), t('Обед', 'Lunch'), t('Ужин', 'Dinner'), t('Перекус', 'Snack')];
  const nutrients = [t('Ккал', 'kcal'), t('Белки, г', 'Protein, g'), t('Жиры, г', 'Fat, g'), t('Углеводы, г', 'Carbs, g')];
  const input = (name, label, type = 'text', extra = '') => `<label>${label}<input class="input" name="${name}" type="${type}" ${extra}></label>`;
  host.innerHTML = `<div class="food-heading"><p class="eyebrow">${t('Продукты · блюда · история', 'Foods · meals · history')}</p><h2>${t('Мой рацион', 'My food diary')}</h2><p class="lede">${t('Сохрани данные с этикетки один раз. Добавляй граммы или привычную порцию.', 'Save label values once. Log grams or your usual serving.')}</p></div>
  <div class="food-toolbar">${input('day', t('Дата', 'Date'), 'date', `required value="${today}"`)}<label>${t('Период', 'Period')}<select class="input" name="period"><option value="day">${t('День', 'Day')}</option><option value="week">${t('Неделя', 'Week')}</option><option value="month">${t('Месяц', 'Month')}</option></select></label><label>${t('Приём пищи', 'Meal')}<select class="input" name="meal">${MEALS.map((key, i) => `<option value="${key}">${labels[i]}</option>`).join('')}</select></label></div>
  <p role="status" data-food-status></p><div class="food-layout"><div><div class="panel"><h3>${t('Каталог', 'Catalog')}</h3>${input('search', t('Найти продукт или блюдо', 'Search foods or meals'), 'search')}<label class="food-check"><input name="favorites" type="checkbox">${t('Только избранное', 'Favorites only')}</label><div data-food-catalog></div></div>
  <details class="panel" data-food-product><summary>${t('Создать или изменить продукт', 'Create or edit food')}</summary><form data-food-create><input name="id" type="hidden">${input('name', t('Название', 'Name'), 'text', 'required maxlength="160"')}<p class="small">${t('На 100 г · введено пользователем с этикетки', 'Per 100 g · user-entered label values')}</p><div class="food-pair">${MACROS.map((key, i) => input(key, nutrients[i], 'number', `required min="0" max="${key === 'calories' ? 1000 : 100}" step="any"`)).join('')}</div>${input('portion', t('Обычная порция, г', 'Usual serving, g'), 'number', 'required min="0.1" max="10000" step="any" value="100"')}${input('source', t('Источник / этикетка', 'Source / label'), 'text', 'required maxlength="500"')}<div class="food-pair"><button class="btn btn-primary" type="submit">${t('Сохранить продукт', 'Save food')}</button><button class="btn btn-quiet" type="reset">${t('Новый продукт', 'New food')}</button></div></form></details></div>
  <div><div class="panel"><h3>${t('Добавить в дневник', 'Log food')}</h3><form data-food-add><input name="entry" type="hidden"><label>${t('Продукт или блюдо', 'Food or meal')}<select name="food" class="input" required></select></label><div class="food-pair">${input('amount', t('Количество', 'Amount'), 'number', 'required min="0.1" max="10000" step="any" value="100"')}<label>${t('Единица', 'Unit')}<select name="unit" class="input"><option value="grams">${t('Граммы', 'Grams')}</option><option value="servings">${t('Порции', 'Servings')}</option></select></label></div><p class="small" data-food-preview></p><button class="btn btn-primary" type="submit">${t('Записать', 'Log food')}</button></form></div>
  <div class="panel"><h3>${t('Дневник и итоги', 'Diary and totals')}</h3><div data-food-summary></div><div class="food-actions"><button class="btn btn-quiet" data-food-repeat type="button">${t('Повторить прошлый приём', 'Repeat previous meal')}</button><button class="btn btn-quiet" data-food-recipe type="button">${t('Сохранить приём как блюдо', 'Save meal as recipe')}</button><button class="btn btn-primary" data-food-publish type="button">${t('День заполнен · обновить аналитику', 'Day complete · update analytics')}</button></div><p class="small">${t('Итог дня переносится в аналитику только по этой кнопке. Пустые дни не считаются нулевым потреблением.', 'Daily totals enter analytics only with this button. Missing days are not treated as zero intake.')}</p><div data-food-entries></div></div></div></div>`;
  const q = selector => host.querySelector(selector);
  const get = name => host.querySelector(`[name="${name}"]`);
  const status = q('[data-food-status]');
  const form = q('[data-food-add]'), productForm = q('[data-food-create]');
  let busy = false, editingFood = null;
  async function save(next) {
    if (busy || !cleanFoodDiary(next)) return false;
    busy = true; host.setAttribute('aria-busy', 'true');
    try {
      if (!await write(next)) throw Error();
      state = next; status.textContent = t('Сохранено на устройстве.', 'Saved on this device.'); render(); return true;
    } catch { status.textContent = t('Не удалось сохранить. Ввод сохранён в форме; повтори попытку.', 'Could not save. Your input remains in the form; try again.'); return false; }
    finally { busy = false; host.setAttribute('aria-busy', 'false'); }
  }
  const foodById = id => [...state.products, ...state.recipes].find(food => food.id === id);
  const dayEntries = () => state.entries.filter(row => row.date === get('day').value);
  const chosenMeal = () => dayEntries().filter(row => row.meal === get('meal').value);
  const line = totals => MACROS.map((key, i) => `${totals[key]} ${nutrients[i]}`).join(' · ');
  function preview() {
    const food = editingFood?.id === form.elements.food.value ? editingFood : foodById(form.elements.food.value);
    const grams = Number(form.elements.amount.value) * (form.elements.unit.value === 'servings' ? food?.portion || 0 : 1);
    q('[data-food-preview]').textContent = food ? `${Math.round(grams * 10) / 10} g · ${line(foodTotals([{ food, grams }]))}` : t('Сначала создай продукт с данными с этикетки.', 'Create a food using its label values first.');
  }
  function render() {
    const selected = form.elements.food.value;
    const foods = [...state.products, ...state.recipes];
    form.elements.food.innerHTML = foods.map(food => `<option value="${food.id}">${esc(food.name)}${state.recipes.includes(food) ? ' · '+t('блюдо','recipe') : ''}</option>`).join('');
    if (foods.some(food => food.id === selected)) form.elements.food.value = selected;
    const query = get('search').value.toLocaleLowerCase();
    const visible = foods.filter(food => food.name.toLocaleLowerCase().includes(query) && (!get('favorites').checked || food.favorite));
    q('[data-food-catalog]').innerHTML = visible.slice(0, 100).map(food => `<article class="food-item"><button class="btn btn-quiet" data-food-select="${food.id}" type="button">${esc(food.name)}</button><p class="small">${line(food)} / 100 g · ${t('Введено пользователем', 'User entered')}</p><p class="small">${esc(food.source)}</p><div class="food-actions"><button class="btn btn-quiet" data-food-favorite="${food.id}" aria-pressed="${food.favorite}" type="button">${t('Избранное','Favorite')}</button><button class="btn btn-quiet" data-food-edit="${food.id}" type="button">${t('Изменить','Edit')}</button><button class="btn btn-quiet" data-food-remove="${food.id}" type="button">${t('Удалить','Delete')}</button></div></article>`).join('') || `<p class="empty">${t('Продуктов пока нет. Добавь первый по этикетке — без вымышленных пищевых значений.', 'No foods yet. Add your first label — no invented nutrition values.')}</p>`;
    const [start, end] = foodPeriod(get('day').value || today, get('period').value);
    const entries = state.entries.filter(row => row.date >= start && row.date <= end);
    const dates = [...new Set(entries.map(row => row.date))].sort().reverse(), totals = foodTotals(entries);
    const measured = weights.filter(row => row.date >= start && row.date <= end && Number(row.weight) > 0).sort((a,b)=>a.date.localeCompare(b.date));
    const weightText = measured.length >= 2 ? `${measured[0].weight} → ${measured.at(-1).weight} kg (${measured[0].date} – ${measured.at(-1).date})` : t('Для динамики веса нужны два измерения.', 'Weight trend needs two measurements.');
    q('[data-food-summary]').innerHTML = `<p class="food-total num">${line(totals)}</p><p>${t('Дней с записями','Days with entries')}: ${dates.length}. ${t('Среднее по записанным дням','Average per recorded day')}: ${dates.length ? `${Math.round(totals.calories/dates.length)} kcal · ${Math.round(totals.protein/dates.length)} g ${t('белка','protein')}` : '—'}.</p><p class="small">${esc(weightText)}</p><p class="small">${target ? `${t('План калорий','Calorie target')}: ${Math.round(target)} kcal. ` : ''}${t('Неполный дневник не позволяет оценить энергозатраты. Для коррекции цели используй сверку ниже и 2–3 недели полных данных.', 'Partial diaries cannot establish energy expenditure. Use the check-in below and 2–3 weeks of complete data before adjusting targets.')}</p>`;
    q('[data-food-entries]').innerHTML = dates.map(date => `<section class="food-day"><h4>${date}</h4>${MEALS.map((meal, i) => {
      const rows = entries.filter(row => row.date === date && row.meal === meal);
      return rows.length ? `<h5>${labels[i]} · ${foodTotals(rows).calories} kcal</h5>${rows.map(row => `<article class="food-entry"><div><strong>${esc(row.food.name)}</strong><p class="small">${row.grams} g · ${line(foodTotals([row]))}</p></div><div class="food-actions"><button type="button" class="btn btn-quiet" data-entry-edit="${row.id}">${t('Изменить','Edit')}</button><button type="button" class="btn btn-quiet" data-entry-remove="${row.id}">${t('Удалить','Delete')}</button></div></article>`).join('')}` : '';
    }).join('')}</section>`).join('') || `<p class="empty">${t('За этот период нет записей.', 'No entries in this period.')}</p>`;
    preview();
  }
  productForm.addEventListener('reset', () => { setTimeout(() => { productForm.elements.id.value = ''; }, 0); });
  productForm.addEventListener('submit', async event => {
    event.preventDefault(); if (busy) return;
    const item = Object.fromEntries(new FormData(productForm));
    item.id ||= crypto.randomUUID(); item.favorite = foodById(item.id)?.favorite || false;
    [...MACROS, 'portion'].forEach(key => item[key] = Number(item[key]));
    const key = state.recipes.some(food => food.id === item.id) ? 'recipes' : 'products';
    if (await save({ ...state, [key]: [...state[key].filter(food => food.id !== item.id), item] })) { productForm.reset(); form.elements.food.value = item.id; preview(); }
  });
  form.addEventListener('submit', async event => {
    event.preventDefault(); if(busy)return;
    const food = editingFood?.id === form.elements.food.value ? editingFood : foodById(form.elements.food.value), id = form.elements.entry.value || crypto.randomUUID();
    if(!food)return;
    const grams = Number(form.elements.amount.value) * (form.elements.unit.value === 'servings' ? food.portion : 1);
    const next = { ...state, entries: [...state.entries.filter(row => row.id !== id), {id, date:get('day').value, meal:get('meal').value, food:{...food}, grams}] };
    if(!cleanFoodDiary(next)){status.textContent=t('Проверь дату и граммовку до 10 000 г.','Check date and amount up to 10,000 g.');return;}
    if(await save(next)){form.elements.entry.value='';editingFood=null;}
  });
  host.addEventListener('input', event => { if(event.target===get('search'))render(); else if(form.contains(event.target))preview(); });
  host.addEventListener('change', event => { if(event.target===get('day')||event.target===get('period')||event.target===get('meal')||event.target===get('favorites'))render(); else preview(); });
  host.addEventListener('click', async event => {
    const b = event.target.closest('button'); if(!b||busy)return;
    if(b.dataset.foodSelect){ form.elements.food.value=b.dataset.foodSelect;form.elements.entry.value='';form.elements.amount.value=1;form.elements.unit.value='servings';preview();form.elements.amount.focus(); }
    if(b.dataset.foodFavorite){const id=b.dataset.foodFavorite;await save({...state,products:state.products.map(f=>f.id===id?{...f,favorite:!f.favorite}:f),recipes:state.recipes.map(f=>f.id===id?{...f,favorite:!f.favorite}:f)});}
    if(b.dataset.foodEdit){const food=foodById(b.dataset.foodEdit);Object.entries(food).forEach(([key,value])=>{if(productForm.elements[key])productForm.elements[key].value=value;});q('[data-food-product]').open=true;productForm.elements.name.focus();}
    if(b.dataset.foodRemove&&confirm(t('Удалить из каталога? История сохранится.','Remove from catalog? History will be retained.'))){const id=b.dataset.foodRemove;await save({...state,products:state.products.filter(f=>f.id!==id),recipes:state.recipes.filter(f=>f.id!==id)});}
    if(b.dataset.entryEdit){const row=state.entries.find(row=>row.id===b.dataset.entryEdit);get('day').value=row.date;get('meal').value=row.meal;form.elements.entry.value=row.id;editingFood={...row.food};render();if(!foodById(row.food.id))form.elements.food.add(new Option(row.food.name,row.food.id));form.elements.food.value=row.food.id;form.elements.unit.value='grams';form.elements.amount.value=row.grams;preview();form.elements.amount.focus();}
    if(b.dataset.entryRemove&&confirm(t('Удалить запись?','Delete entry?')))await save({...state,entries:state.entries.filter(row=>row.id!==b.dataset.entryRemove)});
    if(b.hasAttribute('data-food-repeat')){
      const prior=state.entries.filter(row=>row.meal===get('meal').value&&row.date<get('day').value).sort((a,b)=>b.date.localeCompare(a.date))[0];
      if(!prior){status.textContent=t('Нет предыдущего приёма этого типа.','No previous meal of this type.');return;}
      const copies=state.entries.filter(row=>row.date===prior.date&&row.meal===prior.meal).map(row=>({...row,id:crypto.randomUUID(),date:get('day').value}));
      if(confirm(t('Добавить предыдущий приём к выбранному дню?','Add the previous meal to the selected day?')))await save({...state,entries:[...state.entries,...copies]});
    }
    if(b.hasAttribute('data-food-recipe')){const name=prompt(t('Название блюда','Recipe name'));const recipe=recipeFromEntries(chosenMeal(),name,crypto.randomUUID());if(recipe)await save({...state,recipes:[...state.recipes,recipe]});}
    if(b.hasAttribute('data-food-publish')){
      const rows=dayEntries();if(!rows.length)return;
      if(!confirm(t('День заполнен полностью? Заменить итог в аналитике суммой этих записей?','Is this day complete? Replace its analytics total with these entries?')))return;
      busy=true;try{await publishDay(get('day').value,foodTotals(rows));status.textContent=t('Итог дня обновлён в аналитике.','Daily analytics updated.');}catch{status.textContent=t('Итог не сохранён. Повтори попытку.','Total not saved. Try again.');}finally{busy=false;}
    }
  });
  render();
}
