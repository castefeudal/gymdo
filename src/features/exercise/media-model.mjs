// Only explicitly licensed sources are eligible. GIF dimensions are never HD.
export function licensedVideo(record) {
  if (!record || !record.author || !record.license || !record.attributionUrl) return null;
  const safe = value => typeof value === 'string' && (/^https:\/\//.test(value) || /^(?:videos|assets)\/[\w./-]+$/.test(value));
  const sources = (Array.isArray(record.sources) ? record.sources : []).filter(source =>
    source && safe(source.src) && ['video/mp4', 'video/webm'].includes(source.type) &&
    Number.isInteger(source.width) && source.width > 0 && Number.isInteger(source.height) && source.height > 0
  ).sort((a, b) => a.width - b.width);
  if (!sources.length || !/^https:\/\//.test(record.attributionUrl)) return null;
  return { ...record, poster: safe(record.poster) ? record.poster : '', sources };
}
