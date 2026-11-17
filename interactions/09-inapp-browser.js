/* ===== SOCIAL IN-APP BROWSER · PLATFORM-SPECIFIC UX ===== */
(() => {
  'use strict';
  const root = document.documentElement;
  const platform = root.dataset.inapp;
  if (!platform) return;

  const platformCopy = {
    line: {
      label: 'LINE VIEW',
      title: '你正在 LINE 裡閱讀',
      body: '已為 LINE 的上下工具列保留空間並放大觸控範圍。想看完整動畫，可從選單選擇「用預設瀏覽器開啟」。'
    },
    instagram: {
      label: 'INSTAGRAM VIEW',
      title: '你正在 Instagram 裡閱讀',
      body: '已降低模糊與動畫負載，避免底部工具列和返回手勢遮住內容。完整體驗可改用 Safari 或 Chrome。'
    },
    facebook: {
      label: 'FACEBOOK VIEW',
      title: '你正在 Facebook 裡閱讀',
      body: '已改用更穩定的文字縮放與直向版面，減少 Facebook 內建瀏覽器的左右裁切。也可從選單改用外部瀏覽器。'
    },
    x: {
      label: 'X VIEW',
      title: '你正在 X 裡閱讀',
      body: '已加大操作區並限制水平滑動，避免與 X 的返回手勢互相干擾。完整動畫可改用 Safari 或 Chrome。'
    }
  };
  const copy = platformCopy[platform];
  if (!copy) return;
  const storageKey = `empath_inapp_tip_${platform}_dismissed`;
  try { if (sessionStorage.getItem(storageKey) === 'true') return; } catch (error) {}

  const tip = document.createElement('aside');
  tip.className = `empath-inapp-tip empath-inapp-tip-${platform}`;
  tip.setAttribute('role','region');
  tip.setAttribute('aria-label',`${copy.title}提示`);
  tip.innerHTML = `
    <div class="empath-inapp-tip-copy">
      <span class="empath-inapp-tip-label">${copy.label}</span>
      <strong>${copy.title}</strong>
      <p>${copy.body}</p>
    </div>
    <div class="empath-inapp-tip-actions">
      <button type="button" class="empath-inapp-copy-link">複製網址</button>
      <button type="button" class="empath-inapp-dismiss">繼續瀏覽</button>
    </div>`;

  const dismiss = () => {
    tip.classList.remove('is-visible');
    document.body.classList.remove('empath-inapp-tip-open');
    try { sessionStorage.setItem(storageKey,'true'); } catch (error) {}
    window.setTimeout(() => tip.remove(),420);
  };
  tip.querySelector('.empath-inapp-dismiss')?.addEventListener('click',dismiss);
  tip.querySelector('.empath-inapp-copy-link')?.addEventListener('click',async event => {
    const button = event.currentTarget;
    const original = button.textContent;
    let copied = false;
    try {
      await navigator.clipboard.writeText(location.href);
      copied = true;
    } catch (error) {
      const helper = document.createElement('textarea');
      helper.value = location.href;
      helper.setAttribute('readonly','');
      helper.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
      document.body.appendChild(helper);
      helper.select();
      try { copied = document.execCommand('copy'); } catch (copyError) {}
      helper.remove();
    }
    button.textContent = copied ? '已複製 ✓' : '請長按網址列複製';
    window.setTimeout(() => { if (button.isConnected) button.textContent = original; },1800);
  });

  document.body.appendChild(tip);
  const reveal = () => {
    window.setTimeout(() => {
      if (!tip.isConnected) return;
      document.body.classList.add('empath-inapp-tip-open');
      tip.classList.add('is-visible');
    },650);
  };
  if (root.classList.contains('empath-entry-pending')) {
    const observer = new MutationObserver(() => {
      if (root.classList.contains('empath-entry-pending')) return;
      observer.disconnect();
      reveal();
    });
    observer.observe(root,{attributes:true,attributeFilter:['class']});
  } else {
    reveal();
  }
})();
