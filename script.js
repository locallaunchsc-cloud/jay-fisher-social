/* ============================================================
   Jay Fisher Social — script.js
   Features:
   - Mobile nav burger toggle (aria + animation)
   - Nav hide-on-scroll-down / show-on-scroll-up
   - IntersectionObserver scroll reveal (.reveal → .visible)
   - Trust counter animations (data-target)
   - Apply form validation + success state
   - Smooth anchor scrolling
   ============================================================ */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     1. NAV — MOBILE BURGER TOGGLE
     HTML: .nav__burger button, .nav__mobile div
  ---------------------------------------------------------- */
  const burger = document.querySelector('.nav__burger');
  const mobileMenu = document.querySelector('.nav__mobile');

  if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
      const isOpen = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!isOpen));
      mobileMenu.classList.toggle('open', !isOpen);

      // Animate bars → X
      const bars = burger.querySelectorAll('span');
      if (!isOpen) {
        bars[0].style.transform = 'translateY(7px) rotate(45deg)';
        bars[1].style.opacity  = '0';
        bars[2].style.transform = 'translateY(-7px) rotate(-45deg)';
      } else {
        bars[0].style.transform = '';
        bars[1].style.opacity  = '';
        bars[2].style.transform = '';
      }
    });

    // Close menu when a mobile nav link is clicked
    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        burger.setAttribute('aria-expanded', 'false');
        mobileMenu.classList.remove('open');
        const bars = burger.querySelectorAll('span');
        bars[0].style.transform = '';
        bars[1].style.opacity  = '';
        bars[2].style.transform = '';
      });
    });
  }

  /* ----------------------------------------------------------
     2. NAV — HIDE ON SCROLL DOWN / SHOW ON SCROLL UP
  ---------------------------------------------------------- */
  const nav = document.querySelector('.nav');
  let lastScrollY = window.scrollY;
  let ticking = false;

  function handleNavScroll() {
    const y = window.scrollY;

    if (y <= 80) {
      nav.classList.remove('nav--hidden');
    } else if (y > lastScrollY + 10) {
      nav.classList.add('nav--hidden');
      // Auto-close mobile menu if visible
      if (mobileMenu && mobileMenu.classList.contains('open')) {
        mobileMenu.classList.remove('open');
        if (burger) burger.setAttribute('aria-expanded', 'false');
      }
    } else if (y < lastScrollY - 6) {
      nav.classList.remove('nav--hidden');
    }

    lastScrollY = y;
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(handleNavScroll);
      ticking = true;
    }
  }, { passive: true });

  /* ----------------------------------------------------------
     3. SCROLL REVEAL — IntersectionObserver
     Targets .reveal elements → adds .visible class
  ---------------------------------------------------------- */
  const revealEls = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window && revealEls.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -36px 0px' }
    );
    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('visible'));
  }

  /* ----------------------------------------------------------
     4. TRUST COUNTER ANIMATIONS
     Matches HTML: <span class="trust__num" data-target="500">0</span>
  ---------------------------------------------------------- */
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  function runCounter(el) {
    const target = parseInt(el.getAttribute('data-target'), 10);
    if (isNaN(target)) return;
    const duration = 1600;
    const start = performance.now();

    function frame(now) {
      const pct = Math.min((now - start) / duration, 1);
      el.textContent = Math.round(easeOutCubic(pct) * target);
      if (pct < 1) requestAnimationFrame(frame);
      else el.textContent = target;
    }
    requestAnimationFrame(frame);
  }

  const counters = document.querySelectorAll('.trust__num[data-target]');
  if ('IntersectionObserver' in window && counters.length) {
    const cObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            runCounter(entry.target);
            cObs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach((el) => cObs.observe(el));
  }

  /* ----------------------------------------------------------
     5. APPLY FORM — Validation + Success State
     HTML IDs: #applyName, #applyEmail, #applyProgram,
               #applyMessage, #applySubmit
     Wrapper:  .apply__inner
  ---------------------------------------------------------- */
  const submitBtn  = document.getElementById('applySubmit');
  const nameField  = document.getElementById('applyName');
  const emailField = document.getElementById('applyEmail');
  const progField  = document.getElementById('applyProgram');
  const msgField   = document.getElementById('applyMessage');
  const applyInner = document.querySelector('.apply__inner');

  function clearErrors() {
    document.querySelectorAll('.field-error').forEach((e) => e.remove());
    [nameField, emailField, progField, msgField].forEach((f) => {
      if (f) f.classList.remove('input-error');
    });
  }

  function addError(field, msg) {
    field.classList.add('input-error');
    const span = document.createElement('span');
    span.className = 'field-error';
    span.setAttribute('role', 'alert');
    span.textContent = msg;
    field.insertAdjacentElement('afterend', span);
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', (e) => {
      e.preventDefault();
      clearErrors();

      let valid = true;

      if (!nameField || !nameField.value.trim()) {
        addError(nameField, 'Your name is required.');
        valid = false;
      }
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailField || !emailField.value.trim() || !emailRe.test(emailField.value)) {
        addError(emailField, 'Enter a valid email address.');
        valid = false;
      }
      if (!progField || !progField.value) {
        addError(progField, 'Please select a program.');
        valid = false;
      }
      if (!msgField || msgField.value.trim().length < 20) {
        addError(msgField, 'Tell Jay a bit more about yourself (min 20 chars).');
        valid = false;
      }

      if (!valid) {
        const firstErr = document.querySelector('.input-error');
        if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      // Processing state
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';

      // Show success after brief pause
      setTimeout(() => {
        if (applyInner) {
          applyInner.innerHTML = `
            <div class="apply__success" role="status">
              <div class="apply__success-icon" aria-hidden="true">✓</div>
              <h3 class="apply__success-title">Application Received.</h3>
              <p class="apply__success-body">
                Jay reviews every application personally.<br />
                You'll hear back within 48 hours — check your inbox (and spam).
              </p>
              <a href="https://calendly.com/jayfishersocial"
                 target="_blank" rel="noopener"
                 class="btn btn--primary"
                 style="margin-top:2rem;min-width:240px;">
                Book Your Discovery Call
              </a>
            </div>`;
        }
      }, 900);
    });
  }

  /* ----------------------------------------------------------
     6. SMOOTH SCROLL for same-page anchor links
  ---------------------------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 78;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

})();
