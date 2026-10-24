import { LAB_MARKERS, cleanLabResults, labCanonicalValue, labPosition } from './results-model.mjs';

export function renderLabWorkspace({ host, read, write, lang, esc, today, history, nutrition }) {
  const text = (ru, en) => lang === 'en' ? en : ru;
  const rows = cleanLabResults(read());
  if(!rows){host.innerHTML='<p role=alert>'+text('Данные повреждены. Экспортируй копию в настройках перед восстановлением.','Invalid data. Export a backup in Settings before recovery.')+'</p>';return;}
  const name = marker => marker[lang === 'en' ? 2 : 1];
  const field = (key, label, type = 'text', extra = '') => `<label>${label}<input class="input" name="${key}" type="${type}" ${extra}></label>`;
  host.innerHTML = `<div class="container"><div class="section-head"><p class="eyebrow">${text('Локальный журнал здоровья', 'Local health journal')}</p><h2>${text('Анализы', 'Lab results')}</h2><p class="lede">${text('Результаты из бланка, сравнение и контекст.', 'Your reports, comparisons and context.')}</p></div>
    <div class="lab-results-layout"><form class="panel lab-result-form"><h2>${text('Новое измерение', 'New measurement')}</h2><input name="id" type="hidden">
    <label>${text('Показатель', 'Marker')}<select name="marker" class="input">${LAB_MARKERS.map(marker => `<option value="${marker[0]}">${name(marker)}</option>`).join('')}</select></label>
    <div class="lab-result-pair">${field('value', text('Результат', 'Result'), 'number', 'required min="0" step="any"')}<label>${text('Единица', 'Unit')}<select name="unit" class="input"></select></label></div>
    <div class="lab-result-pair">${field('date', text('Дата', 'Date'), 'date', `required value="${today}"`)}${field('time', text('Время', 'Time'), 'time')}</div>
    <div class="lab-result-pair">${field('low', text('Нижний референс', 'Lower reference'), 'number', 'min="0" step="any"')}${field('high', text('Верхний референс', 'Upper reference'), 'number', 'min="0" step="any"')}</div>
    ${field('laboratory', text('Лаборатория', 'Laboratory'), 'text', 'maxlength="160"')}${field('method', text('Методика', 'Assay method'), 'text', 'maxlength="160"')}
    <label>${text('Контекст измерения', 'Measurement context')}<textarea name="context" class="input" maxlength="1000" rows="3"></textarea></label>
    <p class="small">${text('Референсы — только из твоего бланка. Пустой интервал не считается нормой.', 'Use reference limits from your report. A missing interval is not classified as normal.')}</p>
    <p role="status" data-lab-result-status></p><div class="lab-result-pair"><button class="btn btn-primary" type="submit">${text('Сохранить', 'Save')}</button><button class="btn btn-quiet" type="reset">${text('Отменить правку', 'Cancel edit')}</button></div></form>
    <div><div class="panel"><h2>${text('История измерений', 'Measurement history')}</h2><label>${text('Показатель для сравнения', 'Compare marker')}<select class="input" data-lab-result-filter><option value="">${text('Все', 'All')}</option>${LAB_MARKERS.map(marker => `<option value="${marker[0]}">${name(marker)}</option>`).join('')}</select></label><div data-lab-result-list></div></div>
    <details class="panel"><summary>${text('Как читать результаты', 'Reading your results')}</summary><p>${text('Сравнение с интервалом — не диагноз. Учитывай метод, пол, возраст, время и условия сдачи. Совпадение с тренировкой или питанием не доказывает причинную связь.', 'Interval position is not a diagnosis. Consider assay, sex, age, timing and collection conditions. Coincidence with training or food does not establish causality.')}</p>
    <p>${text('Пролактин и HbA1c не конвертируются; свободный тестостерон не рассчитывается.', 'Prolactin and HbA1c are not converted; free testosterone is not estimated.')}</p>
    <a href="https://www.mayocliniclabs.com/order-tests/si-unit-conversion.html" target="_blank" rel="noopener noreferrer">Mayo Clinic Laboratories · SI conversion</a><br><a href="https://www.niddk.nih.gov/health-information/diagnostic-tests/a1c-test" target="_blank" rel="noopener noreferrer">NIDDK · A1C test and limitations</a></details></div></div></div>`;
  const form = host.querySelector('form');
  const status = host.querySelector('[data-lab-result-status]');
  const controls = form.elements;
  function units() {
    const marker = LAB_MARKERS.find(marker => marker[0] === controls.marker.value);
    controls.unit.innerHTML = marker[3].map(unit => `<option>${esc(unit)}</option>`).join('');
  }
  units();
  controls.marker.addEventListener('change', units);
  form.addEventListener('reset', () => { setTimeout(() => { controls.id.value = ''; units(); status.textContent = ''; }, 0); });
  function list() {
    const filtered = rows.filter(row => !host.querySelector('[data-lab-result-filter]').value || row.marker === host.querySelector('[data-lab-result-filter]').value);
    host.querySelector('[data-lab-result-list]').innerHTML = filtered.length ? filtered.map(row => {
      const marker = LAB_MARKERS.find(marker => marker[0] === row.marker);
      const comparable = rows.find(previous => previous.id !== row.id && previous.marker === row.marker && `${previous.date}${previous.time}` < `${row.date}${row.time}` && previous.laboratory === row.laboratory && previous.method === row.method && (previous.unit === row.unit || (labCanonicalValue(previous) != null && labCanonicalValue(row) != null)));
      const delta = comparable ? (comparable.unit === row.unit ? row.value - comparable.value : (labCanonicalValue(row) - labCanonicalValue(comparable)) / (row.unit === marker[3][0] ? 1 : marker[4])) : null;
      const labels = { unknown: text('Нет полного интервала', 'No complete interval'), low: text('Ниже интервала', 'Below interval'), high: text('Выше интервала', 'Above interval'), within: text('Внутри интервала', 'Within interval') };
      const sessions = history.filter(session => session.date?.slice(0, 10) === row.date).length;
      const hasFood = nutrition.some(day => day.date === row.date);
      return `<article class="lab-result-entry"><p class="eyebrow">${esc(row.date)} ${esc(row.time)}</p><h3>${esc(name(marker))}</h3><strong class="lab-result-value num">${row.value} <small>${esc(row.unit)}</small></strong><p>${text('Интервал', 'Interval')}: ${row.low ?? '—'}–${row.high ?? '—'} · ${labels[labPosition(row)]}</p>${row.low != null && row.high != null ? `<meter min="${Math.min(row.low, row.value)}" max="${Math.max(row.high, row.value)}" low="${row.low}" high="${row.high}" value="${row.value}" aria-label="${esc(name(marker))}"></meter>` : ''}<p class="small">${delta == null ? text('Нет сопоставимого предыдущего измерения', 'No comparable previous measurement') : `${text('Изменение с', 'Change since')} ${comparable.date}: ${delta > 0 ? '+' : ''}${Number(delta.toPrecision(4))} ${esc(row.unit)}`}</p><p class="small">${esc([row.laboratory, row.method, row.context].filter(Boolean).join(' · '))}</p><p class="small">${text('В этот день', 'Same day')}: ${sessions} ${text('тренировок', 'sessions')} · ${text('питание', 'nutrition')}: ${hasFood ? '✓' : '—'}</p><div class="lab-result-pair"><button type="button" class="btn btn-quiet" data-lab-edit="${esc(row.id)}">${text('Изменить', 'Edit')}</button><button type="button" class="btn btn-quiet" data-lab-delete="${esc(row.id)}">${text('Удалить', 'Delete')}</button></div></article>`;
    }).join('') : `<p class="empty">${text('Здесь появятся твои измерения. Добавь результат из лабораторного бланка.', 'Your measurements will appear here. Add a result from your laboratory report.')}</p>`;
  }
  list();
  host.querySelector('[data-lab-result-filter]').addEventListener('change', list);
  form.addEventListener('submit', event => {
    event.preventDefault();
    const row = Object.fromEntries(new FormData(form));
    row.value = Number(row.value);
    row.id ||= crypto.randomUUID();
    const clean = cleanLabResults([row]);
    if (!clean) { status.textContent = text('Проверь дату, значение и границы интервала.', 'Check the date, value and interval limits.'); return; }
    const next = cleanLabResults([...rows.filter(item => item.id !== row.id), clean[0]]);
    if (!write(next)) { status.textContent = text('Не удалось сохранить. Скопируй введённые данные.', 'Could not save. Copy your input before leaving.'); return; }
    rows.splice(0, rows.length, ...next);
    controls.id.value = row.id;
    status.textContent = text('Сохранено на устройстве.', 'Saved on this device.');
    list();
  });
  host.querySelector('[data-lab-result-list]').addEventListener('click', event => {
    const edit = event.target.closest('[data-lab-edit]');
    const remove = event.target.closest('[data-lab-delete]');
    if (edit) {
      const row = rows.find(row => row.id === edit.dataset.labEdit);
      controls.marker.value = row.marker; units();
      Object.entries(row).forEach(([key, value]) => { if (controls[key]) controls[key].value = value ?? ''; });
      controls.value.focus(); form.scrollIntoView({ block: 'start' });
    }
    if (remove && confirm(text('Удалить это измерение?', 'Delete this measurement?'))) {
      const next = rows.filter(row => row.id !== remove.dataset.labDelete);
      if (write(next)) { rows.splice(0, rows.length, ...next); list(); }
    }
  });
}
