/* ============================================================
   BADAAAS AI — MAIN JAVASCRIPT
============================================================ */

'use strict';

/* ============================================================
   1. UTILITY HELPERS
============================================================ */

/** Debounce: limit how often a function fires */
function debounce(fn, ms = 100) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/** Query helper */
const qs  = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ============================================================
   2. SCROLL PROGRESS BAR
============================================================ */
function initScrollProgress() {
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  bar.setAttribute('role', 'progressbar');
  bar.setAttribute('aria-label', 'Page reading progress');
  document.body.prepend(bar);

  const update = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    bar.style.width = pct + '%';
    bar.setAttribute('aria-valuenow', Math.round(pct));
  };

  window.addEventListener('scroll', update, { passive: true });
  update();
}

/* ============================================================
   3. STICKY HEADER
============================================================ */
function initStickyHeader() {
  const header = qs('#site-header');
  if (!header) return;

  const toggle = () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  };

  window.addEventListener('scroll', toggle, { passive: true });
  toggle();
}

/* ============================================================
   4. MOBILE NAVIGATION
============================================================ */
function initMobileNav() {
  const toggle  = qs('#nav-toggle');
  const menu    = qs('#nav-menu');
  if (!toggle || !menu) return;

  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'nav-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  document.body.appendChild(overlay);

  const openMenu = () => {
    menu.classList.add('open');
    overlay.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    // Focus first link for accessibility
    const firstLink = qs('a, button', menu);
    if (firstLink) firstLink.focus();
  };

  const closeMenu = () => {
    menu.classList.remove('open');
    overlay.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    toggle.focus();
  };

  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    isOpen ? closeMenu() : openMenu();
  });

  overlay.addEventListener('click', closeMenu);

  // Close on nav link click
  qsa('.nav__link', menu).forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      closeMenu();
    }
  });

  // Close if viewport widens
  window.addEventListener('resize', debounce(() => {
    if (window.innerWidth > 960) closeMenu();
  }), { passive: true });
}

/* ============================================================
   5. SMOOTH SCROLL (fallback for older browsers)
============================================================ */
function initSmoothScroll() {
  qsa('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const target = qs(anchor.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const header = qs('#site-header');
      const offset = header ? header.offsetHeight + 16 : 80;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

/* ============================================================
   6. INTERSECTION OBSERVER — ANIMATE ON SCROLL
============================================================ */
function initAnimations() {
  const elements = qsa('[data-animate]');
  if (!elements.length) return;

  if (!window.IntersectionObserver) {
    elements.forEach(el => el.classList.add('animate-in'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  elements.forEach(el => observer.observe(el));
}

/* ============================================================
   7. PARTICLE BACKGROUND
============================================================ */
function initParticles() {
  const container = qs('#particles');
  if (!container) return;

  // Don't run on reduced-motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const PARTICLE_COUNT = 30;

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const p = document.createElement('div');
    p.className = 'particle';

    const x    = Math.random() * 100;
    const size = Math.random() * 3 + 1;
    const dur  = Math.random() * 8 + 6;
    const del  = Math.random() * 8;

    p.style.cssText = `
      left: ${x}%;
      bottom: ${Math.random() * 30}%;
      width: ${size}px;
      height: ${size}px;
      animation-duration: ${dur}s;
      animation-delay: ${del}s;
      opacity: ${Math.random() * 0.5 + 0.1};
    `;

    container.appendChild(p);
  }
}

/* ============================================================
   8. COUNTER ANIMATION
============================================================ */
function initCounters() {
  const statsSection = qs('.stats');
  if (!statsSection) return;

  let animated = false;

  const animateCounters = () => {
    if (animated) return;
    animated = true;

    const counters = [
      { el: qs('#count-businesses'), start: 0, end: 500, suffix: '+', duration: 1800 },
      { el: qs('#count-cost'),       start: 0, end: 50,  suffix: '%', duration: 1500 },
    ];

    counters.forEach(({ el, start, end, suffix, duration }) => {
      if (!el) return;
      const startTime = performance.now();

      const step = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + (end - start) * eased);
        el.textContent = current + suffix;
        if (progress < 1) requestAnimationFrame(step);
      };

      requestAnimationFrame(step);
    });
  };

  if (!window.IntersectionObserver) {
    animateCounters();
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      animateCounters();
      observer.disconnect();
    }
  }, { threshold: 0.3 });

  observer.observe(statsSection);
}

