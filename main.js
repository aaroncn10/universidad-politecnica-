(function () {
  /* chatPyme — main.js (IIFE, sin dependencias externas) */
  "use strict";

  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn("[" + name + "]", e); }
  }

  /* ---------- Nav móvil ---------- */
  function initNav() {
    var nav = document.querySelector(".nav");
    var toggle = document.querySelector(".nav-toggle");
    if (!nav || !toggle) return;
    toggle.addEventListener("click", function () {
      nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", nav.classList.contains("is-open") ? "true" : "false");
    });
    nav.querySelectorAll(".nav-links a").forEach(function (a) {
      a.addEventListener("click", function () { nav.classList.remove("is-open"); });
    });
  }

  /* ---------- Scroll suave para anclas ---------- */
  function initSmoothAnchors() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href");
      if (!id || id === "#") return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY - 90,
        behavior: reduced ? "auto" : "smooth"
      });
    });
  }

  /* ---------- Reveals ---------- */
  function initReveals() {
    var targets = document.querySelectorAll(".reveal, [data-reveal]");
    if (!targets.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("is-revealed");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.01, rootMargin: "0px 0px -2% 0px" });
    targets.forEach(function (el) { io.observe(el); });

    /* Red de seguridad: a los 6s, revelar lo que quede visible */
    setTimeout(function () {
      document.querySelectorAll(".reveal:not(.is-revealed), [data-reveal]:not(.is-revealed)").forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight) {
          el.classList.add("is-revealed");
        }
      });
    }, 6000);
  }

  /* ---------- Count-up ---------- */
  function initCountUp() {
    var els = document.querySelectorAll("[data-count]");
    if (!els.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        animateCount(en.target);
      });
    }, { threshold: 0.1 });
    els.forEach(function (el) { io.observe(el); });

    function animateCount(el) {
      if (el.dataset.counted) return;
      el.dataset.counted = "1";
      var to = parseFloat(el.dataset.count);
      var decimals = (el.dataset.count.split(".")[1] || "").length;
      var dur = 1600;
      var t0 = null;
      function frame(t) {
        if (!t0) t0 = t;
        var p = Math.min((t - t0) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = (to * eased).toFixed(decimals);
        if (p < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }
  }

  /* ---------- Demo de chat animada (loop) ---------- */
  function initChatDemo() {
    var body = document.querySelector("[data-chat-body]");
    if (!body) return;

    var script = [
      { who: "user", text: "Hola, ¿tienen disponible la torta de chocolate para mañana?" },
      { who: "bot",  text: "¡Hola! 😊 Sí, tenemos disponibilidad para mañana. ¿Para cuántas personas la necesitas?" },
      { who: "user", text: "Para 15 personas" },
      { who: "bot",  text: "Perfecto. La torta para 15 personas cuesta $45. ¿Confirmo tu pedido para mañana?" },
      { who: "user", text: "Sí, confírmalo 🙌" },
      { who: "bot",  text: "¡Pedido confirmado! Te envío el enlace para asegurar tu reserva:", pay: "💳 Pagar $45 ahora" },
      { who: "bot",  text: "✅ Pago recibido. Mañana a las 10:00 estará lista. ¡Gracias por tu compra!" }
    ];

    var idx = 0;
    var typing = null;

    function el(tag, cls, html) {
      var n = document.createElement(tag);
      if (cls) n.className = cls;
      if (html) n.innerHTML = html;
      return n;
    }

    function showTyping() {
      typing = el("div", "msg-typing");
      typing.appendChild(el("i"));
      typing.appendChild(el("i"));
      typing.appendChild(el("i"));
      body.appendChild(typing);
      body.scrollTop = body.scrollHeight;
    }

    function hideTyping() {
      if (typing && typing.parentNode) typing.parentNode.removeChild(typing);
      typing = null;
    }

    function next() {
      if (idx >= script.length) {
        setTimeout(function () {
          body.innerHTML = "";
          idx = 0;
          setTimeout(next, 700);
        }, 4200);
        return;
      }
      var m = script[idx++];
      var delayTyping = m.who === "bot" ? 900 : 400;

      if (m.who === "bot") showTyping();

      setTimeout(function () {
        hideTyping();
        var cls = "msg " + (m.who === "bot" ? "msg-bot" : "msg-user") + (m.pay ? " msg-pay" : "");
        var html = m.text + (m.pay ? '<br><span class="pay-chip">' + m.pay + "</span>" : "");
        var node = el("div", cls, html);
        body.appendChild(node);
        body.scrollTop = body.scrollHeight;
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { node.classList.add("is-in"); });
        });
        setTimeout(next, m.who === "bot" ? 1400 : 900);
      }, delayTyping);
    }

    next();
  }

  /* ---------- Donut chart ---------- */
  function initDonuts() {
    var donuts = document.querySelectorAll("[data-donut]");
    if (!donuts.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        var svg = en.target;
        var circle = svg.querySelector("circle.value");
        var pct = parseFloat(svg.dataset.donut) || 0;
        var r = parseFloat(circle.getAttribute("r"));
        var circ = 2 * Math.PI * r;
        circle.style.strokeDasharray = (circ * pct / 100) + " " + circ;
      });
    }, { threshold: 0.1 });
    donuts.forEach(function (d) { io.observe(d); });
  }

  /* ---------- Barras de progreso ---------- */
  function initProgress() {
    var fills = document.querySelectorAll("[data-fill]");
    if (!fills.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        en.target.style.width = en.target.dataset.fill + "%";
      });
    }, { threshold: 0.1 });
    fills.forEach(function (f) { io.observe(f); });
  }

  /* ---------- Formulario de leads ---------- */
  function initLeadForm() {
    var wrap = document.querySelector(".lead-form");
    var form = wrap && wrap.querySelector("form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      if (!form.reportValidity()) { e.preventDefault(); return; }
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = "Enviando…"; }

      var data = new FormData(form);
      var endpoint = form.getAttribute("action");

      function done() {
        wrap.classList.add("is-sent");
        var ok = wrap.querySelector(".form-success");
        if (ok) ok.classList.add("is-on");
      }

      if (endpoint && window.fetch) {
        fetch(endpoint, {
          method: "POST",
          body: data,
          headers: { "Accept": "application/json" }
        }).then(done).catch(done);
      } else {
        setTimeout(done, 800);
      }
    });
  }

  /* ---------- Boot ---------- */
  function boot() {
    safe(initNav, "initNav");
    safe(initSmoothAnchors, "initSmoothAnchors");
    safe(initReveals, "initReveals");
    safe(initCountUp, "initCountUp");
    safe(initChatDemo, "initChatDemo");
    safe(initDonuts, "initDonuts");
    safe(initProgress, "initProgress");
    safe(initLeadForm, "initLeadForm");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
