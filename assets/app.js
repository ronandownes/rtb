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
      registration: 'registration',
      renting: 'renting',
      disputes: 'disputes',
      'termination-notices': 'disputes',
      compliance: 'compliance',
      services: 'resources',
      resources: 'resources',
      data: 'data',
      about: 'about'
    };
    const group = groups[id];
    topLinks.forEach(a => a.classList.toggle('is-current', a.getAttribute('href') === `#${group}`));
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      const visible = entries
        .filter(e => e.isIntersecting)
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

  const STORAGE_KEY = 'rtb-guide-glossary-v1';
  const list = document.getElementById('glossaryList');
  const empty = document.getElementById('glossaryEmpty');
  const clear = document.getElementById('clearGlossary');
  const toggles = [...document.querySelectorAll('.glossary-toggle')];

  const readGlossary = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch { return {}; }
  };

  const writeGlossary = data => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

  const renderGlossary = () => {
    const saved = readGlossary();
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
          const next = readGlossary();
          delete next[term];
          writeGlossary(next);
          renderGlossary();
        });
        list.appendChild(item);
      });
    }
    if (empty) empty.hidden = terms.length > 0;
    toggles.forEach(button => {
      const term = button.dataset.term;
      const active = Object.prototype.hasOwnProperty.call(saved, term);
      button.classList.toggle('is-saved', active);
      button.textContent = active ? `Remove “${term}” from glossary` : `Add “${term}” to glossary`;
    });
  };

  toggles.forEach(button => {
    button.addEventListener('click', () => {
      const saved = readGlossary();
      const term = button.dataset.term;
      if (Object.prototype.hasOwnProperty.call(saved, term)) delete saved[term];
      else saved[term] = button.dataset.definition || '';
      writeGlossary(saved);
      renderGlossary();
    });
  });

  if (clear) clear.addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    renderGlossary();
  });

  renderGlossary();
  if (sections.length) markCurrent(sections[0].id);
})();
