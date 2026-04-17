/**
 * ankitmathanker.github.io — main script
 * - Canvas particle network background
 * - Profile photo toggle (paths editable below)
 * - Mobile navigation
 * - Smooth in-page navigation with sticky header offset (CSS scroll-margin)
 * - Footer year
 */

(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // Config — edit photo filenames here if you change assets
  // ---------------------------------------------------------------------------
  const PHOTO_PATHS = ["img/photo-real.jpg", "img/photo-ghibli.jpg"];

  // Particle network tuning (performance-friendly defaults)
  const PARTICLE_COUNT_BASE = 55;
  const CONNECTION_DIST = 120;
  const LINE_OPACITY = 0.12;
  const NODE_DRIFT = 0.35;

  // ---------------------------------------------------------------------------
  // Footer year
  // ---------------------------------------------------------------------------
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  // ---------------------------------------------------------------------------
  // Profile photo toggle
  // ---------------------------------------------------------------------------
  const profilePhoto = document.getElementById("profile-photo");
  const photoToggle = document.getElementById("photo-toggle");

  function initPhotoToggle() {
    if (!profilePhoto || !photoToggle) return;

    let index = 0;

    function applyPhoto() {
      profilePhoto.src = PHOTO_PATHS[index];
    }

    // Ensure starting index matches current src if you hand-edit HTML
    const initial = PHOTO_PATHS.indexOf(
      profilePhoto.getAttribute("src") || PHOTO_PATHS[0]
    );
    if (initial >= 0) index = initial;

    photoToggle.addEventListener("click", function () {
      index = (index + 1) % PHOTO_PATHS.length;
      applyPhoto();
    });
  }

  initPhotoToggle();

  // ---------------------------------------------------------------------------
  // Mobile navigation
  // ---------------------------------------------------------------------------
  const nav = document.querySelector(".nav");
  const navToggle = document.getElementById("nav-toggle");
  const navMenu = document.getElementById("nav-menu");

  function setNavOpen(open) {
    if (!nav || !navToggle) return;
    nav.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.style.overflow = open ? "hidden" : "";
  }

  function initMobileNav() {
    if (!navToggle || !navMenu) return;

    navToggle.addEventListener("click", function () {
      setNavOpen(!nav.classList.contains("is-open"));
    });

    navMenu.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener("click", function () {
        if (window.matchMedia("(max-width: 768px)").matches) {
          setNavOpen(false);
        }
      });
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 768) setNavOpen(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setNavOpen(false);
    });
  }

  initMobileNav();

  // ---------------------------------------------------------------------------
  // Smooth scroll: enhance anchor clicks (header offset handled via CSS)
  // ---------------------------------------------------------------------------
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      const id = anchor.getAttribute("href");
      if (!id || id === "#") return;

      anchor.addEventListener("click", function (e) {
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  initSmoothScroll();

  // ---------------------------------------------------------------------------
  // Canvas particle network
  // ---------------------------------------------------------------------------
  function initParticles() {
    const canvas = document.getElementById("particle-canvas");
    if (!canvas || !canvas.getContext) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    /** @type {{ x: number; y: number; vx: number; vy: number }[]} */
    let nodes = [];
    let width = 0;
    let height = 0;
    let reducedMotion = false;

    try {
      reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (_) {
      reducedMotion = false;
    }

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const area = width * height;
      const count = Math.min(
        120,
        Math.max(25, Math.floor((area / (1920 * 1080)) * PARTICLE_COUNT_BASE))
      );

      nodes = [];
      for (let i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * NODE_DRIFT,
          vy: (Math.random() - 0.5) * NODE_DRIFT,
        });
      }
    }

    function step() {
      if (reducedMotion) return;

      ctx.clearRect(0, 0, width, height);

      const teal = "45, 212, 191";
      const blue = "56, 189, 248";
      const purple = "167, 139, 250";

      // Integrate positions with soft bounce at edges
      for (let i = 0; i < nodes.length; i++) {
        const p = nodes[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
        p.x = Math.max(0, Math.min(width, p.x));
        p.y = Math.max(0, Math.min(height, p.y));
      }

      // Edges between nearby nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < CONNECTION_DIST) {
            const t = 1 - dist / CONNECTION_DIST;
            const colorMix =
              (i + j) % 3 === 0 ? teal : (i + j) % 3 === 1 ? blue : purple;
            ctx.strokeStyle = `rgba(${colorMix}, ${t * LINE_OPACITY})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Nodes
      for (let i = 0; i < nodes.length; i++) {
        const p = nodes[i];
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 3.2);
        g.addColorStop(0, "rgba(45, 212, 191, 0.55)");
        g.addColorStop(0.5, "rgba(56, 189, 248, 0.25)");
        g.addColorStop(1, "rgba(167, 139, 250, 0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      requestAnimationFrame(step);
    }

    window.addEventListener("resize", function () {
      resize();
    });

    resize();

    if (reducedMotion) {
      // Single static frame: faint grid of dots only
      ctx.fillStyle = "rgba(148, 163, 184, 0.06)";
      for (let x = 0; x < width; x += 48) {
        for (let y = 0; y < height; y += 48) {
          ctx.fillRect(x, y, 1, 1);
        }
      }
      return;
    }

    requestAnimationFrame(step);
  }

  initParticles();
})();
