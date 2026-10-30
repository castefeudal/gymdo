// DOM adapter: domain rules and persistence remain in their existing modules.
export function renderV7HomeView(context) {
  const {
    $, S, esc, t, v7c, v7DateLabel, v7NextAction, v7PlanSummary, v7TrendSummary,
    totalCompletedHistorySets, premiumIcon, renderV10HomePulse, BY_ID, exStill, exName, countPhrase,
  } = context;
  const host = $('home');
  if (!host) return;

  const en = S.lang === 'en';
  const phrase = (n, kind) => (countPhrase ? countPhrase(n, kind, S.lang) : String(n));
  const $id = id => $(id);

  const kicker = $id('v7-home-kicker');
  const sub = $id('v7-home-sub');
  const date = $id('v7-home-date');
  const nextHost = $id('v7-home-next');
  if (kicker) kicker.textContent = v7c('home');
  if (date) date.textContent = v7DateLabel();

  const workout = Array.isArray(S.workout) ? S.workout : [];
  const plannedSets = workout.reduce((sum, item) => sum + (Number(item.sets) || 0), 0);
  if (sub) {
    sub.textContent = workout.length
      ? (en
        ? `Prepared session: ${phrase(workout.length, 'exercise')} · ${phrase(plannedSets, 'set')}.`
        : `Собрано: ${phrase(workout.length, 'exercise')} · ${phrase(plannedSets, 'set')}.`)
      : v7c('homeSub');
  }

  const next = v7NextAction() || {};
  const title = String(next.title || '');
  const why = String(next.why || '');
  const evidence = (next.evidence || [])
    .filter(item => !/^\s*\d/.test(String(item)))
    .slice(0, 3)
    .map(item => `<span class="v7-evidence">${esc(item)}</span>`).join('');

  const minutes = plannedSets ? Math.max(15, Math.round(plannedSets * 3.6)) : 0;
  const facts = workout.length
    ? `<div class="next-facts">
        <div><b class="num">${workout.length}</b><span>${esc(phrase(workout.length, 'exercise').replace(/^\d+\s/, ''))}</span></div>
        <div><b class="num">${plannedSets}</b><span>${esc(phrase(plannedSets, 'set').replace(/^\d+\s/, ''))}</span></div>
        <div><b class="num">≈${minutes}</b><span>${esc(en ? 'min' : 'мин')}</span></div>
      </div>`
    : '';

  const shortActions = {
    startReady: en ? 'Start workout' : 'Начать тренировку',
    continueRun: en ? 'Resume' : 'Продолжить',
    resume: en ? 'Resume' : 'Продолжить',
    planDay: en ? 'Start plan day' : 'Начать день плана',
    finishProfile: en ? 'Finish setup' : 'Завершить настройку',
    checkin: en ? 'Weekly check-in' : 'Замер и самочувствие',
    weighIn: en ? 'Log weight' : 'Записать вес',
    run: en ? 'Start workout' : 'Начать тренировку',
  };
  const ctaLabel = shortActions[next.type] || title.replace(/^Начать |^Start /, '');
  const primary = `<button class="btn btn-primary btn-lg" type="button" data-v7-action="${esc(next.type || '')}"${next.day != null ? ` data-v7-day="${esc(next.day)}"` : ''}>${esc(en ? ctaLabel : ctaLabel)}<span aria-hidden="true">→</span></button>`;
  const secondary = next.type === 'planDay'
    ? `<button class="btn btn-quiet" type="button" data-v7-route="program">${esc(v7c('program'))}</button>`
    : `<button class="btn btn-quiet" type="button" data-v7-route="library">${esc(en ? 'Exercise library' : 'Библиотека упражнений')}</button>`;

  const roster = workout.slice(0, 5).map(item => {
    const ex = BY_ID ? BY_ID[item.id] : null;
    const name = ex && exName ? exName(ex) : (item.name || '');
    const still = ex && exStill ? exStill(ex) : '';
    const dose = [
      `${Number(item.sets) || 0} × ${item.reps || '—'}`,
      item.weight ? `${item.weight} ${en ? 'kg' : 'кг'}` : '',
    ].filter(Boolean).join(' · ');
    return `<li>
      ${still ? `<img src="${esc(still)}" alt="" width="48" height="48" loading="lazy" decoding="async">` : '<span class="roster-ph" aria-hidden="true"></span>'}
      <span class="roster-copy"><b>${esc(name)}</b><small>${esc(dose)}</small></span>
      ${item.done ? '<span class="roster-done" aria-hidden="true">✓</span>' : ''}
    </li>`;
  }).join('');

  const aside = workout.length
    ? `<div class="next-roster">
        <p class="next-roster-label">${esc(en ? 'Session contents' : 'Состав тренировки')}</p>
        <ol>${roster}</ol>
        <div class="next-roster-actions">
          <button class="next-roster-link" type="button" data-v7-route="library">${esc(en ? '+ Add exercise' : '+ Добавить упражнение')}</button>
          <button class="next-roster-link" type="button" data-v7-route="workout">${esc(en ? 'Edit session' : 'Редактировать тренировку')} →</button>
        </div>
      </div>`
    : `<div class="next-roster next-roster-empty">
        <p class="next-roster-label">${esc(en ? 'No session yet' : 'Тренировка не собрана')}</p>
        <p class="next-roster-copy">${esc(en ? 'Build a session from the library or load a programme day.' : 'Собери сессию из библиотеки или загрузи день программы.')}</p>
        <button class="btn btn-solid btn-sm" type="button" data-v7-route="library">${esc(en ? 'Open library' : 'Открыть библиотеку')}</button>
      </div>`;

  if (nextHost) {
    nextHost.innerHTML = `<div class="next-main">
      <p class="next-label">${esc(v7c('next'))}</p>
      <h2 class="next-title">${esc(title)}</h2>
      <p class="next-copy">${esc(why)}</p>
      ${evidence ? `<div class="next-evidence">${evidence}</div>` : ''}
      ${facts}
      <div class="next-actions">${primary}${secondary}</div>
    </div>${aside}`;
  }

  const plan = v7PlanSummary() || {};
  const last = (S.history || [])[0];
  const trend = v7TrendSummary() || {};
  const signal = (host, label, figure, note, route, action) => {
    if (!host) return;
    host.classList.toggle('is-empty', figure === '—' || figure === '·');
    host.innerHTML = `<span class="ctx-label">${esc(label)}</span>
      <strong class="ctx-figure num">${esc(figure)}</strong>
      <small class="ctx-note">${esc(note)}</small>
      ${action ? `<button class="ctx-link" type="button" data-v7-route="${esc(route)}">${esc(action)}<span aria-hidden="true">→</span></button>` : ''}`;
  };
  signal($id('v7-home-plan'), v7c('plan'), S.plan ? (plan.v || '·') : '—',
    S.plan ? (plan.s || '') : (en ? 'No active programme' : 'Программа не собрана'),
    'program', S.plan ? '' : (en ? 'Build programme' : 'Собрать программу'));
  signal($id('v7-home-last'), v7c('last'), last ? String((last.items || []).length) : '—',
    last ? `${last.date} · ${phrase(totalCompletedHistorySets(last), 'set')}` : (en ? 'No completed sessions' : 'Нет завершённых тренировок'),
    'workout', last ? '' : (en ? 'Open training' : 'К тренировке'));
  const trendFigure = String(trend.v || '—').replace('-', '−').replace(/(\d)\.(\d)/, '$1,$2');
  signal($id('v7-home-progress'), v7c('trend'), trendFigure,
    trend.s || (en ? 'Not enough data yet' : 'Пока недостаточно данных'),
    'progress', (S.diary || []).length ? '' : (en ? 'Log a check-in' : 'Записать данные'));
  signal($id('v7-home-nutrition'), v7c('kcal'), S.kbjuLast ? String(S.kbjuLast.target) : '—',
    S.kbjuLast ? (en ? 'kcal per day' : 'ккал в день') : (en ? 'Not calculated' : 'Не рассчитано'),
    'nutrition', S.kbjuLast ? '' : (en ? 'Open nutrition' : 'Открыть питание'));

  const commands = [
    ['library', 'search', v7c('quickLibrary'), v7c('quickLibraryS')],
    ['workout', 'workout', v7c('quickWorkout'), v7c('quickWorkoutS')],
    ['program', 'program', v7c('quickProgram'), v7c('quickProgramS')],
    ['progress', 'progress', v7c('quickProgress'), v7c('quickProgressS')],
  ];
  const quickHost = $id('v7-home-quick');
  if (quickHost) {
    quickHost.innerHTML = commands.map(([route, icon, label, hint]) => `<button class="v7-command" type="button" data-v7-route="${route}"><i aria-hidden="true">${premiumIcon(icon)}</i><span><b>${esc(label)}</b><small>${esc(hint)}</small></span></button>`).join('');
  }

  if (typeof renderV10HomePulse === 'function') renderV10HomePulse();
}
