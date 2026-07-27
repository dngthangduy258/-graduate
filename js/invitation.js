const $ = id => document.getElementById(id);
const rnd = (min, max) => Math.random() * (max - min) + min;

// Global flag: lock page swiping while on the signature page (before signing)
let swipeLocked = false;

/* ═══════════════════════════════════════════════════════════════
   URL PARAMS — phải khớp với admin.js
   ═══════════════════════════════════════════════════════════════ */
const SALUTATIONS = {
  "kinh-moi-thay":  { text: "Kính mời Thầy",  honorific: "Thầy" },
  "kinh-moi-co":    { text: "Kính mời Cô",    honorific: "Cô" },
  "kinh-moi-ong":   { text: "Kính mời Ông",   honorific: "Ông" },
  "kinh-moi-ba":    { text: "Kính mời Bà",    honorific: "Bà" },
  "kinh-moi-chu":   { text: "Kính mời Chú",   honorific: "Chú" },
  "kinh-moi-bac":   { text: "Kính mời Bác",   honorific: "Bác" },
  "kinh-moi-anh":   { text: "Kính mời Anh",   honorific: "Anh" },
  "kinh-moi-chi":   { text: "Kính mời Chị",   honorific: "Chị" },
  "moi-ban":        { text: "Mời bạn",        honorific: "bạn" },
  "moi-anh":        { text: "Mời anh",        honorific: "Anh" },
  "moi-em":         { text: "Mời em",         honorific: "Em" },
  "moi-gia-dinh":   { text: "Mời gia đình",   honorific: "Gia đình" },
  "moi-ban-than":   { text: "Mời người bạn thân của mình", honorific: "bạn" },
  "moi-anh-chi":    { text: "Mời anh/chị",   honorific: "anh/chị" },
};

function parseGuestName(raw) {
  if (!raw) return "";
  let name = raw.trim();
  // Chỉ chuyển slug ASCII (không dấu) sang Title Case — giữ nguyên tên có dấu từ URL
  const isAsciiSlug = /^[a-z0-9-]+$/i.test(name) && name.includes("-");
  if (isAsciiSlug) {
    name = name.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  }
  return name;
}

function initUrlParams() {
  const p = new URLSearchParams(window.location.search);
  const guestName = parseGuestName(p.get("guest") || p.get("n"));
  const salutationSlug = p.get("salutation");
  const customSalute = p.get("salute");

  let salutationText = "Trân trọng kính mời";
  let honorific = "Quý vị";
  let closingHonorific = "bạn";

  if (salutationSlug === "custom" && customSalute) {
    salutationText = customSalute;
    honorific = customSalute;
    closingHonorific = customSalute;
  } else if (salutationSlug && SALUTATIONS[salutationSlug]) {
    salutationText = SALUTATIONS[salutationSlug].text;
    honorific = SALUTATIONS[salutationSlug].honorific;
    closingHonorific = honorific;
  }

  const guestSal = $("guest-sal");
  if (guestSal) guestSal.textContent = salutationText;

  const envSal = $("env-salutation");
  if (envSal) envSal.textContent = salutationText;

  const honorificEl = $("guest-honorific");
  if (honorificEl) honorificEl.textContent = honorific;

  const closingHonorificEl = $("guest-honorific-closing");
  if (closingHonorificEl) closingHonorificEl.textContent = closingHonorific;

  if (guestName) {
    const guestEl = $("guest-name");
    if (guestEl) guestEl.textContent = guestName;

    const envGuest = $("env-guest");
    if (envGuest) envGuest.textContent = "Dành riêng cho " + guestName;

    const rName = $("r-name");
    if (rName) rName.value = guestName;
  }
}

