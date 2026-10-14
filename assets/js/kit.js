/**
 * Kit page — PLACEHOLDER prototype only. Adding/removing products only
 * changes the DOM in this browser tab; nothing is persisted or sent anywhere.
 */
(function () {
  const list = document.getElementById('product-list');
  const search = document.getElementById('kit-search');
  const filterPills = document.querySelectorAll('[data-filter]');
  const noMatches = document.getElementById('no-matches');
  const emptyKit = document.getElementById('empty-kit');
  const controlsBlock = document.querySelector('#kit-search').closest('div').parentElement; // search+filters wrapper

  let activeFilter = 'all';

  function currentQuery() {
    return (search.value || '').trim().toLowerCase();
  }

  function applyFilters() {
    const rows = Array.from(list.querySelectorAll('.product-row'));
    const query = currentQuery();
    let visibleCount = 0;

    rows.forEach((row) => {
      const matchesCategory = activeFilter === 'all' || row.dataset.category === activeFilter;
      const matchesQuery = !query || row.dataset.name.includes(query) || row.dataset.brand.includes(query);
      const visible = matchesCategory && matchesQuery;
      row.hidden = !visible;
      if (visible) visibleCount += 1;
    });

    const totalRows = rows.length;
    if (totalRows === 0) {
      list.hidden = true;
      controlsBlock.hidden = true;
      noMatches.hidden = true;
      emptyKit.hidden = false;
      emptyKit.classList.add('flex');
    } else {
      list.hidden = false;
      controlsBlock.hidden = false;
      emptyKit.hidden = true;
      emptyKit.classList.remove('flex');
      noMatches.hidden = visibleCount > 0;
    }
  }

  search.addEventListener('input', applyFilters);

  filterPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      activeFilter = pill.dataset.filter;
      filterPills.forEach((p) => {
        const isActive = p === pill;
        p.className = `shrink-0 px-space-lg py-2 rounded-full font-label-md text-label-md uppercase tracking-wider transition-colors ${
          isActive
            ? 'bg-primary-container text-surface-container-lowest'
            : 'border border-outline-variant text-on-surface-variant hover:border-primary-container'
        }`;
      });
      applyFilters();
    });
  });

  function addRow({ name, brand, shade, category }) {
    const row = document.createElement('div');
    row.className = 'product-row flex items-center gap-space-md p-space-md bg-surface-container-lowest rounded-DEFAULT border border-outline-variant group';
    row.dataset.name = name.toLowerCase();
    row.dataset.brand = (brand || '').toLowerCase();
    row.dataset.category = category;
    const subtitle = [brand, shade].filter(Boolean).join(' · ');
    row.innerHTML = `
      <div class="w-12 h-12 rounded-DEFAULT bg-surface-container shrink-0"></div>
      <div class="min-w-0">
        <p class="font-body-md text-body-md text-on-surface truncate"></p>
        <p class="font-body-sm text-body-sm text-on-surface-variant truncate"></p>
      </div>
      <button type="button" class="remove-btn ml-auto shrink-0 px-space-sm py-space-xs -my-space-xs font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant hover:text-primary transition-colors">Remove</button>
    `;
    row.querySelector('p.font-body-md').textContent = name;
    row.querySelector('p.font-body-sm').textContent = subtitle;
    row.querySelector('.remove-btn').addEventListener('click', () => {
      row.remove();
      applyFilters();
    });
    list.prepend(row);
  }

  list.querySelectorAll('.remove-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      btn.closest('.product-row').remove();
      applyFilters();
    });
  });

  // Add-product slide-over
  const panel = document.getElementById('add-panel');
  const backdrop = document.getElementById('add-panel-backdrop');
  const openTriggers = [document.getElementById('open-add-panel'), ...document.querySelectorAll('[data-open-panel]')];
  const closeBtn = document.getElementById('close-add-panel');

  function openPanel() {
    panel.hidden = false;
    backdrop.hidden = false;
    document.body.classList.add('overflow-hidden');
  }
  function closePanel() {
    panel.hidden = true;
    backdrop.hidden = true;
    document.body.classList.remove('overflow-hidden');
    if (catalogSearch) {
      catalogSearch.value = '';
      document.querySelectorAll('.catalog-row').forEach((row) => { row.hidden = false; });
    }
  }
  openTriggers.forEach((btn) => btn && btn.addEventListener('click', openPanel));
  closeBtn.addEventListener('click', closePanel);
  backdrop.addEventListener('click', closePanel);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) closePanel();
  });

  // Panel tabs
  const panelTabs = document.querySelectorAll('[data-panel-tab]');
  const panelSearch = document.getElementById('panel-search');
  const panelManual = document.getElementById('panel-manual');
  panelTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const isSearch = tab.dataset.panelTab === 'search';
      panelSearch.hidden = !isSearch;
      panelManual.hidden = isSearch;
      panelTabs.forEach((t) => {
        const active = t === tab;
        t.className = `flex-1 py-space-md font-label-md text-label-md uppercase tracking-wider border-b-2 ${
          active ? 'text-primary border-primary-container' : 'text-on-surface-variant border-transparent'
        }`;
      });
    });
  });

  // Catalog search — filters the catalog rows inside the Add-product panel
  const catalogSearch = document.getElementById('catalog-search');
  if (catalogSearch) {
    catalogSearch.addEventListener('input', () => {
      const query = catalogSearch.value.trim().toLowerCase();
      document.querySelectorAll('.catalog-row').forEach((row) => {
        const matches = !query || row.dataset.name.includes(query) || row.dataset.brand.includes(query);
        row.hidden = !matches;
      });
    });
  }

  // Catalog "Add" buttons
  document.querySelectorAll('.catalog-add').forEach((btn) => {
    btn.addEventListener('click', () => {
      const row = btn.closest('.catalog-row');
      const titleCase = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase());
      addRow({
        name: titleCase(row.dataset.name),
        brand: titleCase(row.dataset.brand),
        shade: titleCase(row.dataset.shade),
        category: row.dataset.category,
      });
      applyFilters();
      closePanel();
    });
  });

  // Manual add form
  document.getElementById('panel-manual').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('manual-name').value.trim();
    if (!name) return;
    addRow({
      name,
      brand: document.getElementById('manual-brand').value.trim(),
      shade: document.getElementById('manual-shade').value.trim(),
      category: document.getElementById('manual-category').value,
    });
    e.target.reset();
    applyFilters();
    closePanel();
  });

  applyFilters();
})();
