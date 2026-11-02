import { expect, test } from '@playwright/test';

const pages = [
  { path:'/index.html', root:'#hero', heading:'EMPATH' },
  { path:'/room-e.html', root:'#room-e', heading:'情緒出口' },
  { path:'/room-m.html', root:'#room-m', heading:'思念映射' },
  { path:'/room-p.html', root:'#room-p', heading:'碎片修補' },
  { path:'/room-a.html', root:'#room-a', heading:'神聖避難所' },
  { path:'/room-t.html', root:'#room-t', heading:'能量共振' },
  { path:'/room-h.html', root:'#room-h', heading:'靈魂歸宿' }
];

async function isolateFromProduction(page) {
  await page.addInitScript(() => {
    try { sessionStorage.setItem('empath_concept_entry_seen', 'true'); } catch (error) {}
  });
  await page.route(/cloudfunctions\.net/i, async route => {
    const functionName = new URL(route.request().url()).pathname.split('/').filter(Boolean).at(-1);
    const dataByFunction = {
      recordSiteVisit:{ accepted:true, totalVisitors:0, counted:false },
      joinSilentCompanionship:{ accepted:true, count:1, bucket:0, counted:false }
    };
    await route.fulfill({
      status:200,
      contentType:'application/json',
      body:JSON.stringify({ data:dataByFunction[functionName] || {} })
    });
  });
  await page.route(/firestore\.googleapis\.com/i, route => route.abort('blockedbyclient'));
  await page.route(/google-analytics\.com|googletagmanager\.com/i, route => route.abort('blockedbyclient'));
}

for (const entry of pages) {
  test(`${entry.path} renders without runtime failure`, async ({ page }, testInfo) => {
    const pageErrors = [];
    const failedLocalAssets = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('requestfailed', request => {
      const requestURL = new URL(request.url());
      const baseURL = new URL(testInfo.project.use.baseURL);
      if (requestURL.origin === baseURL.origin) {
        failedLocalAssets.push(`${request.method()} ${requestURL.pathname}`);
      }
    });
    await isolateFromProduction(page);

    const response = await page.goto(entry.path, { waitUntil:'domcontentloaded' });
    expect(response?.ok(), `HTTP response for ${entry.path}`).toBe(true);
    await expect(page.locator('#main-content')).toBeAttached();
    await expect(page.locator(entry.root)).toBeVisible();
    await expect(page.getByRole('heading', { level:1, name:entry.heading })).toBeVisible();
    await expect(page.locator('#empath-safe-mode')).toBeHidden();
    await page.waitForTimeout(750);

    const viewport = page.viewportSize();
    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(documentWidth).toBeLessThanOrEqual((viewport?.width || documentWidth) + 2);
    expect(pageErrors).toEqual([]);
    expect(failedLocalAssets).toEqual([]);
  });
}

test('language control updates the document and room copy', async ({ page }) => {
  await isolateFromProduction(page);
  await page.goto('/room-e.html', { waitUntil:'domcontentloaded' });

  await page.locator('#nav-utility-toggle').click();
  await page.locator('.lang-option[data-lang="en"]').click();

  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level:1, name:'Emotional Exit' })).toBeVisible();
  await expect(page.locator('#nav-utility-toggle')).toHaveAttribute('aria-expanded', 'false');
});
