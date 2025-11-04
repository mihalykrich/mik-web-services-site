(function() {
  'use strict';

  // Mobile nav toggle
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.getElementById('nav-menu');
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  // Reveal on scroll
  const revealEls = document.querySelectorAll('[data-reveal]');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => io.observe(el));

  // Footer year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // lax.js scroll animations
  window.addEventListener('load', () => {
    if (window.lax) {
      lax.init();
      lax.addDriver('scrollY', () => window.scrollY, { frameStep: 1 });
      // Elements are configured via data-lax-* attributes in the HTML
    }
    // Dynamic SEO: update title/description on section focus
    const metaDesc = document.querySelector('meta[name="description"]');
    const sectionsSeo = document.querySelectorAll('section[data-seo-title]');
    const baseTitle = document.title;
    const baseDesc = metaDesc ? metaDesc.getAttribute('content') : '';
    const seoIO = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const t = entry.target.getAttribute('data-seo-title');
        const d = entry.target.getAttribute('data-seo-desc');
        if (t) document.title = t;
        if (d && metaDesc) metaDesc.setAttribute('content', d);
      });
    }, { threshold: 0.6 });
    sectionsSeo.forEach(s => seoIO.observe(s));
    // Restore base when scrolled above hero
    window.addEventListener('scroll', () => {
      if (window.scrollY < 100) {
        document.title = baseTitle;
        if (metaDesc) metaDesc.setAttribute('content', baseDesc || '');
      }
    }, { passive: true });

    // Contact form handling (Formspree-compatible)
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
      contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const endpoint = contactForm.getAttribute('data-endpoint') || window.FORMSPREE_ENDPOINT || '';
        const statusEl = contactForm.querySelector('.form-status');
        const btn = contactForm.querySelector('button[type="submit"]');
        function setStatus(msg, ok) {
          if (!statusEl) return;
          statusEl.textContent = msg;
          statusEl.style.color = ok ? 'var(--neon)' : '#ff6b6b';
        }
        if (!endpoint || endpoint === 'noop') {
          // Site-only notification (no network request)
          setStatus('Thanks! Your message has been recorded.', true);
          contactForm.reset();
          return;
        }
        if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
        try {
          const formData = new FormData(contactForm);
          // Simple honeypot
          if ((formData.get('company') || '').toString().trim() !== '') {
            setStatus('Submission blocked.', false);
            if (btn) { btn.disabled = false; btn.textContent = 'Send'; }
            return;
          }
          const payload = {
            name: String(formData.get('name') || ''),
            email: String(formData.get('email') || ''),
            message: String(formData.get('message') || ''),
          };
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (res.ok) {
            setStatus('Thanks! We will get back to you shortly.', true);
            contactForm.reset();
          } else {
            setStatus('Failed to send. Please email info@mik-webservices.co.uk.', false);
          }
        } catch (_err) {
          setStatus('Network error. Please try again or email us directly.', false);
        } finally {
          if (btn) { btn.disabled = false; btn.textContent = 'Send'; }
        }
      });
    }

    // Toggle detailed project form
    const toggle = document.getElementById('toggleDetailed');
    const detailedBox = document.getElementById('detailedForm');
    const simpleForm = document.querySelector('.contact-form');
    if (toggle && detailedBox && simpleForm) {
      toggle.addEventListener('change', () => {
        if (toggle.checked) {
          detailedBox.hidden = false;
          simpleForm.style.display = 'none';
        } else {
          detailedBox.hidden = true;
          simpleForm.style.display = '';
        }
      });
    }
  });

  // Derive accent colors from logo.png and set CSS variables
  const logoImg = document.querySelector('.logo-img');
  if (logoImg && !logoImg.dataset.fixedBrand) {
    const tmp = document.createElement('canvas');
    const tctx = tmp.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = logoImg.getAttribute('src');
    img.onload = function() {
      const w = 120, h = 60; // small sample for speed
      tmp.width = w; tmp.height = h;
      tctx.drawImage(img, 0, 0, w, h);
      const data = tctx.getImageData(0, 0, w, h).data;
      let r = 0, g = 0, b = 0, n = 0;
      for (let i = 0; i < data.length; i += 4 * 16) { // sample every 16 pixels
        const rr = data[i], gg = data[i+1], bb = data[i+2], aa = data[i+3];
        if (aa < 20) continue; // skip transparent
        // skip near-black/near-white background pixels
        const max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb);
        if (max < 20 || min > 235) continue;
        r += rr; g += gg; b += bb; n++;
      }
      if (n > 0) {
        r = Math.round(r / n); g = Math.round(g / n); b = Math.round(b / n);
        // Enforce contrast-friendly saturation/lightness
        const hsl = rgbToHsl(r, g, b);
        const safe = clampHsl(hsl, { minS: 55, maxS: 95, minL: 35, maxL: 55 });
        const shift = { h: (safe.h + 22) % 360, s: safe.s, l: Math.min(60, safe.l + 4) };
        const p = hslToRgb(safe.h, safe.s, safe.l);
        const s2 = hslToRgb(shift.h, shift.s, shift.l);
        document.documentElement.style.setProperty('--neon', `rgb(${p.r}, ${p.g}, ${p.b})`);
        document.documentElement.style.setProperty('--neon-2', `rgb(${s2.r}, ${s2.g}, ${s2.b})`);
      }
    };
  }

  function toCssColor(input) { return input; }
  function rgbToShifted(rgb, shiftDeg) {
    const m = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!m) return rgb;
    const r = parseInt(m[1], 10), g = parseInt(m[2], 10), b = parseInt(m[3], 10);
    const hsl = rgbToHsl(r, g, b);
    hsl.h = (hsl.h + shiftDeg) % 360;
    hsl.s = Math.min(100, hsl.s * 1.05);
    hsl.l = Math.min(60, hsl.l * 1.02);
    const { r: nr, g: ng, b: nb } = hslToRgb(hsl.h, hsl.s, hsl.l);
    return `rgb(${nr}, ${ng}, ${nb})`;
  }
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h *= 60;
    }
    return { h, s: s * 100, l: l * 100 };
  }
  function clampHsl(hsl, { minS, maxS, minL, maxL }) {
    let { h, s, l } = hsl;
    s = Math.min(maxS, Math.max(minS, s || 0));
    l = Math.min(maxL, Math.max(minL, l || 0));
    return { h: h || 0, s, l };
  }
  function hslToRgb(h, s, l) {
    s /= 100; l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c/2;
    let r1=0, g1=0, b1=0;
    if (0 <= h && h < 60) { r1 = c; g1 = x; b1 = 0; }
    else if (60 <= h && h < 120) { r1 = x; g1 = c; b1 = 0; }
    else if (120 <= h && h < 180) { r1 = 0; g1 = c; b1 = x; }
    else if (180 <= h && h < 240) { r1 = 0; g1 = x; b1 = c; }
    else if (240 <= h && h < 300) { r1 = x; g1 = 0; b1 = c; }
    else { r1 = c; g1 = 0; b1 = x; }
    const r = Math.round((r1 + m) * 255);
    const g = Math.round((g1 + m) * 255);
    const b = Math.round((b1 + m) * 255);
    return { r, g, b };
  }

  // Canvas network visual — subtle neon node connections
  const canvas = document.getElementById('networkCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  const nodes = [];
  const NUM_NODES = 46;
  for (let i = 0; i < NUM_NODES; i++) {
    nodes.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      r: 1.2 + Math.random() * 1.6
    });
  }

  // Scroll reactivity
  let scrollProgress = 0; // 0..1 across the page
  window.addEventListener('scroll', () => {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    scrollProgress = window.scrollY / max;
    // Parallax glow
    const glow = document.querySelector('.hero .glow');
    if (glow) {
      const y = Math.round(scrollProgress * 40); // px
      glow.style.transform = `translateY(${y}px)`;
    }
  }, { passive: true });

  // Section accent theming via IntersectionObserver
  const sections = document.querySelectorAll('section[data-accent]');
  const rootStyle = document.documentElement.style;
  const accentIO = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const [c1, c2] = (entry.target.getAttribute('data-accent') || '').split(',');
      if (c1 && c2) smoothSetAccent(c1.trim(), c2.trim(), 380);
    });
  }, { threshold: 0.5 });
  sections.forEach(s => accentIO.observe(s));

  function smoothSetAccent(a, b, ms) {
    const start = performance.now();
    const from1 = getComputedStyle(document.documentElement).getPropertyValue('--neon').trim();
    const from2 = getComputedStyle(document.documentElement).getPropertyValue('--neon-2').trim();
    const f1 = parseColor(from1), f2 = parseColor(from2);
    const t1 = parseColor(a), t2 = parseColor(b);
    function tick(now) {
      const t = Math.min(1, (now - start) / ms);
      const e = t*t*(3 - 2*t); // smoothstep
      const c1 = lerpColor(f1, t1, e);
      const c2 = lerpColor(f2, t2, e);
      rootStyle.setProperty('--neon', `rgb(${c1.r}, ${c1.g}, ${c1.b})`);
      rootStyle.setProperty('--neon-2', `rgb(${c2.r}, ${c2.g}, ${c2.b})`);
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  function parseColor(s) {
    const m = s.match(/#([0-9a-f]{6})/i);
    if (m) {
      const n = parseInt(m[1], 16);
      return { r: (n>>16)&255, g: (n>>8)&255, b: n&255 };
    }
    const m2 = s.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/i);
    if (m2) return { r: +m2[1], g: +m2[2], b: +m2[3] };
    return { r: 51, g: 255, b: 209 };
  }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function lerpColor(a, b, t) { return { r: Math.round(lerp(a.r, b.r, t)), g: Math.round(lerp(a.g, b.g, t)), b: Math.round(lerp(a.b, b.b, t)) }; }

  function step() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw connections (radius reacts to scroll)
    const baseRadius = 120;
    const connectRadius = baseRadius + scrollProgress * 60; // 120..180
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist2 = dx * dx + dy * dy;
        if (dist2 < connectRadius * connectRadius) {
          const alpha = 1 - Math.sqrt(dist2) / connectRadius;
          ctx.strokeStyle = `rgba(124,92,255,${alpha * 0.25})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
    // Draw nodes
    for (const n of nodes) {
      ctx.fillStyle = 'rgba(51,255,209,0.8)';
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
      // Motion
      const speedFactor = 0.8 + scrollProgress * 0.8; // 0.8..1.6
      n.x += n.vx * speedFactor; n.y += n.vy * speedFactor;
      if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
      if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
    }
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
})();



