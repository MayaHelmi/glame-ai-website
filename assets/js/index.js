/* Landing-page before/after compare sliders.
 *
 * Layout contract — all three of these must agree, or the widget silently
 * shows one image with a decorative line down it:
 *   1. index.html   — [data-compare-before] must be the LATER of the two
 *                     absolutely-positioned layers, so it paints on top.
 *   2. this file    — the same layer is the one whose clip-path we animate.
 *   3. input.css    — the no-JS default clip targets the same layer.
 *
 * The clipped layer covers the left edge inward, so it holds the BEFORE
 * image; dragging right wipes it away to reveal the AFTER image beneath.
 */

const STEP = 5;

// Shared with the hero parallax below. The compare unit is one of the parallax
// planes, so while it is shifted the cursor no longer sits where the untranslated
// geometry says it does — percentFromEvent has to subtract that shift, and the
// parallax has to hold still while a drag is in progress.
let compareDragging = false;
let compareShiftX = 0;

const KEY_ACTIONS = {
  ArrowLeft: (at) => at - STEP,
  ArrowDown: (at) => at - STEP,
  ArrowRight: (at) => at + STEP,
  ArrowUp: (at) => at + STEP,
  Home: () => 0,
  End: () => 100,
};

document.querySelectorAll('[data-compare]').forEach((container) => {
  const beforeLayer = container.querySelector('[data-compare-before]');
  const line = container.querySelector('[data-compare-line]');
  const handle = container.querySelector('[data-compare-handle]');
  if (!beforeLayer || !line || !handle) return;

  let dragging = false;

  const setPosition = (percent) => {
    const clamped = Math.min(100, Math.max(0, percent));
    beforeLayer.style.clipPath = `inset(0 ${100 - clamped}% 0 0)`;
    line.style.left = `${clamped}%`;
    handle.style.left = `${clamped}%`;
    handle.setAttribute('aria-valuenow', String(Math.round(clamped)));
  };

  // Reads back the position we last wrote. parseFloat('0%') is 0, which is
  // falsy, so this deliberately tests for a finite number rather than truthiness.
  const currentPosition = () => {
    const parsed = parseFloat(handle.style.left);
    return Number.isFinite(parsed) ? parsed : 50;
  };

  // Only the hero's compare unit is parallaxed; the card in "How it works" is not.
  const parallaxed = container.querySelector('[data-parallax-compare]') !== null;

  const percentFromEvent = (e) => {
    const rect = container.getBoundingClientRect();
    const shift = parallaxed ? compareShiftX : 0;
    return ((e.clientX - rect.left - shift) / rect.width) * 100;
  };

  // Tracked on window rather than on the handle: the pointer routinely leaves
  // the 44px circle mid-drag, and this way the drag can never end up stuck
  // with `dragging` still true.
  handle.addEventListener('pointerdown', (e) => {
    dragging = true;
    compareDragging = true;
    setPosition(percentFromEvent(e));
  });
  window.addEventListener('pointermove', (e) => {
    if (dragging) setPosition(percentFromEvent(e));
  });
  window.addEventListener('pointerup', () => {
    dragging = false;
    compareDragging = false;
  });
  window.addEventListener('pointercancel', () => {
    dragging = false;
    compareDragging = false;
  });

  handle.addEventListener('keydown', (e) => {
    const action = KEY_ACTIONS[e.key];
    if (!action) return;
    e.preventDefault();
    setPosition(action(currentPosition()));
  });

  setPosition(50);
});

/* Hero parallax — each plane follows the cursor at its own depth, so the
 * products, the headline and the portrait separate as you move across.
 *
 * Pointer-driven only: skipped entirely where there is no real hover (touch)
 * and under prefers-reduced-motion. It never runs during a compare drag, and
 * the whole compare unit (girl + gradient + divider + handle) is ONE plane so
 * the clip seam can never drift away from the divider.
 */
(() => {
  const hero = document.querySelector('section[data-compare]');
  if (!hero) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const planes = [...hero.querySelectorAll('[data-parallax]')];
  if (!planes.length) return;

  const TRAVEL = 26; // px at depth 1
  const EASE = 0.09;
  let tx = 0, ty = 0, cx = 0, cy = 0, frame = null;

  const render = () => {
    frame = null;
    if (compareDragging) return; // hold still mid-drag
    cx += (tx - cx) * EASE;
    cy += (ty - cy) * EASE;
    for (const plane of planes) {
      const depth = parseFloat(getComputedStyle(plane).getPropertyValue('--depth')) || 0;
      plane.style.transform =
        `translate3d(${(cx * depth).toFixed(2)}px, ${(cy * depth).toFixed(2)}px, 0)`;
      if (plane.hasAttribute('data-parallax-compare')) compareShiftX = cx * depth;
    }
    if (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) schedule();
  };
  const schedule = () => {
    if (frame === null) frame = requestAnimationFrame(render);
  };

  hero.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || compareDragging) return;
    const r = hero.getBoundingClientRect();
    // invert so the planes drift against the cursor, which reads as depth
    tx = ((e.clientX - r.left) / r.width - 0.5) * -2 * TRAVEL;
    ty = ((e.clientY - r.top) / r.height - 0.5) * -2 * TRAVEL;
    schedule();
  });
  hero.addEventListener('pointerleave', () => { tx = 0; ty = 0; schedule(); });
})();

