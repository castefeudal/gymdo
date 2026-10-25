export function normalizeText(value) {
  const text=String(value==null?'':value).toLowerCase().replace(/\u0451/g,'\u0435');
  // Common RU/EN input avoids expensive Unicode property matching. All other
  // scripts retain the exact Unicode-letter/number behavior of the original.
  return (/^[\x00-\x7f\u0430-\u044f]*$/.test(text)
    ? text.replace(/[^a-z0-9\u0430-\u044f]+/g,' ')
    : text.replace(/[^\p{L}\p{N}]+/gu,' ')).trim();
}

const ruLatin=Object.freeze({'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ы':'y','э':'e','ю':'yu','я':'ya','ь':'','ъ':''});
export function transliterateRu(value) {
  return normalizeText(value).replace(/[а-яё]/g,character=>ruLatin[character]??character);
}

const dateFormatters=new Map();
const collators=new Map();
export function compareText(left,right,language) {
  const locale=language==='en'?'en':'ru';
  if(!collators.has(locale))collators.set(locale,new Intl.Collator(locale));
  return collators.get(locale).compare(left,right);
}
export function formatDateLabel(language,date=new Date()) {
  const locale=language==='en'?'en-GB':'ru-RU';
  if(!dateFormatters.has(locale))dateFormatters.set(locale,new Intl.DateTimeFormat(locale,{weekday:'long',day:'numeric',month:'long',timeZone:'UTC'}));
  // Convert this instant's local calendar fields to UTC before formatting.
  // The cached formatter therefore remains correct after timezone/DST changes.
  const localDate=new Date(date.getTime()-date.getTimezoneOffset()*60000);
  return dateFormatters.get(locale).format(localDate);
}
