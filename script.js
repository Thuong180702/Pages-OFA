/* ============================================================
   ONE FOR ALL — Landing Page Interactive Script
   ============================================================ */

'use strict';

// ── Navbar scroll effect ──────────────────────────────────
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

// ── Mobile menu toggle ────────────────────────────────────
const mobileToggle = document.getElementById('mobile-toggle');
const navLinks = document.querySelector('.nav-links');

mobileToggle?.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('nav-open');
  mobileToggle.setAttribute('aria-expanded', isOpen);
});

// Close mobile menu on link click
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('nav-open');
  });
});

// ── Scroll reveal animations ──────────────────────────────
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.1,
  rootMargin: '0px 0px -40px 0px'
});

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ── Screenshot Carousel ───────────────────────────────────
(function initCarousel() {
  const track = document.getElementById('carousel-track');
  const dotsContainer = document.getElementById('carousel-dots');
  const chromeTitle = document.getElementById('carousel-chrome-title');
  const prevBtn = document.getElementById('carousel-prev');
  const nextBtn = document.getElementById('carousel-next');

  if (!track) return;

  const slides = track.querySelectorAll('.carousel-slide');
  const total = slides.length;
  let current = 0;
  let autoTimer = null;

  const slideTitles = [
    'one-for-all — Web App View',
    'one-for-all — Add Services',
    'one-for-all — Menu Bar Panel',
    'one-for-all — Per-Service Settings',
    'one-for-all — App Settings',
    'one-for-all — RAM Optimization',
    'one-for-all — Notification History',
  ];

  // Build dots
  for (let i = 0; i < total; i++) {
    const dot = document.createElement('button');
    dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Slide ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    dotsContainer.appendChild(dot);
  }

  function goTo(index) {
    current = (index + total) % total;
    track.style.transform = `translateX(-${current * 100}%)`;
    dotsContainer.querySelectorAll('.carousel-dot').forEach((d, i) => {
      d.classList.toggle('active', i === current);
    });
    if (chromeTitle) chromeTitle.textContent = slideTitles[current] || 'one-for-all';
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  prevBtn?.addEventListener('click', () => { prev(); resetAuto(); });
  nextBtn?.addEventListener('click', () => { next(); resetAuto(); });

  // Keyboard navigation
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') { prev(); resetAuto(); }
    if (e.key === 'ArrowRight') { next(); resetAuto(); }
  });

  // Touch/swipe support
  let touchStartX = 0;
  track.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  track.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? next() : prev();
      resetAuto();
    }
  }, { passive: true });

  // Auto-slide every 4s
  function startAuto() {
    autoTimer = setInterval(next, 4000);
  }

  function resetAuto() {
    clearInterval(autoTimer);
    startAuto();
  }

  // Pause on hover
  const carouselWrap = document.querySelector('.carousel-track-wrap');
  carouselWrap?.addEventListener('mouseenter', () => clearInterval(autoTimer));
  carouselWrap?.addEventListener('mouseleave', startAuto);

  startAuto();
})();

// ── Copy to clipboard ─────────────────────────────────────
function copyCode(elementId, btn) {
  const el = document.getElementById(elementId);
  if (!el) return;

  // Get text content without the button text
  const btnEl = el.querySelector('.copy-btn');
  const originalBtnText = btnEl ? btnEl.textContent : '';
  if (btnEl) btnEl.style.display = 'none';

  const text = el.innerText.trim();
  if (btnEl) btnEl.style.display = '';

  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = '✓ Copied!';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = 'Copy';
      btn.classList.remove('copied');
    }, 2000);
  }).catch(() => {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    btn.textContent = '✓ Copied!';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = 'Copy';
      btn.classList.remove('copied');
    }, 2000);
  });
}

// Make copyCode globally available
window.copyCode = copyCode;

// ── Mobile nav styles (injected) ─────────────────────────
const mobileNavStyle = document.createElement('style');
mobileNavStyle.textContent = `
  @media (max-width: 900px) {
    .nav-links {
      display: flex !important;
      flex-direction: column;
      position: absolute;
      top: 68px;
      left: 0; right: 0;
      background: rgba(8,8,16,0.97);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(255,255,255,0.07);
      padding: 12px 24px 20px;
      gap: 4px;
      transform: translateY(-20px);
      opacity: 0;
      pointer-events: none;
      transition: transform 0.3s ease, opacity 0.3s ease;
    }
    .nav-links.nav-open {
      transform: translateY(0);
      opacity: 1;
      pointer-events: all;
    }
    .nav-links a {
      padding: 10px 12px;
      font-size: 15px;
    }
    .nav-cta { display: none; }
    kbd {
      display: inline-block;
      padding: 2px 6px;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 4px;
      font-size: 0.85em;
      font-family: inherit;
    }
  }
`;
document.head.appendChild(mobileNavStyle);

// ── kbd styling ───────────────────────────────────────────
const kbdStyle = document.createElement('style');
kbdStyle.textContent = `
  kbd {
    display: inline-block;
    padding: 1px 5px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 4px;
    font-size: 0.85em;
    font-family: 'SF Mono', 'Fira Code', monospace;
    color: var(--text-primary);
  }
  code {
    font-family: 'SF Mono', 'Fira Code', monospace;
    font-size: 0.85em;
    color: #a5f3fc;
    background: rgba(0,0,0,0.3);
    padding: 1px 5px;
    border-radius: 4px;
  }
`;
document.head.appendChild(kbdStyle);

console.log('%c⚡ one-for-all', 'font-size:20px;font-weight:900;background:linear-gradient(135deg,#6366f1,#ec4899,#f59e0b);-webkit-background-clip:text;-webkit-text-fill-color:transparent;');
console.log('%chttps://github.com/Thuong180702/one-for-all', 'color:#6366f1;font-size:13px;');
