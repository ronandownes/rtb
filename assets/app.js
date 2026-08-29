(() => {
  const topbar = document.querySelector('.topbar');
  const mobileToggle = document.querySelector('.mobile-nav-toggle');
  const topLinks = [...document.querySelectorAll('.topnav .navlabel')];
  const railLinks = [...document.querySelectorAll('.topic-rail a')];
  const sections = [...document.querySelectorAll('.topic-section')];

  if (mobileToggle && topbar) {
    mobileToggle.addEventListener('click', () => {
      const open = topbar.classList.toggle('nav-open');
      mobileToggle.setAttribute('aria-expanded', String(open));
    });
  }

  document.querySelectorAll('.topic-heading').forEach(button => {
    button.addEventListener('click', () => {
      const content = button.nextElementSibling;
      const expanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!expanded));
      content.hidden = expanded;
      const caret = button.querySelector('.topic-caret');
      if (caret) caret.textContent = expanded ? '+' : '−';
    });
  });

  const markCurrent = id => {
    sections.forEach(s => s.classList.toggle('is-current', s.id === id));
    railLinks.forEach(a => a.classList.toggle('is-current', a.getAttribute('href') === `#${id}`));

    const groups = {
      registration: 'registration', renting: 'renting', disputes: 'disputes',
      'termination-notices': 'disputes', compliance: 'compliance', services: 'resources',
      resources: 'resources', data: 'data', about: 'about'
    };
    const group = groups[id];
    topLinks.forEach(a => a.classList.toggle('is-current', a.getAttribute('href') === `#${group}`));
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(e => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible.length) markCurrent(visible[0].target.id);
    }, { rootMargin: '-120px 0px -55% 0px', threshold: [0, .1, .5] });
    sections.forEach(section => observer.observe(section));
  }

  [...topLinks, ...railLinks].forEach(link => {
    link.addEventListener('click', () => {
      if (topbar) topbar.classList.remove('nav-open');
      if (mobileToggle) mobileToggle.setAttribute('aria-expanded', 'false');
    });
  });

  // Word Wall / Language Bank -------------------------------------------------
  const STORAGE_KEY = 'rtb-guide-word-wall-v1';
  const list = document.getElementById('glossaryList');
  const empty = document.getElementById('glossaryEmpty');
  const clear = document.getElementById('clearGlossary');

  const readWall = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch { return {}; }
  };
  const writeWall = data => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

  const renderWall = () => {
    const saved = readWall();
    const terms = Object.keys(saved).sort((a, b) => a.localeCompare(b));
    if (list) {
      list.innerHTML = '';
      terms.forEach(term => {
        const item = document.createElement('article');
        item.className = 'glossary-item';
        item.innerHTML = `<button class="glossary-remove" type="button" aria-label="Remove ${term}">×</button><h3></h3><p></p>`;
        item.querySelector('h3').textContent = term;
        item.querySelector('p').textContent = saved[term];
        item.querySelector('.glossary-remove').addEventListener('click', () => {
          const next = readWall();
          delete next[term];
          writeWall(next);
          renderWall();
        });
        list.appendChild(item);
      });
    }
    if (empty) empty.hidden = terms.length > 0;
    document.querySelectorAll('.glossary-toggle').forEach(button => {
      const term = button.dataset.term;
      const active = Object.prototype.hasOwnProperty.call(saved, term);
      button.classList.toggle('is-saved', active);
      button.textContent = active ? `Remove “${term}” from Word Wall` : `Add “${term}” to Word Wall`;
    });
  };

  document.addEventListener('click', event => {
    const button = event.target.closest('.glossary-toggle');
    if (!button) return;
    event.stopPropagation();
    const saved = readWall();
    const term = button.dataset.term;
    if (Object.prototype.hasOwnProperty.call(saved, term)) delete saved[term];
    else saved[term] = button.dataset.definition || '';
    writeWall(saved);
    renderWall();
  });

  if (clear) clear.addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    renderWall();
  });

  // Education-style blocking focus view -------------------------------------
  const overlay = document.createElement('div');
  overlay.className = 'focus-overlay';
  overlay.hidden = true;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.innerHTML = `
    <article class="focus-card" tabindex="-1">
      <button class="focus-close" type="button" aria-label="Close focus view">×</button>
      <div class="focus-inner"></div>
    </article>`;
  document.body.appendChild(overlay);

  const card = overlay.querySelector('.focus-card');
  const inner = overlay.querySelector('.focus-inner');
  const closeButton = overlay.querySelector('.focus-close');
  let lastTrigger = null;

  const closeFocus = () => {
    if (overlay.hidden) return;
    overlay.hidden = true;
    inner.replaceChildren();
    document.body.classList.remove('focus-open');
    if (lastTrigger) lastTrigger.focus({ preventScroll: true });
    lastTrigger = null;
  };

  const openFocus = heading => {
    const section = heading.closest('.topic-section');
    const source = section?.querySelector('.topic-content');
    if (!section || !source) return;

    const title = document.createElement('h2');
    title.textContent = section.dataset.title || heading.textContent.trim();

    const tools = document.createElement('div');
    tools.className = 'focus-tools';

    const cms = document.createElement('a');
    cms.href = 'https://app.pagescms.org/ronandownes/rtb/main';
    cms.target = '_blank';
    cms.rel = 'noopener';
    cms.textContent = 'Open CMS';
    tools.appendChild(cms);

    const copy = source.cloneNode(true);
    copy.hidden = false;
    copy.classList.add('focus-copy');
    inner.replaceChildren(title, tools, copy);
    lastTrigger = heading;
    overlay.hidden = false;
    document.body.classList.add('focus-open');
    card.scrollTop = 0;
    card.focus({ preventScroll: true });
    renderWall();
  };

  document.querySelectorAll('.topic-heading').forEach(heading => {
    heading.addEventListener('dblclick', event => {
      if (event.target.closest('a,input,textarea,select')) return;
      event.preventDefault();
      openFocus(heading);
    });
    heading.addEventListener('keydown', event => {
      if (!(event.key === 'Enter' && event.shiftKey)) return;
      event.preventDefault();
      openFocus(heading);
    });
  });

  closeButton.addEventListener('click', closeFocus);
  overlay.addEventListener('click', event => { if (event.target === overlay) closeFocus(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeFocus(); });

  renderWall();
  if (sections.length) markCurrent(sections[0].id);
})();
