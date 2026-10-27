// 2021 CKD-EPI creatinine equation (race-free), adult equation only.
// Creatinine is converted to mg/dL using the standard 88.4 µmol/L factor.
export function estimateCkdEpi2021(creatinine, unit, age, sexAtBirth) {
  const value = Number(creatinine), years = Number(age);
  if (!Number.isFinite(value) || value <= 0 || !['mg/dL', 'µmol/L'].includes(unit)
    || !Number.isInteger(years) || years < 18 || years > 120
    || !['female', 'male'].includes(sexAtBirth)) return null;
  const scr = unit === 'mg/dL' ? value : value / 88.4;
  const female = sexAtBirth === 'female', ratio = scr / (female ? 0.7 : 0.9);
  return 142 * Math.min(ratio, 1) ** (female ? -0.241 : -0.302)
    * Math.max(ratio, 1) ** -1.2 * 0.9938 ** years * (female ? 1.012 : 1);
}

export function mountEgfrEstimator({ host, lang = 'ru' }) {
  const t = (ru, en) => lang === 'en' ? en : ru;
  const content = host.querySelector('[data-egfr-content]');
  content.innerHTML = `<p>${t('Расчёт для взрослых от 18 лет. Нужен креатинин сыворотки, стандартизированный по IDMS. Поля не сохраняются.', 'Adult equation (18+). Requires IDMS-standardized serum creatinine. Inputs are not saved.')}</p><form data-egfr-estimator><div class="lab-result-pair"><label>${t('Возраст, лет', 'Age, years')}<input class="input" name="age" type="number" min="18" max="120" step="1" required></label><label>${t('Креатинин', 'Creatinine')}<input class="input" name="creatinine" type="number" min="0.01" step="any" required></label></div><div class="lab-result-pair"><label>${t('Единица креатинина', 'Creatinine unit')}<select class="input" name="unit"><option>µmol/L</option><option>mg/dL</option></select></label><label>${t('Пол, используемый уравнением (при рождении)', 'Sex variable used by equation (at birth)')}<select class="input" name="sex" required><option value="">${t('Выбери значение', 'Select a value')}</option><option value="female">${t('Женский', 'Female')}</option><option value="male">${t('Мужской', 'Male')}</option></select></label></div><button class="btn btn-quiet" type="submit">${t('Рассчитать оценку', 'Calculate estimate')}</button><p role="status" aria-live="polite" data-egfr-output></p></form><p class="small">${t('Оценка, не измерение и не диагноз. Высокая мышечная масса и другие факторы могут менять креатинин независимо от СКФ. Для важных решений может быть полезен цистатин C; учитывай альбуминурию/ACR. ХБП требует признаков хронического нарушения не менее 3 месяцев: одно значение не устанавливает диагноз.', 'An estimate, not a measurement or diagnosis. High muscle mass and other factors can change creatinine independently of GFR. Cystatin C may help for important decisions; consider albuminuria/ACR. CKD requires evidence of chronicity for at least 3 months: one result does not establish the diagnosis.')}</p><a href="https://www.niddk.nih.gov/research-funding/research-programs/kidney-clinical-research-epidemiology/laboratory/glomerular-filtration-rate-equations/adults" target="_blank" rel="noopener noreferrer">NIDDK · CKD-EPI 2021 adults</a> · <a href="https://doi.org/10.1056/NEJMoa2102953" target="_blank" rel="noopener noreferrer">Inker et al. · 2021</a> · <a href="https://kdigo.org/wp-content/uploads/2024/03/KDIGO-2024-CKD-Guideline.pdf" target="_blank" rel="noopener noreferrer">KDIGO · 2024</a>`;
  const form = content.querySelector('[data-egfr-estimator]');
  form.addEventListener('submit', event => {
    event.preventDefault();
    const fields = new FormData(form);
    const result = estimateCkdEpi2021(fields.get('creatinine'), fields.get('unit'), fields.get('age'), fields.get('sex'));
    content.querySelector('[data-egfr-output]').textContent = result == null
      ? t('Проверь: формула применима с 18 лет; нужны положительный креатинин, единица и выбранный половой коэффициент.', 'Check: this equation applies from age 18 and needs positive creatinine, a unit and a selected sex factor.')
      : `${t('Расчётная СКФ', 'Estimated eGFR')}: ${result.toFixed(1)} mL/min/1.73m² · CKD-EPI 2021`;
  });
}
