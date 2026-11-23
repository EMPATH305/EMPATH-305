import { test, expect } from '@playwright/test';
const key='empath_private_weather_v1';
async function isolate(page) {
  // The feature must function even when the Firebase application cannot load.
  await page.route(/firebase-app\.js|cloudfunctions\.net|firestore\.googleapis\.com|google-analytics\.com|googletagmanager\.com/,r=>r.abort());
  await page.addInitScript(()=>sessionStorage.setItem('empath_concept_entry_seen','true'));
}

test('weather is opt-in, records across rooms, pauses and clears only its own history',async({page})=>{
  await isolate(page);
  await page.goto('/room-m.html');
  expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBeNull();
  await page.goto('/room-h.html');
  await expect(page.locator('#weather-toggle')).toHaveAttribute('aria-pressed','false');
  await page.locator('#weather-toggle').click();
  await expect(page.locator('#weather-status')).toContainText('已開啟');
  await page.goto('/room-m.html');
  await expect.poll(()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)).entries.length,key)).toBe(2);
  await page.reload();
  await page.goto('/room-h.html');
  await expect(page.locator('#weather-rooms [data-room="m"]')).toContainText('1 天');
  expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).entries.length,key)).toBe(2);
  await page.locator('[data-weather-days="30"]').click();
  await expect(page.locator('#weather-summary')).toContainText('近 30 天');
  await page.locator('#weather-toggle').click();
  await page.goto('/room-e.html');
  await page.goto('/room-h.html');
  await expect(page.locator('#weather-rooms [data-room="e"]')).toContainText('0 天');
  await page.evaluate(()=>localStorage.setItem('weather-test-unrelated','preserve'));
  await page.locator('#weather-clear').click();
  await page.locator('#weather-clear-cancel').click();
  await expect(page.locator('#weather-rooms')).toBeVisible();
  await page.locator('#weather-clear').click();
  await page.locator('#weather-clear-yes').click();
  await expect(page.locator('#weather-toggle')).toHaveAttribute('aria-pressed','false');
  expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBeNull();
  expect(await page.evaluate(()=>localStorage.getItem('weather-test-unrelated'))).toBe('preserve');
  await page.reload();
  await expect(page.locator('#weather-rooms')).toBeHidden();
});

test('weather phone summary is readable and language changes do not reset consent',async({page},testInfo)=>{
  await isolate(page);
  await page.setViewportSize({width:320,height:844});
  await page.goto('/room-h.html');
  await page.locator('#weather-toggle').click();
  await page.evaluate(()=>window.dispatchEvent(new CustomEvent('empath:language-changed',{detail:{lang:'en'}})));
  await expect(page.locator('#weather-toggle')).toHaveText('Pause recording');
  await expect(page.locator('#weather-rooms [data-room="h"]')).toContainText('H · Home');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(322);
  const sizes=await page.locator('#private-weather button').evaluateAll(nodes=>nodes.filter(n=>n.offsetHeight).map(n=>n.getBoundingClientRect().height));
  expect(sizes.every(height=>height>=48)).toBe(true);
  await page.evaluate(()=>window.dispatchEvent(new CustomEvent('empath:language-changed',{detail:{lang:'zh'}})));
  await testInfo.attach('private-weather-phone',{body:await page.locator('#private-weather').screenshot({style:'body > nav, .skip-link { visibility:hidden !important; }'}),contentType:'image/png'});
});

test('unavailable local storage is disclosed and the room remains usable',async({page})=>{
  await isolate(page);
  await page.addInitScript(()=>{Storage.prototype.setItem=function(){throw new DOMException('Blocked','QuotaExceededError');};});
  await page.goto('/room-h.html');
  await page.locator('#weather-toggle').click();
  await expect(page.locator('#weather-status')).toContainText('瀏覽器無法儲存');
  await expect(page.locator('#room-h')).toBeVisible();
});
