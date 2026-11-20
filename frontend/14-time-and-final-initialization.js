// ==========================================
// 🌌 魔法五：時間維度引擎 (時刻感知、月相、紀念日)
// ==========================================
function getCollectiveDateWhisper(now) {
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const solarKey = `${month}-${day}`;
    const solarWhispers = {
        '2-14': {
            zh:'有人期待今天，也有人正在學著，和沒有抵達的愛共處。',
            en:'Some welcome today; others are learning to live beside love that never arrived.'
        },
        '4-4': {
            zh:'對某些人而言，今天的思念會重新有名字。',
            en:'For some, remembrance finds its name again today.'
        },
        '4-5': {
            zh:'對某些人而言，今天的思念會重新有名字。',
            en:'For some, remembrance finds its name again today.'
        },
        '8-8': {
            zh:'對某些人而言，今天比平常更像一段安靜的缺口。',
            en:'For some, today may feel more like a quiet absence than usual.'
        },
        '12-31': {
            zh:'一年將盡。不是所有事情，都需要在今晚得到答案。',
            en:'The year is ending. Not everything needs an answer tonight.'
        }
    };
    if (solarWhispers[solarKey]) return solarWhispers[solarKey];

    // 七夕依農曆判斷；不支援農曆的瀏覽器會安靜略過。
    try {
        const parts = new Intl.DateTimeFormat('zh-TW-u-ca-chinese', {
            month:'numeric', day:'numeric'
        }).formatToParts(now);
        const lunarMonth = parts.find(part => part.type === 'month')?.value || '';
        const lunarDay = parts.find(part => part.type === 'day')?.value || '';
        if (/^(7|七)$/.test(lunarMonth) && /^(7|七)$/.test(lunarDay)) {
            return {
                zh:'有人在今天靠近，也有人正練習放下沒有抵達的愛。',
                en:'Some draw closer today; others are learning to release a love that never arrived.'
            };
        }
    } catch(error) {}
    return null;
}

function renderCollectiveDateWhisper(now) {
    const whisper = getCollectiveDateWhisper(now);
    if (!whisper || document.getElementById('collective-date-whisper')) return;
    const element = document.createElement('p');
    element.id = 'collective-date-whisper';
    element.className = 'collective-date-whisper';
    element.setAttribute('data-zh', whisper.zh);
    element.setAttribute('data-zh-cn', whisper.zh);
    element.setAttribute('data-en', whisper.en);
    element.textContent = t(whisper.zh, whisper.en, whisper.en, whisper.en, whisper.en, whisper.en, whisper.zh);
    const anchor = document.getElementById('cosmic-presence') || document.querySelector('.room .desc-wrap');
    anchor?.insertAdjacentElement('afterend', element);
}

