/** Uses the application locale; owns no persisted language state. */
export function mountEntryScreen({ language, selectLanguage }) {
  const screen = document.getElementById('entry-screen');
  if (!screen || document.documentElement.dataset.entryRequested !== 'true') return;
  const sculpture = screen.querySelector('.entry-sculpture picture');
  const source = sculpture.querySelector('source'), art = sculpture.querySelector('img');
  source.srcset = source.dataset.srcset;
  art.src = art.dataset.src;
  const en = language() === 'en';
  const contact = screen.querySelector('[data-entry-contact]');
  contact.textContent = en ? 'Contact the creator ↗' : 'Написать автору ↗';
  contact.href = 'https://t.me/markovmade?text=' + encodeURIComponent(en
    ? "Hello Pavel! I'm contacting you from MARKOV MADE GYM."
    : 'Здравствуйте, Павел! Пишу вам с сайта MARKOV MADE GYM.');
  screen.querySelector('[data-entry-copy]').textContent = en ? 'Train with purpose. Progress with precision.' : 'Тренируйся осознанно. Прогрессируй точно.';
  screen.querySelector('[data-entry-scope]').textContent = en ? 'Training / Nutrition / Progress' : 'Тренировки / Питание / Прогресс';
  screen.querySelector('[data-entry-label]').textContent = en ? 'Choose your language' : 'Выбери свой язык';
  screen.setAttribute('aria-label', en ? 'Welcome to MARKOV MADE GYM' : 'Добро пожаловать в MARKOV MADE GYM');
  const previous = [...document.body.children].filter(el => el !== screen && el.id !== 'mmg-boot' && !['SCRIPT','STYLE','LINK'].includes(el.tagName)).map(el => [el, el.inert]);
  previous.forEach(([el]) => { el.inert = true; });
  document.body.classList.add('entry-open');
  screen.hidden = false;
  screen.tabIndex = -1;
  screen.focus({ preventScroll: true });
  let closed = false;
  const motion = matchMedia('(prefers-reduced-motion: no-preference) and (pointer: fine)');
  let frame;
  screen.addEventListener('pointermove', event => {
    if (closed || !motion.matches || frame) return;
    const x = (event.clientX / innerWidth - .5) * 5;
    const y = (event.clientY / innerHeight - .5) * -5;
    frame = requestAnimationFrame(() => {
      sculpture.style.transform = `perspective(900px) rotateX(${y}deg) rotateY(${x}deg)`;
      frame = null;
    });
  });
  screen.addEventListener('pointerleave', () => {
    cancelAnimationFrame(frame);
    frame = null;
    sculpture.style.transform = '';
  });
  function close() {
    if (closed) return;
    closed = true;
    cancelAnimationFrame(frame);
    screen.hidden = true;
    document.body.classList.remove('entry-open');
    document.body.classList.add('entry-entered');
    previous.forEach(([el, inert]) => { el.inert = inert; });
    window.removeEventListener('hashchange', close);
    const heading = document.querySelector('#home h1, #home h2, main h1');
    if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
  }
  screen.addEventListener('click', event => {
    const button = event.target.closest('[data-entry-lang]');
    if (!button || closed) return;
    selectLanguage(button.dataset.entryLang);
    close();
    location.hash = 'home';
  });
  window.addEventListener('hashchange', close);
}
