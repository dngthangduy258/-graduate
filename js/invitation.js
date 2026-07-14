const $ = id => document.getElementById(id);
const rnd = (min, max) => Math.random() * (max - min) + min;

/* ═══════════════════════════════════════════════════════════════
   URL PARAMS
   ═══════════════════════════════════════════════════════════════ */
function initUrlParams() {
  const p = new URLSearchParams(window.location.search);
  let n = p.get('guest') || p.get('n');
  if (n) {
    // Auto-format slug strings (e.g. "duong-thanh-duy" -> "Duong Thanh Duy")
    if (n.includes('-')) {
      n = n.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
    
    const e = $("guest-name");
    if (e) e.textContent = n;
    
    const envGuest = $("env-guest");
    if (envGuest) envGuest.textContent = "Dành riêng cho " + n;
    
    const rName = $("r-name");
    if (rName) rName.value = n;
  }
}

/* ═══════════════════════════════════════════════════════════════
   PRELOADER
   ═══════════════════════════════════════════════════════════════ */
function initPreloader() {
  window.addEventListener("load", () => {
    setTimeout(() => {
      $("loader")?.classList.add("out");
      setTimeout(() => {
        const card = $("env-card");
        if (card) {
          card.style.transform = "rotateX(5deg) rotateY(-5deg)";
          setTimeout(() => card.style.transform = "rotateX(0) rotateY(0)", 800);
        }
      }, 1000);
    }, 1200);
  });
}

/* ═══════════════════════════════════════════════════════════════
   ENVELOPE
   ═══════════════════════════════════════════════════════════════ */
function initEnvelope() {
  const screen = $("env-screen"), main = $("main"), card = $("env-card");
  if (!card) return;
  card.addEventListener("click", () => {
    card.classList.add("opening");
    setTimeout(() => {
      screen?.classList.add("gone");
      main?.classList.add("show");
      fireConfetti();
    }, 900);
  });

  const box = $("env-screen");
  if (box && card) {
    box.addEventListener("mousemove", e => {
      if (card.classList.contains("opening")) return;
      const r = card.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = (e.clientX - cx) / (r.width / 2);
      const dy = (e.clientY - cy) / (r.height / 2);
      card.style.transform = `rotateX(${-dy * 8}deg) rotateY(${dx * 8}deg)`;
    });
    box.addEventListener("mouseleave", () => {
      if (!card.classList.contains("opening")) card.style.transform = "rotateX(0) rotateY(0)";
    });
  }
}

/* ═══════════════════════════════════════════════════════════════
   AUDIO
   ═══════════════════════════════════════════════════════════════ */
function initAudio() {
  const bgm = $("bg-music"), btn = $("btn-music");
  if (!bgm || !btn) return;
  let isPlaying = false;

  const toggle = () => {
    if (isPlaying) { bgm.pause(); btn.classList.add("off"); }
    else { bgm.play().catch(() => {}); btn.classList.remove("off"); }
    isPlaying = !isPlaying;
  };

  btn.addEventListener("click", toggle);
  $("env-card")?.addEventListener("click", () => {
    if (!isPlaying) {
      bgm.play().then(() => { isPlaying = true; btn.classList.remove("off"); }).catch(() => {});
    }
  });
}

/* ═══════════════════════════════════════════════════════════════
   FLIPBOOK — Pure 3D, No Opacity Pop
   ═══════════════════════════════════════════════════════════════ */
function initFlipbook() {
  const pages = document.querySelectorAll('.page');
  const leftPanel = $('left-panel');
  const rightPanel = $('right-panel');
  const prevTitle = $('sp-prev-title');
  const nextTitle = $('sp-next-title');
  const pageEdges = $('page-edges');

  if (!pages.length) return;

  let curr = 1;
  const total = pages.length;
  let isAnimating = false;

  const updateSidePanels = () => {
    if (curr > 1) {
      const prevPage = document.querySelector(`.page[data-page="${curr - 1}"]`);
      if (prevTitle) prevTitle.textContent = prevPage?.getAttribute('data-title') || '';
      leftPanel?.classList.remove('hidden');
    } else {
      leftPanel?.classList.add('hidden');
    }

    if (curr < total) {
      const nextPage = document.querySelector(`.page[data-page="${curr + 1}"]`);
      if (nextTitle) nextTitle.textContent = nextPage?.getAttribute('data-title') || '';
      rightPanel?.classList.remove('hidden');
    } else {
      rightPanel?.classList.add('hidden');
    }

    if (pageEdges) {
      const edgeDivs = pageEdges.querySelectorAll('.pe');
      const remaining = total - curr;
      edgeDivs.forEach((e, i) => {
        e.style.display = (i < remaining) ? 'block' : 'none';
      });
    }
  };

  /*
   * Z-index strategy for realistic book flip:
   *
   * In a real book, when you flip a page forward:
   * - The page lifting up (old current) must be ABOVE everything during the flip
   * - After it lands on the left (past), it goes below
   *
   * When you flip backward:
   * - The page returning (from past) must be ABOVE everything during the flip
   * - After it lands on the right (current), it stays on top
   */

  const applyPageStates = (direction) => {
    isAnimating = true;

    pages.forEach(p => {
      const pIdx = parseInt(p.getAttribute('data-page'));
      p.classList.remove('current', 'past', 'future', 'flipping');

      if (pIdx === curr) {
        // New current page
        p.classList.add('current');
        p.style.zIndex = 100;
      } else if (pIdx < curr) {
        p.classList.add('past');
        // The page we just flipped away (forward navigation) — keep high z during animation
        if (direction === 'forward' && pIdx === curr - 1) {
          p.classList.add('flipping');
          p.style.zIndex = 200;
        } else {
          p.style.zIndex = pIdx;
        }
      } else {
        // Future pages stacked in reverse order underneath current
        p.classList.add('future');
        p.style.zIndex = total - pIdx;
      }
    });

    // Reset scroll position of new current page
    const currEl = document.querySelector('.page.current');
    if (currEl) currEl.scrollTop = 0;

    updateSidePanels();

    // After animation completes, clean up z-index and flipping class
    setTimeout(() => {
      pages.forEach(p => {
        p.classList.remove('flipping');
        const pIdx = parseInt(p.getAttribute('data-page'));
        if (pIdx < curr) p.style.zIndex = pIdx;
      });
      isAnimating = false;
    }, 1150);
  };

  const goNext = () => {
    if (curr >= total || isAnimating) return;
    curr++;
    applyPageStates('forward');
  };

  const goPrev = () => {
    if (curr <= 1 || isAnimating) return;
    curr--;
    applyPageStates('backward');
  };

  // Side panel clicks
  leftPanel?.addEventListener('click', goPrev);
  rightPanel?.addEventListener('click', goNext);

  // Keyboard
  window.addEventListener('keydown', (e) => {
    if (!$('main')?.classList.contains('show')) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); goNext(); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); goPrev(); }
  });

  // Mouse Wheel (with cooldown & scroll boundary detection)
  let wheelCooldown = false;
  window.addEventListener('wheel', (e) => {
    if (!$('main')?.classList.contains('show') || isAnimating || wheelCooldown) return;

    const currPageEl = document.querySelector('.page.current');
    if (currPageEl) {
      const isScrollable = currPageEl.scrollHeight > currPageEl.clientHeight + 4;
      if (isScrollable) {
        const isAtBottom = Math.ceil(currPageEl.scrollTop + currPageEl.clientHeight) >= currPageEl.scrollHeight - 6;
        const isAtTop = currPageEl.scrollTop <= 6;
        if (e.deltaY > 0 && !isAtBottom) return;
        if (e.deltaY < 0 && !isAtTop) return;
      }
    }

    wheelCooldown = true;
    setTimeout(() => { wheelCooldown = false; }, 800);

    if (e.deltaY > 0) goNext();
    else if (e.deltaY < 0) goPrev();
  }, { passive: true });

  // Touch Swipe
  let touchStartX = 0, touchStartY = 0;
  window.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });

  window.addEventListener('touchend', (e) => {
    if (!$('main')?.classList.contains('show') || isAnimating) return;
    const dx = touchStartX - e.changedTouches[0].screenX;
    const dy = touchStartY - e.changedTouches[0].screenY;

    if (Math.abs(dx) > Math.abs(dy) + 20) {
      if (dx > 50) goNext();
      if (dx < -50) goPrev();
    } else {
      const currPageEl = document.querySelector('.page.current');
      if (currPageEl) {
        const isScrollable = currPageEl.scrollHeight > currPageEl.clientHeight + 4;
        if (isScrollable) {
          const isAtBottom = Math.ceil(currPageEl.scrollTop + currPageEl.clientHeight) >= currPageEl.scrollHeight - 6;
          const isAtTop = currPageEl.scrollTop <= 6;
          if (dy > 0 && !isAtBottom) return;
          if (dy < 0 && !isAtTop) return;
        }
      }
      if (dy > 60) goNext();
      if (dy < -60) goPrev();
    }
  }, { passive: true });

  // Initial state
  applyPageStates('none');
}

