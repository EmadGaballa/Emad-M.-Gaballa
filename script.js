/* ============================================================
   TOUCH DETECTION
   ============================================================ */
let isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
window.addEventListener('touchstart', () => { isTouch = true; }, { once: true, passive: true });

/* ============================================================
   CUSTOM CURSOR  (desktop only)
   ============================================================ */
const cursor     = document.getElementById('cursor');
const cursorRing = document.getElementById('cursor-ring');
let cx = 0, cy = 0, rx = 0, ry = 0;
let rafRunning = false;

if (cursor && cursorRing) {
  document.addEventListener('mousemove', e => {
    if (isTouch) return;
    cx = e.clientX; cy = e.clientY;
    cursor.style.left = cx + 'px';
    cursor.style.top  = cy + 'px';
    if (!rafRunning) animRing();
  });

  function animRing() {
    rafRunning = true;
    rx += (cx - rx) * 0.12;
    ry += (cy - ry) * 0.12;
    cursorRing.style.left = rx + 'px';
    cursorRing.style.top  = ry + 'px';
    if (Math.abs(cx - rx) > 0.5 || Math.abs(cy - ry) > 0.5) {
      requestAnimationFrame(animRing);
    } else {
      rafRunning = false;
    }
  }

  document.querySelectorAll('a, button, .skill-card, .project-hero, .case-card, .feature-item').forEach(el => {
    el.addEventListener('mouseenter', () => { if (!isTouch) document.body.classList.add('cursor-expand'); });
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-expand'));
  });
}

/* ============================================================
   NAV — scroll shrink
   ============================================================ */
const nav = document.getElementById('nav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
}

/* ============================================================
   MOBILE MENU
   ============================================================ */
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');
let menuOpen = false;

function closeMobile() {
  if (!menuOpen) return;
  menuOpen = false;
  mobileMenu.classList.remove('open');
  document.body.style.overflow = '';
  const spans = hamburger.querySelectorAll('span');
  spans[0].style.transform = '';
  spans[1].style.transform = '';
}

if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => {
    menuOpen = !menuOpen;
    mobileMenu.classList.toggle('open', menuOpen);
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    const spans = hamburger.querySelectorAll('span');
    if (menuOpen) {
      spans[0].style.transform = 'translateY(6px) rotate(45deg)';
      spans[1].style.transform = 'translateY(-1px) rotate(-45deg)';
    } else {
      spans[0].style.transform = '';
      spans[1].style.transform = '';
    }
  });

  // ── FIX: menu link taps on touch screens ──
  // Root cause: the inline onclick="closeMobile()" in the HTML + touchend
  // listeners were racing each other, and body scroll-lock / display changes
  // fired BEFORE the browser could register the anchor navigation.
  // Fix: take full control here, preventDefault the default jump, close the
  // menu, then scrollIntoView() after a tiny delay so the DOM settles first.
  mobileMenu.querySelectorAll('a').forEach(a => {
    a.removeAttribute('onclick'); // strip inline handler — we own this now

    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const target = document.querySelector(href);
        closeMobile();
        // Wait just long enough for the menu opacity transition to start
        // (50ms << 400ms transition), then scroll. Feels instant to the user.
        setTimeout(() => {
          if (target) target.scrollIntoView({ behavior: 'smooth' });
        }, 50);
      } else {
        closeMobile();
      }
    });
  });

  // Close on backdrop tap
  mobileMenu.addEventListener('click', e => {
    if (e.target === mobileMenu) closeMobile();
  });

  // Close on swipe-up gesture
  let touchStartY = 0;
  mobileMenu.addEventListener('touchstart', e => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });
  mobileMenu.addEventListener('touchend', e => {
    if (e.changedTouches[0].clientY - touchStartY > 60) closeMobile();
  }, { passive: true });
}

/* ============================================================
   SCROLL REVEAL
   ============================================================ */
const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');

const ioOptions = {
  threshold:  isTouch ? 0.05 : 0.12,
  rootMargin: isTouch ? '0px 0px -20px 0px' : '0px 0px -40px 0px'
};

const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible');

    const bar = entry.target.querySelector('.skill-bar');
    if (bar) {
      const lvl = entry.target.dataset.level || 0;
      setTimeout(() => { bar.style.width = lvl + '%'; }, 300);
      entry.target.classList.add('animated');
    }

    io.unobserve(entry.target);
  });
}, ioOptions);

revealEls.forEach(el => io.observe(el));

/* ============================================================
   PARALLAX  (desktop only)
   ============================================================ */
if (!isTouch && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const heroGrid = document.querySelector('.hero-grid');
  if (heroGrid) {
    window.addEventListener('scroll', () => {
      heroGrid.style.transform = `translateY(${window.scrollY * 0.25}px)`;
    }, { passive: true });
  }
}

/* ============================================================
   TOUCH RIPPLE
   ============================================================ */
function createRipple(e, el) {
  const rect  = el.getBoundingClientRect();
  const touch = e.changedTouches ? e.changedTouches[0] : e;
  const x     = touch.clientX - rect.left;
  const y     = touch.clientY - rect.top;
  const size  = Math.max(rect.width, rect.height) * 1.6;

  const ripple = document.createElement('span');
  ripple.style.cssText = `
    position:absolute;
    width:${size}px; height:${size}px;
    left:${x - size / 2}px; top:${y - size / 2}px;
    background: rgba(200,169,126,0.12);
    border-radius: 50%;
    pointer-events: none;
    transform: scale(0);
    animation: ripple-anim 0.55s cubic-bezier(0.0,0.0,0.2,1) forwards;
    z-index: 10;
  `;

  const prev = el.style.overflow;
  el.style.overflow = 'hidden';
  el.style.position = el.style.position || 'relative';
  el.appendChild(ripple);

  ripple.addEventListener('animationend', () => {
    ripple.remove();
    el.style.overflow = prev;
  });
}

const rippleStyle = document.createElement('style');
rippleStyle.textContent = `@keyframes ripple-anim { to { transform: scale(1); opacity: 0; } }`;
document.head.appendChild(rippleStyle);

if (isTouch || 'ontouchstart' in window) {
  document.querySelectorAll(
    '.btn-primary, .btn-secondary, .overlay-btn, .contact-link, .nav-cta, .skill-card, .case-card'
  ).forEach(el => {
    el.addEventListener('touchstart', e => createRipple(e, el), { passive: true });
  });
}

/* ============================================================
   ACTIVE STATE HELPER
   ============================================================ */
document.querySelectorAll(
  '.btn-primary, .btn-secondary, .overlay-btn, .contact-link, .tech-tag, .skill-card, .case-card, .feature-item, .stat-card'
).forEach(el => {
  el.addEventListener('touchstart',  () => el.classList.add('is-active'),    { passive: true });
  el.addEventListener('touchend',    () => el.classList.remove('is-active'), { passive: true });
  el.addEventListener('touchcancel', () => el.classList.remove('is-active'), { passive: true });
});