/* Scroll-driven "everything flies into the kit bag".
 *
 * As the hero scrolls away, each floating product slides toward the makeup bag
 * in the section below, shrinking and fading as it arrives.
 *
 * Two things make this work:
 *   - The hero is `overflow-x-clip`, NOT `overflow-hidden`, so the products can
 *     actually leave the hero vertically. Reverting that clips them mid-flight.
 *   - Flight offsets are measured from `offsetLeft/offsetTop`, never from
 *     getBoundingClientRect(), because the drift animation and the parallax are
 *     both transforms and would poison a rect-based measurement.
 *
 * We animate the standalone `translate`/`scale` properties rather than
 * `transform`, so this composes with the drift keyframes instead of fighting them.
 */
(() => {
  const hero = document.querySelector('section[data-compare]');
  const bag = document.querySelector('[data-kit-target]');
  if (!hero || !bag) return;

  const items = [...hero.querySelectorAll('.product-float')];
  if (!items.length) return;

  const STAGGER = 0.035; // per lane, so they arrive in waves rather than as one blob
  const LANES = 6;
  let paths = [];
  let startY = 0;
  let span = 1;
  let frame = null;
  let last = -1;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  const measure = () => {
    const hr = hero.getBoundingClientRect();
    const originX = hr.left + window.scrollX;
    const originY = hr.top + window.scrollY;
    const br = bag.getBoundingClientRect();
    // aim a little above the bag's centre, roughly at the zip line
    const targetX = br.left + window.scrollX + br.width / 2;
    const targetY = br.top + window.scrollY + br.height * 0.35;

    paths = items.map((el) => ({
      el,
      dx: targetX - (originX + el.offsetLeft + el.offsetWidth / 2),
      dy: targetY - (originY + el.offsetTop + el.offsetHeight / 2),
    }));

    startY = originY;
    span = Math.max(1, hr.height * 0.85);
  };

  const apply = (p) => {
    const denom = 1 - STAGGER * (LANES - 1);
    for (let i = 0; i < paths.length; i++) {
      const { el, dx, dy } = paths[i];
      const t = Math.min(1, Math.max(0, (p - (i % LANES) * STAGGER) / denom));
      const e = t * t * (3 - 2 * t); // smoothstep
      el.style.translate = `${(dx * e).toFixed(1)}px ${(dy * e).toFixed(1)}px`;
      el.style.scale = (1 - 0.94 * e).toFixed(3);
      el.style.opacity = e > 0.72 ? String(Math.max(0, 1 - (e - 0.72) / 0.28)) : '';
    }
  };

  const update = () => {
    frame = null;
    const p = Math.min(1, Math.max(0, (window.scrollY - startY) / span));
    if (Math.abs(p - last) < 0.002) return;
    last = p;
    apply(p);
  };

  const onScroll = () => {
    if (frame === null) frame = requestAnimationFrame(update);
  };

  const start = () => {
    if (reduced.matches) return;
    measure();
    last = -1;
    update();
  };

  start();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => {
    measure();
    last = -1;
    update();
  });
  // the bag is lazy-loaded, so its box can settle after first paint
  if (!bag.complete) bag.addEventListener('load', start, { once: true });
  window.addEventListener('load', start, { once: true });
})();

/* "How it works" — staggered card entrance + the progress spine.
 *
 * One IntersectionObserver drives both: as each step scrolls in, its card rises
 * into place and the plum spine advances one third toward 03.
 *
 * The hidden start state is only armed once this runs (data-steps="ready"), so a
 * JS failure leaves the copy visible rather than blank. Under reduced motion the
 * spine is drawn complete and nothing is ever hidden.
 */
(() => {
  const section = document.querySelector('#how-it-works');
  if (!section) return;

  const cards = [...section.querySelectorAll('[data-step-card]')];
  const spine = section.querySelector('[data-spine]');
  const track = section.querySelector('[data-spine-track]');
  const fill = section.querySelector('[data-spine-fill]');
  const dots = [...section.querySelectorAll('[data-spine-dot]')];
  if (!cards.length) return;

  // Vertical timeline: the rail runs from the first dot to the last.
  // Measured from offsetTop, NOT getBoundingClientRect — the entrance animation
  // translates each <li>, and a rect-based measurement taken mid-animation puts
  // the rail ~8px out. offsetTop is layout, so transforms cannot poison it.
  // X needs no JS: the rail carries the same left-0/-translate-x-1/2 as the dots.
  let stops = [];
  const layout = () => {
    if (!spine || !dots.length) return;
    if (!spine.getBoundingClientRect().height) return;
    stops = dots.map((dot) => {
      const item = dot.closest('[data-step-card]');
      return item.offsetTop + dot.offsetTop + dot.offsetHeight / 2;
    });
    const start = stops[0];
    const end = stops[stops.length - 1];
    if (track) {
      track.style.top = `${start}px`;
      track.style.height = `${end - start}px`;
    }
    if (fill) fill.style.top = `${start}px`;
  };

  const paintFill = (reached) => {
    if (!fill || !stops.length) return;
    const to = reached > 0 ? stops[Math.min(reached, stops.length) - 1] : stops[0];
    fill.style.height = `${Math.max(0, to - stops[0])}px`;
  };

  let reached = 0;

  const lightDot = (dot) => {
    dot.classList.remove('bg-outline-variant');
    dot.classList.add('bg-primary-container');
  };

  layout();
  window.addEventListener('resize', () => {
    layout();
    paintFill(reached);
  });

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    paintFill(dots.length);
    dots.forEach(lightDot);
    return;
  }

  section.setAttribute('data-steps', 'ready');

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.setAttribute('data-visible', '');
      observer.unobserve(entry.target);

      // the spine tracks the furthest step seen, so it never runs backwards
      reached = Math.max(reached, cards.indexOf(entry.target) + 1);
      paintFill(reached);
      dots.slice(0, reached).forEach(lightDot);
    }
  }, { threshold: 0.35, rootMargin: '0px 0px -10% 0px' });

  cards.forEach((card) => observer.observe(card));
})();