/* ═══════════════════════════════════════════════════════════════
   COUNTDOWN
   ═══════════════════════════════════════════════════════════════ */
function initCountdown() {
  const tg = new Date("2026-08-15T08:00:00").getTime();
  const els = { d: $("cd-d"), h: $("cd-h"), m: $("cd-m"), s: $("cd-s") };
  if (!els.d) return;

  const pad = (el, val) => {
    const s = val < 10 ? "0" + val : "" + val;
    if (el.textContent !== s) el.textContent = s;
  };

  const tick = () => {
    const diff = tg - Date.now();
    if (diff <= 0) return;
    pad(els.d, Math.floor(diff / 86400000));
    pad(els.h, Math.floor((diff / 3600000) % 24));
    pad(els.m, Math.floor((diff / 60000) % 60));
    pad(els.s, Math.floor((diff / 1000) % 60));
  };

  tick();
  setInterval(tick, 1000);
}

/* ═══════════════════════════════════════════════════════════════
   RSVP & TOAST & FACTS
   ═══════════════════════════════════════════════════════════════ */
function initRSVP() {
  const form = $("rsvp-form"), ok = $("rsvp-ok");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const nm = $("r-name")?.value.trim();
    if (!nm) { alert("Vui lòng nhập tên của bạn nhé!"); return; }
    form.style.display = "none";
    ok.classList.add("show");
  });
}

