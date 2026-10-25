/* EMPATH v18 — one sanctuary per URL */
(() => {
  'use strict';
  const rooms = {
    e: { letter: 'E', name: '情緒出口' },
    m: { letter: 'M', name: '思念映射' },
    p: { letter: 'P', name: '碎片修補' },
    a: { letter: 'A', name: '神聖避難所' },
    t: { letter: 'T', name: '能量共振' },
    h: { letter: 'H', name: '靈魂歸宿' }
  };
  const root = document.documentElement;
  const currentRoom = Object.keys(rooms).find(key => root.classList.contains(`empath-room-${key}`)) || '';

  function roomFile(key) { return `room-${key}.html`; }

  function resetFreshRouteScroll() {
    try {
      if (sessionStorage.getItem('empath_fresh_route') !== '1') return;
      sessionStorage.removeItem('empath_fresh_route');
      requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' }));
    } catch (error) {}
  }

  function bindIntentPrefetch() {
    const prefetched = new Set();
    const prefetch = link => {
      const href = link?.getAttribute?.('href') || '';
      if (!/^room-[empath]\.html(?:$|[?#])/.test(href) || prefetched.has(href)) return;
      prefetched.add(href);
      const hint = document.createElement('link');
      hint.rel = 'prefetch';
      hint.href = href;
      document.head.appendChild(hint);
    };
    document.addEventListener('pointerover', event => prefetch(event.target.closest?.('a[href]')), { passive: true });
    document.addEventListener('focusin', event => prefetch(event.target.closest?.('a[href]')));
  }

  function setupRoomPage() {
    if (!currentRoom) return;
    const meta = rooms[currentRoom];
    try { localStorage.setItem('empath_last_room', currentRoom); } catch (error) {}
    document.title = `Room ${meta.letter} — ${meta.name} | EMPATH`;
    const logo = document.querySelector('.nav-logo');
    if (logo) logo.href = 'index.html';
    const skip = document.querySelector('.skip-link');
    if (skip) skip.href = `#room-${currentRoom}`;
    document.querySelector(`.nav-letter[data-l="${meta.letter}"]`)?.setAttribute('aria-current', 'page');

    const back = document.createElement('a');
    back.className = 'room-back-lobby';
    back.href = 'index.html';
    back.setAttribute('aria-label', '回到 EMPATH 大廳');
    back.innerHTML = '<span aria-hidden="true">←</span><span>回到大廳</span>';
    const nav = logo?.closest('nav');
    if (logo && nav) {
      const origin = document.createElement('div');
      origin.className = 'room-nav-origin';
      nav.insertBefore(origin, logo);
      origin.append(logo, back);
    } else {
      document.body.appendChild(back);
    }
  }

  function migrateLegacyHash() {
    if (!root.classList.contains('empath-home-page')) return false;
    const match = location.hash.match(/^#room-([empath])$/);
    if (!match) return false;
    location.replace(roomFile(match[1]));
    return true;
  }

  function bindPageTransitions() {
    document.addEventListener('click', event => {
      const link = event.target.closest?.('a[href]');
      if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const href = link.getAttribute('href') || '';
      if (!/^(?:index|room-[empath])\.html(?:$|[?#])/.test(href)) return;
      event.preventDefault();
      try { sessionStorage.setItem('empath_fresh_route', '1'); } catch (error) {}
      document.body.classList.add('empath-page-leaving');
      window.setTimeout(() => { location.href = href; }, 280);
    });
  }

  if (migrateLegacyHash()) return;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { setupRoomPage(); resetFreshRouteScroll(); bindIntentPrefetch(); bindPageTransitions(); }, { once: true });
  } else {
    setupRoomPage();
    resetFreshRouteScroll();
    bindIntentPrefetch();
    bindPageTransitions();
  }
})();
