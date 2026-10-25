export const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'];
export const MACROS = ['calories', 'protein', 'fat', 'carbs'];
export const emptyFoodDiary = () => ({ products: [], recipes: [], entries: [] });
export function validFoodDate(date) {
  return typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date;
}
const idOK = id => typeof id === 'string' && /^[\w-]{1,80}$/.test(id);
const amount = (value, max) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= max;
function cleanFood(item) {
  if (!item || !idOK(item.id) || typeof item.name !== 'string' || !item.name.trim() || item.name.length > 160 || !MACROS.every(key => amount(item[key], key === 'calories' ? 1000 : 100)) || !amount(item.portion, 10000) || item.portion === 0) return null;
  return { id: item.id, name: item.name.trim(), portion: item.portion, ...Object.fromEntries(MACROS.map(key => [key, item[key]])), source: String(item.source || '').slice(0, 500), favorite: !!item.favorite };
}
export function cleanFoodDiary(value) {
  if (!value || !['products', 'recipes', 'entries'].every(key => Array.isArray(value[key])) || value.products.length > 5000 || value.recipes.length > 5000 || value.entries.length > 100000) return null;
  const products = value.products.map(cleanFood), recipes = value.recipes.map(cleanFood);
  if (products.includes(null) || recipes.includes(null)) return null;
  const ids = new Set();
  for (const food of [...products, ...recipes]) { if (ids.has(food.id)) return null; ids.add(food.id); }
  const entries = [];
  ids.clear();
  for (const row of value.entries) {
    const food = cleanFood(row?.food);
    if (!row || !food || !idOK(row.id) || ids.has(row.id) || !validFoodDate(row.date) || !MEALS.includes(row.meal) || !amount(row.grams, 10000) || row.grams === 0) return null;
    ids.add(row.id);
    entries.push({ id: row.id, date: row.date, meal: row.meal, grams: row.grams, food });
  }
  return { products, recipes, entries };
}
export function foodTotals(entries) {
  return Object.fromEntries(MACROS.map(key => [key, Math.round(entries.reduce((sum, row) => sum + row.food[key] * row.grams / 100, 0) * 10) / 10]));
}
export function recipeFromEntries(entries, name, id) {
  const grams = entries.reduce((sum, row) => sum + row.grams, 0);
  if (!grams || !name?.trim()) return null;
  const totals = foodTotals(entries);
  return cleanFood({ id, name, portion: grams, favorite: true, source: entries.map(row => `${row.food.name}: ${row.grams} g`).join('; '), ...Object.fromEntries(MACROS.map(key => [key, totals[key] * 100 / grams])) });
}
export function foodPeriod(date, period) {
  const end = new Date(date + 'T12:00:00Z'), start = new Date(end);
  if (period === 'week') start.setUTCDate(start.getUTCDate() - (start.getUTCDay() + 6) % 7);
  if (period === 'month') start.setUTCDate(1);
  if (period === 'week') { end.setTime(start.getTime()); end.setUTCDate(start.getUTCDate() + 6); }
  if (period === 'month') { end.setUTCMonth(end.getUTCMonth() + 1, 0); }
  return [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)];
}