function initActions() {
  const toast = $("toast");
  const showToast = (msg) => {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3000);
  };
  $("btn-save")?.addEventListener("click", () => showToast("Đã lưu sự kiện vào lịch!"));
  $("btn-copy")?.addEventListener("click", () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      showToast("Đã sao chép liên kết thiệp!");
    }).catch(() => {});
  });
}

function initFacts() {
  const modal = $("fact-modal"), q = $("fact-q"), a = $("fact-a"), close = $("fact-close");
  if (!modal) return;
  const facts = {
    major: { q: "Tâm lý học", a: "Ngành học tìm hiểu về tâm trí và hành vi con người. 4 năm học giúp mình thấu hiểu bản thân và trân trọng mọi cảm xúc." },
    class: { q: "Niên khoá 2022-2026", a: "Hành trình thanh xuân tuyệt vời nhất với bao kỷ niệm tại mái trường Đại học Sài Gòn." },
    gpa: { q: "Tốt nghiệp loại Giỏi", a: "Thành quả nhỏ bé sau những nỗ lực không ngừng nghỉ, là món quà tri ân gửi đến gia đình và thầy cô." }
  };
  document.querySelectorAll(".chip[data-fact]").forEach(c => {
    c.addEventListener("click", () => {
      const id = c.getAttribute("data-fact");
      if (facts[id]) {
        q.textContent = facts[id].q;
        a.textContent = facts[id].a;
        modal.classList.add("show");
      }
    });
  });
  close?.addEventListener("click", () => modal.classList.remove("show"));
  modal.addEventListener("click", e => { if (e.target === modal) modal.classList.remove("show"); });
}

/* ═══════════════════════════════════════════════════════════════
   CONFETTI
   ═══════════════════════════════════════════════════════════════ */
let cCtx = null, cW = 0, cH = 0, conf = [];
function initConfettiSystem() {
  const cv = $("cx-conf"); if (!cv) return;
  cCtx = cv.getContext("2d");
  const resize = () => { cW = cv.width = innerWidth; cH = cv.height = innerHeight; };
  resize(); window.addEventListener("resize", resize, { passive: true });
}
function fireConfetti() {
  if (!cCtx) initConfettiSystem(); if (!cCtx) return;
  const cv = $("cx-conf"); if (cv) cv.style.display = "block";
  const PAL = ["#C5A059", "#8B6914", "#E4D9C5", "#2C1810"];
  const batch = Array.from({ length: 70 }, () => {
    const ang = rnd(-Math.PI * .8, -Math.PI * .2); const spd = rnd(12, 26);
    return {
      x: rnd(cW * .3, cW * .7), y: cH * .7,
      vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
      w: rnd(5, 10), h: rnd(3, 5), rot: rnd(0, Math.PI * 2), rotV: rnd(-.15, .15),
      c: PAL[Math.floor(Math.random() * PAL.length)]
    };
  });
  conf.push(...batch);

  const draw = () => {
    cCtx.clearRect(0, 0, cW, cH);
    let active = false;
    conf.forEach(p => {
      p.vy += .35; p.x += p.vx; p.y += p.vy; p.rot += p.rotV;
      if (p.y < cH + 20) active = true;
      cCtx.save(); cCtx.translate(p.x, p.y); cCtx.rotate(p.rot);
      cCtx.fillStyle = p.c; cCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      cCtx.restore();
    });
    if (active) requestAnimationFrame(draw);
    else { cCtx.clearRect(0, 0, cW, cH); if (cv) cv.style.display = "none"; conf = []; }
  };
  draw();
}

