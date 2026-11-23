import { expect, test } from '@playwright/test';

async function isolate(page) {
  await page.route(/cloudfunctions\.net/i, route => route.fulfill({contentType:'application/json',body:JSON.stringify({data:{accepted:true,count:1,totalVisitors:0}})}));
  await page.route(/firestore\.googleapis\.com|google-analytics\.com|googletagmanager\.com/i, route => route.abort());
  await page.addInitScript(() => {
    sessionStorage.setItem('empath_concept_entry_seen','true');
    sessionStorage.setItem('empath_session_route','["E","M","P","A","T","H"]');
  });
}

test('phone H journey and week read vertically without clipping', async ({page}, testInfo) => {
  await isolate(page);
  for (const width of [320,390,768]) {
    await page.setViewportSize({width,height:844});
    await page.goto('/room-h.html');
    await expect(page.locator('.h-arc-node')).toHaveCount(6);
    await expect(page.locator('.emotion-day')).toHaveCount(7);
    await expect(page.locator('.h-path-nav')).toHaveCSS('position','relative');
    await expect(page.locator('.h-path-nav')).toHaveCSS('display','grid');
    const navBox = await page.locator('.h-path-nav').boundingBox();
    const journeyBox = await page.locator('#h-journey-arc').boundingBox();
    expect(navBox.y + navBox.height).toBeLessThanOrEqual(journeyBox.y);
    const boxes = await page.locator('.h-arc-node').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().toJSON()));
    for (let i=1;i<boxes.length;i++) expect(boxes[i].top).toBeGreaterThanOrEqual(boxes[i-1].bottom + 8);
    const days = await page.locator('.emotion-day').evaluateAll(nodes => nodes.map(node=>({rect:node.getBoundingClientRect().toJSON(),width:node.scrollWidth,client:node.clientWidth})));
    for (let i=0;i<days.length;i++) {
      expect(days[i].width).toBeLessThanOrEqual(days[i].client + 1);
      if (i) expect(days[i].rect.top).toBeGreaterThan(days[i-1].rect.bottom);
    }
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 2);
    if (width===390) await testInfo.attach('H-phone-week',{body:await page.locator('#emotion-week').screenshot(),contentType:'image/png'});
  }
});

test('phone M separates crowded stars from copy and keeps every shown star selectable', async ({page}, testInfo) => {
  await isolate(page);
  for (const width of [320,390,768]) {
    await page.setViewportSize({width,height:844});
    await page.goto('/room-m.html');
    await page.waitForFunction(()=>typeof window.drawStars==='function' && Array.isArray(window.starMessages));
    await page.evaluate(()=>{
      window.starMessages.splice(0,window.starMessages.length,...Array.from({length:80},(_,i)=>({id:`fixture-${i}`,text:`Test memory ${i}`,brightness:100,colorIdx:i%6,relX:.5,relY:.5})));
      document.querySelectorAll('#room-m .data-state, #star-loading').forEach(el=>el.style.setProperty('display','none','important'));
      window.resizeCanvas('m'); window.drawStars();
    });
    await expect.poll(()=>page.evaluate(()=>window.starMessages.filter(s=>Number.isFinite(s.x)).length)).toBe(12);
    const geometry=await page.evaluate(()=>{
      const rect=document.querySelector('#star-canvas').getBoundingClientRect();
      return {stars:window.starMessages.filter(s=>Number.isFinite(s.x)).map(s=>({id:s.id,x:s.x,y:s.y})),top:document.querySelector('#room-m .desc-wrap').getBoundingClientRect().bottom-rect.top,bottom:document.querySelector('.m-input-wrap').getBoundingClientRect().top-rect.top};
    });
    for (const star of geometry.stars) {
      expect(star.y).toBeGreaterThan(geometry.top+30);
      expect(star.y).toBeLessThan(geometry.bottom-30);
      for (const other of geometry.stars) if (other.id!==star.id) expect(Math.hypot(star.x-other.x,star.y-other.y)).toBeGreaterThan(60);
      await page.evaluate(s=>{
        const rect=document.querySelector('#star-canvas').getBoundingClientRect();
        document.querySelector('#room-m').dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:rect.left+s.x,clientY:rect.top+s.y}));
      },star);
      await expect(page.locator('#star-tooltip')).toContainText(`Test memory ${star.id.split('-')[1]}`);
    }
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width+2);
    if(width===390) await testInfo.attach('M-phone-sky',{body:await page.locator('#room-m').screenshot(),contentType:'image/png'});
  }
});
