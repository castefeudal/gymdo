/**
 * Language-aware counting: Russian needs three plural forms, English two.
 * A catalogue is keyed by language so callers never build strings inline.
 */
export function pluralize(count, forms, lang = 'ru') {
  const n = Math.abs(Number(count) || 0);
  const list = forms[lang] || forms.ru;
  if (!list) return String(n);
  if (lang === 'en') return n === 1 ? list[0] : (list[1] || list[0]);
  const tail = n % 100;
  const last = n % 10;
  if (tail > 10 && tail < 20) return list[2];
  if (last > 1 && last < 5) return list[1];
  if (last === 1) return list[0];
  return list[2];
}

export const COUNT_FORMS = Object.freeze({
  exercise: { ru: ['упражнение', 'упражнения', 'упражнений'], en: ['exercise', 'exercises'] },
  set: { ru: ['подход', 'подхода', 'подходов'], en: ['set', 'sets'] },
  rep: { ru: ['повтор', 'повтора', 'повторов'], en: ['rep', 'reps'] },
  day: { ru: ['день', 'дня', 'дней'], en: ['day', 'days'] },
  week: { ru: ['неделя', 'недели', 'недель'], en: ['week', 'weeks'] },
  entry: { ru: ['запись', 'записи', 'записей'], en: ['entry', 'entries'] },
  measurement: { ru: ['измерение', 'измерения', 'измерений'], en: ['measurement', 'measurements'] },
});

export function countPhrase(count, kind, lang = 'ru') {
  const n = Number(count) || 0;
  const forms = COUNT_FORMS[kind];
  if (!forms) return String(n);
  return `${n} ${pluralize(n, forms, lang)}`;
}