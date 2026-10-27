/* EMPATH v21.1 · Collective Grief Calendar */
(function(root, factory) {
  'use strict';
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (!root?.document) return;
  root.EmpathCollectiveCalendar = Object.freeze(api);
  const start = () => api.mount(root.document, new Date());
  if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
  'use strict';

  const COPY = {
    qingming:{
      zh:'今天，有很多人帶著相似的重量來到這裡。很多份思念都有一個名字，也有一個再也抵達不了的地址。',
      'zh-cn':'今天，有很多人带着相似的重量来到这里。很多份思念都有一个名字，也有一个再也抵达不了的地址。',
      en:'Many people arrive here today carrying a similar weight. So much longing has a name, and an address it can no longer reach.',
      ja:'今日、似た重さを抱えてここを訪れる人がたくさんいます。多くの想いには名前があり、もう届かない宛先があります。',
      es:'Hoy muchas personas llegan aquí con un peso parecido. Tantos recuerdos tienen un nombre y una dirección a la que ya no pueden llegar.',
      fr:'Aujourd’hui, beaucoup arrivent ici avec un poids semblable. Tant de souvenirs portent un nom et une adresse qu’ils ne peuvent plus atteindre.',
      de:'Heute kommen viele mit einer ähnlichen Last hierher. So viel Sehnsucht trägt einen Namen und eine Adresse, die sie nicht mehr erreichen kann.',
      uk:'Сьогодні багато людей приходять сюди зі схожим тягарем. У багатьох спогадів є ім’я й адреса, якої вони вже не досягнуть.',
      pl:'Dziś wiele osób przychodzi tu z podobnym ciężarem. Wiele tęsknot ma imię i adres, pod który nie może już dotrzeć.'
    },
    father:{
      zh:'今天，有很多人帶著相似的重量來到這裡。有人想念父親，也有人仍在學著與那個位置留下的空缺相處。',
      'zh-cn':'今天，有很多人带着相似的重量来到这里。有人想念父亲，也有人仍在学着与那个位置留下的空缺相处。',
      en:'Many people arrive here today carrying a similar weight. Some miss a father; others are still learning to live beside the space he left.',
      ja:'今日、似た重さを抱えてここを訪れる人がたくさんいます。父を想う人も、その場所に残った空白と生きることを学んでいる人もいます。',
      es:'Hoy muchas personas llegan aquí con un peso parecido. Algunas extrañan a un padre; otras aún aprenden a vivir junto al vacío que dejó.',
      fr:'Aujourd’hui, beaucoup arrivent ici avec un poids semblable. Certains regrettent un père ; d’autres apprennent encore à vivre auprès du vide laissé.',
      de:'Heute kommen viele mit einer ähnlichen Last hierher. Manche vermissen einen Vater; andere lernen noch, mit der hinterlassenen Lücke zu leben.',
      uk:'Сьогодні багато людей приходять сюди зі схожим тягарем. Хтось сумує за батьком, а хтось учиться жити поруч із залишеною порожнечею.',
      pl:'Dziś wiele osób przychodzi tu z podobnym ciężarem. Jedni tęsknią za ojcem, inni wciąż uczą się żyć obok pozostawionej pustki.'
    },
    mother:{
      zh:'今天，有很多人帶著相似的重量來到這裡。有人想念母親，也有人正努力理解一段複雜、未說完的關係。',
      'zh-cn':'今天，有很多人带着相似的重量来到这里。有人想念母亲，也有人正努力理解一段复杂、未说完的关系。',
      en:'Many people arrive here today carrying a similar weight. Some miss a mother; others are trying to understand a complicated, unfinished bond.',
      ja:'今日、似た重さを抱えてここを訪れる人がたくさんいます。母を想う人も、複雑で未完の関係を理解しようとしている人もいます。',
      es:'Hoy muchas personas llegan aquí con un peso parecido. Algunas extrañan a una madre; otras intentan comprender un vínculo complejo e inconcluso.',
      fr:'Aujourd’hui, beaucoup arrivent ici avec un poids semblable. Certains regrettent une mère ; d’autres tentent de comprendre un lien complexe et inachevé.',
      de:'Heute kommen viele mit einer ähnlichen Last hierher. Manche vermissen eine Mutter; andere versuchen, eine komplizierte, unvollendete Beziehung zu verstehen.',
      uk:'Сьогодні багато людей приходять сюди зі схожим тягарем. Хтось сумує за матір’ю, а хтось намагається зрозуміти складний, незавершений зв’язок.',
      pl:'Dziś wiele osób przychodzi tu z podobnym ciężarem. Jedni tęsknią za matką, inni próbują zrozumieć trudną, niedokończoną więź.'
    },
    love:{
      zh:'今天，有很多人帶著相似的重量來到這裡。有人慶祝相遇，也有人帶著未能走到最後的愛。',
      'zh-cn':'今天，有很多人带着相似的重量来到这里。有人庆祝相遇，也有人带着未能走到最后的爱。',
      en:'Many people arrive here today carrying a similar weight. Some celebrate finding each other; others carry a love that could not reach the end.',
      ja:'今日、似た重さを抱えてここを訪れる人がたくさんいます。出会いを祝う人も、最後まで辿り着けなかった愛を抱える人もいます。',
      es:'Hoy muchas personas llegan aquí con un peso parecido. Algunas celebran haberse encontrado; otras llevan un amor que no pudo llegar hasta el final.',
      fr:'Aujourd’hui, beaucoup arrivent ici avec un poids semblable. Certains célèbrent une rencontre ; d’autres portent un amour qui n’a pas pu aller jusqu’au bout.',
      de:'Heute kommen viele mit einer ähnlichen Last hierher. Manche feiern ihr Zusammentreffen; andere tragen eine Liebe, die nicht bis ans Ende gelangte.',
      uk:'Сьогодні багато людей приходять сюди зі схожим тягарем. Хтось святкує зустріч, а хтось несе любов, якій не судилося дійти до кінця.',
      pl:'Dziś wiele osób przychodzi tu z podobnym ciężarem. Jedni świętują spotkanie, inni niosą miłość, która nie dotarła do końca.'
    },
    remembrance:{
      zh:'今天，有很多人帶著相似的重量來到這裡。很多人正在記得那些已經不在身邊、卻仍留在生命裡的人。',
      'zh-cn':'今天，有很多人带着相似的重量来到这里。很多人正在记得那些已经不在身边、却仍留在生命里的人。',
      en:'Many people arrive here today carrying a similar weight, remembering those no longer beside them who still remain within their lives.',
      ja:'今日、似た重さを抱えてここを訪れる人がたくさんいます。もうそばにはいなくても、今も人生の中に残る人を想っています。',
      es:'Hoy muchas personas llegan aquí con un peso parecido, recordando a quienes ya no están a su lado pero siguen dentro de sus vidas.',
      fr:'Aujourd’hui, beaucoup arrivent ici avec un poids semblable, se souvenant de ceux qui ne sont plus à leurs côtés mais demeurent dans leur vie.',
      de:'Heute kommen viele mit einer ähnlichen Last hierher und erinnern sich an Menschen, die nicht mehr neben ihnen sind und doch in ihrem Leben bleiben.',
      uk:'Сьогодні багато людей приходять сюди зі схожим тягарем, згадуючи тих, кого вже немає поруч, але хто досі залишається в їхньому житті.',
      pl:'Dziś wiele osób przychodzi tu z podobnym ciężarem, pamiętając o tych, których nie ma już obok, lecz nadal pozostają w ich życiu.'
    },
    yearEnd:{
      zh:'不是每個人都能輕盈地跨過年末。今天，你不必假裝自己已經準備好了。',
      'zh-cn':'不是每个人都能轻盈地跨过年末。今天，你不必假装自己已经准备好了。',
      en:'Not everyone crosses the end of a year lightly. Today, you do not have to pretend that you are ready.',
      ja:'誰もが軽やかに年末を越えられるわけではありません。今日は、準備ができたふりをしなくても大丈夫です。',
      es:'No todo el mundo cruza el final del año con ligereza. Hoy no tienes que fingir que estás preparado.',
      fr:'Tout le monde ne traverse pas la fin de l’année avec légèreté. Aujourd’hui, vous n’avez pas à faire semblant d’être prêt.',
      de:'Nicht alle gehen leicht über das Jahresende hinweg. Heute musst du nicht so tun, als wärst du bereit.',
      uk:'Не всі легко переходять межу року. Сьогодні тобі не потрібно вдавати, що ти готовий.',
      pl:'Nie każdy lekko przekracza koniec roku. Dziś nie musisz udawać, że jesteś gotowy.'
    }
  };

  function lunarParts(date) {
    try {
      const parts = new Intl.DateTimeFormat('en-u-ca-chinese', { month:'numeric', day:'numeric' }).formatToParts(date);
      const month = Number((parts.find(part => part.type === 'month')?.value || '').match(/\d+/)?.[0]);
      const day = Number((parts.find(part => part.type === 'day')?.value || '').match(/\d+/)?.[0]);
      return Number.isInteger(month) && Number.isInteger(day) ? { month, day } : null;
    } catch (error) {
      return null;
    }
  }

  function isSecondSunday(date) {
    return date.getDay() === 0 && date.getDate() >= 8 && date.getDate() <= 14;
  }

  function getCollectiveMoment(date, options = {}) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const lunar = options.lunar || lunarParts(date);
    if (month === 12 && day === 31) return 'yearEnd';
    if (month === 4 && (day === 4 || day === 5)) return 'qingming';
    if (month === 8 && day === 8) return 'father';
    if (month === 5 && isSecondSunday(date)) return 'mother';
    if ((month === 2 && day === 14) || (lunar?.month === 7 && lunar?.day === 7)) return 'love';
    if (lunar?.month === 7 && lunar?.day === 15) return 'remembrance';
    return null;
  }

  function language() {
    let value = 'zh';
    try { value = localStorage.getItem('empath_language') || root.currentLang || 'zh'; } catch (error) {}
    return value === 'en-uk' ? 'en' : value;
  }

  function messageFor(moment, lang = language()) {
    return COPY[moment]?.[lang] || COPY[moment]?.en || '';
  }

  function dateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function mount(document, date) {
    const moment = getCollectiveMoment(date);
    if (!moment || document.getElementById('collective-grief-note')) return null;
    const seenKey = `empath_collective_grief_seen_${dateKey(date)}`;
    try {
      if (root.sessionStorage?.getItem(seenKey)) return null;
      root.sessionStorage?.setItem(seenKey, 'true');
    } catch (error) {}

    const note = document.createElement('aside');
    note.id = 'collective-grief-note';
    note.className = 'collective-grief-note';
    note.setAttribute('aria-label', 'Collective grief calendar');
    const mark = document.createElement('span');
    mark.className = 'collective-grief-mark';
    mark.setAttribute('aria-hidden', 'true');
    mark.textContent = '✦';
    const copy = document.createElement('p');
    copy.textContent = messageFor(moment);
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'collective-grief-close';
    close.setAttribute('aria-label', 'Close');
    close.textContent = '×';
    const updateLanguage = () => { copy.textContent = messageFor(moment); };
    const remove = () => {
      note.classList.remove('is-visible');
      root.removeEventListener?.('empath:language-changed', updateLanguage);
      root.setTimeout(() => note.remove(), 700);
    };
    close.addEventListener('click', remove);
    note.append(mark, copy, close);
    document.body.appendChild(note);
    root.requestAnimationFrame(() => note.classList.add('is-visible'));
    root.addEventListener?.('empath:language-changed', updateLanguage);
    root.setTimeout(remove, 16000);
    return note;
  }

  return { getCollectiveMoment, isSecondSunday, lunarParts, messageFor, mount };
});
