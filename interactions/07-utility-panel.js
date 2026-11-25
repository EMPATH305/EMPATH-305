/* ===== INLINE BLOCK 6 ===== */
window.toggleUtilityPanel = function(forceState) {
  const panel = document.getElementById('nav-controls');
  const trigger = document.getElementById('nav-utility-toggle');
  if (!panel || !trigger) return;
  const shouldOpen = typeof forceState === 'boolean' ? forceState : !panel.classList.contains('is-open');
  panel.classList.toggle('is-open', shouldOpen);
  trigger.setAttribute('aria-expanded', String(shouldOpen));
};
document.addEventListener('click', function(event) {
  const panel = document.getElementById('nav-controls');
  const trigger = document.getElementById('nav-utility-toggle');
  if (!panel || !trigger || !panel.classList.contains('is-open')) return;
  // Homepage audio replaces its icon during the click; the original target can
  // already be detached. The dispatch path still records the containing panel.
  const homePanelClick = document.documentElement.classList.contains('empath-home-page')
    && event.composedPath().includes(panel);
  if (!homePanelClick && !panel.contains(event.target) && !trigger.contains(event.target)) window.toggleUtilityPanel(false);
});
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') window.toggleUtilityPanel(false);
});

;

