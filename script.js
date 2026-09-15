/* Malaika Saini — portfolio behaviour: reveals, clock, keycap nav, contact panel, drifting fields */

/* ── scroll reveals ── */
(function () {
  'use strict';
  const io = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.06, rootMargin: '0px 0px -4% 0px' });
  document.querySelectorAll('.rv').forEach((el, i) => {
    el.style.transitionDelay = (Math.min(i % 5, 4) * 0.07) + 's';
    io.observe(el);
  });
})();

/* ── Bay Area clock, top bar + footer ── */
(function () {
  'use strict';
  const targets = [document.getElementById('clock'), document.getElementById('cmClock')].filter(Boolean);
  if (!targets.length) return;
  const tick = () => {
    const text = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Los_Angeles',
    }).format(new Date()).toLowerCase();
    targets.forEach(t => { t.textContent = text; });
  };
  tick();
  setInterval(tick, 15000);
})();

/* ── keycap nav: click, or press the underlined letter ── */
(function () {
  'use strict';
  const keys = [...document.querySelectorAll('.key[data-k]')];
  if (!keys.length) return;
  function fire(el) {
    el.classList.add('down');
    setTimeout(() => el.classList.remove('down'), 130);
    const t = document.querySelector(el.getAttribute('href'));
    if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const tag = document.activeElement && document.activeElement.tagName;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag || '')) return;
    const el = keys.find(k => k.dataset.k === e.key.toLowerCase());
    if (!el) return;
    e.preventDefault();
    fire(el);
  });
  keys.forEach(k => k.addEventListener('click', e => { e.preventDefault(); fire(k); }));
})();

/* ── reach: contact panel opens beneath the button, copies the email ── */
(function () {
  'use strict';
  const wrap = document.querySelector('.reach');
  if (!wrap) return;
  const btn = wrap.querySelector('[data-contact]');
  const list = wrap.querySelector('.reach-list');

  function setOpen(on) {
    wrap.classList.toggle('open', on);
    btn.setAttribute('aria-expanded', on ? 'true' : 'false');
    btn.classList.toggle('is-open', on);
  }
  btn.addEventListener('click', e => { e.preventDefault(); setOpen(!wrap.classList.contains('open')); });
  addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
  addEventListener('click', e => { if (!wrap.contains(e.target)) setOpen(false); });
  addEventListener('scroll', () => setOpen(false), { passive: true });

  list.querySelectorAll('[data-copy]').forEach(row => {
    const act = row.querySelector('.reach-act');
    const label = act ? act.textContent : '';
    row.addEventListener('click', async e => {
      e.stopPropagation();
      try { await navigator.clipboard.writeText(row.dataset.copy); }
      catch (_) {
        const t = document.createElement('textarea');
        t.value = row.dataset.copy; document.body.appendChild(t); t.select();
        try { document.execCommand('copy'); } catch (__) {}
        t.remove();
      }
      row.classList.add('copied');
      if (act) act.textContent = 'copied';
      setTimeout(() => { row.classList.remove('copied'); if (act) act.textContent = label; }, 1600);
    });
  });
})();
