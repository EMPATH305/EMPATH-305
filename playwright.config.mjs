import { defineConfig } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://127.0.0.1:4173';

export default defineConfig({
  testDir:'./tests/browser',
  fullyParallel:false,
  forbidOnly:Boolean(process.env.CI),
  retries:process.env.CI ? 1 : 0,
  workers:process.env.CI ? 1 : undefined,
  reporter:process.env.CI
    ? [['line'], ['html', { open:'never' }]]
    : 'line',
  use:{
    baseURL,
    reducedMotion:'reduce',
    serviceWorkers:'block',
    trace:'retain-on-failure',
    screenshot:'only-on-failure',
    video:'off'
  },
  webServer:process.env.PLAYWRIGHT_TEST_BASE_URL ? undefined : {
    command:'python3 -m http.server 4173 --bind 127.0.0.1',
    url:'http://127.0.0.1:4173/index.html',
    reuseExistingServer:!process.env.CI,
    stdout:'ignore',
    stderr:'pipe'
  },
  projects:[
    {
      name:'desktop-chromium',
      use:{
        browserName:'chromium',
        viewport:{ width:1440, height:900 }
      }
    },
    {
      name:'mobile-chromium',
      use:{
        browserName:'chromium',
        viewport:{ width:390, height:844 },
        deviceScaleFactor:3,
        hasTouch:true,
        isMobile:true
      }
    }
  ]
});
