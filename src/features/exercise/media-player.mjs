import { licensedVideo } from './media-model.mjs';

export function createExerciseMediaPlayer({ frame, image, text, onFallback }) {
  let video = null;
  let extras = null;
  let generation = 0;
  function stop() {
    generation++;
    if (video) {
      video.pause();
      video.removeAttribute('src');
      video.querySelectorAll('source').forEach(source => source.remove());
      video.load();
      video.remove();
    }
    extras?.remove();
    extras = video = null;
    image.hidden = false;
    frame.querySelector('#modal-media-play').hidden = false;
  }
  async function open(exercise, still) {
    stop();
    const current = generation;
    // The manifest is optional; failure keeps the existing licensed GIF usable.
    let manifest;
    try {
      const response = await fetch('data/exercise-media.json');
      if (!response.ok) return;
      manifest = await response.json();
    } catch { return; }
    if (current !== generation) return;
    const record = licensedVideo(manifest?.exercises?.[exercise.id]);
    if (!record) return;
    video = document.createElement('video');
    video.controls = true;
    video.playsInline = true;
    video.preload = 'none';
    video.poster = record.poster || still;
    video.setAttribute('aria-label', text('Демонстрация упражнения', 'Exercise demonstration'));
    let failedSources = 0;
    const fallback = () => {
      if (current !== generation) return;
      stop();
      onFallback();
      frame.querySelector('#modal-media-status').textContent = text('Видео недоступно · показан GIF', 'Video unavailable · showing GIF');
    };
    for (const source of record.sources) {
      const element = document.createElement('source');
      element.src = source.src;
      element.type = source.type;
      element.addEventListener('error', () => {
        failedSources++;
        if (failedSources === record.sources.length) fallback();
      }, { once: true });
      video.append(element);
    }
    video.addEventListener('error', fallback, { once: true });
    image.hidden = true;
    image.parentElement.append(video);
    frame.querySelector('#modal-media-play').hidden = true;
    extras = document.createElement('div');
    extras.className = 'exercise-video-options';
    const replay = document.createElement('button');
    replay.type = 'button';
    replay.className = 'media-btn';
    replay.textContent = text('Сначала', 'Replay');
    replay.addEventListener('click', () => { video.currentTime = 0; video.play().catch(() => {}); });
    const speed = document.createElement('select');
    speed.className = 'media-btn';
    speed.setAttribute('aria-label', text('Скорость воспроизведения', 'Playback speed'));
    for (const rate of [0.5, 1, 1.5]) speed.add(new Option(`${rate}×`, String(rate), rate === 1, rate === 1));
    speed.addEventListener('change', () => { video.playbackRate = Number(speed.value); });
    const attribution = document.createElement('a');
    attribution.href = record.attributionUrl;
    attribution.target = '_blank';
    attribution.rel = 'noopener noreferrer';
    attribution.textContent = `${record.author} · ${record.license}`;
    extras.append(replay, speed, attribution);
    frame.append(extras);
    video.addEventListener('loadedmetadata', () => {
      const hd = video.videoWidth >= 1920 && video.videoHeight >= 1080;
      frame.querySelector('#modal-media-status').textContent = `${hd ? 'Full HD · ' : ''}${video.videoWidth} × ${video.videoHeight}`;
    });
    frame.querySelector('#modal-media-status').textContent = text('Видео · качество после загрузки', 'Video · quality available after loading');
  }
  return { open, stop };
}
