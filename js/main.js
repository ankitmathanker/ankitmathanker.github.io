/**
 * ankitmathanker.github.io — main script
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
  const PHOTO_PATHS = ["img/photo-real.png", "img/photo-ghibli.png"];

  function basename(path) {
    if (!path) return "";
    var parts = path.split("/");
    return parts[parts.length - 1] || "";
  }

  // ---------------------------------------------------------------------------
  // Profile photo toggle
  // ---------------------------------------------------------------------------
  function initPhotoToggle() {
    var profilePhoto = document.getElementById("profile-photo");
    var photoToggle = document.getElementById("photo-toggle");
    if (!profilePhoto || !photoToggle) return;

    function currentIndexFromImg() {
      var pathname = "";
      try {
        pathname = new URL(profilePhoto.src || "", window.location.href).pathname;
      } catch (_) {
        pathname = "";
      }
      var currentFile = basename(pathname);
      var i;
      for (i = 0; i < PHOTO_PATHS.length; i++) {
        if (basename(PHOTO_PATHS[i]) === currentFile) return i;
      }
      return 0;
    }

    var index = currentIndexFromImg();

    function applyPhoto() {
      profilePhoto.setAttribute("src", PHOTO_PATHS[index]);
    }

    photoToggle.addEventListener(
      "click",
      function (e) {
        e.preventDefault();
        e.stopPropagation();
        index = (index + 1) % PHOTO_PATHS.length;
        applyPhoto();
      },
      false
    );
  }

  // ---------------------------------------------------------------------------
  // Footer year
  // ---------------------------------------------------------------------------
  function initYear() {
    var yearEl = document.getElementById("year");
    if (yearEl) {
      yearEl.textContent = String(new Date().getFullYear());
    }
  }

  function initAll() {
    initYear();
    initPhotoToggle();
    initMobileNav();
    initSmoothScroll();
  }

  // ---------------------------------------------------------------------------
  // Mobile navigation
  // ---------------------------------------------------------------------------
  var nav = document.querySelector(".nav");

  var navToggle = document.getElementById("nav-toggle");
  var navMenu = document.getElementById("nav-menu");

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

    navMenu.querySelectorAll("a").forEach(function (link) {
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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