window.initTimeAndCosmic = function() {
    const now = new Date();
    const hour = now.getHours();
    
    // 🌙 1. 深夜與破曉感知
    const body = document.body;
    renderCollectiveDateWhisper(now);
    const eInput = document.getElementById('e-input');
    if (hour >= 0 && hour <= 4) {
        body.classList.add('night-mode');
        if(eInput) {
            eInput.setAttribute('data-zh-ph', '深夜了，是什麼讓你無法入睡？\n把這份重量放在這裡，沒有人知道是你。');
            eInput.setAttribute('data-en-ph', 'Late at night, what keeps you awake?\nLeave the weight here, no one knows it is you.');
            // 強制更新當下 placeholder
            const targetLang = (window.currentLang === 'en-uk') ? 'en' : window.currentLang;
            eInput.setAttribute('placeholder', eInput.getAttribute('data-' + targetLang + '-ph') || eInput.getAttribute('data-zh-ph'));
        }
    } else if (hour >= 5 && hour <= 8) {
        body.classList.add('dawn-mode');
    }

    // 🌕 2. 月相感知 (純數學計算，無須 API)
    // 週期約為 29.53 天 (轉換成秒數)，基準點為千禧年的一個已知新月
    const lunarPeriod = 2551443; 
    const newMoon1970 = 947182440;
    const currentUnix = now.getTime() / 1000;
    const phase = ((currentUnix - newMoon1970) % lunarPeriod) / lunarPeriod;
    const normalizedPhase = (phase + 1) % 1;
    const phaseIndex = Math.floor(normalizedPhase * 8 + 0.5) % 8;
    const moonPhases = [
        { icon:'●', zh:'新月', en:'new moon', ja:'新月' },
        { icon:'◔', zh:'眉月', en:'waxing crescent', ja:'三日月' },
        { icon:'◐', zh:'上弦月', en:'first-quarter moon', ja:'上弦の月' },
        { icon:'◕', zh:'盈凸月', en:'waxing gibbous moon', ja:'満ちてゆく月' },
        { icon:'○', zh:'滿月', en:'full moon', ja:'満月' },
        { icon:'◕', zh:'虧凸月', en:'waning gibbous moon', ja:'欠けてゆく月' },
        { icon:'◑', zh:'下弦月', en:'last-quarter moon', ja:'下弦の月' },
        { icon:'◔', zh:'殘月', en:'waning crescent', ja:'有明の月' }
    ];
    const moon = moonPhases[phaseIndex];
    window.empathMoonPhase = { phase:normalizedPhase, index:phaseIndex, ...moon };
    
    // 判斷是否為滿月 (月相落在 0.47 到 0.53 之間)
    window.isFullMoon = (phase > 0.47 && phase < 0.53);

    const presence = document.getElementById('cosmic-presence');
    if (presence) {
        const hhmm = now.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', hour12:false });
        const periodZh = hour < 5 ? '深夜' : hour < 9 ? '清晨' : hour < 12 ? '上午' : hour < 17 ? '午後' : hour < 20 ? '傍晚' : '夜晚';
        const zh = `現在是${periodZh} ${hhmm}。你不孤單。 · ${moon.icon} 今晚是${moon.zh}`;
        const en = `It is ${hhmm}. You are not alone. · ${moon.icon} Tonight: ${moon.en}`;
        const ja = `今は ${hhmm}。あなたはひとりではありません。 · ${moon.icon} 今夜は${moon.ja}`;
        presence.setAttribute('data-zh',zh);
        presence.setAttribute('data-zh-cn',zh);
        presence.setAttribute('data-en',en);
        presence.setAttribute('data-ja',ja);
        presence.textContent = t(zh,en,ja,en,en,en,zh);
    }
    
    if (window.isFullMoon) {
        const mDesc = document.querySelector('#room-m .room-desc');
        if (mDesc) {
            mDesc.setAttribute('data-zh', '今夜是滿月，思念傳得更遠。<br>點亮一顆星星，聽見別人藏在夜空裡的心事。');
            mDesc.setAttribute('data-en', 'Tonight is a full moon. Memories travel further.<br>Click a star to hear the night\'s secrets.');
            const targetLang = (window.currentLang === 'en-uk') ? 'en' : window.currentLang;
            mDesc.innerHTML = mDesc.getAttribute('data-' + targetLang) || mDesc.getAttribute('data-zh');
        }
    }

    // 🎂 3. 週年紀念日感知
    // 💡 我先幫妳設定為 8 月 3 日 (今天)，讓妳一打開就能測試！測試完可改成妳實際上線的日期
    const launchMonth = 7; // JS的月份是 0-11，所以 7 代表 8 月
    const launchDay = 3;
    const launchYear = 2026;
    
    if (now.getMonth() === launchMonth && now.getDate() === launchDay) {
        body.classList.add('anniversary-mode');
        const years = now.getFullYear() - launchYear;
        // 延遲 3 秒後，在左下角跳出隱藏的極美吐司提示
        setTimeout(() => {
            let msg = years === 0 ? '✦ EMPATH 誕生了，謝謝你成為第一批在這裡的靈魂 ✦' : `✦ EMPATH 今天 ${years} 歲了，謝謝你也在這裡 ✦`;
            window.showToast(msg, 6000);
        }, 3000);
    }
};

  // ==========================================
// 🌌 魔法七：情感閉環引擎 (時空信箱、溫暖回聲、延遲沙畫)
// ==========================================

