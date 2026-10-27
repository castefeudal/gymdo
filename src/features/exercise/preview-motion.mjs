export function createExercisePreviewController({ grid, findExercise, stillSource, motionSource }) {
  const observedCards = new Set();
  let observer;

  function preview(card, playing) {
    const exercise = card && findExercise(card.dataset.id);
    const image = card && card.querySelector('img');
    if (!exercise || exercise.custom || !image) return;
    if (playing) {
      if (image.dataset.mediaFailed === 'final' || image.dataset.mediaFailed === 'inline') return;
      image.dataset.still = stillSource(exercise);
      image.dataset.motion = '1';
      image.dataset.mediaFailed = '';
      image.setAttribute('data-ex-media', '');
      image.src = motionSource(exercise);
    } else if (image.dataset.motion === '1') {
      image.dataset.motion = '0';
      image.src = image.dataset.still || stillSource(exercise);
    }
  }

  function observeVisibleCards() {
    if (!('IntersectionObserver' in window)) {
      grid.querySelectorAll('.card[data-id]').forEach(card => preview(card, true));
      return;
    }
    if (!observer) {
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => preview(entry.target, entry.isIntersecting && entry.intersectionRatio >= 0.18));
      }, { rootMargin: '80px 0px', threshold: [0, 0.18] });
    }
    observedCards.forEach(card => {
      if (grid.contains(card)) return;
      preview(card, false);
      observer.unobserve(card);
      observedCards.delete(card);
    });
    grid.querySelectorAll('.card[data-id]').forEach(card => {
      if (observedCards.has(card)) return;
      observedCards.add(card);
      observer.observe(card);
    });
  }

  return { observeVisibleCards };
}
