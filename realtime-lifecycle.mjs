// Own listener lifetimes without depending on Firebase or the DOM.
export function createRealtimeLifecycle({ isHidden = () => false, onError = () => {} } = {}) {
  let running = false;
  let primary = [];
  const auxiliary = new Map();

  function cleanup(unsubscribe, key) {
    try { unsubscribe?.(); } catch (error) { onError(error, key); }
  }

  function startAuxiliary(key) {
    const entry = auxiliary.get(key);
    if (!entry || entry.active || isHidden()) return;
    entry.active = true;
    try {
      const unsubscribe = entry.subscribe();
      // A synchronous snapshot may remove or replace its own subscription.
      if (auxiliary.get(key) !== entry || !entry.active) cleanup(unsubscribe, key);
      else entry.unsubscribe = typeof unsubscribe === 'function' ? unsubscribe : null;
    } catch (error) {
      entry.active = false;
      onError(error, key);
    }
  }

  function register(key, subscribe) {
    remove(key);
    auxiliary.set(key, { subscribe, unsubscribe:null, active:false });
    startAuxiliary(key);
  }

  function remove(key) {
    const entry = auxiliary.get(key);
    auxiliary.delete(key);
    if (entry) {
      entry.active = false;
      cleanup(entry.unsubscribe, key);
    }
  }

  function resumeAuxiliary() {
    auxiliary.forEach((_, key) => startAuxiliary(key));
  }

  function stop() {
    running = false;
    const listeners = primary;
    primary = [];
    listeners.forEach(unsubscribe => cleanup(unsubscribe, 'primary'));
    auxiliary.forEach((entry, key) => {
      const unsubscribe = entry.unsubscribe;
      entry.unsubscribe = null;
      entry.active = false;
      cleanup(unsubscribe, key);
    });
  }

  function start(subscribe) {
    if (running || isHidden()) return false;
    running = true;
    try {
      subscribe();
      resumeAuxiliary();
      return true;
    } catch (error) {
      stop();
      throw error;
    }
  }

  function track(unsubscribe) {
    if (typeof unsubscribe === 'function') primary.push(unsubscribe);
  }

  return Object.freeze({ start, stop, track, register, remove, getPrimaryCount:() => primary.length });
}
