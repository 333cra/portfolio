/* Script du portfolio.
   L'onde de la bannière et le menu plein écran sont repris de mon site pro.
   Le reste (carrousel, filtres, copie du mail, effet des tuiles) est propre au portfolio. */
(function () {
  "use strict";
  document.documentElement.classList.add("js");
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = matchMedia("(pointer: fine)").matches;

  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- Onde de la bannière (canvas), reprise de mon site pro ---------- */
  var cv = document.getElementById("wave");
  if (cv) {
    var ctx = cv.getContext("2d");
    var W = 0, H = 0, mx = 0.5, my = 0.5, tx = 0.5, ty = 0.5, running = false;
    var size = function () {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!running) draw(0);
    };
    var draw = function (t) {
      ctx.clearRect(0, 0, W, H);
      var g = ctx.createLinearGradient(0, 0, W, 0);
      g.addColorStop(0, "oklch(62% 0.16 250)");
      g.addColorStop(1, "oklch(68% 0.14 155)");
      var base = H * 0.36, amp = H * (0.07 + my * 0.08), lines = 7;
      for (var k = 0; k < lines; k++) {
        ctx.beginPath();
        ctx.lineWidth = k === 0 ? 2.2 : 1;
        ctx.globalAlpha = k === 0 ? 0.9 : 0.42 - k * 0.05;
        ctx.strokeStyle = g;
        for (var x = 0; x <= W; x += 6) {
          var u = x / W;
          var env = Math.sin(Math.PI * Math.min(1, u * 1.05)) * 0.8 + 0.2;
          var y = base
            + Math.sin(u * 6.2 + t * 0.0006 + k * 0.35 + (mx - 0.5) * 2) * amp * env
            + Math.sin(u * 13 - t * 0.0009 + k * 0.6) * amp * 0.18
            + k * 9;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };
    var loop = function (t) {
      if (!running) return;
      mx += (tx - mx) * 0.05; my += (ty - my) * 0.05;
      draw(t);
      requestAnimationFrame(loop);
    };
    size();
    if ("ResizeObserver" in window) new ResizeObserver(size).observe(cv);
    if (!reduce && "IntersectionObserver" in window) {
      new IntersectionObserver(function (e) {
        var vis = e[0].isIntersecting;
        if (vis && !running) { running = true; requestAnimationFrame(loop); }
        if (!vis) running = false;
      }).observe(cv);
      cv.parentElement.addEventListener("pointermove", function (e) {
        var r = cv.getBoundingClientRect();
        tx = (e.clientX - r.left) / r.width; ty = (e.clientY - r.top) / r.height;
      });
    }
  }

  /* ---------- Apparition des blocs au défilement ---------- */
  var rv = document.querySelectorAll(".rv");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    rv.forEach(function (el) { io.observe(el); });
  } else { rv.forEach(function (el) { el.classList.add("in"); }); }

  /* ---------- Boutons magnétiques (souris uniquement) ---------- */
  if (finePointer && !reduce) {
    document.querySelectorAll(".magnetic").forEach(function (b) {
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect();
        b.style.transform = "translate(" + (e.clientX - r.left - r.width / 2) * 0.18 + "px," + (e.clientY - r.top - r.height / 2) * 0.3 + "px)";
      });
      b.addEventListener("pointerleave", function () { b.style.transform = ""; });
    });
  }

  /* ---------- Menu plein écran, repris de mon site pro ---------- */
  var menu = document.getElementById("menu"), mOpen = document.getElementById("menu-open"), mClose = document.getElementById("menu-close");
  var setMenu = function (open) {
    menu.classList.toggle("open", open);
    mOpen.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.classList.toggle("locked", open);
    if (open) setTimeout(function () { mClose.focus(); }, 50); else mOpen.focus();
  };
  if (menu && mOpen && mClose) {
    mOpen.addEventListener("click", function () { setMenu(true); });
    mClose.addEventListener("click", function () { setMenu(false); });
    menu.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setMenu(false);
      if (e.key === "Tab") {
        var f = menu.querySelectorAll("a, button"), first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { if (menu.classList.contains("open")) setMenu(false); });
    });
  }

  /* ---------- Tuiles des compétences : halo qui suit la souris ---------- */
  if (finePointer) {
    document.querySelectorAll(".pf-tile").forEach(function (t) {
      t.addEventListener("pointermove", function (e) {
        var r = t.getBoundingClientRect();
        t.style.setProperty("--mx", (e.clientX - r.left) + "px");
        t.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
    });
  }

  /* ---------- Carrousel des réalisations ---------- */
  var rail = document.querySelector(".pf-rail");
  var prev = document.querySelector("[data-rail-prev]"), next = document.querySelector("[data-rail-next]");
  if (rail && prev && next) {
    var step = function () { var c = rail.querySelector(".pf-shot"); return c ? c.getBoundingClientRect().width + 16 : 300; };
    var update = function () {
      prev.disabled = rail.scrollLeft <= 4;
      next.disabled = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 4;
    };
    prev.addEventListener("click", function () { rail.scrollBy({ left: -step(), behavior: reduce ? "auto" : "smooth" }); });
    next.addEventListener("click", function () { rail.scrollBy({ left: step(), behavior: reduce ? "auto" : "smooth" }); });
    rail.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ---------- Filtres de la page réalisations ---------- */
  var filters = document.querySelectorAll(".pf-filter");
  if (filters.length) {
    var cards = document.querySelectorAll(".pf-card[data-cat]");
    filters.forEach(function (b) {
      b.addEventListener("click", function () {
        var cat = b.getAttribute("data-filter");
        filters.forEach(function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); });
        cards.forEach(function (c) { c.hidden = cat !== "tout" && c.getAttribute("data-cat") !== cat; });
      });
    });
  }

  /* ---------- Copier l'adresse mail ---------- */
  document.querySelectorAll("[data-copy]").forEach(function (b) {
    b.addEventListener("click", function (e) {
      e.preventDefault(); e.stopPropagation();
      var txt = b.getAttribute("data-copy");
      var done = function () { var old = b.textContent; b.textContent = "Copié !"; setTimeout(function () { b.textContent = old; }, 1600); };
      if (navigator.clipboard) navigator.clipboard.writeText(txt).then(done, function () {});
    });
  });
})();
