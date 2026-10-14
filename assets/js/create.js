/**
 * Create wizard — PLACEHOLDER prototype only. No real upload, no real AI call.
 * Step 5 "Generating" is a timed pause for demo purposes; step 6's photo/inspiration
 * slots fall back to static sample images if the user didn't actually attach files.
 */
(function () {
  const TOTAL_STEPS = 8;
  let current = 1;

  const steps = document.querySelectorAll('[data-step]');
  const segments = document.querySelectorAll('[data-segment]');
  const stepLabel = document.getElementById('step-label');

  function render() {
    steps.forEach((el) => {
      el.hidden = Number(el.dataset.step) !== current;
    });
    segments.forEach((seg) => {
      const n = Number(seg.dataset.segment);
      seg.classList.remove('bg-primary-container', 'bg-outline-variant', 'ring-2', 'ring-primary-container', 'ring-offset-1');
      if (n < current) {
        seg.classList.add('bg-primary-container');
      } else if (n === current) {
        seg.classList.add('bg-primary-container', 'ring-2', 'ring-primary-container', 'ring-offset-1');
      } else {
        seg.classList.add('bg-outline-variant');
      }
    });
    if (stepLabel) stepLabel.textContent = `Step ${current} of ${TOTAL_STEPS}`;
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function goTo(n) {
    current = Math.min(Math.max(n, 1), TOTAL_STEPS);
    render();
  }

  document.querySelectorAll('[data-next]').forEach((btn) => {
    btn.addEventListener('click', () => goTo(current + 1));
  });
  document.querySelectorAll('[data-back]').forEach((btn) => {
    // Step 5 is a transient "generating" state with no content to revisit,
    // so Back from Step 6 skips it and returns to the last real input step.
    const target = btn.dataset.backTarget ? Number(btn.dataset.backTarget) : null;
    btn.addEventListener('click', () => goTo(target || current - 1));
  });

  // Step 4 -> 5 (generating, timed) -> 6
  const generateContinue = document.getElementById('generate-continue');
  if (generateContinue) {
    generateContinue.addEventListener('click', () => {
      goTo(5);
      setTimeout(() => goTo(6), 1600);
    });
  }

  // Upload zones (steps 1 and 2) — one-shot file picker or drag/drop, local preview only
  function wireUpload(zoneId, inputId, previewId, imgId, replaceId, guideImgId) {
    const zone = document.getElementById(zoneId);
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    const img = document.getElementById(imgId);
    const replace = document.getElementById(replaceId);
    const guideImg = guideImgId ? document.getElementById(guideImgId) : null;
    if (!zone || !input || !preview || !img) return;

    function handleFile(file) {
      if (!file) return;
      const url = URL.createObjectURL(file);
      img.src = url;
      if (guideImg) guideImg.src = url;
      zone.hidden = true;
      preview.hidden = false;
    }

    zone.addEventListener('click', () => input.click());
    zone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        input.click();
      }
    });
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('border-primary-container');
    });
    zone.addEventListener('dragleave', () => zone.classList.remove('border-primary-container'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('border-primary-container');
      handleFile(e.dataTransfer.files[0]);
    });
    input.addEventListener('change', (e) => handleFile(e.target.files[0]));
    if (replace) {
      replace.addEventListener('click', () => {
        preview.hidden = true;
        zone.hidden = false;
        input.value = '';
      });
    }
  }

  wireUpload('inspo-zone', 'inspo-input', 'inspo-preview', 'inspo-img', 'inspo-replace', 'guide-inspo-img');
  wireUpload('photo-zone', 'photo-input', 'photo-preview', 'photo-img', 'photo-replace', 'guide-photo-img');

  // Step 2 consent checkbox gates Continue
  const consentCheckbox = document.getElementById('consent-checkbox');
  const photoContinue = document.getElementById('photo-continue');
  if (consentCheckbox && photoContinue) {
    photoContinue.disabled = true;
    consentCheckbox.addEventListener('change', () => {
      photoContinue.disabled = !consentCheckbox.checked;
    });
  }

  // Chip groups — single-select per group, freely editable
  document.querySelectorAll('[data-chip-group]').forEach((group) => {
    const chips = group.querySelectorAll('[data-chip]');
    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        chips.forEach((c) => {
          c.classList.remove('bg-primary-container', 'text-surface-container-lowest', 'border-primary-container');
          const tag = c.querySelector('span');
          if (tag) tag.remove();
        });
        chip.classList.add('bg-primary-container', 'text-surface-container-lowest', 'border-primary-container');
      });
    });
  });

  // Step 6 — hovering a numbered zone highlights its shape + matching instruction row
  let tappedZone = null;
  const zoneEls = document.querySelectorAll('[data-zone]');

  function setZoneActive(zone, active) {
    document.querySelectorAll(`[data-zone-shape="${zone}"]`).forEach((shape) => {
      shape.classList.toggle('fill-primary-container/30', active);
    });
    document.querySelectorAll(`[data-zone-row="${zone}"]`).forEach((row) => {
      row.classList.toggle('bg-surface-container-low', active);
    });
  }

  zoneEls.forEach((el) => {
    const zone = el.dataset.zone;
    el.addEventListener('mouseenter', () => setZoneActive(zone, true));
    el.addEventListener('mouseleave', () => setZoneActive(zone, false));
    el.addEventListener('focus', () => setZoneActive(zone, true));
    el.addEventListener('blur', () => setZoneActive(zone, false));
    // Tap support: no hover on touch devices, so a tap toggles the same
    // highlight and holds it (rather than firing on press then vanishing).
    el.addEventListener('click', () => {
      if (tappedZone === zone) {
        setZoneActive(zone, false);
        tappedZone = null;
      } else {
        if (tappedZone) setZoneActive(tappedZone, false);
        setZoneActive(zone, true);
        tappedZone = zone;
      }
    });
  });

  render();
})();