/* ============================================================
   9. ACTIVE NAV HIGHLIGHT
============================================================ */
function initActiveNav() {
  const sections = qsa('section[id]');
  const navLinks = qsa('.nav__link');
  if (!sections.length || !navLinks.length) return;

  const highlight = debounce(() => {
    const scrollY = window.scrollY + 120;
    let current = '';

    sections.forEach(sec => {
      if (sec.offsetTop <= scrollY) current = sec.id;
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  }, 50);

  window.addEventListener('scroll', highlight, { passive: true });
  highlight();
}

/* ============================================================
   10. CONTACT FORM
============================================================ */
function initContactForm() {
  const form = qs('#contact-form');
  if (!form) return;

  const btnText   = qs('#btn-text', form);
  const submitBtn = qs('#submit-btn', form);
  const success   = qs('#form-success', form);

  const validate = (field) => {
    const val = field.value.trim();
    let valid = true;

    if (field.required && !val) valid = false;
    if (field.type === 'email' && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) valid = false;

    field.classList.toggle('error', !valid);
    return valid;
  };

  // Real-time validation on blur
  qsa('.form-input', form).forEach(input => {
    input.addEventListener('blur', () => validate(input));
    input.addEventListener('input', () => {
      if (input.classList.contains('error')) validate(input);
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fields = qsa('.form-input[required]', form);
    const allValid = fields.map(validate).every(Boolean);

    if (!allValid) {
      const firstError = qs('.form-input.error', form);
      if (firstError) firstError.focus();
      return;
    }

    // Simulate form submission (no backend in this static build)
    submitBtn.disabled = true;
    if (btnText) btnText.textContent = 'Sending…';

    await new Promise(r => setTimeout(r, 1200)); // Simulate network delay

    form.style.opacity = '0.4';
    form.style.pointerEvents = 'none';
    if (success) {
      success.style.display = 'flex';
    }

    // Redirect to badaaas.com/get-started after a short delay
    setTimeout(() => {
      window.open('https://www.badaaas.com/get-started', '_blank', 'noopener,noreferrer');
      // Reset form
      form.reset();
      form.style.opacity = '';
      form.style.pointerEvents = '';
      submitBtn.disabled = false;
      if (btnText) btnText.textContent = 'Get My Free Consultation';
      if (success) success.style.display = 'none';
    }, 3000);
  });
}

/* ============================================================
   11. FOOTER YEAR
============================================================ */
function initFooterYear() {
  const el = qs('#footer-year');
  if (el) el.textContent = new Date().getFullYear();
}

/* ============================================================
   12. TESTIMONIAL CARD SLIDER (mobile)
============================================================ */
function initTestimonialsSlider() {
  const grid = qs('.testimonials__grid');
  if (!grid) return;

  // Only activate on small screens
  const mq = window.matchMedia('(max-width: 640px)');

  let startX = 0;
  let currentIndex = 0;
  const cards = qsa('.testimonial-card', grid);

  if (cards.length < 2) return;

  const handleTouch = () => {
    grid.addEventListener('touchstart', e => {
      startX = e.touches[0].clientX;
    }, { passive: true });

    grid.addEventListener('touchend', e => {
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        if (diff > 0 && currentIndex < cards.length - 1) currentIndex++;
        else if (diff < 0 && currentIndex > 0) currentIndex--;
        cards[currentIndex].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }, { passive: true });
  };

  if (mq.matches) handleTouch();
  mq.addEventListener('change', e => {
    if (e.matches) handleTouch();
  });
}

/* ============================================================
   13. INIT — RUN ON DOM READY
============================================================ */
function init() {
  initScrollProgress();
  initStickyHeader();
  initMobileNav();
  initSmoothScroll();
  initAnimations();
  initParticles();
  initCounters();
  initActiveNav();
  initContactForm();
  initFooterYear();
  initTestimonialsSlider();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
