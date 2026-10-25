import { LAB_MARKERS, cleanLabResults, labCanonicalValue, labPosition } from './results-model.mjs';
import { labTrend } from './trend-model.mjs';
import { mountReportTools } from './report-view.mjs';

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
    <p>${text('Пролактин и HbA1c не конвертируются. Расчётный свободный тестостерон показан отдельно от измеренных данных.', 'Prolactin and HbA1c are not converted. Calculated free testosterone is separate from measured results.')}</p>
    <a href="https://www.mayocliniclabs.com/order-tests/si-unit-conversion.html" target="_blank" rel="noopener noreferrer">Mayo Clinic Laboratories · SI conversion</a><br><a href="https://www.niddk.nih.gov/health-information/diagnostic-tests/a1c-test" target="_blank" rel="noopener noreferrer">NIDDK · A1C test and limitations</a></details></div></div></div>`;
  const form = host.querySelector('form');
  const status = host.querySelector('[data-lab-result-status]');
  const controls = form.elements;
  function units() {
    const marker = LAB_MARKERS.find(marker => marker[0] === controls.marker.value);
    controls.unit.innerHTML = marker[3].map(unit => `<option>${esc(unit)}</option>`).join('');
  }
  units();
  mountReportTools({host,lang,esc,rows,fill:row=>{form.reset();setTimeout(()=>{controls.marker.value=row.marker;units();controls.unit.value=row.unit;controls.value.value=row.value;controls.date.value='';controls.context.value=row.source;controls.date.focus();form.scrollIntoView({block:'start'});},0);}});
  const trend=document.createElement('div');trend.className='lab-trend';
  host.querySelector('[data-lab-result-list]').before(trend);
  controls.marker.addEventListener('change', units);
  form.addEventListener('reset', () => { setTimeout(() => { controls.id.value = ''; units(); status.textContent = ''; }, 0); });
  function list() {
    const marker=host.querySelector('[data-lab-result-filter]').value;
    const definition=LAB_MARKERS.find(item=>item[0]===marker);
    const groups=labTrend(rows,marker);
    trend.innerHTML=groups.length?groups.map(group=>{
      const min=Math.min(...group.map(row=>row.plotValue)),max=Math.max(...group.map(row=>row.plotValue)),span=max-min||1;
      const unit=labCanonicalValue(group[0])==null?group[0].unit:definition[3][0];
      const points=group.map((row,i)=>`${30+(group.length===1?150:i*300/(group.length-1))},${140-(row.plotValue-min)*110/span}`);
      return `<figure><figcaption>${esc(name(definition))} · ${esc(unit)} · ${esc(group[0].laboratory||text('Лаборатория не указана','Laboratory unspecified'))} · ${esc(group[0].method)}</figcaption><svg viewBox="0 0 360 180" role="img" aria-label="${esc(text('Динамика значений; точные данные в таблице ниже','Value trend; exact values in the table below'))}"><path d="M30 20V150H340" fill="none" stroke="currentColor" opacity=".3"/><polyline points="${points.join(' ')}" fill="none" stroke="var(--accent)" stroke-width="3"/>${points.map((point,i)=>`<circle cx="${point.split(',')[0]}" cy="${point.split(',')[1]}" r="4" fill="var(--text-primary)"><title>${group[i].date}: ${Number(group[i].plotValue.toPrecision(4))} ${esc(unit)}</title></circle>`).join('')}<text x="30" y="172" fill="currentColor" font-size="12">${group[0].date}</text><text x="340" y="172" text-anchor="end" fill="currentColor" font-size="12">${group.at(-1).date}</text></svg><table><caption>${text('Данные графика','Chart data')}</caption><thead><tr><th>${text('Дата','Date')}</th><th>${esc(unit)}</th></tr></thead><tbody>${group.map(row=>`<tr><td>${row.date} ${row.time}</td><td>${Number(row.plotValue.toPrecision(4))}</td></tr>`).join('')}</tbody></table></figure>`;
    }).join(''):`<p class="small">${text('Выбери показатель, чтобы увидеть график. Разные лаборатории и методики показаны отдельно.','Select a marker for its chart. Different laboratories and assays are shown separately.')}</p>`;
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
  let busy = false;
  async function persist(next) {
    if(busy)return false;busy=true;form.querySelector('[type=submit]').disabled=true;
    try{return await write(next);}finally{busy=false;form.querySelector('[type=submit]').disabled=false;}
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if(busy)return;
    const row = Object.fromEntries(new FormData(form));
    row.value = Number(row.value);
    row.id ||= crypto.randomUUID();
    const clean = cleanLabResults([row]);
    if (!clean) { status.textContent = text('Проверь дату, значение и границы интервала.', 'Check the date, value and interval limits.'); return; }
    const next = cleanLabResults([...rows.filter(item => item.id !== row.id), clean[0]]);
    if (!await persist(next)) { status.textContent = text('Не удалось сохранить. Скопируй введённые данные.', 'Could not save. Copy your input before leaving.'); return; }
    rows.splice(0, rows.length, ...next);
    controls.id.value = row.id;
    status.textContent = text('Сохранено на устройстве.', 'Saved on this device.');
    list();
  });
  host.querySelector('[data-lab-result-list]').addEventListener('click', async event => {
    if(busy)return;
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
      if (await persist(next)) { rows.splice(0, rows.length, ...next); list(); }
    }
  });
}
