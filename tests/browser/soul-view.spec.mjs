import { expect, test } from '@playwright/test';

async function mount(page) {
  await page.route('**/soul-view-fixture.html', route => route.fulfill({contentType:'text/html',body:'<!doctype html><div id="h-events"></div><div id="unlocked-letters"></div>'}));
  await page.goto('/soul-view-fixture.html');
  await page.evaluate(async () => {
    const { createSoulView } = await import('/soul-view.mjs');
    window.journey = {events:[]}; window.language='en';
    window.view=createSoulView({document,t:(zh,en)=>window.language==='zh'?zh:en,getLanguage:()=>window.language,getJourney:()=>window.journey});
  });
}

test('Soul timeline rebuilds current journey and language without duplicating events', async ({page}) => {
  await mount(page);
  await page.evaluate(()=>window.view.initTimeline());
  await expect(page.locator('#h-events')).toContainText('Your journey footprints will slowly appear here');
  await page.evaluate(()=>{
    window.journey={events:[{type:'m',text:'memory',time:'10:00'}]};
    window.language='en-uk'; window.view.initTimeline();window.view.initTimeline();
  });
  await expect(page.locator('.h-event')).toHaveCount(2);
  await expect(page.locator('.h-event-label')).toHaveText('Stars');
  await expect(page.locator('.h-event-text')).toHaveText('memory');
  await page.evaluate(()=>{window.language='zh';window.view.initTimeline();});
  await expect(page.locator('.h-event-label')).toHaveText('思念映射');
});

test('Soul timeline renders untrusted text literally and bounds event class and summary', async ({page}) => {
  await mount(page);
  const input='<img src=x onerror=alert(1)>'+ 'A'.repeat(50);
  await page.evaluate(text=>{
    window.view.renderTimelineHTML('invalid" onclick="alert(1)',text,'<b>time</b>');
    window.view.renderTimelineHTML('e',null,null);
  },input);
  await expect(page.locator('#h-events img, #h-events b')).toHaveCount(0);
  await expect(page.locator('.h-event').first()).toHaveClass('h-event e-event');
  await expect(page.locator('.h-event-text').first()).toHaveText(input.slice(0,40)+'…');
  await expect(page.locator('.h-event-time').first()).toHaveText('<b>time</b>');
  await expect(page.locator('.h-event-text').last()).toHaveText('');
});

test('future letters honor unlock boundary, replace rendered content and keep HTML as text', async ({page}) => {
  await mount(page);
  await page.evaluate(()=>{
    window.letters=[{content:'<img src=x>\nhello',createdAt:1,unlockDate:100},{content:'later',createdAt:2,unlockDate:101}];
    window.view.renderFutureLetters(window.letters,100);
  });
  await expect(page.locator('#unlocked-letters > div')).toHaveCount(1);
  await expect(page.locator('#unlocked-letters img')).toHaveCount(0);
  await expect(page.locator('#unlocked-letters > div > div')).toHaveText('<img src=x>\nhello');
  await expect(page.locator('#unlocked-letters > div > div')).toHaveCSS('white-space','pre-wrap');
  await page.evaluate(()=>window.view.renderFutureLetters(window.letters,100,true));
  await expect(page.locator('#unlocked-letters > div')).toHaveCount(2);
  await page.evaluate(()=>window.view.renderFutureLetters(window.letters,99));
  await expect(page.locator('#unlocked-letters > div')).toHaveCount(0);
  await page.evaluate(()=>{
    document.getElementById('h-events').remove();document.getElementById('unlocked-letters').remove();
    window.view.initTimeline();window.view.renderTimelineHTML('e','text','time');window.view.renderFutureLetters(window.letters,100);
  });
});
