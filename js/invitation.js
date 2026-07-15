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
  const updateShine = (dx, dy) => {
    if (card.classList.contains("opening")) return;
    // Map dx/dy (-1 to 1) to background-position-x (0% to 100%)
    const shine = 50 + (dx * 150); // -1 -> -100%, 1 -> 200%
    card.style.setProperty('--shine-pos', `${shine}%`);
    card.style.transform = `rotateX(${-dy * 8}deg) rotateY(${dx * 8}deg)`;
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
    window.addEventListener("deviceorientation", (e) => {
      if (typeof e.gamma !== 'number' || typeof e.beta !== 'number') return;
      hasOrientation = true;
      
      let dx = e.gamma / 15; // highly sensitive
      let dy = (e.beta - 45) / 15; 
      dx = Math.max(-2.5, Math.min(2.5, dx));
      dy = Math.max(-2.5, Math.min(2.5, dy));
      
      if (card.classList.contains("opening")) return;
      const shine = 50 + (dx * 40); 
      card.style.setProperty('--shine-pos', `${shine}%`);
      card.style.transform = `rotateX(${-dy * 15}deg) rotateY(${dx * 15}deg)`;
    });

    // Fallback for browsers that block deviceorientation but allow devicemotion
    window.addEventListener("devicemotion", (e) => {
      if (hasOrientation || card.classList.contains("opening")) return;
      const accel = e.accelerationIncludingGravity;
      if (!accel || typeof accel.x !== 'number') return;
      
      // accel.x is roughly -9.8 to 9.8
      let dx = -(accel.x / 3); 
      let dy = (accel.y / 3);
      dx = Math.max(-2.5, Math.min(2.5, dx));
      dy = Math.max(-2.5, Math.min(2.5, dy));
      
      const shine = 50 + (dx * 40);
      card.style.setProperty('--shine-pos', `${shine}%`);
      card.style.transform = `rotateX(${-dy * 15}deg) rotateY(${dx * 15}deg)`;
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
  let isUnlocked = false; // Cover page lock

  // Handle key click
  const hiddenKey = document.getElementById('hidden-key');
  const lockIcon = document.getElementById('lock-icon');
  
  if (hiddenKey) {
    hiddenKey.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isUnlocked) return;
      isUnlocked = true;
      
      const keyRect = hiddenKey.getBoundingClientRect();
      const lockRect = lockIcon.getBoundingClientRect();
      
      // Calculate translation to the center of the lock
      const tx = lockRect.left + lockRect.width / 2 - (keyRect.left + keyRect.width / 2);
      const ty = lockRect.top + lockRect.height / 2 - (keyRect.top + keyRect.height / 2);
      
      // Stop glowing
      hiddenKey.classList.remove('key-glow');
      
      // Fly to lock (even slower, 1.5s)
      hiddenKey.style.transition = 'transform 1.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.5s ease-in 1s';
      hiddenKey.style.transform = `translate(${tx}px, ${ty}px) scale(0.6) rotate(-90deg)`;
      hiddenKey.style.opacity = '0';
      
      // After flying (1.5s), unlock the lock and drop chains
      setTimeout(() => {
        if (lockIcon) {
          // Open lock shackle SVG
          lockIcon.innerHTML = '<rect x="4" y="10" width="16" height="12" rx="3" ry="3"/><path d="M7 10V5a5 5 0 0110 0"/><circle cx="12" cy="16" r="1.5"/>';
        }
        
        // Wait for unlock animation to be seen VERY clearly (1.5s), then drop chains
        setTimeout(() => {
          document.body.classList.add('cover-unlocked');
          
          // Wait for chains to finish sliding away (they will take ~4s now) before removing blur
          setTimeout(() => {
            const page1 = document.querySelector('.page[data-page="1"]');
            if (page1) page1.classList.remove('cover-locked');
          }, 3500);
          
        }, 1500);
      }, 1500);
    });
  }

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
    if (curr === 1 && !isUnlocked) return;
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

  // Interactive Touch Swipe (Page Flip effect)
  let touchStartX = 0, touchStartY = 0;
  let isDragging = false;
  let dragDirection = null; // 'next' or 'prev'
  let dragPage = null; // The DOM element being dragged
  const SWIPE_THRESHOLD = 60; // Pixels needed to trigger page turn

  window.addEventListener('touchstart', (e) => {
    if (!$('main')?.classList.contains('show') || isAnimating) return;
    if (curr === 1 && !isUnlocked) return; // Locked on cover
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
    isDragging = true;
    dragDirection = null;
    dragPage = null;
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!isDragging || isAnimating) return;
    if (curr === 1 && !isUnlocked) {
      isDragging = false;
      return;
    }
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
    
    if (curr === 1 && !isUnlocked) return;
    
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

    // Base dust layer
    ctx.fillStyle = '#b8a68b'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add heavy noise texture for real dust feel
    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const w = Math.random() * 1.5;
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255, 255, 255, 0.25)' : 'rgba(40, 30, 20, 0.35)';
      ctx.beginPath();
      ctx.arc(x, y, w, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Add subtle vignette
    const vig = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 10, canvas.width/2, canvas.height/2, Math.max(canvas.width, canvas.height)/1.5);
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, "rgba(30,25,15,0.5)");
    ctx.fillStyle = vig;
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
    
    // Make the hidden key glow to attract attention
    const key = document.getElementById('hidden-key');
    if (key) key.classList.add('key-glow');
    
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
   SIGNATURE BOOK
   ═══════════════════════════════════════════════════════════════ */
