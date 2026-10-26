/**
 * Local-first key/value adapter used for small app state and compatibility
 * keys. Structured collections belong in the IndexedDB repository.
 */
export function createLocalFirstStore({
  storage = null,
  isIndexedDBOwned = () => false,
  enqueueIndexedDBWrite = () => {},
  onWarning = () => {},
  now = Date.now,
} = {}) {
  const memory = Object.create(null);
  const protectedKeys = new Set();

  function get(key) {
    if (Object.prototype.hasOwnProperty.call(memory, key)) return memory[key];
    try {
      return storage ? storage.getItem(key) : (memory[key] || null);
    } catch {
      return memory[key] || null;
    }
  }

  function set(key, value) {
    if (protectedKeys.has(key)) {
      onWarning({ key, type: 'write', at: now() });
      return false;
    }
    memory[key] = value;
    try {
      if (storage && !isIndexedDBOwned(key)) storage.setItem(key, value);
      enqueueIndexedDBWrite(key, value, false);
      return true;
    } catch {
      onWarning({ key, type: 'write', at: now() });
      if (storage && isIndexedDBOwned(key)) {
        try { storage.setItem(key, value); } catch {}
      }
      try { enqueueIndexedDBWrite(key, value, false); } catch {}
      return !storage;
    }
  }

  function remove(key) {
    protectedKeys.delete(key);
    delete memory[key];
    try { if (storage) storage.removeItem(key); } catch {}
    try { enqueueIndexedDBWrite(key, '', true); } catch {}
  }

  function json(key, fallback) {
    const raw = get(key);
    if (!raw) return fallback;
    try {
      const parsed = JSON.parse(raw);
      return parsed == null ? fallback : parsed;
    } catch {
      if (protectedKeys.has(key)) return fallback;
      const recoveryKey = `mmg.recovery.${String(key).replace(/[^a-z0-9_.-]/gi, '_')}.${now()}`;
      let durable = false;
      try {
        memory[recoveryKey] = raw;
        if (storage) {
          storage.setItem(recoveryKey, raw);
          durable = storage.getItem(recoveryKey) === raw;
        }
      } catch {}
      onWarning({ key, type: 'json', recoveryKey, at: now(), ...(durable ? {} : { recoveryFailed: true }) });
      if (durable) remove(key);
      else protectedKeys.add(key);
      return fallback;
    }
  }

  return { get, set, remove, json, memory };
}
