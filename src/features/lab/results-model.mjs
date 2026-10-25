// No population reference ranges: use the interval printed on the actual report.
export const LAB_MARKERS = [
  ['testosterone', 'Общий тестостерон', 'Total testosterone', ['nmol/L', 'ng/dL'], 0.0347],
  ['shbg', 'ГСПГ', 'SHBG', ['nmol/L']],
  ['albumin', 'Альбумин', 'Albumin', ['g/L', 'g/dL'], 10],
  ['freeTestosterone', 'Свободный тестостерон (измеренный)', 'Free testosterone (measured)', ['pmol/L', 'pg/mL'], 3.467],
  ['lh', 'ЛГ', 'LH', ['IU/L']], ['fsh', 'ФСГ', 'FSH', ['IU/L']],
  ['estradiol', 'Эстрадиол', 'Estradiol', ['pmol/L', 'pg/mL'], 3.671],
  ['prolactin', 'Пролактин', 'Prolactin', ['mIU/L', 'ng/mL']],
  ['tsh', 'ТТГ', 'TSH', ['mIU/L']], ['ft4', 'Свободный Т4', 'Free T4', ['pmol/L', 'ng/dL'], 12.87],
  ['hemoglobin', 'Гемоглобин', 'Hemoglobin', ['g/L', 'g/dL'], 10],
  ['hematocrit', 'Гематокрит', 'Hematocrit', ['%', 'L/L'], 100],
  ['rbc', 'Эритроциты', 'Red blood cells', ['10^12/L']],
  ['wbc', 'Лейкоциты', 'White blood cells', ['10^9/L']],
  ['platelets', 'Тромбоциты', 'Platelets', ['10^9/L']],
  ['glucose', 'Глюкоза', 'Glucose', ['mmol/L', 'mg/dL'], 0.0555],
  ['hba1c', 'HbA1c', 'HbA1c', ['%', 'mmol/mol']],
  ['cholesterol', 'Общий холестерин', 'Total cholesterol', ['mmol/L', 'mg/dL'], 0.0259],
  ['ldl', 'ЛПНП', 'LDL cholesterol', ['mmol/L', 'mg/dL'], 0.0259],
  ['hdl', 'ЛПВП', 'HDL cholesterol', ['mmol/L', 'mg/dL'], 0.0259],
  ['triglycerides', 'Триглицериды', 'Triglycerides', ['mmol/L', 'mg/dL'], 0.0113],
  ['alt', 'АЛТ', 'ALT', ['U/L']], ['ast', 'АСТ', 'AST', ['U/L']],
  ['creatinine', 'Креатинин', 'Creatinine', ['µmol/L', 'mg/dL'], 88.4],
  ['egfr', 'СКФ', 'eGFR', ['mL/min/1.73m²']],
];

export function cleanLabResults(rows) {
  if (!Array.isArray(rows)) return null;
  const ids = new Set();
  const cleaned = [];
  for (const row of rows) {
    const marker = LAB_MARKERS.find(item => item[0] === row?.marker);
    if (!marker || !marker[3].includes(row.unit) || typeof row.id !== 'string' || !row.id || row.id.length > 80 || ids.has(row.id)) return null;
    const timestamp = Date.parse(`${row.date}T12:00:00Z`);
    if (row.time && !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(row.time)) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date) || !Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== row.date) return null;
    if (typeof row.value !== 'number' || !Number.isFinite(row.value) || row.value < 0) return null;
    const low = row.low === '' || row.low == null ? null : Number(row.low);
    const high = row.high === '' || row.high == null ? null : Number(row.high);
    if ((low != null && (!Number.isFinite(low) || low < 0)) || (high != null && (!Number.isFinite(high) || high < 0)) || (low != null && high != null && low >= high)) return null;
    ids.add(row.id);
    cleaned.push({ id: row.id.slice(0, 80), marker: row.marker, unit: row.unit, date: row.date,
      value: row.value, low, high,
      time: row.time || '',
      laboratory: String(row.laboratory || '').slice(0, 160), method: String(row.method || '').slice(0, 160), context: String(row.context || '').slice(0, 1000) });
  }
  return cleaned.sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
}

export function labCanonicalValue(row) {
  const marker = LAB_MARKERS.find(item => item[0] === row.marker);
  if (!marker || !marker[3].includes(row.unit)) return null;
  if (row.unit === marker[3][0]) return row.value;
  return marker[4] ? row.value * marker[4] : null;
}

export function labPosition(row) {
  if (row.low == null || row.high == null) return 'unknown';
  return row.value < row.low ? 'low' : row.value > row.high ? 'high' : 'within';
}