function initSignatureBook() {
  const canvas = document.getElementById('sig-canvas');
  const modal = document.getElementById('sig-modal');
  const colors = document.querySelectorAll('.sig-color');
  const btnConfirm = document.getElementById('sig-btn-confirm');
  const hint = document.getElementById('sig-hint');
  const inputName = document.getElementById('sig-name-field');
  const groupName = document.getElementById('sig-name-group');
  
  if (!canvas || !modal) return;
  
  // Get guest name from URL or use empty
  const p = new URLSearchParams(window.location.search);
  let urlGuestName = p.get('guest') || p.get('n') || '';
  if (urlGuestName && urlGuestName.includes('-')) {
    urlGuestName = urlGuestName.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }
  
  if (inputName) {
    inputName.value = urlGuestName;
  }
  
  if (urlGuestName && groupName) {
    // If they already have a name from URL, we can hide the input or just leave it pre-filled
    // We will leave it visible so they can change it if they want.
  }
  
  let currentX = 0;
  let currentY = 0;
  let selectedColor = '#1a1a1a';
  
  // Load existing signatures from localStorage
  const loadSignatures = () => {
    try {
      const saved = localStorage.getItem('guest_signatures');
      if (saved) {
        const sigs = JSON.parse(saved);
        sigs.forEach(s => renderSignature(s.x, s.y, s.color, s.name, s.rotation, false));
        if (sigs.length > 0) {
          if (hint) hint.style.opacity = '0';
          const successHint = document.getElementById('sig-success-hint');
          if (successHint) successHint.classList.add('show');
        }
      }
    } catch (e) { console.error(e); }
  };
  
  const saveSignature = (sig) => {
    try {
      const saved = localStorage.getItem('guest_signatures');
      const sigs = saved ? JSON.parse(saved) : [];
      sigs.push(sig);
      localStorage.setItem('guest_signatures', JSON.stringify(sigs));
    } catch (e) { console.error(e); }
  };
  
  const renderSignature = (x, y, color, name, rotation, animate = true) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'sig-item';
    wrapper.style.left = x + '%';
    wrapper.style.top = y + '%';
    wrapper.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
    wrapper.style.color = color;
    
    const textEl = document.createElement('div');
    textEl.className = 'sig-text';
    textEl.textContent = name;
    
    if (animate) {
      textEl.style.animation = 'sigDraw 0.6s ease forwards';
    } else {
      textEl.style.opacity = '0.9';
      textEl.style.transform = 'scale(1)';
      textEl.style.animation = 'none';
    }
    
    wrapper.appendChild(textEl);
    canvas.appendChild(wrapper);
  };
  
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    // Calculate percentage position
    currentX = ((e.clientX - rect.left) / rect.width) * 100;
    currentY = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Show color picker modal
    modal.classList.add('show');
  });
  
  colors.forEach(c => {
    c.addEventListener('click', () => {
      colors.forEach(el => el.classList.remove('active'));
      c.classList.add('active');
      selectedColor = c.getAttribute('data-color');
    });
  });
  
  btnConfirm.addEventListener('click', () => {
    let finalName = inputName ? inputName.value.trim() : urlGuestName;
    if (!finalName) {
      alert('Vui lòng nhập tên của bạn để lưu lại chữ ký nhé!');
      if (inputName) inputName.focus();
      return;
    }
    
    modal.classList.remove('show');
    if (hint) hint.style.opacity = '0';
    const successHint = document.getElementById('sig-success-hint');
    if (successHint) successHint.classList.add('show');
    
    const rotation = Math.random() * 30 - 15; // -15 to 15 degrees
    
    const sig = {
      x: currentX,
      y: currentY,
      color: selectedColor,
      name: finalName,
      rotation: rotation
    };
    
    renderSignature(sig.x, sig.y, sig.color, sig.name, sig.rotation, true);
    saveSignature(sig);
  });
  
  // Close modal if clicked outside box
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('show');
    }
  });
  
  loadSignatures();
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
  initSignatureBook();
});
