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

    if (entry.path === '/room-m.html') {
      const canvasSize = await page.locator('#star-canvas').evaluate(canvas => ({ width:canvas.width, height:canvas.height }));
      expect(canvasSize.width).toBeGreaterThan(0);
      expect(canvasSize.height).toBeGreaterThan(0);
    }

    if (entry.path === '/room-p.html') {
      const canvasSize = await page.locator('#p-canvas').evaluate(canvas => ({
        width:canvas.width,
        height:canvas.height,
        renderedWidth:canvas.getBoundingClientRect().width
      }));
      expect(canvasSize.width).toBeGreaterThan(0);
      expect(canvasSize.height).toBeGreaterThan(0);
      expect(canvasSize.renderedWidth).toBeGreaterThan(0);
    }

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

  if ((page.viewportSize()?.width || 0) <= 900) {
    await page.locator('#hamburger-btn').click();
    await expect(page.locator('#nav-menu')).toHaveClass(/show/);
  } else {
    // The desktop control has a deliberate transform transition, which can
    // keep Playwright's stability check waiting after the event has fired.
    // Dispatching the real click event tests the same registered handler.
    await page.locator('#nav-utility-toggle').dispatchEvent('click');
    await expect(page.locator('#nav-controls')).toHaveClass(/is-open/);
  }
  await page.locator('#lang-select-btn').click();
  await expect(page.locator('#lang-dropdown-list')).toHaveClass(/show/);
  await page.locator('.lang-option[data-lang="en"]').click();

  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level:1, name:'Emotional Exit' })).toBeVisible();
  await expect(page.locator('#lang-select-btn')).toHaveAttribute('aria-expanded', 'false');
});

test('Room E delivery state follows text and drawing modes', async ({ page }) => {
  await isolateFromProduction(page);
  await page.goto('/room-e.html', { waitUntil:'domcontentloaded' });

  await page.locator('#e-delivery-drift').click();
  await expect(page.locator('#e-delivery-drift')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#e-submit-btn')).toContainText('把信裝進瓶子');

  await page.locator('#btn-mode-draw').click();
  await expect(page.locator('#e-delivery-choice')).toBeHidden();
  await expect(page.locator('#e-delivery-public')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#e-draw-canvas')).toBeVisible();
  const canvasSize = await page.locator('#e-draw-canvas').evaluate(canvas => ({ width:canvas.width, height:canvas.height }));
  expect(canvasSize.width).toBeGreaterThan(0);
  expect(canvasSize.height).toBeGreaterThan(0);

  await page.locator('#btn-mode-text').click();
  await expect(page.locator('#e-delivery-choice')).toBeVisible();
  await expect(page.locator('#e-delivery-public')).toHaveAttribute('aria-pressed', 'true');
});

test('runtime profile selects the embedded-browser compatibility path', async ({ page }, testInfo) => {
  await isolateFromProduction(page);
  await page.goto('/room-e.html', { waitUntil:'domcontentloaded' });

  const expectedRuntime = testInfo.project.name === 'instagram-ios' ? 'embedded' : 'standard';
  await expect(page.locator('html')).toHaveAttribute('data-empath-runtime', expectedRuntime);
});