/* ═══════════════════════════════════════════════════════════════
   DUST WIPE EFFECT (Scratch Card over Guest Name)
   ═══════════════════════════════════════════════════════════════ */
function initDustEffect() {
  const canvas = $('dust-canvas');
  const hint = $('dust-hint');
  const targetWrap = document.querySelector('.grad-nm-wrap');
  if (!canvas || !targetWrap) return;

  const ctx = canvas.getContext('2d');
  let isActive = false;
  let totalArea = 0;
  let wipedArea = 0;
  const BRUSH = 15;
  let hintRemoved = false;

  const drawDust = () => {
    const rect = targetWrap.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    totalArea = canvas.width * canvas.height;

    // Base foil/dust layer — warm brownish gold
    ctx.fillStyle = '#D4AF37'; // Gold base
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add noise texture for scratch card feel
    for (let i = 0; i < 500; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const w = Math.random() * 2;
      const bright = Math.random() > 0.5;
      ctx.fillStyle = bright ? 'rgba(255, 255, 255, 0.4)' : 'rgba(139, 105, 20, 0.4)';
      ctx.fillRect(x, y, w, w);
    }
    
    // Add a shiny glare
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(0.3, 'rgba(255,255,255,0.4)');
    grad.addColorStop(0.7, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    isActive = true;
  };

  const wipe = (x, y) => {
    if (!isActive) return;

    ctx.globalCompositeOperation = 'destination-out';

    // Harder edge for scratch card
    ctx.beginPath();
    ctx.arc(x, y, BRUSH, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,1)';
    ctx.fill();

    ctx.globalCompositeOperation = 'source-over';

    // Estimate wiped area (accounts for overlap)
    wipedArea += Math.PI * BRUSH * BRUSH * 0.25;

    if (wipedArea > totalArea * 0.55) {
      autoClear();
    }
  };

  const autoClear = () => {
    isActive = false;
    canvas.classList.add('cleared');
    if (hint) hint.classList.add('hidden');
    setTimeout(() => {
      canvas.remove();
      hint?.remove();
    }, 800);
  };

  const removeHint = () => {
    if (!hintRemoved && hint) {
      hint.classList.add('hidden');
      hintRemoved = true;
    }
  };

  // Mouse events
  let isDown = false;
  canvas.addEventListener('mousedown', (e) => {
    isDown = true;
    removeHint();
    const r = canvas.getBoundingClientRect();
    wipe(e.clientX - r.left, e.clientY - r.top);
  });
  canvas.addEventListener('mousemove', (e) => {
    if (!isDown || !isActive) return;
    const r = canvas.getBoundingClientRect();
    wipe(e.clientX - r.left, e.clientY - r.top);
  });
  window.addEventListener('mouseup', () => { isDown = false; });

  // Touch events
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    removeHint();
    const r = canvas.getBoundingClientRect();
    const t = e.touches[0];
    wipe(t.clientX - r.left, t.clientY - r.top);
  }, { passive: false });
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!isActive) return;
    const r = canvas.getBoundingClientRect();
    const t = e.touches[0];
    wipe(t.clientX - r.left, t.clientY - r.top);
  }, { passive: false });

  // Draw early since it's just a small box, no need to wait for observer
  setTimeout(drawDust, 100);
}

/* ═══════════════════════════════════════════════════════════════
   BOOTSTRAP
   ═══════════════════════════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {
  initUrlParams();
  initPreloader();
  initEnvelope();
  initAudio();
  initFlipbook();
  initCountdown();
  initRSVP();
  initActions();
  initFacts();
  initDustEffect();
});