// Disable right click globally
document.addEventListener('contextmenu', e => e.preventDefault());

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

  // Easter Egg Foil Animation Logic
  let rAF = null;
  const updateShine = (dx, dy) => {
    if (card.classList.contains("opening")) return;
    if (rAF) cancelAnimationFrame(rAF);
    rAF = requestAnimationFrame(() => {
      const shine = 50 + (dx * 150);
      card.style.setProperty('--shine-pos', `${shine}%`);
      card.style.transform = `rotateX(${-dy * 8}deg) rotateY(${dx * 8}deg)`;
    });
  };

  const box = $("env-screen");
  if (box && card) {
    const handleMove = (x, y) => {
      const r = card.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      let dx = (x - cx) / (r.width / 2);
      let dy = (y - cy) / (r.height / 2);
      dx = Math.max(-1.5, Math.min(1.5, dx));
      dy = Math.max(-1.5, Math.min(1.5, dy));
      updateShine(dx, dy);
    };

    box.addEventListener("mousemove", e => handleMove(e.clientX, e.clientY));
    box.addEventListener("touchmove", e => handleMove(e.touches[0].clientX, e.touches[0].clientY), { passive: true });

    const resetTransform = () => {
      if (!card.classList.contains("opening")) {
        card.style.transform = "rotateX(0) rotateY(0)";
        card.style.setProperty('--shine-pos', '200%');
      }
    };
    box.addEventListener("mouseleave", resetTransform);
    box.addEventListener("touchend", resetTransform);
  }

  // Mobile Device Orientation
  if (window.DeviceOrientationEvent) {
    // iOS 13+ requires explicit permission via user interaction
    let permissionRequested = false;
    const requestMotionPermission = () => {
      if (!permissionRequested && typeof DeviceOrientationEvent.requestPermission === 'function') {
        permissionRequested = true;
        DeviceOrientationEvent.requestPermission().catch(console.error);
      }
    };
    // Bind to the first touch/click on the envelope screen
    box.addEventListener("touchstart", requestMotionPermission, { once: true, passive: true });
    box.addEventListener("click", requestMotionPermission, { once: true });

    let hasOrientation = false;
    let orientRAF = null;
    window.addEventListener("deviceorientation", (e) => {
      if (typeof e.gamma !== 'number' || typeof e.beta !== 'number') return;
      hasOrientation = true;

      let dx = e.gamma / 15;
      let dy = (e.beta - 45) / 15;
      dx = Math.max(-2.5, Math.min(2.5, dx));
      dy = Math.max(-2.5, Math.min(2.5, dy));

      if (card.classList.contains("opening")) return;
      if (orientRAF) cancelAnimationFrame(orientRAF);
      orientRAF = requestAnimationFrame(() => {
        const shine = 50 + (dx * 40);
        card.style.setProperty('--shine-pos', `${shine}%`);
        card.style.transform = `rotateX(${-dy * 15}deg) rotateY(${dx * 15}deg)`;
      });
    });

    let motionRAF = null;
    window.addEventListener("devicemotion", (e) => {
      if (hasOrientation || card.classList.contains("opening")) return;
      const accel = e.accelerationIncludingGravity;
      if (!accel || typeof accel.x !== 'number') return;

      let dx = -(accel.x / 3);
      let dy = (accel.y / 3);
      dx = Math.max(-2.5, Math.min(2.5, dx));
      dy = Math.max(-2.5, Math.min(2.5, dy));

      if (motionRAF) cancelAnimationFrame(motionRAF);
      motionRAF = requestAnimationFrame(() => {
        const shine = 50 + (dx * 40);
        card.style.setProperty('--shine-pos', `${shine}%`);
        card.style.transform = `rotateX(${-dy * 15}deg) rotateY(${dx * 15}deg)`;
      });
    });
  }
}

/* ═══════════════════════════════════════════════════════════════
   AUDIO
   ═══════════════════════════════════════════════════════════════ */
