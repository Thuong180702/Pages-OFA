/* ============================================================
   NOTIHUB — Landing Page Interactive Script
   ============================================================ */

'use strict';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// ── Auto-fetch latest release asset from the GitHub API ───
(async function initDownloadLinks() {
  const REPO = 'Thuong180702/notihub';
  const RELEASES_PAGE = `https://github.com/${REPO}/releases`;
  const API_URL = `https://api.github.com/repos/${REPO}/releases/latest`;

  const DOWNLOAD_BTN_IDS = [
    'nav-download-btn',
    'hero-download-btn',
    'direct-download-btn',
    'cta-download-btn',
  ];

  const buttons = () => DOWNLOAD_BTN_IDS.map((id) => document.getElementById(id)).filter(Boolean);

  function setDownloadUrl(url, isDirect) {
    buttons().forEach((el) => {
      el.href = url;
      if (isDirect) {
        el.setAttribute('download', '');  // save the file instead of navigating
        el.removeAttribute('target');
        el.removeAttribute('rel');
      }
    });
  }

  try {
    const res = await fetch(API_URL, { headers: { Accept: 'application/vnd.github+json' } });
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);

    const release = await res.json();
    const assets = release.assets || [];
    const dmg = assets.find((a) => a.name.endsWith('.dmg'));
    const zip = assets.find((a) => a.name.endsWith('.zip') && a.name.includes('mac'));
    const best = dmg || zip;

    if (!best) {
      // A release exists but has no macOS artifact yet — send people to the list.
      setDownloadUrl(RELEASES_PAGE, false);
      return;
    }

    setDownloadUrl(best.browser_download_url, true);

    const version = release.tag_name || '';
    if (version) {
      buttons().forEach((el) => {
        // Only the label text node is replaced, so inline SVG icons survive.
        const textNode = [...el.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
        if (textNode) textNode.textContent = ` ↓ Download ${version}`;
      });
    }
  } catch (err) {
    // Offline, or the unauthenticated API rate limit is spent. Not worth an
    // error to the user — the releases page is a perfectly good destination.
    console.warn('[notihub] Falling back to the releases page:', err.message);
    setDownloadUrl(RELEASES_PAGE, false);
  }
})();

// ── Navbar scroll effect ──────────────────────────────────
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

// ── Mobile menu ───────────────────────────────────────────
(function initMobileMenu() {
  const toggle = document.getElementById('mobile-toggle');
  const links = document.getElementById('nav-links');
  if (!toggle || !links) return;

  const setOpen = (open) => {
    links.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    setOpen(!links.classList.contains('nav-open'));
  });

  links.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));

  // A menu you can only close with the same small button is a trap on mobile.
  document.addEventListener('click', (e) => {
    if (links.classList.contains('nav-open') && !links.contains(e.target)) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);
  });
})();

// ── Scroll reveal animations ──────────────────────────────
(function initReveal() {
  const items = document.querySelectorAll('.reveal');

  // No IntersectionObserver, or motion is unwanted: show everything up front
  // rather than leaving the page permanently blank.
  if (!('IntersectionObserver' in window) || prefersReducedMotion.matches) {
    items.forEach((el) => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  items.forEach((el) => observer.observe(el));
})();

// ── Screenshot carousel ───────────────────────────────────
(function initCarousel() {
  const root = document.getElementById('gallery-carousel');
  const track = document.getElementById('carousel-track');
  const dotsContainer = document.getElementById('carousel-dots');
  const prevBtn = document.getElementById('carousel-prev');
  const nextBtn = document.getElementById('carousel-next');
  if (!root || !track) return;

  const slides = [...track.querySelectorAll('.carousel-slide')];
  const total = slides.length;
  if (!total) return;

  let current = 0;
  let autoTimer = null;
  let inView = false;

  const dots = slides.map((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Go to screenshot ${i + 1} of ${total}`);
    dot.addEventListener('click', () => { goTo(i); restartAuto(); });
    dotsContainer.appendChild(dot);
    return dot;
  });

  function goTo(index) {
    current = (index + total) % total;
    track.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((d, i) => {
      d.classList.toggle('active', i === current);
      d.setAttribute('aria-current', i === current ? 'true' : 'false');
    });
    // Off-screen slides shouldn't be reachable by Tab or read out as current.
    slides.forEach((s, i) => s.setAttribute('aria-hidden', String(i !== current)));
  }

  const next = () => goTo(current + 1);
  const prev = () => goTo(current - 1);

  prevBtn?.addEventListener('click', () => { prev(); restartAuto(); });
  nextBtn?.addEventListener('click', () => { next(); restartAuto(); });

  // Arrow keys used to be bound to the document, which stole them from anyone
  // trying to scroll the page. They now only apply inside the gallery.
  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); restartAuto(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); restartAuto(); }
  });

  let touchStartX = 0;
  track.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', (e) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) < 50) return;
    diff > 0 ? next() : prev();
    restartAuto();
  }, { passive: true });

  // Autoplay. startAuto() always clears first — the old version could stack
  // several intervals through repeated hover in/out and speed the carousel up.
  function startAuto() {
    stopAuto();
    if (prefersReducedMotion.matches || document.hidden || !inView) return;
    autoTimer = setInterval(next, 5500);
  }
  function stopAuto() {
    clearInterval(autoTimer);
    autoTimer = null;
  }
  const restartAuto = () => startAuto();

  root.addEventListener('mouseenter', stopAuto);
  root.addEventListener('mouseleave', startAuto);
  root.addEventListener('focusin', stopAuto);
  root.addEventListener('focusout', startAuto);
  document.addEventListener('visibilitychange', startAuto);
  prefersReducedMotion.addEventListener('change', startAuto);

  // Don't burn a timer (or move slides behind the reader's back) while the
  // gallery is nowhere near the viewport.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      startAuto();
    }, { threshold: 0.25 }).observe(root);
  } else {
    inView = true;
  }

  goTo(0);
  startAuto();
})();

// ── Copy-to-clipboard for the install snippets ────────────
(function initCopyButtons() {
  document.querySelectorAll('.copy-btn[data-copy-target]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const block = document.getElementById(btn.dataset.copyTarget);
      if (!block) return;

      // Read the command text with the button itself hidden, so "Copy" doesn't
      // end up pasted along with it.
      btn.style.display = 'none';
      const text = block.innerText.trim();
      btn.style.display = '';

      try {
        await navigator.clipboard.writeText(text);
      } catch {
        // Insecure context or a browser without the async clipboard API.
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch { /* nothing else to try */ }
        document.body.removeChild(ta);
      }

      btn.textContent = '✓ Copied!';
      btn.classList.add('copied');
      clearTimeout(btn._resetTimer);
      btn._resetTimer = setTimeout(() => {
        btn.textContent = 'Copy';
        btn.classList.remove('copied');
      }, 2000);
    });
  });
})();

console.log('%c⚡ Notihub', 'font-size:20px;font-weight:900;background:linear-gradient(135deg,#6366f1,#ec4899,#f59e0b);-webkit-background-clip:text;-webkit-text-fill-color:transparent;');
console.log('%chttps://github.com/Thuong180702/notihub', 'color:#6366f1;font-size:13px;');
