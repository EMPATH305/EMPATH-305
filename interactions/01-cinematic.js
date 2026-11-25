/* ===== INLINE BLOCK 1 ===== */
/* ===== EMPATH CINEMATIC INTERACTION SYSTEM ===== */
(() => {
  'use strict';
  if (window.__EMPATH_CINEMATIC_SYSTEM__) return;
  window.__EMPATH_CINEMATIC_SYSTEM__ = true;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function setupNoise() {
    if (document.documentElement.classList.contains('empath-home-page')) return;
    if (document.querySelector('.aw-site-noise')) return;
    const noise = document.createElement('div');
    noise.className = 'aw-site-noise';
    noise.setAttribute('aria-hidden', 'true');
    document.body.appendChild(noise);
  }

  function setupRoomStages() {
    const selector = [
      '.room-tag', '.room-title-wrap', '.desc-wrap', '.e-mode-toggle',
      '.input-area', '#e-draw-wrap', '.m-input-wrap', '.step-wrapper',
      '.a-warning-mask', '.t-layout', '.h-journey'
    ].join(',');
    const items = qsa(selector);
    items.forEach((element, index) => {
      element.classList.add('aw-stage');
      element.style.setProperty('--aw-delay', Math.min(index * 110, 660) + 'ms');
    });
    if (reduceMotion.matches || !('IntersectionObserver' in window)) {
      items.forEach(element => element.classList.add('aw-in'));
      return;
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('aw-in');
        else if (Math.abs(entry.boundingClientRect.top) > window.innerHeight * 1.25) {
          entry.target.classList.remove('aw-in');
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    items.forEach(element => observer.observe(element));
  }

  function setupHeroParallax() {
    const hero = document.querySelector('#hero');
    const backgroundText = document.querySelector('.hero-bg-text');
    if (!hero || !backgroundText) return;
    let ticking = false;
    const update = () => {
      ticking = false;
      const disabled = reduceMotion.matches || window.innerWidth < 768;
      const offset = disabled ? 0 : Math.min(window.scrollY * 0.3, window.innerHeight * 0.35);
      backgroundText.style.setProperty('--hero-parallax-y', offset.toFixed(2) + 'px');
    };
    const requestUpdate = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate, { passive: true });
    reduceMotion.addEventListener?.('change', requestUpdate);
    update();
  }

  function setupMagneticButtons() {
    if (!finePointer.matches || reduceMotion.matches) return;
    qsa('.send-btn, .door-btn').forEach(button => {
      button.classList.add('is-magnetic');
      button.addEventListener('pointermove', event => {
        const rect = button.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width - 0.5) * 16;
        const y = ((event.clientY - rect.top) / rect.height - 0.5) * 16;
        button.style.setProperty('--magnetic-x', Math.max(-8, Math.min(8, x)).toFixed(2) + 'px');
        button.style.setProperty('--magnetic-y', Math.max(-8, Math.min(8, y)).toFixed(2) + 'px');
      });
      button.addEventListener('pointerleave', () => {
        button.style.setProperty('--magnetic-x', '0px');
        button.style.setProperty('--magnetic-y', '0px');
      });
    });
  }

  function setupSplitTitles() {
    const processedText = new WeakMap();
    const split = title => {
      const text = title.textContent || '';
      if (processedText.get(title) === text && title.querySelector('.aw-title-char')) return;
      processedText.set(title, text);
      title.setAttribute('aria-label', text);
      title.replaceChildren(...Array.from(text).map((character, index) => {
        const span = document.createElement('span');
        span.className = 'aw-title-char';
        span.setAttribute('aria-hidden', 'true');
        span.style.setProperty('--char-index', index);
        span.textContent = character === ' ' ? '\u00a0' : character;
        return span;
      }));
    };
    const titles = qsa('.room-title');
    titles.forEach(split);
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.target.classList.toggle('aw-title-in', entry.isIntersecting));
    }, { threshold: 0.35 });
    titles.forEach(title => observer.observe(title));
    const mutations = new MutationObserver(records => {
      records.forEach(record => {
        const title = record.target.nodeType === Node.TEXT_NODE
          ? record.target.parentElement?.closest('.room-title')
          : record.target.closest?.('.room-title');
        if (title && !title.querySelector('.aw-title-char')) {
          split(title);
          observer.observe(title);
        }
      });
    });
    titles.forEach(title => mutations.observe(title, { childList: true, characterData: true, subtree: true }));
  }

  function setupCursorStates() {
    document.documentElement.classList.remove('aw-custom-cursor');
    const cursor = document.querySelector('#cursor-glow');
    if (cursor) cursor.hidden = true;
  }

  // Keep backend-owned audio behavior intact; normalize only its decorative icon.
  function setupHomePresentation() {
    if (!document.documentElement.classList.contains('empath-home-page')) return;
    const warmthDoor = document.querySelector('.home-surface .door-btn[data-d="T"]');
    if (warmthDoor) {
      // Retain the return-echo cue as a colored rule, without backend glow styles.
      const normalizeEcho = () => {
        if (!warmthDoor.style.boxShadow) return;
        warmthDoor.classList.add('has-return-echo');
        warmthDoor.style.removeProperty('box-shadow');
        warmthDoor.style.removeProperty('border-color');
      };
      normalizeEcho();
      new MutationObserver(normalizeEcho).observe(warmthDoor, { attributes: true, attributeFilter: ['style'] });
    }
    const audio = document.getElementById('audio-btn');
    if (audio) {
      const normalizeIcon = () => {
        for (const node of Array.from(audio.childNodes)) {
          if (node.nodeType === Node.TEXT_NODE && /[🔊🔇]/u.test(node.textContent)) {
            node.textContent = node.textContent.replace(/[🔊🔇]\uFE0F?/gu, '');
          }
        }
        if (!audio.querySelector('.home-control-glyph')) {
          const icon = document.createElement('span');
          icon.className = 'home-control-glyph';
          icon.setAttribute('aria-hidden', 'true');
          icon.textContent = '音';
          audio.prepend(icon);
        }
      };
      normalizeIcon();
      new MutationObserver(normalizeIcon).observe(audio, { childList: true, characterData: true, subtree: true });
    }
  }

  function init() {
    document.body.classList.add('aw-ready');
    setupNoise();
    setupHomePresentation();
    setupRoomStages();
    setupHeroParallax();
    setupMagneticButtons();
    setupSplitTitles();
    setupCursorStates();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();

