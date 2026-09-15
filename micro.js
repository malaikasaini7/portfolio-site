/* microinteractions - landing + case pages (desktop, motion-safe) */
(function () {
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* 1. custom cursor: ink dot, inverts over links, labels over project media */
  function initCursor() {
    if (!fine.matches || calm.matches) return;
    var c = document.createElement('div');
    c.className = 'mx-cursor';
    c.setAttribute('aria-hidden', 'true');
    c.innerHTML = '<span class="mx-cursor-label"></span>';
    document.body.appendChild(c);
    document.documentElement.classList.add('has-mx-cursor');
    var shown = false;
    window.addEventListener('pointermove', function (e) {
      if (!shown) { shown = true; c.classList.add('is-on'); }
      c.style.transform = 'translate3d(' + e.clientX + 'px,' + e.clientY + 'px,0)';
      var t = e.target instanceof Element ? e.target : null;
      var row = t && t.closest ? t.closest('.xp-row[href]') : null;
      var media = t && t.closest ? t.closest('.xp-thumb, .cs-hero img, .shot img') : null;
      var link = t && t.closest ? t.closest('a, button, .key') : null;
      var overRowMedia = !!(row && media);
      c.classList.toggle('is-media', !!media && (overRowMedia || !link));
      c.classList.toggle('is-link', !!link && !overRowMedia && !media);
      c.querySelector('.mx-cursor-label').textContent = overRowMedia ? 'View' : '';
      c.classList.toggle('has-label', overRowMedia);
    }, { passive: true });
    window.addEventListener('pointerleave', function () {
      shown = false; c.classList.remove('is-on');
    }, { passive: true });
  }

  /* 2. hide-on-scroll nav bar, returns on scroll up */
  function initNav() {
    var bar = document.querySelector('.bar');
    if (!bar || calm.matches) return;
    var last = window.scrollY, ticking = false;
    bar.classList.add('mx-bar');
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY, d = y - last;
        if (y <= 0) bar.classList.remove('mx-bar-hidden');
        else if (d > 4 && y > 120) bar.classList.add('mx-bar-hidden');
        else if (d < -4) bar.classList.remove('mx-bar-hidden');
        last = y; ticking = false;
      });
    }, { passive: true });
  }

  initCursor();
  initNav();
})();