function initAudio() {
  const bgm = $("bg-music"), btn = $("btn-music");
  if (!bgm || !btn) return;

  bgm.volume = 0.1; // Giảm xuống 10% âm lượng
  let isPlaying = false;

  const toggle = () => {
    if (isPlaying) { bgm.pause(); btn.classList.add("off"); }
    else { bgm.play().catch(() => { }); btn.classList.remove("off"); }
    isPlaying = !isPlaying;
  };

  btn.addEventListener("click", toggle);

  // Thử tự động phát nhạc khi tải trang
  bgm.play().then(() => {
    isPlaying = true;
    btn.classList.remove("off");
  }).catch(() => {
    // Trình duyệt chặn autoplay, chờ tương tác của người dùng
    btn.classList.add("off");
  });

  // Chơi nhạc khi người dùng tương tác mở thiệp
  $("env-card")?.addEventListener("click", () => {
    if (!isPlaying) {
      bgm.play().then(() => { isPlaying = true; btn.classList.remove("off"); }).catch(() => { });
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
  // Lock logic removed

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
    if (isAnimating) return;

    if (curr >= total) {
      // Trigger closing animation on last page
      closeAndFlyAway();
      return;
    }

    curr++;
    applyPageStates('forward');
  };

  const closeAndFlyAway = () => {
    if (document.body.classList.contains('book-closing')) return;

    // 1. Close book
    document.body.classList.add('book-closing');

    // Hide side panels
    if (leftPanel) leftPanel.style.display = 'none';
    if (rightPanel) rightPanel.style.display = 'none';
    if (pageEdges) pageEdges.style.display = 'none';

    // 2. Magical transformation: Envelope appears and flies away (1.8s)
    setTimeout(() => {
      document.body.classList.add('envelope-flying');
    }, 1800);
  };

  const goPrev = () => {
    if (curr <= 1 || isAnimating) return;
    curr--;
    applyPageStates('backward');
  };

  // Side panel clicks
  leftPanel?.addEventListener('click', () => { if (!swipeLocked) goPrev(); });
  rightPanel?.addEventListener('click', () => { if (!swipeLocked) goNext(); });

  // Keyboard
  window.addEventListener('keydown', (e) => {
    if (!$('main')?.classList.contains('show')) return;
    if (swipeLocked) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); goNext(); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); goPrev(); }
  });

  // Mouse Wheel (with cooldown & scroll boundary detection)
  let wheelCooldown = false;
  window.addEventListener('wheel', (e) => {
    if (!$('main')?.classList.contains('show') || isAnimating || wheelCooldown || swipeLocked) return;

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

  // Interactive Touch Swipe (Page Flip effect)
  let touchStartX = 0, touchStartY = 0;
  let isDragging = false;
  let dragDirection = null; // 'next' or 'prev'
  let dragPage = null; // The DOM element being dragged
  const SWIPE_THRESHOLD = 60; // Pixels needed to trigger page turn

  window.addEventListener('touchstart', (e) => {
    if (!$('main')?.classList.contains('show') || isAnimating) return;
    // Block swipe when signature page is locked
    if (swipeLocked) return;
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
    isDragging = true;
    dragDirection = null;
    dragPage = null;
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!isDragging || isAnimating) return;
    const dx = e.changedTouches[0].screenX - touchStartX;
    const dy = e.changedTouches[0].screenY - touchStartY;

    // Ignore vertical scrolling if user is trying to scroll the page
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) {
      if (dragPage) dragPage.style.transform = '';
      isDragging = false;
      return;
    }

    // Determine direction once we move past a small threshold
    if (!dragDirection && Math.abs(dx) > 10) {
      dragDirection = dx < 0 ? 'next' : 'prev';

      if (dragDirection === 'next') {
        if (curr < total) {
          dragPage = document.querySelector(`.page[data-page="${curr}"]`);
          if (dragPage) {
            dragPage.style.transition = 'transform 0.1s ease-out';
            dragPage.style.zIndex = 200;
          }
        }
      } else if (dragDirection === 'prev' && curr > 1) {
        dragPage = document.querySelector(`.page[data-page="${curr - 1}"]`);
        if (dragPage) {
          dragPage.style.transition = 'transform 0.1s ease-out';
          dragPage.style.zIndex = 200;
          dragPage.classList.add('current'); // Make visible
          dragPage.classList.remove('past');
        }
      } else {
        isDragging = false; // Cannot turn in this direction
      }
    }

    if (dragPage) {
      const W = window.innerWidth || 400;
      let clientX = e.changedTouches[0].clientX;
      // Clamp between 0 and W
      clientX = Math.max(0, Math.min(clientX, W));

      // Absolute tracking: right edge of screen (1) = 0deg, left edge (0) = -150deg
      let progress = clientX / W;
      let angle = -150 * (1 - progress);

      // Add slight curl effect
      let rotateZ = 0;
      if (dragDirection === 'next') {
        rotateZ = -4 * Math.sin(progress * Math.PI);
      } else if (dragDirection === 'prev') {
        rotateZ = 4 * Math.sin(progress * Math.PI);
      }

      dragPage.style.transform = `perspective(1200px) rotateY(${angle}deg) rotateZ(${rotateZ}deg)`;
    }
  }, { passive: true });

  window.addEventListener('touchend', (e) => {
    if (!isDragging || isAnimating) return;
    isDragging = false;

    const dx = e.changedTouches[0].screenX - touchStartX;

    if (dragPage) {
      const pageToClean = dragPage;
      // Smoothly transition from the current drag angle to the final state
      pageToClean.style.transition = 'transform 1.1s cubic-bezier(0.645, 0.045, 0.355, 1)';

      if (dragDirection === 'next') {
        if (dx < -SWIPE_THRESHOLD) {
          pageToClean.style.transform = 'perspective(1200px) rotateY(-180deg) rotateZ(0deg)';
          if (curr >= total) {
            closeAndFlyAway();
          } else {
            goNext();
          }
        } else {
          // Cancel swipe, page falls back
          pageToClean.style.transform = 'perspective(1200px) rotateY(0deg) rotateZ(0deg)';
          pageToClean.style.zIndex = '';
        }
      } else if (dragDirection === 'prev') {
        if (dx > SWIPE_THRESHOLD) {
          pageToClean.style.transform = 'perspective(1200px) rotateY(0deg) rotateZ(0deg)';
          goPrev();
        } else {
          // Cancel swipe, page falls forward
          pageToClean.style.transform = 'perspective(1200px) rotateY(-180deg) rotateZ(0deg)';
          pageToClean.classList.remove('current');
          pageToClean.classList.add('past');
          pageToClean.style.zIndex = '';
        }
      }

      // Clean up inline styles after animation finishes
      setTimeout(() => {
        pageToClean.style.transition = '';
        pageToClean.style.transform = '';
      }, 1150);

    } else {
      // Fallback for very quick swipes where touchmove didn't trigger logic
      if (Math.abs(dx) > SWIPE_THRESHOLD) {
        if (dx < 0) {
          if (curr >= total) closeAndFlyAway();
          else goNext();
        }
        else goPrev();
      }
    }
  }, { passive: true });

  // Initial state
  applyPageStates('none');
}