// 1. Room H：給未來的自己
window.submitFutureLetter = async function() {
    const text = document.getElementById('future-letter-input').value.trim();
    if(!text) {
        window.showToast(t('請先寫下你想對未來自己說的話 ✦', 'Please write a message for your future self first ✦'));
        return;
    }
    let key = safeLocalStorage.getItem('empath_soul_key');
    if(!key) {
        await window.createSoulKey();
        key = safeLocalStorage.getItem('empath_soul_key');
    }
    if(!key) return;
    const unlockDate = Date.now() + (90 * 24 * 60 * 60 * 1000); // 預設 90 天後解鎖
    try {
        await soulActions.sealFutureLetter(key, text, unlockDate);
        document.getElementById('future-letter-input').value = '';
        window.showToast('✉️ 信件已封存。三個月後，帶著鑰匙回來這裡。', 4000);
    } catch(e) {
        console.error(e);
        window.showToast(t('信件暫時無法封存，內容仍留在輸入框中。', 'The letter could not be sealed yet. Your text is still here.'));
    }
};

window.checkFutureLetters = async function() {
    const key = safeLocalStorage.getItem('empath_soul_key');
    if(!key) return;
    try {
        const cloud = await readSoulBackup(key);
        if(cloud?.letters?.length) {
            soulView.renderFutureLetters(cloud.letters, Date.now(), window.isTestingLetter);
        }
    } catch(e) {
        console.warn('Future letters could not be opened:', e);
    }
};

window.deleteSoulBackup = async function() {
    const key = safeLocalStorage.getItem('empath_soul_key');
    if (!key) return;
    const confirmed = confirm(t(
        '確定永久刪除這把鑰匙的雲端足跡與未來信嗎？本機足跡會保留，但此動作無法復原。',
        'Permanently delete this key’s cloud footprints and future letters? Local footprints will remain, but this cannot be undone.',
        'この鍵のクラウド上の足跡と未来への手紙を完全に削除しますか？元に戻せません。',
        '¿Eliminar permanentemente las huellas y cartas futuras de esta llave? No se puede deshacer.',
        'Supprimer définitivement les empreintes et lettres futures de cette clé ? Cette action est irréversible.',
        'Cloud-Spuren und Zukunftsbriefe dieses Schlüssels dauerhaft löschen? Dies kann nicht rückgängig gemacht werden.',
        '确定永久删除这把钥匙的云端足迹与未来信吗？此操作无法恢复。'
    ));
    if (!confirmed) return;
    try {
        await soulActions.deleteConfirmedBackup(key);
        updateSyncUI();
        const unlocked = document.getElementById('unlocked-letters');
        if (unlocked) unlocked.replaceChildren();
        window.showToast(t('雲端備份已永久刪除，本機足跡仍保留。', 'Cloud backup permanently deleted; local footprints remain.'));
    } catch (error) {
        console.error('Soul backup deletion failed:', error);
        window.showToast(t('暫時無法刪除，雲端資料沒有變動。', 'Could not delete yet; cloud data was not changed.'));
    }
};

// 2. Room A：24 小時後只回傳匿名總量，不重播任何已消散原文。
window.checkRoomAEcho = async function() {
    const aSubmitTime = safeLocalStorage.getItem('empath_a_submit_time');
    if (aSubmitTime && (Date.now() - parseInt(aSubmitTime) > 24 * 60 * 60 * 1000 || window.isTestingEcho)) {
        try {
            const snapshot = await getDoc(doc(db, 'metadata', 'room_a_stats'));
            const total = Math.max(0, Number(snapshot.data()?.totalReleased) || 0);
            if (total > 0) setTimeout(() => {
                window.showToast(t(
                    `✦ 到現在，已有 ${total.toLocaleString()} 份重量被交給時間。沒有任何原文被留下。`,
                    `✦ ${total.toLocaleString()} weights have now been given to time. None of their words were kept.`
                ), 8000);
            }, 4000);
            safeLocalStorage.removeItem('empath_a_submit_time');
        } catch(error) {
            console.error('Room A anonymous echo failed:', error);
        }
    }
};

