/* ===== INLINE BLOCK 4 ===== */
/* ===== EDITORIAL CONTENT RHYTHM · INTERACTIONS ===== */
(() => {
  'use strict';
  if (window.__EMPATH_EDITORIAL_RHYTHM__) return;
  window.__EMPATH_EDITORIAL_RHYTHM__ = true;

  const language = () => window.currentLang || 'zh';
  const copy = (zh,en,ja) => language() === 'ja' ? ja : (language().startsWith('en') ? en : zh);

  function setupKintsugiPagination() {
    const board = document.getElementById('p-board');
    if (!board || board.dataset.paginationReady) return;
    board.dataset.paginationReady = 'true';

    const PAGE_SIZE = 12;
    const STEP = 8;
    let visibleCount = PAGE_SIZE;

    const loading = document.createElement('p');
    loading.className = 'kintsugi-loading';
    loading.textContent = copy('正在接住這些碎片……','Receiving these fragments…','かけらを受け止めています…');

    const controls = document.createElement('div');
    controls.className = 'kintsugi-pagination';
    controls.hidden = true;

    const status = document.createElement('p');
    status.className = 'kintsugi-page-status';
    status.setAttribute('aria-live','polite');

    const more = document.createElement('button');
    more.type = 'button';
    more.className = 'kintsugi-load-more';
    more.textContent = copy('再拾起一些碎片','REVEAL MORE FRAGMENTS','もう少しかけらを拾う');
    controls.append(more,status);
    board.before(loading);
    board.after(controls);

    function addExpandControl(card) {
      if (card.querySelector('.shard-expand')) return;
      const text = card.querySelector('.shard-text');
      if (!text) return;
      requestAnimationFrame(() => {
        if (text.scrollHeight <= text.clientHeight + 3 || card.querySelector('.shard-expand')) return;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'shard-expand';
        button.textContent = copy('展開文字','READ MORE','続きを読む');
        button.addEventListener('click',event => {
          event.preventDefault();
          event.stopPropagation();
          const expanded = card.classList.toggle('is-text-expanded');
          button.textContent = expanded
            ? copy('收起文字','CLOSE','閉じる')
            : copy('展開文字','READ MORE','続きを読む');
          button.setAttribute('aria-expanded',String(expanded));
        });
        text.after(button);
      });
    }

    function refresh() {
      if (!window.pShardDataReady || typeof window.renderPShards !== 'function') {
        loading.hidden = false;
        controls.hidden = true;
        return;
      }

      const total = Array.isArray(window.pShardRecords) ? window.pShardRecords.length : 0;
      loading.hidden = true;
      if (!total) {
        board.replaceChildren();
        controls.hidden = true;
        return;
      }

      visibleCount = Math.min(Math.max(PAGE_SIZE,visibleCount),total);
      const result = window.renderPShards(visibleCount);
      Array.from(board.querySelectorAll(':scope > .shard')).forEach(addExpandControl);
      const remaining = Math.max(0,total-result.rendered);
      controls.hidden = false;
      more.hidden = remaining === 0;
      more.textContent = copy(
        remaining ? '再拾起一些碎片' : '所有碎片都已被看見',
        remaining ? 'REVEAL MORE FRAGMENTS' : 'ALL FRAGMENTS SEEN',
        remaining ? 'もう少しかけらを拾う' : 'すべてのかけらを見ました'
      );
      status.textContent = copy(
        '已看見 ' + result.rendered + '／' + total + ' 片',
        result.rendered + ' of ' + total + ' fragments',
        result.rendered + '／' + total + ' 個'
      );
    }

    more.addEventListener('click',() => {
      const total = Array.isArray(window.pShardRecords) ? window.pShardRecords.length : 0;
      if (!total) return;
      visibleCount = Math.min(total,Math.max(PAGE_SIZE,visibleCount)+STEP);
      refresh();
    });

    document.addEventListener('empath:p-shards-updated',refresh);
    refresh();
  }

  function setupHomeEditorialCut() {
    const manifesto = document.querySelector('#hero .hero-manifesto');
    if (manifesto) manifesto.setAttribute('aria-hidden','true');
  }

  function setupHomeLayering() {
    const journey = document.querySelector('#room-h .h-journey');
    const summary = document.getElementById('g-summary');
    if (!journey || !summary || journey.dataset.layered) return;
    journey.dataset.layered = 'true';

    const secondary = document.createElement('div');
    secondary.className = 'h-secondary-summary';
    Array.from(summary.querySelectorAll('.g-card:not(.visitor-card)')).forEach(card => secondary.appendChild(card));

    const panel = document.createElement('div');
    panel.className = 'h-detail-panel';
    panel.id = 'h-detail-panel';
    panel.hidden = true;
    panel.appendChild(secondary);

    let next = summary.nextSibling;
    const remaining = [];
    while (next) {
      const current = next;
      next = next.nextSibling;
      if (current.nodeType === 1 && current.classList.contains('share-action-box')) continue;
      remaining.push(current);
    }
    remaining.forEach(node => panel.appendChild(node));

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'h-details-toggle';
    toggle.setAttribute('aria-expanded','false');
    toggle.setAttribute('aria-controls',panel.id);
    toggle.textContent = copy('查看完整靈魂旅程','VIEW THE FULL JOURNEY','魂の旅をすべて見る');

    summary.after(toggle,panel);
    toggle.addEventListener('click',() => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      panel.classList.toggle('is-open',open);
      panel.hidden = !open;
      toggle.setAttribute('aria-expanded',String(open));
      toggle.textContent = open
        ? copy('收起完整旅程','CLOSE THE JOURNEY','旅を閉じる')
        : copy('查看完整靈魂旅程','VIEW THE FULL JOURNEY','魂の旅をすべて見る');
      if (open) {
        requestAnimationFrame(() => requestAnimationFrame(() => {
          panel.scrollIntoView({
            behavior: window.matchMedia('(prefers-reduced-motion:reduce)').matches ? 'auto' : 'smooth',
            block: 'start'
          });
        }));
      }
    });
  }

  function initEditorialRhythm() {
    setupHomeEditorialCut();
    setupKintsugiPagination();
    setupHomeLayering();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded',initEditorialRhythm,{once:true});
  } else {
    initEditorialRhythm();
  }
})();

;

