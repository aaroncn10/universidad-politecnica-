(function () {
  "use strict";

  var data = window.__BRAND__ || {};

  var $ = function (sel, scope) { return (scope || document).querySelector(sel); };
  var $$ = function (sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); };
  var escHTML = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };

  function safe(fn, name) {
    try { fn(); } catch (e) { if (window.console) console.warn("[" + name + "] failed:", e); }
  }

  /* ---------- Splash (JS side of the double safety net) ---------- */
  function initSplash() {
    var splash = $("#splash");
    if (!splash) return;
    var hide = function () { splash.classList.add("is-hidden"); };
    if (document.readyState === "complete") {
      setTimeout(hide, 900);
    } else {
      window.addEventListener("load", function () { setTimeout(hide, 700); });
    }
    setTimeout(hide, 3000); // JS safety net (CSS has its own at 3.2s)
  }

  /* ---------- Nav: solidify + mobile menu ---------- */
  function initNav() {
    var nav = $("#nav");
    if (!nav) return;
    var onScroll = function () {
      nav.classList.toggle("is-solid", window.scrollY > 40);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    var burger = $("#navBurger");
    if (burger) {
      burger.addEventListener("click", function () {
        var open = nav.classList.toggle("menu-open");
        burger.setAttribute("aria-expanded", open ? "true" : "false");
      });
      $$(".nav-links a", nav).forEach(function (a) {
        a.addEventListener("click", function () {
          nav.classList.remove("menu-open");
          burger.setAttribute("aria-expanded", "false");
        });
      });
    }
  }

  /* ---------- Team mount (idempotent) ---------- */
  function mountTeam() {
    var target = $("[data-team]");
    if (!target || target.children.length > 0 || !data.team) return;
    target.innerHTML = data.team.map(function (m) {
      var initials = m.name.split(" ").map(function (p) { return p.charAt(0); }).slice(0, 2).join("");
      return (
        '<article class="member reveal">' +
          '<div class="member-avatar" style="background: radial-gradient(circle at 30% 30%, hsl(' + (m.hue || 20) + ' 45% 26%), #1E1813)">' + escHTML(initials) + "</div>" +
          "<h3>" + escHTML(m.name) + "</h3>" +
          "<p>" + escHTML(m.role) + "</p>" +
        "</article>"
      );
    }).join("");
  }

  /* ---------- Reveals: IntersectionObserver + safety timeout ---------- */
  function initReveals() {
    var items = $$(".reveal");
    if (!items.length) return;

    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05, rootMargin: "0px 0px -6% 0px" });

    items.forEach(function (el) { io.observe(el); });

    // 6s safety: reveal anything still hidden
    setTimeout(function () {
      $$(".reveal:not(.is-in)").forEach(function (el) { el.classList.add("is-in"); });
    }, 6000);
  }

  /* ---------- Count-up numbers ---------- */
  function initCounters() {
    var els = $$("[data-count-to]");
    if (!els.length) return;

    var fmt = function (n) {
      return n >= 1000 ? n.toLocaleString("es-PE") : String(n);
    };

    var animate = function (el) {
      var to = parseInt(el.getAttribute("data-count-to"), 10) || 0;
      var t0 = null;
      var dur = 1600;
      var step = function (ts) {
        if (!t0) t0 = ts;
        var p = Math.min((ts - t0) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(Math.round(to * eased)) + (to >= 1000 ? "+" : "");
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.textContent = fmt(parseInt(el.getAttribute("data-count-to"), 10) || 0); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animate(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05 });

    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Tilt 3D (max 7deg) with radial halo ---------- */
  function initTilt() {
    if (window.matchMedia("(hover: none)").matches) return; // touch devices skip
    var MAX = 7;
    $$("[data-tilt]").forEach(function (card) {
      var raf = null;
      card.addEventListener("mousemove", function (e) {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = null;
          var r = card.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width;
          var py = (e.clientY - r.top) / r.height;
          var rx = (0.5 - py) * MAX;
          var ry = (px - 0.5) * MAX;
          card.style.transform = "perspective(900px) rotateX(" + rx.toFixed(2) + "deg) rotateY(" + ry.toFixed(2) + "deg) translateY(-4px)";
        });
      });
      card.addEventListener("mouseleave", function () {
        card.style.transform = "";
      });
    });
  }

  /* ---------- Pelazón: pinned horizontal showcase (vanilla) ---------- */
  function initShowcase() {
    var section = $("#showcase");
    var track = $("#showcaseTrack");
    if (!section || !track) return;

    var setHeight = function () {
      var overflow = track.scrollWidth - window.innerWidth;
      if (overflow <= 0) {
        section.style.height = "auto";
        track.style.transform = "";
        return;
      }
      section.style.height = (window.innerHeight + overflow) + "px";
    };

    var onScroll = function () {
      var overflow = track.scrollWidth - window.innerWidth;
      if (overflow <= 0) { track.style.transform = ""; return; }
      var rect = section.getBoundingClientRect();
      var total = section.offsetHeight - window.innerHeight;
      if (total <= 0) return;
      var progress = Math.min(Math.max(-rect.top / total, 0), 1);
      track.style.transform = "translateX(" + (-overflow * progress).toFixed(1) + "px)";
    };

    setHeight();
    onScroll();
    window.addEventListener("resize", function () { setHeight(); onScroll(); });
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Smooth anchors (native) ---------- */
  function initAnchors() {
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href");
        if (id.length < 2) return;
        var target = $(id);
        if (!target) return;
        e.preventDefault();
        var top = target.getBoundingClientRect().top + window.scrollY - 76;
        window.scrollTo({ top: top, behavior: "smooth" });
      });
    });
  }

  function boot() {
    safe(mountTeam, "mountTeam");
    safe(initSplash, "initSplash");
    safe(initNav, "initNav");
    safe(initReveals, "initReveals");
    safe(initCounters, "initCounters");
    safe(initTilt, "initTilt");
    safe(initShowcase, "initShowcase");
    safe(initAnchors, "initAnchors");
    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
