(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const chapters = [
    { id: '1', start: 9, end: 12, title: 'Introduction' },
    { id: '2', start: 13, end: 16, title: 'Literature Review' },
    { id: '3', start: 17, end: 22, title: 'Methodology' },
    { id: '4', start: 23, end: 47, title: 'Seismic Evaluation' },
    { id: '5', start: 48, end: 62, title: 'Analysis & Design' },
    { id: '6', start: 63, end: 87, title: 'Detailing' },
    { id: '7', start: 88, end: 111, title: 'Results & Discussion' },
    { id: '8', start: 112, end: 116, title: 'Conclusions' }
  ];

  const archive = $('#archiveGrid');
  const viewer = $('#viewer');
  const viewerImage = $('#viewerImage');
  const viewerCaption = $('#viewerCaption');
  const pageCount = $('#pageCount');
  const navButtons = $$('.chapter-nav button[data-jump]');
  const filterButtons = $$('.filters button[data-filter]');

  if (!archive || !viewer || !viewerImage || !viewerCaption) return;

  const state = {
    filter: 'all',
    items: [],
    visibleItems: [],
    index: 0,
    lastFocus: null,
    touchStartX: 0,
    touchStartY: 0
  };

  const pagePath = page => `assets/thesis/pages/page-${String(page).padStart(3, '0')}.webp`;
  const chapterForPage = page => chapters.find(c => page >= c.start && page <= c.end) || chapters[0];

  function buildArchive() {
    const fragment = document.createDocumentFragment();

    for (let page = 9; page <= 116; page++) {
      const chapter = chapterForPage(page);
      const item = document.createElement('article');
      item.className = 'archive-item';
      item.dataset.chapter = chapter.id;
      item.dataset.page = String(page);
      item.tabIndex = 0;
      item.setAttribute('role', 'button');
      item.setAttribute('aria-label', `Open Chapter ${chapter.id}, source page ${page}`);

      item.innerHTML = `
        <div class="archive-thumb">
          <img loading="lazy" decoding="async" src="${pagePath(page)}" alt="${chapter.title}, source page ${page}" />
          <span class="archive-open">OPEN ↗</span>
        </div>
        <p>CH ${chapter.id} · ${chapter.title.toUpperCase()} · P. ${page}</p>
      `;

      item.addEventListener('click', () => openViewer(item));
      item.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openViewer(item);
        }
      });

      const img = $('img', item);
      img.addEventListener('error', () => {
        item.classList.add('asset-missing');
        item.setAttribute('aria-hidden', 'true');
      });

      fragment.appendChild(item);
    }

    archive.replaceChildren(fragment);
    state.items = $$('.archive-item', archive);
    if (pageCount) pageCount.textContent = state.items.length;
    applyFilter('all', false);
  }

  function applyFilter(filter = state.filter, announce = true) {
    state.filter = filter;

    filterButtons.forEach(button => {
      const active = button.dataset.filter === filter;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    state.items.forEach(item => {
      const match = filter === 'all' || item.dataset.chapter === filter;
      item.hidden = !match;
    });

    state.visibleItems = state.items.filter(item => !item.hidden && !item.classList.contains('asset-missing'));

    if (announce) {
      const label = filter === 'all' ? 'all chapters' : `chapter ${filter}`;
      announceMessage(`${state.visibleItems.length} pages shown for ${label}.`);
    }
  }

  function announceMessage(message) {
    let live = $('#thesisLiveRegion');
    if (!live) {
      live = document.createElement('div');
      live.id = 'thesisLiveRegion';
      live.className = 'sr-only';
      live.setAttribute('aria-live', 'polite');
      document.body.appendChild(live);
    }
    live.textContent = message;
  }

  function openViewer(item) {
    const visible = state.visibleItems;
    const index = visible.indexOf(item);
    if (index === -1) return;

    state.lastFocus = document.activeElement;
    state.index = index;
    showViewer();
  }

  function showViewer() {
    const item = state.visibleItems[state.index];
    if (!item) return;

    const page = Number(item.dataset.page);
    const chapter = chapterForPage(page);
    const image = pagePath(page);

    viewerImage.src = image;
    viewerImage.alt = `${chapter.title}, source page ${page}`;
    viewerCaption.innerHTML = `
      <strong>Chapter ${chapter.id} · ${chapter.title}</strong>
      <span>Source page ${page} · ${state.index + 1} of ${state.visibleItems.length}</span>
    `;

    viewer.classList.add('open');
    viewer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('viewer-open');

    const close = $('#viewerClose');
    if (close) close.focus();

    preloadAdjacent();
  }

  function closeViewer() {
    viewer.classList.remove('open');
    viewer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('viewer-open');
    viewerImage.removeAttribute('src');

    if (state.lastFocus && typeof state.lastFocus.focus === 'function') {
      state.lastFocus.focus();
    }
  }

  function moveViewer(direction) {
    if (!state.visibleItems.length) return;
    state.index = (state.index + direction + state.visibleItems.length) % state.visibleItems.length;
    showViewer();
  }

  function preloadAdjacent() {
    [-1, 1].forEach(direction => {
      const nextIndex = (state.index + direction + state.visibleItems.length) % state.visibleItems.length;
      const item = state.visibleItems[nextIndex];
      if (!item) return;
      const image = new Image();
      image.src = pagePath(Number(item.dataset.page));
    });
  }

  function setupViewer() {
    const close = $('#viewerClose');
    const previous = $('#viewerPrev');
    const next = $('#viewerNext');

    close?.addEventListener('click', closeViewer);
    previous?.addEventListener('click', () => moveViewer(-1));
    next?.addEventListener('click', () => moveViewer(1));

    viewer.addEventListener('click', event => {
      if (event.target === viewer) closeViewer();
    });

    viewer.addEventListener('touchstart', event => {
      const touch = event.changedTouches[0];
      state.touchStartX = touch.clientX;
      state.touchStartY = touch.clientY;
    }, { passive: true });

    viewer.addEventListener('touchend', event => {
      const touch = event.changedTouches[0];
      const dx = touch.clientX - state.touchStartX;
      const dy = touch.clientY - state.touchStartY;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
        moveViewer(dx < 0 ? 1 : -1);
      }
    }, { passive: true });
  }

  function setupFilters() {
    filterButtons.forEach(button => {
      button.addEventListener('click', () => applyFilter(button.dataset.filter));
    });
  }

  function setupNavigation() {
    navButtons.forEach(button => {
      button.addEventListener('click', event => {
        event.preventDefault();
        const target = document.getElementById(button.dataset.jump);
        if (!target) return;
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(null, '', `#${button.dataset.jump}`);
      });
    });

    // Highlight the chapter currently occupying the viewport.
    const sections = $$('[data-chapter]');
    const navByTarget = new Map(navButtons.map(button => [button.dataset.jump, button]));

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          navButtons.forEach(button => button.classList.remove('active'));
          const button = navByTarget.get(entry.target.id);
          button?.classList.add('active');
        });
      }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });

      sections.forEach(section => observer.observe(section));
    }
  }

  function setupKeyboard() {
    window.addEventListener('keydown', event => {
      if (!viewer.classList.contains('open')) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        closeViewer();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        moveViewer(-1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        moveViewer(1);
      } else if (event.key === 'Home') {
        event.preventDefault();
        state.index = 0;
        showViewer();
      } else if (event.key === 'End') {
        event.preventDefault();
        state.index = state.visibleItems.length - 1;
        showViewer();
      }
    });
  }

  function setupImageEnhancements() {
    // Clicking any editorial image opens it too, so important figures are never dead ends.
    $$('.chapter-image img, .wide-image img, .feature-image img, .page-stack img, .analysis-gallery img, .detail-feature img, .result-page img')
      .forEach(image => {
        image.style.cursor = 'zoom-in';
        image.addEventListener('click', () => {
          const item = state.items.find(candidate => candidate.querySelector('img')?.src === image.src);
          if (item) openViewer(item);
          else openStandaloneImage(image);
        });
      });
  }

  function openStandaloneImage(image) {
    state.lastFocus = document.activeElement;
    state.index = 0;
    viewerImage.src = image.currentSrc || image.src;
    viewerImage.alt = image.alt || 'Thesis figure';
    viewerCaption.innerHTML = `<strong>Thesis figure</strong><span>${image.alt || 'Technical figure'}</span>`;
    viewer.classList.add('open');
    viewer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('viewer-open');
    $('#viewerClose')?.focus();
  }

  function setupHashRouting() {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const target = document.getElementById(hash);
    if (target) {
      requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
    }
  }

  function init() {
    buildArchive();
    setupViewer();
    setupFilters();
    setupNavigation();
    setupKeyboard();
    setupImageEnhancements();
    setupHashRouting();

    // Keep browser history useful when a chapter link is selected.
    window.addEventListener('popstate', setupHashRouting);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
