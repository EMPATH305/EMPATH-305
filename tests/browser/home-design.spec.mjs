import { expect, test } from '@playwright/test';

async function prepare(page) {
  await page.addInitScript(() => sessionStorage.setItem('empath_concept_entry_seen', 'true'));
  await page.route(/cloudfunctions\.net/i, route => route.fulfill({ status:200, contentType:'application/json', body:JSON.stringify({ data:{ accepted:true, totalVisitors:0, counted:false, count:1 } }) }));
  await page.route(/firestore\.googleapis\.com|google-analytics\.com|googletagmanager\.com/i, route => route.abort('blockedbyclient'));
}

for (const width of [375, 1440]) {
  test(`homepage visual contract at ${width}px`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Exact viewport audit runs once per width.');
    await page.setViewportSize({ width, height:900 });
    await page.emulateMedia({ reducedMotion:'no-preference' });
    await prepare(page);
    await page.clock.setFixedTime(new Date('2026-12-31T12:00:00Z'));
    await page.goto('/index.html', { waitUntil:'domcontentloaded' });
    await expect(page.locator('#hero')).toBeVisible();
    await page.waitForFunction(() => typeof window.switchLang === 'function');
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1200);
    await expect(page.locator('.cinematic-sky > div')).toHaveCount(2);
    await expect(page.locator('.aw-site-noise, .empath-living-field')).toHaveCount(0);
    await expect(page.locator('.daily-mood > span')).toHaveText(['雨','霧','月','傷','燭','晴']);
    await expect(page.locator('.door-btn .dl')).toHaveText(['墨','星','金','沙','脈','家']);
    await expect(page.locator('#collective-date-whisper')).toBeVisible();
    await expect(page.locator('.hero-manifesto')).not.toHaveAttribute('aria-hidden', 'true');
    await page.locator('.door-btn[data-d="T"]').evaluate(el => {el.style.boxShadow='0 0 25px orange';el.style.borderColor='orange';});
    await expect(page.locator('.door-btn[data-d="T"]')).toHaveClass(/has-return-echo/);
    const measureHome = () => {
      const issues=[];
      const roots=[...document.querySelectorAll('.home-surface')];
      const elements=[...new Set(roots.flatMap(el=>[el,...el.querySelectorAll('*')]))];
      const label=el=>el.id || el.className || el.tagName;
      const rgb=value=>(value.match(/[\d.]+/g)||[]).map(Number);
      const lum=c=>c.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
      for (const el of elements) {
        const cs=getComputedStyle(el);
        if (!el.getClientRects().length || cs.visibility==='hidden' || cs.display==='none') continue;
        for (const pseudo of [null,'::before','::after']) {
          const s=getComputedStyle(el,pseudo);
          if (pseudo && (s.content==='none'||s.content==='normal')) continue;
          if (/\p{Emoji_Presentation}|\p{Extended_Pictographic}\uFE0F|✦/u.test(s.content)) issues.push([label(el),pseudo,'emoji content']);
          if(s.boxShadow!=='none') issues.push([label(el),pseudo,'shadow',s.boxShadow]);
          if(s.backdropFilter && s.backdropFilter!=='none') issues.push([label(el),pseudo,'backdrop',s.backdropFilter]);
          if(s.animationName!=='none' && s.animationIterationCount.split(',').some(n=>n.trim()==='infinite')) issues.push([label(el),pseudo,'infinite animation']);
        }
        const text=[...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim();
        if (!text) continue;
        if (/\p{Emoji_Presentation}|\p{Extended_Pictographic}\uFE0F|✦/u.test(text)) issues.push([label(el),'emoji',text]);
        if (parseFloat(cs.fontSize)<12) issues.push([label(el),'small font',cs.fontSize]);
        if (!cs.fontFamily.includes('Noto Serif TC')) issues.push([label(el),'font',cs.fontFamily]);
        if (parseFloat(cs.letterSpacing)>parseFloat(cs.fontSize)*.04+.01) issues.push([label(el),'spacing',cs.letterSpacing]);
        let opacity=1,bg=null;
        for(let n=el;n;n=n.parentElement){const s=getComputedStyle(n);opacity*=Number(s.opacity);const c=rgb(s.backgroundColor);if(!bg && (c.length===3||c[3]===1))bg=c;}
        if(opacity<.6)issues.push([label(el),'text opacity',opacity]);
        const fg=rgb(cs.color);bg ||= [13,27,42];
        const alpha=(fg[3]??1)*opacity;
        const blended=fg.slice(0,3).map((v,i)=>v*alpha+bg[i]*(1-alpha));
        const [a,b]=[lum(blended),lum(bg)].sort((a,b)=>b-a);
        const contrast=(a+.05)/(b+.05);
        if(contrast<4.5)issues.push([label(el),'contrast',contrast]);
      }
      return {issues,width:document.documentElement.scrollWidth, cards:[...document.querySelectorAll('.door-btn')].map(el=>{const r=el.getBoundingClientRect();return {width:r.width,height:r.height};}),acts:[...document.querySelectorAll('.journey-act')].map(el=>el.getBoundingClientRect().left)};
    };
    const audit = await page.evaluate(measureHome);
    expect(audit.issues).toEqual([]);
    expect(audit.width).toBeLessThanOrEqual(width);
    expect(new Set(audit.cards.map(c=>Math.round(c.width))).size).toBe(1);
    expect(new Set(audit.cards.map(c=>Math.round(c.height))).size).toBe(1);
    expect(audit.acts[1]-audit.acts[0]).toBeCloseTo(28);
    expect(audit.acts[2]-audit.acts[0]).toBeCloseTo(56);
    if (await page.locator('.collective-grief-close').isVisible()) await page.locator('.collective-grief-close').click();
    await testInfo.attach(`homepage-${width}.png`, { body:await page.screenshot({ fullPage:true }),contentType:'image/png' });
    await page.locator('[data-mood="missing"]').click();
    await expect(page.locator('#daily-result-link')).toHaveAttribute('href','room-m.html');
    await expect(page.locator('[data-mood="missing"]')).toHaveAttribute('aria-pressed','true');
    await page.locator('#creator-btn').click();
    await expect(page.locator('#creator-modal')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#creator-modal')).toBeHidden();
    if(width<901) await page.locator('#hamburger-btn').click();
    else await page.locator('#nav-utility-toggle').click();
    await expect(page.locator('#nav-controls')).toBeVisible();
    expect((await page.evaluate(measureHome)).issues).toEqual([]);
    await page.locator('#audio-btn .home-control-glyph').click();
    await expect(page.locator('#audio-btn')).not.toContainText('🔊');
    await expect(page.locator('#nav-controls')).toBeVisible();
    expect((await page.evaluate(measureHome)).issues).toEqual([]);
    await expect(page.locator('#audio-btn .home-control-glyph')).toHaveAttribute('aria-hidden','true');
    await page.locator('#audio-btn').click();
    await page.locator('#lang-select-btn').click();
    await page.locator('[data-lang="en"]').click();
    await expect(page.locator('.hero-lead')).toHaveText('Some feelings do not need to be solved. They only need a place to be seen.');
    await page.evaluate(()=>window.closeMobileNav());
    expect((await page.evaluate(measureHome)).issues).toEqual([]);
    await testInfo.attach(`homepage-${width}-english.png`, { body:await page.screenshot({fullPage:true}),contentType:'image/png' });
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.evaluate(()=>window.toggleHSP());
    await expect(page.locator('body')).toHaveClass(/hsp-mode/);
    await expect(page.locator('.cinematic-sky')).toBeHidden();
    expect((await page.evaluate(measureHome)).issues).toEqual([]);
    await page.evaluate(()=>window.toggleHSP());
    await page.emulateMedia({reducedMotion:'reduce'});
    await expect(page.locator('.cinematic-lens')).toBeHidden();
    for(const mode of ['dawn-mode','night-mode']){
      await page.evaluate(mode=>document.body.classList.add(mode),mode);
      await expect(page.locator('#hero')).toBeVisible();
      expect((await page.evaluate(measureHome)).issues).toEqual([]);
      await page.evaluate(mode=>document.body.classList.remove(mode),mode);
    }
    await expect(page.locator('#empath-safe-mode')).toBeHidden();
  });
}