/* ═══════════════════════════════════════════════════════════════
   COUNTDOWN
   ═══════════════════════════════════════════════════════════════ */
function initCountdown() {
  const tg = new Date("2026-08-05T11:00:00").getTime();
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
   SIGNATURE BOOK
   ═══════════════════════════════════════════════════════════════ */
function initSignatureBook() {
  const canvas = document.getElementById('sig-canvas');
  const modal = document.getElementById('sig-modal');
  const colors = document.querySelectorAll('.sig-color');
  const btnConfirm = document.getElementById('sig-btn-confirm');
  const hint = document.getElementById('sig-hint');
  const drawPad = document.getElementById('sig-draw-pad');
  const btnClear = document.getElementById('sig-btn-clear');

  if (!canvas || !modal) return;

  let currentX = 0;
  let currentY = 0;
  let selectedColor = '#1a1a1a';
  let isDrawing = false;
  let hasDrawn = false;
  let ctx = null;

  if (drawPad) {
    ctx = drawPad.getContext('2d');
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = selectedColor;

    const getPos = (e) => {
      const rect = drawPad.getBoundingClientRect();
      const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
      const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    const startDraw = (e) => {
      e.preventDefault();
      isDrawing = true;
      hasDrawn = true;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    };

    const draw = (e) => {
      if (!isDrawing) return;
      e.preventDefault();
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    };

    const endDraw = () => {
      isDrawing = false;
    };

    // Use pointer events for better support, fallback to touch/mouse
    if (window.PointerEvent) {
      drawPad.addEventListener('pointerdown', startDraw);
      drawPad.addEventListener('pointermove', draw);
      drawPad.addEventListener('pointerup', endDraw);
      drawPad.addEventListener('pointerout', endDraw);
      drawPad.addEventListener('pointercancel', endDraw);
    } else {
      drawPad.addEventListener('mousedown', startDraw);
      drawPad.addEventListener('mousemove', draw);
      drawPad.addEventListener('mouseup', endDraw);
      drawPad.addEventListener('mouseleave', endDraw);
      drawPad.addEventListener('touchstart', startDraw, { passive: false });
      drawPad.addEventListener('touchmove', draw, { passive: false });
      drawPad.addEventListener('touchend', endDraw);
    }

    if (btnClear) {
      btnClear.addEventListener('click', () => {
        ctx.clearRect(0, 0, drawPad.width, drawPad.height);
        hasDrawn = false;
      });
    }
  }

  const fontsList = [
    "'Dancing Script', cursive",
    "'Great Vibes', cursive",
    "'Pacifico', cursive",
    "'Alex Brush', cursive",
    "'Sacramento', cursive",
    "'Allura', cursive"
  ];



  // Load existing signatures from Backend (or localStorage fallback)
  const loadSignatures = async () => {
    try {
      let sigs = [];
      try {
        const res = await fetch('/api/signatures');
        if (res.ok) {
          sigs = await res.json();
          // Cache to local storage
          localStorage.setItem('guest_signatures', JSON.stringify(sigs));
        }
      } catch (err) {
        console.warn('API error, using localStorage fallback');
        const saved = localStorage.getItem('guest_signatures');
        if (saved) sigs = JSON.parse(saved);
      }

      if (sigs && sigs.length > 0) {
        canvas.classList.add('hide-sigs');
        sigs.forEach(s => renderSignature(s.x, s.y, s.color, s.name, s.rotation, false));
      }

      const sigPage = canvas.closest('.page');
      let hasTriggered = false;

      const checkSigPage = () => {
        if (sigPage && sigPage.classList.contains('current') && !hasTriggered) {
          hasTriggered = true;
          let countdown = 5;
          if (hint) {
            hint.innerHTML = `Chạm vào mặt giấy để ký tên (${countdown}s)`;
            hint.style.opacity = '1';
          }

          const interval = setInterval(() => {
            countdown--;
            if (countdown > 0) {
              if (hint) hint.innerHTML = `Chạm vào mặt giấy để ký tên (${countdown}s)`;
            } else {
              clearInterval(interval);
              if (hint) hint.style.opacity = '0';
              canvas.classList.remove('hide-sigs');
            }
          }, 1000);
        }
      };

      if (sigPage) {
        const observer = new MutationObserver(checkSigPage);
        observer.observe(sigPage, { attributes: true, attributeFilter: ['class'] });
        checkSigPage(); // Check immediately in case already active
      }
    } catch (e) { console.error(e); }
  };

  const saveSignature = async (sig) => {
    try {
      // Optimistic UI save to localStorage
      const saved = localStorage.getItem('guest_signatures');
      const sigs = saved ? JSON.parse(saved) : [];
      sigs.push(sig);
      localStorage.setItem('guest_signatures', JSON.stringify(sigs));

      // Save to Backend
      fetch('/api/signatures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sig)
      }).catch(err => console.error("Failed to save to backend:", err));
    } catch (e) { console.error(e); }
  };

  const renderSignature = (x, y, colorData, name, rotation, animate = true) => {
    let color = colorData;
    let font = "'Dancing Script', cursive";
    if (colorData && colorData.includes('|||')) {
      const parts = colorData.split('|||');
      color = parts[0];
      font = parts[1];
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'sig-item';
    wrapper.style.left = x + '%';
    wrapper.style.top = y + '%';
    wrapper.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
    wrapper.style.color = color;

    let contentEl;
    let imgData = name;
    let message = '';

    if (name && name.includes('|||')) {
      const parts = name.split('|||');
      imgData = parts[0];
      message = decodeURIComponent(parts[1] || '');
    }

    if (imgData && imgData.startsWith('data:image')) {
      contentEl = document.createElement('img');
      contentEl.src = imgData;
      contentEl.className = 'sig-img';
      contentEl.style.width = 'auto';
      contentEl.style.height = 'auto';
      contentEl.onload = () => {
        contentEl.style.width = (contentEl.naturalWidth * 0.6) + 'px';
      };
      contentEl.style.pointerEvents = 'none';
      contentEl.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))';

      if (message) {
        // Visual indicator that it has a message
        const badge = document.createElement('div');
        badge.style.position = 'absolute';
        badge.style.bottom = '-5px';
        badge.style.right = '-5px';
        badge.style.width = '20px';
        badge.style.height = '20px';
        badge.style.background = 'var(--gold)';
        badge.style.borderRadius = '50%';
        badge.style.border = '2px solid #fff';
        badge.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';
        badge.style.cursor = 'pointer';
        badge.style.pointerEvents = 'auto';
        badge.title = "Nhấp để xem lời nhắn";

        // Add a small envelope icon inside the badge
        badge.innerHTML = '<svg viewBox="0 0 24 24" fill="white" style="width:12px; height:12px; display:block; margin:2px auto;"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>';

        wrapper.appendChild(badge);

        badge.addEventListener('click', (e) => {
          e.stopPropagation();
          const readModal = document.getElementById('msg-read-modal');
          const sigDisplay = document.getElementById('msg-sig-display');
          const textDisplay = document.getElementById('msg-text-display');
          if (readModal && sigDisplay && textDisplay) {
            sigDisplay.innerHTML = `<img src="${imgData}" style="max-width:200px; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.1));">`;
            textDisplay.textContent = message;
            readModal.classList.add('show');
          }
        });
      }
    } else {
      contentEl = document.createElement('div');
      contentEl.className = 'sig-text';
      contentEl.textContent = imgData || 'Khách mời';
      contentEl.style.fontFamily = font;
    }

    if (animate) {
      contentEl.style.animation = 'sigDraw 0.6s ease forwards';
    } else {
      contentEl.style.opacity = '0.9';
      contentEl.style.transform = 'scale(1)';
      contentEl.style.animation = 'none';
    }

    wrapper.appendChild(contentEl);
    canvas.appendChild(wrapper);
  };

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    // Calculate percentage position
    currentX = ((e.clientX - rect.left) / rect.width) * 100;
    currentY = ((e.clientY - rect.top) / rect.height) * 100;

    // Lock swiping while signature modal is open
    swipeLocked = true;
    // Show color picker modal
    modal.classList.add('show');
  });

  colors.forEach(c => {
    c.addEventListener('click', () => {
      colors.forEach(el => el.classList.remove('active'));
      c.classList.add('active');
      selectedColor = c.getAttribute('data-color');
      if (ctx) ctx.strokeStyle = selectedColor;
    });
  });

  btnConfirm.addEventListener('click', () => {
    if (!hasDrawn || !drawPad) {
      alert('Vui lòng vẽ chữ ký của bạn trước khi lưu nhé!');
      return;
    }

    // Trim canvas helper to crop whitespace
    const trimCanvas = (c) => {
      let ctx = c.getContext('2d'),
        copy = document.createElement('canvas').getContext('2d'),
        pixels = ctx.getImageData(0, 0, c.width, c.height),
        l = pixels.data.length,
        i, bound = { top: null, left: null, right: null, bottom: null },
        x, y;

      for (i = 0; i < l; i += 4) {
        if (pixels.data[i + 3] !== 0) {
          x = (i / 4) % c.width;
          y = ~~((i / 4) / c.width);
          if (bound.top === null) bound.top = y;
          if (bound.left === null) bound.left = x;
          else if (x < bound.left) bound.left = x;
          if (bound.right === null) bound.right = x;
          else if (bound.right < x) bound.right = x;
          if (bound.bottom === null) bound.bottom = y;
          else if (bound.bottom < y) bound.bottom = y;
        }
      }

      if (bound.top === null) return c.toDataURL('image/png');

      const pad = 10;
      const trimWidth = bound.right - bound.left + 1 + pad * 2;
      const trimHeight = bound.bottom - bound.top + 1 + pad * 2;
      copy.canvas.width = trimWidth;
      copy.canvas.height = trimHeight;
      copy.drawImage(c, bound.left - pad, bound.top - pad, trimWidth, trimHeight, 0, 0, trimWidth, trimHeight);

      return copy.canvas.toDataURL('image/png');
    };

    // Get cropped base64 image from canvas
    const imgData = trimCanvas(drawPad);

    // Get message
    const msgField = document.getElementById('sig-message-field');
    const message = msgField ? msgField.value.trim() : '';
    const finalNameData = message ? (imgData + '|||' + encodeURIComponent(message)) : imgData;

    modal.classList.remove('show');
    if (hint) hint.style.opacity = '0';
    // Unlock swiping after successful signature
    swipeLocked = false;
    const successHint = document.getElementById('sig-success-hint');
    if (successHint) successHint.classList.add('show');

    const rotation = Math.random() * 30 - 15; // -15 to 15 degrees

    const sig = {
      x: currentX,
      y: currentY,
      color: selectedColor + '|||', // Font is no longer relevant for images
      name: finalNameData,
      rotation: rotation
    };

    renderSignature(sig.x, sig.y, sig.color, sig.name, sig.rotation, true);
    saveSignature(sig);

    // Reset canvas for next time
    if (ctx) {
      ctx.clearRect(0, 0, drawPad.width, drawPad.height);
      hasDrawn = false;
    }
  });

  // Close modal if clicked outside box
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('show');
      // Unlock swiping when modal is dismissed
      swipeLocked = false;
    }
  });

  // Setup close for message read modal
  const readModal = document.getElementById('msg-read-modal');
  const btnCloseMsg = document.getElementById('msg-btn-close');
  if (readModal) {
    readModal.addEventListener('click', (e) => {
      if (e.target === readModal) readModal.classList.remove('show');
    });
    if (btnCloseMsg) {
      btnCloseMsg.addEventListener('click', () => readModal.classList.remove('show'));
    }
  }

  loadSignatures();
}

