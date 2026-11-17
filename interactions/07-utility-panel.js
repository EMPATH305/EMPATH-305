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
  if (!panel.contains(event.target) && !trigger.contains(event.target)) window.toggleUtilityPanel(false);
});
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') window.toggleUtilityPanel(false);
});

;