// 3. Room T：溫暖抵達了
window.checkRoomTWarmth = function() {
    const myWarmthId = safeLocalStorage.getItem('empath_my_warmth_id');
    const subscriptionKey = 'warmth:return';
    if(!myWarmthId) {
        removeAuxiliarySubscription(subscriptionKey);
        return;
    }
    registerAuxiliarySubscription(subscriptionKey, () => onSnapshot(
        doc(db, "warmth", myWarmthId),
        (docSnap) => {
            if(!docSnap.exists()) {
                safeLocalStorage.removeItem('empath_my_warmth_id');
                safeLocalStorage.removeItem('empath_my_warmth_echos');
                removeAuxiliarySubscription(subscriptionKey);
                return;
            }
                const echos = docSnap.data().echos || 0;
                const lastEchos = parseInt(safeLocalStorage.getItem('empath_my_warmth_echos') || '0');
                if(echos > lastEchos) {
                    safeLocalStorage.setItem('empath_my_warmth_echos', echos);
                    // 讓 Room T 門口微微發光
                    const tDoor = document.querySelector('.door-btn[data-d="T"]');
                    if(tDoor) { tDoor.style.boxShadow = '0 0 25px rgba(232,168,124,0.6)'; tDoor.style.borderColor = 'var(--amber)'; }
                    
                    // 在面板內顯示靜靜的通知
                    let msgBox = document.getElementById('my-warmth-echo-msg');
                    if(!msgBox) {
                        msgBox = document.createElement('div');
                        msgBox.id = 'my-warmth-echo-msg';
                        msgBox.style.cssText = 'color:var(--amber); font-size:13px; margin-top:24px; text-align:center; font-weight:bold; letter-spacing:1px; border-top:1px dashed rgba(232,168,124,0.3); padding-top:16px; animation: pulse-spark 3s infinite;';
                        document.querySelector('.t-send-panel').appendChild(msgBox);
                    }
                    msgBox.textContent = `✦ 宇宙回聲：你上次送出的溫暖，已被陌生人共鳴了 ${Math.max(0, Number(echos) || 0)} 次。`;
                }
        },
        error => console.error('Room T return echo failed:', error)
    ));
};
  
  // Cinematic pointer light and restrained reveal motion
document.addEventListener('DOMContentLoaded', () => {
    const sky = document.querySelector('.cinematic-sky');
    const heroOpening = document.querySelector('.hero-opening');
    if(sky && heroOpening && window.matchMedia('(pointer:fine)').matches) {
        heroOpening.addEventListener('pointermove', (event) => {
            const rect = heroOpening.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / rect.width) * 100;
            const y = ((event.clientY - rect.top) / rect.height) * 100;
            sky.style.setProperty('--lens-x', x + '%');
            sky.style.setProperty('--lens-y', y + '%');
            sky.style.setProperty('--depth-x', ((x - 50) * -0.18) + 'px');
            sky.style.setProperty('--depth-y', ((y - 50) * -0.12) + 'px');
        }, { passive: true });
    }

    document.querySelectorAll('#hero .door-btn').forEach(card => {
        card.addEventListener('pointermove', (event) => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty('--card-x', (event.clientX - rect.left) + 'px');
            card.style.setProperty('--card-y', (event.clientY - rect.top) + 'px');
        }, { passive: true });
    });

    const revealRoomHeader = (hash) => {
        if(!hash || !hash.startsWith('#room-')) return;
        document.querySelectorAll(hash + ' .room-tag, ' + hash + ' .room-title-wrap, ' + hash + ' .desc-wrap')
            .forEach(element => element.classList.add('is-revealed'));
    };
    document.querySelectorAll('a[href^="#room-"]').forEach(link => {
        link.addEventListener('click', () => revealRoomHeader(link.getAttribute('href')));
    });
    revealRoomHeader(window.location.hash);

    const revealTargets = document.querySelectorAll('.journey-heading, .journey-act, .hero-manifesto > *, .room .room-tag, .room .room-title-wrap, .room .desc-wrap');
    if('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.body.classList.add('visual-ready');
        const revealObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if(entry.isIntersecting) {
                    entry.target.classList.add('is-revealed');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
        revealTargets.forEach(target => revealObserver.observe(target));
    }
});

