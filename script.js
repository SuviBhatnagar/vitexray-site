/* Vitexray LLC — minimal enhancements: mobile nav, smooth scroll, active nav, form UX */
(function () {
  'use strict';
  document.documentElement.classList.remove('no-js');

  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Mobile nav */
  function closeNav() {
    if (!nav.classList.contains('is-open')) return;
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }
  toggle.addEventListener('click', function () {
    var open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
    if (open) { var first = nav.querySelector('a'); if (first) first.focus(); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { closeNav(); toggle.focus(); }
  });
  window.addEventListener('resize', function () { if (window.innerWidth >= 960) closeNav(); });

  /* Header shadow on scroll */
  function onScroll() { header.classList.toggle('is-scrolled', window.scrollY > 8); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Smooth in-page scroll + preselect form intent */
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href^="#"]');
    if (!link) return;
    var id = link.getAttribute('href');
    var target = id === '#top' ? document.body : document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    closeNav();

    var intent = link.getAttribute('data-intent');
    if (intent) {
      var radio = document.querySelector('input[name="intent"][value="' + (intent === 'vendor' ? 'Vendor partnership' : 'Hire talent') + '"]');
      if (radio) radio.checked = true;
    }

    var y = id === '#top' ? 0 : target.getBoundingClientRect().top + window.scrollY - header.offsetHeight - 8;
    window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
    if (id !== '#top') {
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
    history.replaceState(null, '', id);
  });

  /* Active section highlight */
  var navLinks = Array.prototype.slice.call(nav.querySelectorAll('ul a'));
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          var active = a.getAttribute('href') === '#' + entry.target.id;
          a.classList.toggle('is-active', active);
          if (active) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach(function (a) {
      var s = document.querySelector(a.getAttribute('href'));
      if (s) spy.observe(s);
    });

    /* Gentle reveal */
    if (!reduceMotion) {
      var items = document.querySelectorAll('.card, .model, .partner-points li, .step, .section-head');
      var rev = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          el.classList.add('is-visible');
          rev.unobserve(el);
          if (el.classList.contains('reveal')) {
            setTimeout(function () { el.classList.remove('reveal', 'is-visible'); }, 700);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px' });
      items.forEach(function (el, i) {
        el.classList.add('reveal');
        el.style.transitionDelay = (i % 3) * 70 + 'ms';
        rev.observe(el);
      });
      var steps = document.querySelector('.steps');
      if (steps) rev.observe(steps);
    } else {
      var st = document.querySelector('.steps'); if (st) st.classList.add('is-visible');
    }
  }

  /* Pointer spotlight on cards */
  if (window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.card, .partner-points li, .model').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* Contact form: validate, then open a pre-filled email */
  var form = document.getElementById('contact-form');
  var status = document.getElementById('form-status');
  var EMAIL = 'admin@vitexray.com';

  function setError(input, msg) {
    var err = document.getElementById(input.id + '-err');
    if (msg) { input.setAttribute('aria-invalid', 'true'); if (err) err.textContent = msg; }
    else { input.removeAttribute('aria-invalid'); if (err) err.textContent = ''; }
  }
  function validate(input) {
    var v = input.value.trim();
    if (input.required && !v) { setError(input, 'This field is required.'); return false; }
    if (input.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { setError(input, 'Please enter a valid email address.'); return false; }
    setError(input, ''); return true;
  }

  form.querySelectorAll('input[required], textarea[required]').forEach(function (el) {
    el.addEventListener('blur', function () { validate(el); });
    el.addEventListener('input', function () { if (el.getAttribute('aria-invalid')) validate(el); });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var fields = [form.elements.name, form.elements.email, form.elements.message];
    var firstBad = null;
    fields.forEach(function (f) { if (!validate(f) && !firstBad) firstBad = f; });
    if (firstBad) { firstBad.focus(); status.textContent = 'Please fix the highlighted fields.'; status.classList.remove('is-success'); return; }

    var intent = form.querySelector('input[name="intent"]:checked').value;
    var name = form.elements.name.value.trim();
    var company = form.elements.company.value.trim();
    var subject = intent + ' inquiry from ' + name + (company ? ' (' + company + ')' : '');
    var body =
      'Intent: ' + intent + '\n' +
      'Name: ' + name + '\n' +
      'Email: ' + form.elements.email.value.trim() + '\n' +
      'Company: ' + (company || '-') + '\n\n' +
      form.elements.message.value.trim() + '\n';

    window.location.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    status.textContent = 'Your email app should open with your message ready to send. If it doesn\u2019t, email us directly at ' + EMAIL + '.';
    status.classList.add('is-success');
  });
})();
