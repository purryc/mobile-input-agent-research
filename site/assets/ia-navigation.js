(() => {
  'use strict';
  const nav = document.querySelector('.ia-nav');
  if (!nav) return;
  document.documentElement.classList.add('ia-report');
  const chapters = [...document.querySelectorAll('.report-chapter[data-chapter]')];
  const topLinks = [...nav.querySelectorAll('[data-chapter-link]')];
  const groups = [...nav.querySelectorAll('[data-for]')];
  const subLinks = [...nav.querySelectorAll('[data-subsection-link]')];
  const row = nav.querySelector('.subnav-row');
  let scheduled = false;
  let current = '';
  let preview = '';
  let closeTimer;
  let keyboardInput = false;
  let touchInput = false;
  let jumpToken = 0;

  // Reading position and the previewed menu are independent states.
  groups.forEach(group => { group.id = `nav-subnav-${group.dataset.for}`; });
  topLinks.forEach(a => {
    a.setAttribute('aria-controls', `nav-subnav-${a.dataset.chapterLink}`);
    a.setAttribute('aria-expanded', 'false');
  });
  function showMenu(id) {
    clearTimeout(closeTimer);
    if (!groups.some(group => group.dataset.for === id)) return;
    preview = id;
    nav.classList.add('is-subnav-open');
    row.hidden = false;
    groups.forEach(group => { group.hidden = group.dataset.for !== id; });
    topLinks.forEach(a => a.setAttribute('aria-expanded', String(a.dataset.chapterLink === id)));
  }
  function hideMenu() {
    clearTimeout(closeTimer);
    preview = '';
    nav.classList.remove('is-subnav-open');
    row.hidden = true;
    groups.forEach(group => { group.hidden = true; });
    topLinks.forEach(a => a.setAttribute('aria-expanded', 'false'));
  }
  hideMenu();

  function mark() {
    scheduled = false;
    const height = Math.ceil(nav.getBoundingClientRect().height);
    document.documentElement.style.setProperty('--report-nav-height', `${height}px`);
    const limit = height + 25;
    let chapter = chapters[0];
    for (const c of chapters) {
      if (c.getBoundingClientRect().top <= limit) chapter = c;
      else break;
    }
    if (!chapter) return;
    const id = chapter.id;
    topLinks.forEach(a => {
      if (a.dataset.chapterLink === id) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    });
    const group = groups.find(g => g.dataset.for === id);
    const links = group ? [...group.querySelectorAll('a')] : [];
    let active = links[0];
    for (const a of links) {
      const target = document.getElementById(a.dataset.subsectionLink);
      if (target && target.getBoundingClientRect().top <= limit) active = a;
    }
    subLinks.forEach(a => {
      if (a === active) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    });
    if (current !== id) {
      current = id;
      const a = topLinks.find(a => a.dataset.chapterLink === id);
      // Do not move a hovered or keyboard-focused menu out from under the user.
      if (a && !preview) {
        const box = a.getBoundingClientRect();
        const parent = a.parentElement.getBoundingClientRect();
        if (box.left < parent.left || box.right > parent.right) {
          a.parentElement.scrollTo({ left: a.offsetLeft - a.parentElement.offsetLeft - 12, behavior: 'auto' });
        }
      }
    }
  }
  function queue() {
    if (!scheduled) { scheduled = true; requestAnimationFrame(mark); }
  }
  function jumpTo(id) {
    const target = document.getElementById(id);
    if (!target) return;
    const token = ++jumpToken;
    const start = performance.now();
    function align() {
      if (token !== jumpToken) return;
      const desired = target.getBoundingClientRect().top + scrollY - nav.getBoundingClientRect().height - 18;
      if (Math.abs(scrollY - desired) > 1) window.scrollTo({ top: Math.max(0, desired), behavior: 'instant' });
      mark();
      if (performance.now() - start < 260) requestAnimationFrame(align);
    }
    align();
  }

  nav.addEventListener('pointerover', ev => {
    if (ev.pointerType === 'touch') return;
    const a = ev.target.closest('[data-chapter-link]');
    if (a && nav.contains(a)) showMenu(a.dataset.chapterLink);
  });
  nav.addEventListener('pointerenter', () => clearTimeout(closeTimer));
  nav.addEventListener('pointerleave', () => {
    if (keyboardInput && nav.contains(document.activeElement)) return;
    // Preserve the short travel from the primary row into its secondary row.
    closeTimer = setTimeout(hideMenu, 160);
  });
  nav.addEventListener('focusin', ev => {
    const a = ev.target.closest('[data-chapter-link]');
    if (a && (!touchInput || keyboardInput)) showMenu(a.dataset.chapterLink);
    else clearTimeout(closeTimer);
  });
  nav.addEventListener('focusout', () => {
    setTimeout(() => { if (!nav.contains(document.activeElement)) hideMenu(); }, 0);
  });
  addEventListener('keydown', ev => {
    if (ev.key === 'Tab' || ev.key.startsWith('Arrow')) keyboardInput = true;
    if (ev.key === 'Escape' && preview) {
      const trigger = topLinks.find(a => a.dataset.chapterLink === preview);
      hideMenu();
      if (trigger) trigger.focus();
      hideMenu();
    }
  });
  addEventListener('pointerdown', ev => {
    keyboardInput = false;
    touchInput = ev.pointerType === 'touch';
    if (!nav.contains(ev.target)) hideMenu();
  });
  nav.addEventListener('click', ev => {
    const a = ev.target.closest('a[href^="#"]');
    if (!a) return;
    const id = decodeURIComponent(a.hash.slice(1));
    if (!document.getElementById(id)) return;
    const firstTouch = a.dataset.chapterLink && (touchInput || !matchMedia('(hover: hover)').matches);
    if (firstTouch && preview !== a.dataset.chapterLink) {
      ev.preventDefault();
      showMenu(a.dataset.chapterLink);
      return;
    }
    ev.preventDefault();
    hideMenu();
    history.pushState(null, '', a.hash);
    jumpTo(id);
  });
  addEventListener('wheel', () => { jumpToken++; }, { passive: true });
  addEventListener('touchstart', () => { jumpToken++; }, { passive: true });
  addEventListener('hashchange', () => { hideMenu(); jumpTo(decodeURIComponent(location.hash.slice(1))); });
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  new ResizeObserver(queue).observe(nav);
  mark();

  const panel = document.getElementById('timeline-panel');
  function fit() {
    if (!panel || innerWidth <= 1000 || panel.classList.contains('is-zoomed')) return;
    let size = 46;
    panel.style.setProperty('--pan-node-size', `${size}px`);
    const top = panel.getBoundingClientRect().top + scrollY;
    const limit = innerHeight - 12;
    while (size > 39 && top + panel.offsetHeight > limit) {
      size--;
      panel.style.setProperty('--pan-node-size', `${size}px`);
    }
  }
  requestAnimationFrame(() => {
    fit();
    mark();
    if (location.hash) {
      const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (target) jumpTo(target.id);
    }
  });
  addEventListener('resize', fit);
})();