// Premium navigation and quiet hero utilities
window.addEventListener('scroll', () => {
    document.body.classList.toggle('page-scrolled', window.scrollY > 90);
}, { passive: true });
document.addEventListener('keydown', (event) => {
    if(event.key === 'Escape' && document.getElementById('onboarding-box')?.classList.contains('is-open')) {
        window.closeGuide();
    }
});

document.addEventListener('DOMContentLoaded', async () => {
  window.switchLang(window.currentLang, { silent:true, persist:false });
  renderCrisisRegionControls();
  renderAnalyticsConsentControls();
  initializeConsentedAnalytics();
  setupRoomPresence('roomE', 'e-input');
  setupRoomPresence('roomM', 'm-input');
  setupRoomPresence('roomP', 'p-input');
  setupRoomPresence('roomA', 'a-input');
  setupRoomPresence('roomT', 't-input');
  if (ACTIVE_ROOM === 'h') ensureSilentCompanyOverlay();
    
  // 啟動時間與宇宙感知
  window.initTimeAndCosmic();
  initReturnMemory();
  initSessionNarrative();

  // 啟動情感閉環引擎
  if (ACTIVE_ROOM === 'a') window.checkRoomAEcho();
  if (ACTIVE_ROOM === 't') window.checkRoomTWarmth();

  // ==========================================
  // 🌍 魔法六：全站情緒脈衝與集體靜默引擎
  // ==========================================
  
  // 動態生成 HTML 結構
  document.body.insertAdjacentHTML('beforeend', `
    <div id="global-pulse-overlay"><div class="pulse-text" id="pulse-text"></div></div>
    <div id="silence-overlay">
        <div class="silence-text" id="silence-text">此刻，世界某處的靈魂，正與你一起安靜。</div>
        <div class="silence-timer" id="silence-timer">60</div>
    </div>
  `);

  // 1. 全站情緒脈衝觸發器
  window.checkGlobalPulse = function(totalMsgs) {
      const currentThousand = Math.floor(totalMsgs / 1000) * 1000;
      const lastPulse = parseInt(safeLocalStorage.getItem('empath_last_pulse') || '0');
      
      // 當跨越一個新的 1000 門檻時觸發 (例如從 999 變成 1000)
      if (currentThousand > 0 && currentThousand > lastPulse) {
          safeLocalStorage.setItem('empath_last_pulse', currentThousand);
          
          const overlay = document.getElementById('global-pulse-overlay');
          const textEl = document.getElementById('pulse-text');
          textEl.innerHTML = `✦<br>${t(`全世界第 ${currentThousand} 則傾訴，已被接住`, `The world's ${currentThousand}th message has been caught`, `世界で ${currentThousand} 番目の想いが受け止められました`, `El mensaje ${currentThousand} del mundo ha sido atrapado`, `Le ${currentThousand}ème message a été attrapé`, `Die ${currentThousand}. Nachricht wurde aufgefangen`, `全世界第 ${currentThousand} 则倾诉，已被接住`)}`;
          
          overlay.style.opacity = '1';
          setTimeout(() => { textEl.style.opacity = '1'; textEl.style.transform = 'translateY(0)'; }, 500);
          if(typeof window.playChime === 'function') window.playChime();
          
          setTimeout(() => {
              textEl.style.opacity = '0';
              textEl.style.transform = 'translateY(20px)';
              overlay.style.opacity = '0';
          }, 6000);
      }
  };

  // 2. 集體靜默時刻系統 (每天 UTC 00:00 觸發 60 秒)
  const updateSilenceMoment = () => {
      const now = new Date();
      // 判斷是否為 UTC 00:00 (台灣時間早上 8:00) 的前 60 秒內
      const isSilenceMoment = (now.getUTCHours() === 0 && now.getUTCMinutes() === 0 && now.getUTCSeconds() < 60);
      
      // 開放一個手動測試開關 window.isTestingSilence
      if (isSilenceMoment || window.isTestingSilence) {
          if (!document.getElementById('silence-overlay').classList.contains('active')) {
              document.getElementById('silence-overlay').classList.add('active');
              if (typeof audioCtx !== 'undefined' && isAudioEnabled) audioCtx.suspend(); // 暫停所有音樂
          }
          // 倒數計時器
          const left = 60 - now.getUTCSeconds();
          document.getElementById('silence-timer').innerText = left > 0 ? left : '0';
      } else {
          if (document.getElementById('silence-overlay').classList.contains('active')) {
              document.getElementById('silence-overlay').classList.remove('active');
              if (typeof audioCtx !== 'undefined' && isAudioEnabled) audioCtx.resume(); // 恢復音樂
          }
      }
  };
  registerAuxiliarySubscription('collective-silence-clock', () => {
      updateSilenceMoment();
      const timer = setInterval(updateSilenceMoment, 1000);
      return () => clearInterval(timer);
  });
    
  // 🌟 瞬間視覺魔法：在 Firebase 還沒連上之前，先用快取數據填滿畫面！
  const cached = safeLocalStorage.getItem('empath_global_counts');
  if (cached) {
      Object.assign(globalCounts, JSON.parse(cached));
      updateCountersUI();
  }

  subscribeRealtimeData();
  
  const visitDay = String(Math.floor(Date.now() / 86400000));
  const visitDayKey = 'empath_site_visit_day';
  if (safeLocalStorage.getItem(visitDayKey) !== visitDay) {
      try {
          const response = await recordSiteVisitRequest({});
          if (response?.data?.accepted) safeLocalStorage.setItem(visitDayKey, visitDay);
      } catch(e) {
          console.error('Anonymous site visit failed:', e);
      }
  }
  if(!safeLocalStorage.getItem('empath_hsp_hint_shown')) { setTimeout(() => { const ttip = document.getElementById('hsp-tooltip'); if(ttip) { ttip.classList.add('show'); setTimeout(() => { ttip.classList.remove('show'); }, 8000); safeLocalStorage.setItem('empath_hsp_hint_shown', 'true'); } }, 1000); }
  if(safeSessionStorage.getItem('empath_a_accepted') === 'true') { const mask = document.getElementById('a-warning-mask'); const feed = document.getElementById('a-feed'); if(mask && feed) { mask.style.display = 'none'; feed.style.display = 'flex'; feed.style.filter = 'blur(0px)'; } }
  initTimeline(); updateSyncUI(); 
  const existingKey = safeLocalStorage.getItem('empath_soul_key');
  if(existingKey && document.getElementById('h-events')) {
      try {
          const cloud = await readSoulBackup(existingKey);
          if(cloud) applyJourney(mergeJourneys(journeyData, cloud.journey));
          await autoBackupToCloud();
      } catch(err) { console.error("發生錯誤:", err); }
  }
  const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
          if (entry.target.id === 'room-m') roomMVisible = entry.isIntersecting;
          if (entry.target.id === 'room-a') roomAVisible = entry.isIntersecting;
          if (!document.body.classList.contains('hsp-mode')) {
              if (entry.target.id === 'room-m') { 
                  if (entry.isIntersecting && isAnimating) { 
                      window.resizeCanvas('m');
                      if (!starsRafId) window.drawStars(); 
                  } else if (!entry.isIntersecting) { 
                      if (starsRafId) { cancelAnimationFrame(starsRafId); starsRafId = null; } 
                  } 
              }
              if (entry.target.id === 'room-a') { 
                  if (entry.isIntersecting && isAnimating) { 
                      window.resizeCanvas('a');
                      if (!sandRafId) window.drawSand(); 
                  } else if (!entry.isIntersecting) { 
                      if (sandRafId) { cancelAnimationFrame(sandRafId); sandRafId = null; } 
                  } 
              }
          }
          if (!ACTIVE_ROOM && entry.isIntersecting) {
              if (entry.target.id === 'hero') { document.title = 'EMPATH — Every Moment As Truth Heals'; } 
              else { const roomLetter = entry.target.querySelector('.room-letter')?.textContent; if (roomLetter) document.title = `Room ${roomLetter} — EMPATH`; } 
          }
      });
  }, { threshold: 0.15 });

  document.querySelectorAll('.room, #hero').forEach(el => observer.observe(el));
  setTimeout(updateCountersUI, 800);
});
