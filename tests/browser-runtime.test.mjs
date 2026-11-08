import test from 'node:test';
import assert from 'node:assert/strict';
import { detectBrowserRuntime } from '../browser-runtime.mjs';

test('recognizes Instagram on iPhone as an embedded browser', () => {
  const profile = detectBrowserRuntime('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Instagram 355.0.0.20.109');
  assert.deepEqual(profile, { kind:'embedded', isEmbedded:true, embeddedBrowser:'instagram' });
});

test('recognizes common social app webviews', () => {
  assert.equal(detectBrowserRuntime('Mozilla/5.0 FBAN/FBIOS;FBAV/490.0').embeddedBrowser, 'facebook');
  assert.equal(detectBrowserRuntime('Mozilla/5.0 iPhone Line/14.20.0').embeddedBrowser, 'line');
  assert.equal(detectBrowserRuntime('Mozilla/5.0 MicroMessenger/8.0.54').embeddedBrowser, 'wechat');
  assert.equal(detectBrowserRuntime('Mozilla/5.0 BytedanceWebview TikTok').embeddedBrowser, 'tiktok');
});

test('keeps Safari and Chrome on the standard runtime', () => {
  for (const userAgent of [
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Version/18.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/131.0 Mobile Safari/537.36'
  ]) {
    assert.deepEqual(detectBrowserRuntime(userAgent), { kind:'standard', isEmbedded:false, embeddedBrowser:null });
  }
});
