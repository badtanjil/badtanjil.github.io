/* =============================================================
   Md Badrul Hasan — site behaviour
   One file, loaded on every page. Each block exits quietly if the
   markup it needs is not on the current page.
   ============================================================= */
(function () {
  'use strict';

  /* --- Mobile navigation ------------------------------------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');

  if (toggle && nav) {
    var setNav = function (open) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    };

    toggle.addEventListener('click', function () {
      setNav(toggle.getAttribute('aria-expanded') !== 'true');
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        setNav(false);
        toggle.focus();
      }
    });

    document.addEventListener('click', function (e) {
      if (!nav.classList.contains('is-open')) return;
      if (!nav.contains(e.target) && !toggle.contains(e.target)) setNav(false);
    });

    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') setNav(false);
    });
  }

  /* --- Mark the current page in the nav ----------------------- */
  var here = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('#site-nav a[href]').forEach(function (link) {
    var target = link.getAttribute('href').split('/').pop();
    if (target === here) link.setAttribute('aria-current', 'page');
  });

  /* --- On this page: build the rail and highlight while scrolling */
  var toc = document.querySelector('[data-toc]');
  var sections = Array.prototype.slice.call(
    document.querySelectorAll('main .section[id]')
  );

  if (toc && sections.length > 1) {
    var list = document.createElement('ol');

    sections.forEach(function (section) {
      var heading = section.querySelector('h2');
      if (!heading) return;

      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = '#' + section.id;
      a.textContent = section.dataset.navLabel || heading.textContent.trim();
      li.appendChild(a);
      list.appendChild(li);
    });

    toc.appendChild(list);

    var links = Array.prototype.slice.call(toc.querySelectorAll('a'));
    var setCurrent = function (id) {
      links.forEach(function (a) {
        a.classList.toggle('is-current', a.getAttribute('href') === '#' + id);
      });
    };

    // Track which section owns the top of the viewport.
    var visible = new Map();
    var spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          visible.set(entry.target.id, entry.isIntersecting);
        });
        for (var i = 0; i < sections.length; i++) {
          if (visible.get(sections[i].id)) {
            setCurrent(sections[i].id);
            break;
          }
        }
      },
      { rootMargin: '-25% 0px -60% 0px', threshold: 0 }
    );

    sections.forEach(function (s) { spy.observe(s); });
    setCurrent(sections[0].id);
  }

  /* --- Publication filter ------------------------------------- */
  var filters = document.querySelector('[data-filters]');

  if (filters) {
    var items = Array.prototype.slice.call(document.querySelectorAll('.pub[data-kind]'));
    var count = filters.querySelector('[data-count]');
    var groups = Array.prototype.slice.call(document.querySelectorAll('.section[data-kind]'));

    var apply = function (kind) {
      var shown = 0;

      items.forEach(function (item) {
        var match = kind === 'all' || item.dataset.kind === kind;
        item.hidden = !match;
        if (match) shown++;
      });

      // Hide a whole section, and its rail entry, when the filter empties it.
      groups.forEach(function (group) {
        var any = group.querySelectorAll('.pub:not([hidden])').length > 0;
        group.hidden = !any;

        var entry = document.querySelector('[data-toc] a[href="#' + group.id + '"]');
        if (entry && entry.parentElement) entry.parentElement.hidden = !any;
      });

      if (count) {
        count.textContent = shown + (shown === 1 ? ' item' : ' items');
      }
    };

    filters.querySelectorAll('.chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        filters.querySelectorAll('.chip').forEach(function (c) {
          c.setAttribute('aria-pressed', String(c === chip));
        });
        apply(chip.dataset.kind);
      });
    });

    apply('all');
  }

  /* --- Lightbox for gallery images ---------------------------- */
  var thumbs = document.querySelectorAll('.gallery img, figure > img[data-zoom]');

  if (thumbs.length) {
    var box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Enlarged photo');
    box.innerHTML =
      '<button class="lightbox__close" type="button" aria-label="Close photo">&times;</button>' +
      '<figure style="margin:0"><img alt=""><figcaption></figcaption></figure>';
    document.body.appendChild(box);

    var boxImg = box.querySelector('img');
    var boxCap = box.querySelector('figcaption');
    var closeBtn = box.querySelector('.lightbox__close');
    var lastFocus = null;

    var open = function (img) {
      lastFocus = document.activeElement;
      boxImg.src = img.currentSrc || img.src;
      boxImg.alt = img.alt || '';
      var cap = img.closest('figure') && img.closest('figure').querySelector('figcaption');
      boxCap.textContent = cap ? cap.textContent.trim() : (img.alt || '');
      box.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
    };

    var close = function () {
      box.classList.remove('is-open');
      document.body.style.overflow = '';
      if (lastFocus) lastFocus.focus();
    };

    thumbs.forEach(function (img) {
      img.setAttribute('tabindex', '0');
      img.setAttribute('role', 'button');
      img.addEventListener('click', function () { open(img); });
      img.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open(img);
        }
      });
    });

    closeBtn.addEventListener('click', close);
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && box.classList.contains('is-open')) close();
    });
  }

  /* --- Back to top -------------------------------------------- */
  var top = document.querySelector('.to-top');

  if (top) {
    var onScroll = function () {
      top.classList.toggle('is-visible', window.scrollY > 700);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    top.addEventListener('click', function () {
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
  }
})();
