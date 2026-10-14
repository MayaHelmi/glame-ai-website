/**
 * Saved / History toggle — PLACEHOLDER prototype only. There is no separate
 * History dataset yet, so this only switches which pill reads as active;
 * the grid itself doesn't change. Wire this up for real once look history
 * is a real, distinct dataset.
 */
(function () {
  const ACTIVE = 'bg-primary-container text-surface-container-lowest shadow-sm';
  const INACTIVE = 'text-on-surface-variant hover:text-on-surface';

  document.querySelectorAll('[data-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-tab]').forEach((b) => {
        b.className = `px-space-lg py-2 rounded-full font-label-md text-label-md uppercase tracking-wider transition-all ${INACTIVE}`;
      });
      btn.className = `px-space-lg py-2 rounded-full font-label-md text-label-md uppercase tracking-wider transition-all ${ACTIVE}`;
    });
  });
})();
