/* ============================================================
   TOUCH DETECTION
   isTouch = true when the primary input is a finger/stylus.
   We check once at load; also listen for first touch event
   in case the device is a hybrid (laptop + touchscreen).
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

  // Cursor expand on interactive elements
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
  const [s1, s2] = hamburger.querySelectorAll('span');
  s1.style.transform = '';
  s2.style.transform = '';
}

if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => {
    menuOpen = !menuOpen;
    mobileMenu.classList.toggle('open', menuOpen);
    // Lock body scroll while menu is open
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    const [s1, s2] = hamburger.querySelectorAll('span');
    if (menuOpen) {
      s1.style.transform = 'translateY(6px) rotate(45deg)';
      s2.style.transform = 'translateY(-1px) rotate(-45deg)';
    } else {
      s1.style.transform = '';
      s2.style.transform = '';
    }
  });

  // Close menu when a link is tapped
  mobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', closeMobile);
    // Better touch response — fire on touchend too
    a.addEventListener('touchend', closeMobile, { passive: true });
  });

  // Close on backdrop tap (outside links)
  mobileMenu.addEventListener('click', e => {
    if (e.target === mobileMenu) closeMobile();
  });

  // Close on swipe up
  let touchStartY = 0;
  mobileMenu.addEventListener('touchstart', e => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });
  mobileMenu.addEventListener('touchend', e => {
    if (e.changedTouches[0].clientY - touchStartY > 60) closeMobile();
  }, { passive: true });
}

/* ============================================================
   SCROLL REVEAL  (IntersectionObserver)
   On touch, lower the threshold so reveals fire earlier
   (finger already past element before 12% is visible).
   ============================================================ */
const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');

const ioOptions = {
  threshold:   isTouch ? 0.05 : 0.12,
  rootMargin: isTouch ? '0px 0px -20px 0px' : '0px 0px -40px 0px'
};

const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible');

    // Animate skill bars
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
   PARALLAX  (desktop only — GPU-heavy on low-end phones)
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
   TOUCH RIPPLE  — tactile feedback on buttons & cards
   ============================================================ */
function createRipple(e, el) {
  const rect   = el.getBoundingClientRect();
  const touch  = e.changedTouches ? e.changedTouches[0] : e;
  const x      = touch.clientX - rect.left;
  const y      = touch.clientY - rect.top;
  const size   = Math.max(rect.width, rect.height) * 1.6;

  const ripple = document.createElement('span');
  ripple.style.cssText = `
    position:absolute;
    width:${size}px; height:${size}px;
    left:${x - size / 2}px; top:${y - size / 2}px;
    background: rgba(200,169,126,0.12);
    border-radius: 50%;
    pointer-events: none;
    transform: scale(0);
    animation: ripple-anim 0.55s var(--ease-out) forwards;
    z-index: 10;
  `;

  // Make sure the container clips the ripple
  const prev = el.style.overflow;
  el.style.overflow = 'hidden';
  el.style.position = el.style.position || 'relative';
  el.appendChild(ripple);

  ripple.addEventListener('animationend', () => {
    ripple.remove();
    el.style.overflow = prev;
  });
}

// Inject ripple keyframe once
const style = document.createElement('style');
style.textContent = `@keyframes ripple-anim { to { transform: scale(1); opacity: 0; } }`;
document.head.appendChild(style);

// Attach ripple to tappable elements on touch devices
if (isTouch || 'ontouchstart' in window) {
  document.querySelectorAll(
    '.btn-primary, .btn-secondary, .overlay-btn, .contact-link, .nav-cta, .skill-card, .case-card'
  ).forEach(el => {
    el.addEventListener('touchstart', e => createRipple(e, el), { passive: true });
  });
}

/* ============================================================
   ACTIVE STATE HELPER
   Adds .is-active class on touchstart, removes on touchend/cancel.
   Lets CSS do the visual work without JS hover hacks.
   ============================================================ */
document.querySelectorAll(
  '.btn-primary, .btn-secondary, .overlay-btn, .contact-link,.tech-tag, .skill-card, .case-card, .feature-item, .stat-card'
).forEach(el => {
  el.addEventListener('touchstart', () => el.classList.add('is-active'),   { passive: true });
  el.addEventListener('touchend',   () => el.classList.remove('is-active'), { passive: true });
  el.addEventListener('touchcancel',() => el.classList.remove('is-active'), { passive: true });
});