/**
 * Profile page — PLACEHOLDER prototype only. Nothing here is persisted or
 * sent anywhere; "Sign out" and "Delete account" both just navigate back to
 * the marketing home, simulating what a real session-end would do.
 */
(function () {
  // Sub-nav section switching
  const tabs = document.querySelectorAll('.profile-tab');
  const panels = document.querySelectorAll('[data-panel]');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.section;
      tabs.forEach((t) => {
        const active = t === tab;
        t.classList.toggle('text-primary-container', active);
        t.classList.toggle('bg-surface-container-low', active);
        t.classList.toggle('border-primary-container', active);
        t.classList.toggle('text-on-surface-variant', !active);
        t.classList.toggle('border-transparent', !active);
      });
      panels.forEach((p) => {
        p.hidden = p.dataset.panel !== target;
      });
    });
  });

  // Chip groups — single-select per group, flashes a quiet "Saved" confirmation
  document.querySelectorAll('[data-chip-group]').forEach((group) => {
    const chips = group.querySelectorAll('[data-chip]');
    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        if (chip.classList.contains('bg-primary-container')) return; // already selected
        chips.forEach((c) => c.classList.remove('bg-primary-container', 'text-surface-container-lowest', 'border-primary-container'));
        chip.classList.add('bg-primary-container', 'text-surface-container-lowest', 'border-primary-container');
        const panel = chip.closest('[data-panel]');
        const flash = panel && panel.querySelector('[data-saved-flash]');
        if (flash) {
          flash.classList.remove('opacity-0');
          clearTimeout(flash._timer);
          flash._timer = setTimeout(() => flash.classList.add('opacity-0'), 1500);
        }
      });
    });
  });

  // Change password expand/collapse
  const toggleBtn = document.getElementById('toggle-password-row');
  const passwordRow = document.getElementById('password-row');
  const passwordIcon = document.getElementById('password-row-icon');
  if (toggleBtn && passwordRow) {
    toggleBtn.addEventListener('click', () => {
      passwordRow.hidden = !passwordRow.hidden;
      passwordIcon.style.transform = passwordRow.hidden ? '' : 'rotate(180deg)';
    });
  }

  // Sign out
  const signOut = document.getElementById('sign-out');
  if (signOut) {
    signOut.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  }

  // Delete account modal
  const deleteBackdrop = document.getElementById('delete-backdrop');
  const openDelete = document.getElementById('open-delete-modal');
  const cancelDelete = document.getElementById('cancel-delete');
  const confirmDelete = document.getElementById('confirm-delete');
  if (openDelete) {
    openDelete.addEventListener('click', () => {
      deleteBackdrop.hidden = false;
      document.body.classList.add('overflow-hidden');
    });
    cancelDelete.addEventListener('click', () => {
      deleteBackdrop.hidden = true;
      document.body.classList.remove('overflow-hidden');
    });
    deleteBackdrop.addEventListener('click', (e) => {
      if (e.target === deleteBackdrop) {
        deleteBackdrop.hidden = true;
        document.body.classList.remove('overflow-hidden');
      }
    });
    confirmDelete.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !deleteBackdrop.hidden) {
        deleteBackdrop.hidden = true;
        document.body.classList.remove('overflow-hidden');
      }
    });
  }

  // Notification toggles
  document.querySelectorAll('.notif-toggle').forEach((input) => {
    const track = input.nextElementSibling;
    const thumb = track.querySelector('.toggle-thumb');
    input.addEventListener('change', () => {
      track.classList.toggle('bg-primary-container', input.checked);
      track.classList.toggle('bg-surface-container-high', !input.checked);
      thumb.classList.toggle('translate-x-5', input.checked);
    });
  });
})();
