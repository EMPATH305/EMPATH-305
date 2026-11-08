const EMBEDDED_BROWSER_PATTERNS = Object.freeze([
  ['instagram', /Instagram|Threads/i],
  ['facebook', /FBAN|FBAV|FB_IAB|FBIOS|FB4A/i],
  ['line', /\bLine\/[\d.]+/i],
  ['wechat', /MicroMessenger/i],
  ['tiktok', /TikTok|BytedanceWebview/i]
]);

export function detectBrowserRuntime(userAgent = globalThis.navigator?.userAgent || '') {
  const matched = EMBEDDED_BROWSER_PATTERNS.find(([, pattern]) => pattern.test(String(userAgent)));
  const embeddedBrowser = matched?.[0] || null;
  return Object.freeze({
    kind:embeddedBrowser ? 'embedded' : 'standard',
    isEmbedded:Boolean(embeddedBrowser),
    embeddedBrowser
  });
}
