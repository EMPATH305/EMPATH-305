import { expect, test } from '@playwright/test';

async function prepare(page) {
  await page.route(/cloudfunctions\.net/i,r=>r.fulfill({contentType:'application/json',body:JSON.stringify({data:{accepted:true,count:1,totalVisitors:0}})}));
  await page.route(/firestore\.googleapis\.com|google-analytics\.com|googletagmanager\.com/i,r=>r.abort());
  await page.addInitScript(()=>{
    sessionStorage.setItem('empath_concept_entry_seen','true');
    sessionStorage.setItem('empath_session_route','["E","M","P","A","T","H"]');
    localStorage.setItem('empath_hsp_hint_shown','true');
  });
}
function readingAudit() {
  const issues=[];
  const roots=[...document.querySelectorAll('.reading-surface')];
  const all=[...new Set(roots.flatMap(el=>[el,...el.querySelectorAll('*')]))];
  const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number);
  const lum=c=>c.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
  for(const el of all){
    const s=getComputedStyle(el),name=el.id||el.getAttribute('class')||el.tagName;
    if(!el.getClientRects().length||s.display==='none'||s.visibility==='hidden')continue;
    for(const pseudo of [null,'::before','::after']){
      const st=getComputedStyle(el,pseudo);
      if(pseudo&&(st.content==='none'||st.content==='normal'))continue;
      if(st.boxShadow!=='none')issues.push([name,pseudo,'shadow',st.boxShadow]);
      if(st.backdropFilter&&st.backdropFilter!=='none')issues.push([name,pseudo,'backdrop']);
      if(st.animationName!=='none'&&st.animationIterationCount.split(',').some(v=>v.trim()==='infinite'))issues.push([name,pseudo,'infinite']);
    }
    const text=[...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim();
    if(!text&&el.tagName!=='TEXTAREA')continue;
    if(parseFloat(s.fontSize)<12)issues.push([name,'font',s.fontSize]);
    if(parseFloat(s.letterSpacing)>parseFloat(s.fontSize)*.04+.01)issues.push([name,'spacing',s.letterSpacing]);
    let opacity=1,bg=null;
    for(let n=el;n;n=n.parentElement){const st=getComputedStyle(n);opacity*=Number(st.opacity);const c=rgb(st.backgroundColor);if(!bg&&(c.length===3||c[3]===1))bg=c;}
    if(opacity<.6)issues.push([name,'opacity',opacity]);
    const fg=rgb(el.tagName.toLowerCase()==='text'?s.fill:s.color);bg||=[13,27,42];
    const a=(fg[3]??1)*opacity;const blend=fg.slice(0,3).map((v,i)=>v*a+bg[i]*(1-a));
    const [l,h]=[lum(blend),lum(bg)].sort((a,b)=>a-b);
    if((h+.05)/(l+.05)<4.5)issues.push([name,'contrast',(h+.05)/(l+.05)]);
    const rect=el.getBoundingClientRect();
    if(rect.left< -1||rect.right>innerWidth+1)issues.push([name,'horizontal clipping',rect.left,rect.right]);
  }
  return {issues,width:document.documentElement.scrollWidth};
}
for(const room of ['m','h'])for(const width of [320,375,768,1440]){
  test(`Room ${room.toUpperCase()} reading surface at ${width}px`,async({page},info)=>{
    test.skip(info.project.name!=='desktop-chromium','Each exact-width design audit runs once.');
    await page.setViewportSize({width,height:900});
    await page.emulateMedia({reducedMotion:'no-preference'});
    await prepare(page);
    await page.clock.setFixedTime(new Date('2026-12-31T12:00:00Z'));
    await page.goto(`/room-${room}.html`);
    await page.waitForFunction(()=>typeof window.switchLang==='function');
    await page.evaluate(()=>document.fonts.ready);
    if(await page.locator('.collective-grief-close').isVisible()){
      await page.locator('.collective-grief-close').click();
      await expect(page.locator('.collective-grief-close')).toHaveCount(0);
    }
    if(room==='m'){
      await page.waitForFunction(()=>typeof window.drawStars==='function');
      await page.evaluate(()=>{
        window.starMessages.splice(0,window.starMessages.length,...Array.from({length:80},(_,i)=>({id:`fixture-${i}`,text:`Test memory ${i}`,brightness:3,colorIdx:i%6,relX:.5,relY:.5})));
        document.querySelectorAll('#room-m .data-state,#star-loading').forEach(el=>el.hidden=true);
        window.resizeCanvas('m');window.drawStars();window.updateMStats();
      });
      await expect.poll(()=>page.evaluate(()=>{window.drawStars();return window.starMessages.filter(s=>Number.isFinite(s.x)).length})).toBe(width<=768?12:80);
      await page.locator('#m-input').fill('A remembered moment.');
      await expect(page.locator('#m-char')).toHaveText('20 / 500');
      await page.locator('#m-input').fill('');
      if(width<=768){
        const gap=await page.evaluate(()=>document.querySelector('.m-input-wrap').getBoundingClientRect().top-document.querySelector('.desc-wrap').getBoundingClientRect().bottom);
        expect(gap).toBeGreaterThanOrEqual(420);
      }
    }else{
      await expect(page.locator('.h-arc-node')).toHaveCount(6);
      await expect(page.locator('.emotion-day')).toHaveCount(7);
      await expect(page.locator('.h-path-nav')).toHaveCSS('position','relative');
      await page.locator('#weather-toggle').click();
      await expect(page.locator('#weather-toggle')).toHaveAttribute('aria-pressed','true');
      await expect(page.locator('#weather-rooms')).toBeVisible();
      await page.locator('#weather-clear').click();
      expect((await page.evaluate(readingAudit)).issues).toEqual([]);
      await page.locator('#weather-clear-cancel').click();
    }
    const audit=await page.evaluate(readingAudit);expect(audit.issues).toEqual([]);expect(audit.width).toBeLessThanOrEqual(width);
    await page.evaluate(()=>{document.activeElement?.blur();window.scrollTo({top:0,behavior:'instant'});});
    if([375,1440].includes(width))await info.attach(`room-${room}-${width}.png`,{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
    await page.evaluate(()=>window.switchLang('en'));
    expect((await page.evaluate(readingAudit)).issues).toEqual([]);
    await expect(page.locator('#toast')).not.toHaveClass(/show/);
    if([375,1440].includes(width))await info.attach(`room-${room}-${width}-english.png`,{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
    await page.evaluate(()=>window.toggleHSP());
    expect((await page.evaluate(readingAudit)).issues).toEqual([]);
    await page.emulateMedia({reducedMotion:'reduce'});
    expect((await page.evaluate(readingAudit)).issues).toEqual([]);
    await expect(page.locator('#empath-safe-mode')).toBeHidden();
  });
}