/* ═══════════════════════════════════════════════════════════════
   SVG INTERACTIVE SGU CAMPUS MAP SYSTEM
   ═══════════════════════════════════════════════════════════════ */
function initInteractiveSguMap() {
  const areasGroup = document.getElementById('svg-areas-group');
  const gatesGroup = document.getElementById('svg-gates-group');
  const infoBox = document.getElementById('campus-map-info');
  const chkRef = document.getElementById('chk-show-reference');
  const refImg = document.getElementById('svg-ref-image');

  if (!areasGroup || !infoBox) return;

  const areas = [
    {
      id: "hoi-truong-a",
      name: "Hội Trường A ★",
      type: "rect",
      x: 228,
      y: 185,
      width: 110,
      height: 68,
      badge: "🎓 Nơi Tổ Chức Lễ Tốt Nghiệp",
      description: "Nơi cử hành Lễ Tốt nghiệp Cử nhân ngành Tâm lý học của Nguyễn Thị Xuân Mai (11:00 ngày 06/08/2026). Nằm tại Dãy A phía Cổng Nguyễn Trãi.",
    },
    {
      id: "day-a",
      name: "Dãy A",
      type: "rect",
      x: 170,
      y: 85,
      width: 510,
      height: 58,
      badge: "Khu Giảng Đường A",
      description: "Khu phòng học chính và các phòng chức năng C.SA01, C.SA03, C.SA05 thuộc Dãy A.",
    },
    {
      id: "vpk-my-thuat",
      name: "VPK Mỹ thuật",
      type: "rect",
      x: 120,
      y: 185,
      width: 100,
      height: 68,
      badge: "Khoa Mỹ Thuật",
      description: "Văn phòng Khoa Mỹ thuật & Khu triển lãm nghệ thuật.",
    },
    {
      id: "thu-quan",
      name: "Thư quán",
      type: "rect",
      x: 170,
      y: 88,
      width: 95,
      height: 35,
      badge: "Thư Quán SGU",
      description: "Khu vực Thư quán và gian hàng giáo trình, quà lưu niệm SGU.",
    },
    {
      id: "day-b",
      name: "Dãy B",
      type: "polygon",
      points: "270,325 675,325 675,540 620,540 620,380 270,380",
      labelX: 465,
      labelY: 353,
      badge: "Dãy Nhà B",
      description: "Dãy B gồm khu tự học, các hội trường con và hệ thống phòng học hiện đại.",
    },
    {
      id: "hoi-truong-b",
      name: "Hội trường B",
      type: "rect",
      x: 270,
      y: 325,
      width: 68,
      height: 58,
      badge: "Hội Trường B",
      description: "Hội trường B dành cho các hội thảo và hoạt động sinh viên.",
    },
    {
      id: "khu-tu-hoc-b",
      name: "Khu tự học",
      type: "rect",
      x: 270,
      y: 390,
      width: 68,
      height: 58,
      badge: "Góc Tự Học",
      description: "Khu vực tự học thoáng mát, yên tĩnh dành cho sinh viên.",
    },
    {
      id: "klf",
      name: "KLF",
      type: "rect",
      x: 270,
      y: 450,
      width: 68,
      height: 65,
      badge: "Trung Tâm KLF",
      description: "Khu vực trung tâm KLF và phòng thực hành.",
    },
    {
      id: "can-tin",
      name: "Căn tin",
      type: "rect",
      x: 620,
      y: 380,
      width: 55,
      height: 160,
      rotateLabel: true,
      badge: "Căn Tin SGU",
      description: "Khu vực Căn tin phục vụ ăn uống, nước giải khát cho sinh viên và khách tới thăm.",
    },
    {
      id: "day-c",
      name: "Dãy C",
      type: "rect",
      x: 270,
      y: 540,
      width: 405,
      height: 58,
      badge: "Dãy Nhà C",
      description: "Dãy C nằm song song với Dãy B, gồm các giảng đường và Hội trường C.",
    },
    {
      id: "hoi-truong-c",
      name: "Hội trường C",
      type: "rect",
      x: 270,
      y: 540,
      width: 68,
      height: 58,
      badge: "Hội Trường C",
      description: "Hội trường C phục vụ các buổi sinh hoạt chuyên đề.",
    },
    {
      id: "day-d",
      name: "Dãy D",
      type: "rect",
      x: 585,
      y: 635,
      width: 130,
      height: 95,
      badge: "Dãy Nhà D",
      description: "Dãy D nằm gần khu vực Cổng 273 An Dương Vương.",
    },
    {
      id: "khu-hieu-bo",
      name: "Khu Hiệu bộ",
      type: "rect",
      x: 240,
      y: 615,
      width: 175,
      height: 125,
      badge: "Khu Hiệu Bộ",
      description: "Khu Trung tâm Hành chính - Hiệu bộ Ban Giám hiệu Đại học Sài Gòn.",
    },
    {
      id: "san-da-banh",
      name: "Sân đá banh",
      type: "rect",
      x: 790,
      y: 595,
      width: 150,
      height: 95,
      badge: "Sân Bóng Đá",
      description: "Sân bóng đá cỏ nhân tạo SGU.",
    },
    {
      id: "san-bong-ro",
      name: "Sân bóng rổ",
      type: "rect",
      x: 765,
      y: 445,
      width: 95,
      height: 150,
      rotateLabel: true,
      badge: "Sân Thể Thao",
      description: "Khu vực sân bóng rổ và bóng chuyền ngoài trời.",
    },
    {
      id: "san-cau-long",
      name: "Sân cầu lông",
      type: "rect",
      x: 860,
      y: 445,
      width: 80,
      height: 150,
      rotateLabel: true,
      badge: "Sân Cầu Lông",
      description: "Khu vực sân tập cầu lông.",
    },
    {
      id: "khu-da-nang",
      name: "Khu phức hợp đa năng",
      type: "rect",
      x: 760,
      y: 85,
      width: 180,
      height: 150,
      badge: "Khu Đa Năng",
      description: "Khu phức hợp thể thao đa năng dành cho các giải đấu và sự kiện văn thể mỹ.",
    }
  ];

  const gates = [
    { id: "gate-2", name: "Cổng 2 Nguyễn Trãi", x: 120, y: 55 },
    { id: "gate-4", name: "Cổng 4 Nguyễn Trãi", x: 470, y: 55 },
    { id: "gate-6", name: "Cổng 6 Nguyễn Trãi (Vào Xe)", x: 790, y: 55 },
    { id: "gate-273", name: "Cổng 273 AD Vượng (Đi Bộ)", x: 470, y: 790 },
    { id: "gate-275", name: "Cổng 275 AD Vượng (Ra Xe)", x: 850, y: 790 },
  ];

  let selectedId = "hoi-truong-a";

  const renderInfoBox = (area) => {
    if (!area) return;
    infoBox.innerHTML = `
      <div class="area-type">${area.badge || 'Khu Vực Đã Chọn'}</div>
      <h3>${area.name}</h3>
      <p>${area.description}</p>
      <div style="margin-top: 6px; text-align: right;">
        <a href="https://www.google.com/maps/place/273+An+D%C6%B0%C6%A1ng+V%C6%B0%C6%A1ng,+Ch%E1%BB%A3+Qu%C3%A1n,+H%E1%BB%93+Ch%C3%AD+Minh,+Vietnam" target="_blank" style="font-size: 0.72rem; color: var(--gold-d); text-decoration: none; font-weight: 600;">
          🗺️ Mở Google Maps Chỉ Đường ↗
        </a>
      </div>
    `;
  };

  const selectArea = (areaId) => {
    selectedId = areaId;
    const targetArea = areas.find(a => a.id === areaId);

    document.querySelectorAll('.map-area-g').forEach(g => {
      if (g.getAttribute('data-id') === areaId) {
        g.classList.add('map-group--selected');
        const shape = g.querySelector('.campus-area');
        if (shape) shape.classList.add('campus-area--selected');
      } else {
        g.classList.remove('map-group--selected');
        const shape = g.querySelector('.campus-area');
        if (shape) shape.classList.remove('campus-area--selected');
      }
    });

    renderInfoBox(targetArea);
  };

  // Render SVG Areas
  areasGroup.innerHTML = '';
  areas.forEach(area => {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'map-area-g' + (area.id === selectedId ? ' map-group--selected' : ''));
    g.setAttribute('data-id', area.id);

    let shape;
    let cx, cy;

    if (area.type === 'polygon') {
      shape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      shape.setAttribute('points', area.points);
      cx = area.labelX;
      cy = area.labelY;
    } else {
      shape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      shape.setAttribute('x', area.x);
      shape.setAttribute('y', area.y);
      shape.setAttribute('width', area.width);
      shape.setAttribute('height', area.height);
      shape.setAttribute('rx', '4');
      cx = area.x + area.width / 2;
      cy = area.y + area.height / 2;
    }

    shape.setAttribute('class', 'campus-area' + (area.id === selectedId ? ' campus-area--selected' : ''));
    
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('class', 'campus-label');
    text.setAttribute('x', cx);
    text.setAttribute('y', cy);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    if (area.rotateLabel) {
      text.setAttribute('transform', `rotate(-90 ${cx} ${cy})`);
    }
    text.textContent = area.name;

    g.appendChild(shape);
    g.appendChild(text);

    g.addEventListener('click', () => selectArea(area.id));
    areasGroup.appendChild(g);
  });

  // Render SVG Gates
  gatesGroup.innerHTML = '';
  gates.forEach(gate => {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', gate.x);
    circle.setAttribute('cy', gate.y);
    circle.setAttribute('r', '7');
    circle.setAttribute('class', 'gate-point');

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', gate.x);
    text.setAttribute('y', gate.y - 14);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('class', 'gate-label');
    text.textContent = gate.name;

    g.appendChild(circle);
    g.appendChild(text);
    gatesGroup.appendChild(g);
  });

  // Reference Image toggle
  chkRef?.addEventListener('change', (e) => {
    if (refImg) {
      refImg.style.display = e.target.checked ? 'block' : 'none';
    }
  });

  // Initial selection (Hội trường A)
  selectArea('hoi-truong-a');
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
  initSignatureBook();
  initInteractiveSguMap();
});


