/* =========================================================
   WEDDING LANDING PAGE — SCRIPT
   Tích hợp: Dark/Light Mode, Countdown, 3D Particle Intro
   Đã gộp: Dual Perspective, Red Thread, Focus Gallery, Probability Chart, Rewind Time Machine
   ========================================================= */

/* Một nguồn scroll/resize duy nhất: mọi scene cùng nhận một nhịp RAF, tránh
   Safari phải chạy nhiều handler và đo layout lặp lại trong cùng một frame. */
window.storyFrames = window.storyFrames || (function () {
  var subscribers = new Set();
  var frame = 0;

  function flush() {
    frame = 0;
    subscribers.forEach(function (callback) { callback(); });
  }

  function request() {
    if (!frame) frame = requestAnimationFrame(flush);
  }

  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request, { passive: true });
  return {
    subscribe: function (callback) {
      subscribers.add(callback);
      request();
      return function () { subscribers.delete(callback); };
    },
    request: request
  };
})();

document.addEventListener('DOMContentLoaded', function () {

  /* ---------- CẤU HÌNH CHUNG ---------- */
  var WEDDING_TITLE = '[Tên Cô Dâu] & [Tên Chú Rể] - Tiệc Cưới';
  var WEDDING_LOCATION = 'Trung tâm Tiệc cưới ABC';
  var LOVE_STORY_VIDEO_ID = 'dQw4w9WgXcQ';
  var WEDDING_DATE = new Date('2026-10-20T17:30:00+07:00').getTime();
  var safariRendering = Boolean(window.storyIsSafari);

  // Dữ liệu Góc nhìn kép (Dual Perspective)
  var actTexts = {
    'act-1': {
       groom: 'Anh nhớ hôm đó trời mưa lất phất. Bước vào quán cà phê quen thuộc, anh thấy em đang loay hoay trú mưa. Chỉ một khoảnh khắc nhìn thấy nụ cười ấy, anh biết mình đã tìm đúng người.',
       bride: 'Hôm đó em ướt sũng vì quên mang ô. Đang bực mình thì ngước lên thấy một chàng trai cứ nhìn mình chằm chằm rồi cười ngốc nghếch. Tự nhiên thấy... cũng đáng yêu.'
    },
    'act-2': {
       groom: 'Những tháng ngày yêu nhau, anh nhận ra mình muốn bảo vệ em cả đời. Chuyến đi Đà Lạt năm ấy, nhìn em cười dưới ánh hoàng hôn, anh đã tự hứa sẽ không bao giờ buông tay.',
       bride: 'Chuyến đi Đà Lạt đã thay đổi tất cả. Nơi bờ hồ bình yên đó, em nhận ra anh chính là bến đỗ an toàn nhất mà em luôn tìm kiếm bấy lâu nay.'
    },
    'act-3': {
       groom: 'Ngày hôm nay, anh chính thức được gọi em là vợ. Cảm ơn em đã bước vào cuộc đời anh, biến những thuật toán khô khan thành một câu chuyện cổ tích.',
       bride: 'Từ hai đường thẳng song song, chúng mình đã giao nhau. Ngày 20 tháng 10 năm 2026, em mặc chiếc váy trắng, nắm tay anh bước vào một chương mới. Mình cưới nhau nhé!'
    }
  };

  /* ---------- 1) COUNTDOWN ---------- */
  var elDays = document.getElementById('cd-days');
  var elHours = document.getElementById('cd-hours');
  var elMins = document.getElementById('cd-mins');
  var elSecs = document.getElementById('cd-secs');

  if (elDays && elHours && elMins && elSecs) {
    function pad(n) { return String(n).padStart(2, '0'); }
    function setNum(el, value) {
      var newText = pad(value);
      if (el.textContent === newText) return;
      el.classList.add('tick');
      el.textContent = newText;
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { el.classList.remove('tick'); });
      });
    }

    function updateCountdown() {
      var now = new Date().getTime();
      var diff = WEDDING_DATE - now;
      if (diff <= 0) {
        setNum(elDays, 0); setNum(elHours, 0); setNum(elMins, 0); setNum(elSecs, 0);
        clearInterval(countdownTimer);
        return;
      }
      var days = Math.floor(diff / (1000 * 60 * 60 * 24));
      var hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      var mins = Math.floor((diff / (1000 * 60)) % 60);
      var secs = Math.floor((diff / 1000) % 60);
      setNum(elDays, days); setNum(elHours, hours); setNum(elMins, mins); setNum(elSecs, secs);
    }
    updateCountdown();
    var countdownTimer = setInterval(updateCountdown, 1000);
  }

  /* ---------- 2) DARK / LIGHT MODE ---------- */
  var themeToggle = document.getElementById('theme-toggle');
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  var savedTheme = null;

  // Safari có thể chặn localStorage khi trang được mở trực tiếp bằng file://.
  // Không để lỗi này làm dừng toàn bộ script trước khi Opening Gate được khởi tạo.
  try {
    savedTheme = localStorage.getItem('theme');
  } catch (storageError) {
    savedTheme = null;
  }

  var initialTheme = 'light';
  if (savedTheme) {
    initialTheme = savedTheme;
  } else {
    initialTheme = prefersDark.matches ? 'dark' : 'light';
  }

  if (initialTheme === 'light') {
    document.body.classList.remove('light-mode');
    if (themeToggle) {
      themeToggle.classList.remove('light');
      themeToggle.querySelector('.theme-icon').textContent = '🌙';
    }
  } else {
    document.body.classList.add('light-mode');
    if (themeToggle) {
      themeToggle.classList.add('light');
      themeToggle.querySelector('.theme-icon').textContent = '☀️';
    }
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      document.body.classList.toggle('light-mode');
      var isLight = document.body.classList.contains('light-mode');
      var icon = this.querySelector('.theme-icon');

      if (isLight) {
        icon.textContent = '☀️';
        this.classList.add('light');
        try { localStorage.setItem('theme', 'light'); } catch (storageError) {}
      } else {
        icon.textContent = '🌙';
        this.classList.remove('light');
        try { localStorage.setItem('theme', 'dark'); } catch (storageError) {}
      }
    });
  }

  /* ---------- 3) CUSTOM CURSOR ---------- */
  var cursor = document.getElementById('custom-cursor');
  if (cursor && window.matchMedia('(hover: hover)').matches) {
    document.addEventListener('mousemove', function (e) {
      cursor.style.opacity = '1';
      cursor.style.transform = 'translate(' + e.clientX + 'px, ' + e.clientY + 'px)';
    });
    var hoverEls = document.querySelectorAll('a, button, .btn, .upload-btn, .memory-card, .map-location-item, .glass-shine');
    hoverEls.forEach(function (el) {
      el.addEventListener('mouseenter', function () { cursor.classList.add('hover'); });
      el.addEventListener('mouseleave', function () { cursor.classList.remove('hover'); });
    });
    document.addEventListener('mouseleave', function () { cursor.style.opacity = '0'; });
  }

/* ---------- 4) CÁNH HOA TỰ NHIÊN — KHÔNG HỘI TỤ / KHÔNG XẾP CHỮ ---------- */
  var canvas = document.getElementById('petals-canvas');
  if (canvas) {
    var ctx = canvas.getContext('2d', { alpha: true });
    var width, height;
    var petals = [];
    var petalColors = ['#D8A79C', '#EDEFE5', '#F3ECE0', '#D8C9A3', '#C08D82'];
    var compactMotion = window.matchMedia('(max-width: 760px), (pointer: coarse)').matches;
    var totalPetals = compactMotion ? 72 : (safariRendering ? 90 : 120);
    var petalFrame = 0;
    var petalsRunning = false;

    var mouse = { x: -1000, y: -1000, vx: 0, vy: 0, active: false };
    var lastMouse = { x: -1000, y: -1000 };
    var scrollDir = 1;
    var lastScrollY = window.scrollY;

    function resizeCanvas() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    window.storyFrames.subscribe(function() {
      var currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY + 2) scrollDir = 1;
      else if (currentScrollY < lastScrollY - 2) scrollDir = -1;
      lastScrollY = currentScrollY;
    });

    window.addEventListener('mousemove', function(e) {
      mouse.x = e.clientX; mouse.y = e.clientY;
      mouse.vx = mouse.x - lastMouse.x; mouse.vy = mouse.y - lastMouse.y;
      lastMouse.x = mouse.x; lastMouse.y = mouse.y;
      mouse.active = true;
      clearTimeout(mouse.timer);
      mouse.timer = setTimeout(function() { mouse.vx = 0; mouse.vy = 0; mouse.active = false; }, 100);
    });

    var PetalPhysics = function (index) {
      this.index = index;
      this.reset(true);
    };

    PetalPhysics.prototype.reset = function (isInit) {
      this.x = Math.random() * width;
      this.y = isInit ? Math.random() * height : (scrollDir === 1 ? -30 : height + 30);
      
      this.baseSize = 9 + Math.random() * 6; 
      this.currentSize = this.baseSize; 
      
      this.baseSpeedY = 0.8 + Math.random() * 1.5;
      this.baseSpeedX = -0.5 + Math.random() * 1.0;
      
      this.vx = this.baseSpeedX;
      this.vy = this.baseSpeedY;
      
      this.rotation = Math.random() * Math.PI * 2;
      this.rotSpeed = -0.04 + Math.random() * 0.08;
      
      this.colorIndex = Math.floor(Math.random() * petalColors.length);
      
      this.wobble = Math.random() * 100;
      this.wobbleSpeed = 0.01 + Math.random() * 0.02;

    };

    PetalPhysics.prototype.update = function () {
      this.wobble += this.wobbleSpeed;
      var naturalX = Math.sin(this.wobble) * 1.2;
      var targetVy = scrollDir === 1 ? this.baseSpeedY : -(this.baseSpeedY * 2);
      var targetVx = this.baseSpeedX + naturalX;

      if (mouse.active) {
        var mdx = this.x - mouse.x, mdy = this.y - mouse.y;
        var mDist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mDist < 150) {
          var force = Math.pow((1 - mDist / 150), 2);
          this.vx += mouse.vx * force * .15;
          this.vy += mouse.vy * force * .15;
        }
      }

      this.vx += (targetVx - this.vx) * .05;
      this.vy += (targetVy - this.vy) * .05;
      this.vx *= .98;
      this.vy *= .98;
      this.rotation += this.rotSpeed;
      this.currentSize += (this.baseSize - this.currentSize) * .03;

      if (scrollDir === 1 && this.y > height + 50) this.reset(false);
      else if (scrollDir === -1 && this.y < -50) this.reset(false);
      if (this.x < -50) this.x = width + 50;
      if (this.x > width + 50) this.x = -50;

      this.x += this.vx;
      this.y += this.vy;
    };

    for (var i = 0; i < totalPetals; i++) {
      petals.push(new PetalPhysics(i));
    }

    function animatePetals() {
      petalFrame = 0;
      if (!petalsRunning || document.hidden) return;
      ctx.clearRect(0, 0, width, height);

      for (var i = 0; i < petals.length; i++) petals[i].update();

      // Batch theo 5 màu: từ 72 lần fill/save/rotate xuống còn 5 lần fill mỗi frame.
      ctx.globalAlpha = 0.78;
      for (var colorIndex = 0; colorIndex < petalColors.length; colorIndex++) {
        ctx.beginPath();
        for (var j = 0; j < petals.length; j++) {
          var petal = petals[j];
          if (petal.colorIndex !== colorIndex) continue;
          // ellipse() nối từ điểm cuối trước đó nếu path đã có subpath; moveTo
          // ngăn các cánh bị fill thành những tam giác lớn nối xuyên màn hình.
          ctx.moveTo(petal.x, petal.y);
          ctx.ellipse(petal.x, petal.y, petal.currentSize * 0.55, petal.currentSize * 0.25, petal.rotation, 0, Math.PI * 2);
        }
        ctx.fillStyle = petalColors[colorIndex];
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      petalFrame = requestAnimationFrame(animatePetals);
    }

    function schedulePetals() {
      if (petalsRunning && !document.hidden && !petalFrame) {
        petalFrame = requestAnimationFrame(animatePetals);
      }
    }

    function startPetals() {
      petalsRunning = true;
      schedulePetals();
    }

    window.addEventListener('wedding:intro-stop', startPetals, { once: true });
    document.addEventListener('visibilitychange', schedulePetals);
    if (window.isGateOpened) startPetals();
  }

  /* ---------- 5) PARTICLE INTRO & MUSIC AUTO-PLAY ---------- */
  window.isGateOpened = false;

  var music = document.getElementById('bg-music');
  var musicBtn = document.getElementById('music-toggle');

  window.playBackgroundMusic = function () {
    if (!music) return Promise.resolve(false);

    if (!music.paused) {
      if (musicBtn) {
        musicBtn.classList.add('playing');
        musicBtn.setAttribute('aria-pressed', 'true');
      }
      return Promise.resolve(true);
    }

    return music.play().then(function () {
      if (musicBtn) {
        musicBtn.classList.add('playing');
        musicBtn.setAttribute('aria-pressed', 'true');
      }
      return true;
    }).catch(function (error) {
      console.warn('Trình duyệt chưa cho phép phát nhạc nền:', error);
      return false;
    });
  };

  window.revealWeddingSite = function() {
    if (window.isGateOpened) return;
    window.isGateOpened = true;

    // Tự động phát nhạc khi trang được mở bằng nút Skip hoặc khi particle kết thúc.
    window.playBackgroundMusic();

    var overlay3d = document.getElementById('overlay-3d');
    if (overlay3d) {
      overlay3d.style.transition = 'opacity 1.5s ease';
      overlay3d.style.pointerEvents = 'none';
      overlay3d.style.opacity = '0';
      setTimeout(function() { overlay3d.classList.add('hidden'); }, 1500);
    }

    var nightGarden = document.getElementById('night-garden');
    if (nightGarden) {
      nightGarden.classList.add('active');
      nightGarden.setAttribute('aria-hidden', 'false');
    }
    loadDeferredNightBackgrounds();
    document.body.style.background = 'var(--bg-primary)';

    if (typeof window.initSparkles === 'function') window.initSparkles();
    
    document.documentElement.classList.remove('gate-open');
    
    // SỬA Ở ĐÂY: KHÓA CHẶT TRANG LẠI CHO ĐẾN KHI CHƠI XONG REWIND
    document.documentElement.style.setProperty('overflow', 'auto', 'important');
    document.documentElement.style.setProperty('height', 'auto', 'important');
    document.body.style.removeProperty('overflow');
    document.body.style.setProperty('overflow', 'visible', 'important');
    document.body.style.setProperty('height', 'auto', 'important');

    if (typeof window.observeChronicle === 'function') window.observeChronicle();
    if (typeof window.observeReveal === 'function') window.observeReveal();
    if (typeof window.observe3D === 'function') window.observe3D();

    // Yêu cầu module Three.js ngừng render sau khi overlay đã đóng.
    window.dispatchEvent(new Event('wedding:intro-stop'));
    window.storyFrames.request();
  };

  // Báo cho module particle biết gate controller đã sẵn sàng.
  // Tránh kẹt overlay nếu nhánh Reduce Motion/WebGL gọi bỏ qua trước DOMContentLoaded.
  window.dispatchEvent(new Event('wedding:gate-ready'));

  /* ---------- OPENING GATE FAILSAFE ---------- */
  var openingOverlay = document.getElementById('overlay-3d');
  var openingSkipBtn = document.getElementById('skip-btn');
  var openingFallbackTimer = null;

  function clearOpeningFallback() {
    if (openingFallbackTimer) {
      clearTimeout(openingFallbackTimer);
      openingFallbackTimer = null;
    }
  }

  function openWeddingFromGate(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === 'function') {
        event.stopImmediatePropagation();
      }
    }

    clearOpeningFallback();
    window.playBackgroundMusic();
    window.revealWeddingSite();
  }

  function armOpeningFallback() {
    clearOpeningFallback();

    // Intro bình thường mất khoảng 20 giây. Nếu module Three.js không gọi reveal,
    // tự mở NIGHT GARDEN để người xem không bị kẹt ở màn hình tên hai người.
    openingFallbackTimer = setTimeout(function () {
      if (!window.isGateOpened) {
        window.revealWeddingSite();
      }
    }, 24000);
  }

  if (openingSkipBtn && openingSkipBtn.dataset.gateBound !== 'true') {
    openingSkipBtn.dataset.gateBound = 'true';

    // Capture phase giúp nút Skip chạy trước listener click của overlay Three.js.
    openingSkipBtn.addEventListener('click', openWeddingFromGate, true);
    openingSkipBtn.addEventListener('pointerup', function (event) {
      if (event.pointerType === 'touch') openWeddingFromGate(event);
    }, true);
  }

  if (openingOverlay) {
    openingOverlay.addEventListener('click', function (event) {
      if (event.target !== openingSkipBtn) armOpeningFallback();
    });

    openingOverlay.addEventListener('touchend', function (event) {
      if (event.target !== openingSkipBtn) armOpeningFallback();
    }, { passive: true });
  }

  window.addEventListener('keydown', function (event) {
    if ((event.key === 'Enter' || event.key === ' ') && !window.isGateOpened) {
      armOpeningFallback();
    }
  });

  /* ---------- 7) NIGHT GARDEN - VẦNG SÁNG ---------- */
  var nightLight = document.getElementById('night-light');
  if (nightLight) {
    document.addEventListener('mousemove', function (e) {
      nightLight.style.left = e.clientX + 'px'; nightLight.style.top = e.clientY + 'px';
    });
    document.addEventListener('touchmove', function (e) {
      var touch = e.touches[0];
      nightLight.style.left = touch.clientX + 'px'; nightLight.style.top = touch.clientY + 'px';
    }, { passive: true });
  }

  /* ---------- 8) SPARKLES ---------- */
  var sparkleCanvas = document.getElementById('sparkle-canvas');
  var sparkleCtx, sparkleWidth, sparkleHeight;
  var sparkles = [];
  var isSparkleRunning = false;
  var sparkleInView = false;
  var sparkleFrame = 0;

  function scheduleSparkles() {
    if (isSparkleRunning && sparkleInView && !document.hidden && !sparkleFrame) {
      sparkleFrame = requestAnimationFrame(animateSparkles);
    }
  }

  window.initSparkles = function() {
    if (!sparkleCanvas || isSparkleRunning) return;
    sparkleCtx = sparkleCanvas.getContext('2d');
    sparkleWidth = sparkleCanvas.width = window.innerWidth;
    sparkleHeight = sparkleCanvas.height = window.innerHeight;
    sparkles.length = 0;

    var sparkleCount = window.matchMedia('(max-width: 760px), (pointer: coarse)').matches ? 48 : (safariRendering ? 58 : 72);
    for (var i = 0; i < sparkleCount; i++) {
      sparkles.push({
        x: Math.random() * sparkleWidth, y: Math.random() * sparkleHeight,
        size: 1 + Math.random() * 3, speedX: (Math.random() - 0.5) * 0.3, speedY: (Math.random() - 0.5) * 0.3,
        opacity: 0.3 + Math.random() * 0.7, twinkleSpeed: 0.5 + Math.random() * 1.5
      });
    }
    isSparkleRunning = true;
    scheduleSparkles();
  }

  function animateSparkles() {
    sparkleFrame = 0;
    if (!isSparkleRunning || !sparkleInView || document.hidden) return;
    sparkleCtx.clearRect(0, 0, sparkleWidth, sparkleHeight);

    for (var i = 0; i < sparkles.length; i++) {
      var s = sparkles[i];
      s.x += s.speedX; s.y += s.speedY;
      if (s.x < 0 || s.x > sparkleWidth) s.speedX *= -1;
      if (s.y < 0 || s.y > sparkleHeight) s.speedY *= -1;
      s.opacity = 0.3 + Math.sin(Date.now() / 1000 * s.twinkleSpeed) * 0.3 + 0.4;

      sparkleCtx.beginPath();
      sparkleCtx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      sparkleCtx.fillStyle = 'rgba(255, 215, 150, ' + s.opacity * 0.6 + ')';
      sparkleCtx.fill();
      sparkleCtx.shadowColor = 'rgba(255, 215, 150, 0.3)';
      sparkleCtx.shadowBlur = 10;
    }
    sparkleFrame = requestAnimationFrame(animateSparkles);
  }

  var sparkleSection = document.getElementById('night-garden');
  if (sparkleSection && 'IntersectionObserver' in window) {
    new IntersectionObserver(function(entries) {
      sparkleInView = entries.some(function(entry) { return entry.isIntersecting; });
      scheduleSparkles();
    }, { rootMargin: '15% 0px' }).observe(sparkleSection);
  } else {
    sparkleInView = true;
  }
  document.addEventListener('visibilitychange', scheduleSparkles);

  window.addEventListener('resize', function () {
    if (sparkleCanvas) {
      sparkleWidth = sparkleCanvas.width = window.innerWidth;
      sparkleHeight = sparkleCanvas.height = window.innerHeight;
    }
  });
  
/* ---------- RED THREAD (Sợi chỉ đỏ định mệnh) ---------- */
// Khai báo biến toàn cục để Rewind có thể điều khiển
window.isRewindActive = false;

var threadCanvas = document.createElement('canvas');
threadCanvas.className = 'red-thread-canvas';
document.body.appendChild(threadCanvas);
var tCtx = threadCanvas.getContext('2d');

function resizeThread() {
  threadCanvas.width = window.innerWidth;
  threadCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeThread);
resizeThread();

// Hàm vẽ sợi chỉ với tham số rewindProgress (0-1) để điều khiển mức độ đứt
function drawRedThread(rewindProgress) {
  if (!tCtx) return;
  threadCanvas.style.opacity = '0.8';
  var scrollY = window.scrollY;
  var docH = document.documentElement.scrollHeight - window.innerHeight;
  var scrollProgress = Math.min(1, Math.max(0, scrollY / docH));
  
  tCtx.clearRect(0, 0, threadCanvas.width, threadCanvas.height);
  tCtx.beginPath();

  var centerX = threadCanvas.width / 2;
  var totalHeight = scrollProgress * threadCanvas.height;

  // Nếu rewindProgress > 0, vẽ đứt gãy với mức độ tăng dần
  if (rewindProgress > 0) {
    var segLen = Math.max(2, 8 - rewindProgress * 6); // 8 -> 2
    var gapLen = 4 + rewindProgress * 20; // 4 -> 24
    var opacity = 0.7 - rewindProgress * 0.5; // 0.7 -> 0.2
    var lineWidth = Math.max(0.5, 1.5 - rewindProgress * 0.8); // 1.5 -> 0.7
    
    var y = 0;
    var draw = true;
    while (y < totalHeight) {
      if (draw) {
        var endY = Math.min(y + segLen, totalHeight);
        var x1 = centerX + Math.sin(y * 0.015 + scrollProgress * 5) * 40;
        var x2 = centerX + Math.sin(endY * 0.015 + scrollProgress * 5) * 40;
        tCtx.moveTo(x1, y);
        tCtx.lineTo(x2, endY);
      }
      y += draw ? segLen : gapLen;
      draw = !draw;
    }
    tCtx.strokeStyle = 'rgba(192, 141, 130, ' + opacity + ')';
    tCtx.lineWidth = lineWidth;
    tCtx.shadowColor = 'rgba(216, 167, 156, ' + (opacity * 0.6) + ')';
    tCtx.shadowBlur = 4 * (1 - rewindProgress * 0.7);
    tCtx.stroke();

    // Hạt vụn đỏ rải rác
    var dustCount = Math.floor(10 + rewindProgress * 30);
    for (var i = 0; i < dustCount; i++) {
      var randY = Math.random() * totalHeight;
      var randX = centerX + Math.sin(randY * 0.015 + scrollProgress * 5) * 40 + (Math.random() - 0.5) * (20 + rewindProgress * 40);
      tCtx.beginPath();
      tCtx.arc(randX, randY, 1 + Math.random() * (2 + rewindProgress * 2), 0, Math.PI * 2);
      tCtx.fillStyle = 'rgba(192, 141, 130, ' + (0.3 + rewindProgress * 0.5) + ')';
      tCtx.shadowColor = 'rgba(216, 167, 156, 0.2)';
      tCtx.shadowBlur = 4;
      tCtx.fill();
    }
  } else {
    // Vẽ liền mạch bình thường
    tCtx.moveTo(centerX, 0);
    for (var y = 0; y <= totalHeight; y += 5) {
      var x = centerX + Math.sin(y * 0.015 + scrollProgress * 5) * 40;
      tCtx.lineTo(x, y);
    }
    tCtx.strokeStyle = 'rgba(192, 141, 130, 0.7)';
    tCtx.lineWidth = 1.5;
    tCtx.shadowColor = 'rgba(216, 167, 156, 0.5)';
    tCtx.shadowBlur = 4;
    tCtx.stroke();
  }

  // Vẽ trái tim ở cuối
  if (scrollProgress > 0.99) {
    var tipY = totalHeight;
    var tipX = centerX + Math.sin(tipY * 0.015 + scrollProgress * 5) * 40;
    tCtx.font = '20px Arial';
    tCtx.textAlign = 'center';
    tCtx.textBaseline = 'middle';
    tCtx.shadowColor = 'rgba(255, 50, 50, 0.6)';
    tCtx.shadowBlur = 12;
    tCtx.fillStyle = '#ff4d4d';
    tCtx.fillText('❤️', tipX, tipY + 15);
  }
}

function clearRedThread() {
  if (!tCtx) return;
  tCtx.clearRect(0, 0, threadCanvas.width, threadCanvas.height);
}

// Lắng nghe sự kiện scroll để vẽ sợi chỉ với rewindProgress = 0 (mặc định)
var act0ThreadSection = document.getElementById('super-act');
window.storyFrames.subscribe(function() {
  if (!window.isGateOpened) return;
  if (act0ThreadSection) {
    var act0Rect = act0ThreadSection.getBoundingClientRect();
    if (act0Rect.top < window.innerHeight && act0Rect.bottom > 0) {
      if (!window.isRewindActive) clearRedThread();
      return;
    }
  }
  drawRedThread(0);
});

  /* ---------- 9) CHRONICLE TYPEWRITER & DUAL PERSPECTIVE ---------- */
  var typedActs = {};

  function typeAct(id, text, speed) {
    speed = speed || 35;
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = '';
    var index = 0;
    var cursor = el.parentElement.querySelector('.act-cursor');

    function typeChar() {
      if (index < text.length) {
        el.textContent += text.charAt(index);
        index++;
        setTimeout(typeChar, speed);
      } else {
        if (cursor) cursor.style.opacity = '0';
      }
    }
    typeChar();
  }
  
  // Dual Perspective Toggle Logic
  document.querySelectorAll('.pt-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
       var parent = this.closest('.perspective-toggle');
       parent.querySelectorAll('.pt-btn').forEach(function(b) { b.classList.remove('active'); });
       this.classList.add('active');
       
       var actId = this.getAttribute('data-act');
       var persp = this.getAttribute('data-persp');
       var textTarget = document.getElementById(actId + '-text');
       
       if(textTarget && actTexts[actId] && actTexts[actId][persp]) {
          textTarget.style.opacity = 0;
          setTimeout(function() {
             textTarget.style.opacity = 1;
             typeAct(actId + '-text', actTexts[actId][persp], 30);
          }, 300);
       }
    });
  });

  window.observeChronicle = function() {
    var acts = document.querySelectorAll('.act');
    if ('IntersectionObserver' in window) {
      var actObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var act = entry.target;
            act.classList.add('visible');

            var textId = act.querySelector('.act-text')?.id;
            var actId = textId ? textId.replace('-text', '') : null;
            if (textId && actTexts[actId] && actTexts[actId]['groom'] && !typedActs[textId]) {
              typedActs[textId] = true;
              setTimeout(function () {
                typeAct(textId, actTexts[actId]['groom'], 35);
              }, 600);
            }
          }
        });
      }, { threshold: 0.4 });

      acts.forEach(function (act) { actObserver.observe(act); });
    } else {
      acts.forEach(function (act) {
        act.classList.add('visible');
        var textId = act.querySelector('.act-text')?.id;
        var actId = textId ? textId.replace('-text', '') : null;
        if (textId && actTexts[actId]) document.getElementById(textId).textContent = actTexts[actId]['groom'];
      });
    }
  }

/* ==========================================================
     ACT 0 ENGINE — HOLD TO UNLOCK, SCROLL TO DIRECT
     ========================================================== */
  const rewindBtn = document.getElementById('rewind-btn');
  const circle = document.querySelector('.progress-ring__circle');
  const saSection = document.getElementById('super-act');
  const saPresent = document.getElementById('sa-present');
  const probNum = document.getElementById('sa-prob-num');
  const probLabel = document.getElementById('sa-prob-label');
  const rewindFrame = document.getElementById('sa-rewind-frame');
  const flashLayers = [document.getElementById('sa-flash-img'), document.getElementById('sa-flash-img-next')];
  const rewindTime = document.getElementById('sa-rewind-time');

  if (rewindBtn && circle && saSection) {
    const radius = parseFloat(circle.getAttribute('r')) || 40;
    const circumference = radius * 2 * Math.PI;
    const holdDuration = 3500;
    const rewindList = [
      { src: 'images/anh_cuoi_8.jpg', stamp: '20.10.2026 · HIỆN TẠI' },
      { src: 'images/anh_cuoi_3.jpg', stamp: 'KÝ ỨC · T−01' },
      { src: 'images/anh_story_3.jpg', stamp: 'KÝ ỨC · T−02' },
      { src: 'images/anh_story_2.jpg', stamp: 'KÝ ỨC · T−03' },
      { src: 'images/anh_cau_hon.jpg', stamp: 'KÝ ỨC · T−04' },
      { src: 'images/anh_story_1.jpg', stamp: 'KÝ ỨC · T−05' },
      { src: 'images/anh_gap_go.jpg', stamp: '14.06.2019 · 17:42' }
    ];
    const probSteps = [
      { threshold: 0, num: 8992304, label: 'Người có thể lướt qua giữa thành phố' },
      { threshold: 0.25, num: 3420, label: 'Lần có thể đi qua cùng một con phố' },
      { threshold: 0.50, num: 12, label: 'Những mối liên hệ chung' },
      { threshold: 0.75, num: 2, label: 'Hai người có thể dừng lại' },
      { threshold: 1, num: 1, label: 'Dòng thời gian đã thực sự xảy ra' }
    ];

    const saAlternate = document.getElementById('sa-alternate');
    const saParallel = document.getElementById('sa-parallel');
    const saConvergence = document.getElementById('sa-convergence');
    const saFinale = document.getElementById('sa-finale');
    const scrollProgressBar = document.getElementById('sa-scroll-progress');
    const scrollProgressText = document.getElementById('sa-scroll-percent');
    const timelineRows = Array.from(saSection.querySelectorAll('.timeline-row'));
    const glitchItems = Array.from(saSection.querySelectorAll('.glitch-item'));
    const alternateLines = Array.from(saSection.querySelectorAll('.sa-alternate .alt-text'));
    const silhouettes = Array.from(saSection.querySelectorAll('.sa-silhouette'));
    const oneGlyph = document.querySelector('.sa-one');
    const rainDrop = document.getElementById('raindrop');
    const threadEnds = Array.from(saSection.querySelectorAll('.thread-end'));
    const particles = Array.from(saSection.querySelectorAll('.sa-particles span'));
    const finaleTexts = Array.from(saSection.querySelectorAll('.sa-finale .c-text'));
    const nextCue = saSection.querySelector('.sa-next-cue');

    let holdReq = 0;
    let holdStartTime = 0;
    let isHolding = false;
    let isRewound = false;
    let activeFlashLayer = 0;
    let lastImageIndex = -1;
    let act0Frame = 0;

    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = circumference;

    const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
    const segment = (value, start, end) => clamp((value - start) / (end - start));
    const envelope = (value, fadeInStart, fadeInEnd, fadeOutStart, fadeOutEnd) => {
      const fadeIn = segment(value, fadeInStart, fadeInEnd);
      const fadeOut = fadeOutEnd <= fadeOutStart ? 1 : 1 - segment(value, fadeOutStart, fadeOutEnd);
      return clamp(Math.min(fadeIn, fadeOut));
    };
    const formatProbability = value => Number(value).toLocaleString('vi-VN');

    const setHoldProgress = progress => {
      const safeProgress = clamp(progress);
      circle.style.strokeDashoffset = circumference - safeProgress * circumference;
      saPresent.style.setProperty('--rewind-p', safeProgress.toFixed(4));
    };

    const updateProbability = progress => {
      let currentStep = probSteps[0];
      for (let index = probSteps.length - 1; index >= 0; index--) {
        if (progress >= probSteps[index].threshold) {
          currentStep = probSteps[index];
          break;
        }
      }
      if (probNum) probNum.textContent = formatProbability(currentStep.num);
      if (probLabel) probLabel.textContent = currentStep.label;
      if (probNum) {
        probNum.style.color = progress >= 1 ? 'var(--rose-deep)' : '';
        probNum.style.transform = progress >= 1 ? 'scale(1.16) translateY(-8px)' : '';
        probNum.style.textShadow = progress >= 1 ? '0 0 30px rgba(192, 141, 130, 0.8)' : '';
      }
    };

    function showRewindImage(index) {
      if (index === lastImageIndex || !rewindList[index]) return;
      lastImageIndex = index;
      const nextLayer = activeFlashLayer === 0 ? 1 : 0;
      const incoming = flashLayers[nextLayer];
      const outgoing = flashLayers[activeFlashLayer];
      if (incoming) {
        incoming.style.backgroundImage = `url('${rewindList[index].src}')`;
        incoming.classList.add('is-current');
      }
      if (outgoing) outgoing.classList.remove('is-current');
      activeFlashLayer = nextLayer;
      if (rewindTime) rewindTime.textContent = rewindList[index].stamp;
    }

    function resetHoldVisuals() {
      setHoldProgress(0);
      updateProbability(0);
      saPresent.classList.remove('rewind-active');
      rewindFrame?.classList.remove('is-visible');
      flashLayers.forEach(layer => layer?.classList.remove('is-current'));
      lastImageIndex = -1;
      if (typeof clearRedThread === 'function') clearRedThread();
    }

    function ensureExpandedAct0Height() {
      if (!isRewound) return;
      const viewportHeight = Math.max(window.innerHeight || 0, document.documentElement.clientHeight || 0, 640);
      const screenCount = window.innerWidth <= 680 ? 4.6 : 4.2;
      saSection.style.minHeight = `${Math.round(viewportHeight * screenCount)}px`;
    }

    const startHold = event => {
      if (event && event.cancelable) event.preventDefault();
      if (isRewound || isHolding) return;
      if (event && event.button !== undefined && event.button !== 0) return;
      isHolding = true;
      window.isRewindActive = true;
      rewindBtn.classList.add('is-holding');
      saPresent.classList.add('rewind-active');
      rewindFrame?.classList.add('is-visible');
      holdStartTime = performance.now();
      holdReq = requestAnimationFrame(holdLoop);
    };

    const stopHold = event => {
      if (event && event.cancelable) event.preventDefault();
      if (!isHolding) return;
      isHolding = false;
      window.isRewindActive = false;
      rewindBtn.classList.remove('is-holding');
      cancelAnimationFrame(holdReq);
      if (!isRewound) resetHoldVisuals();
    };

    const holdLoop = now => {
      if (!isHolding) return;
      const progress = clamp((now - holdStartTime) / holdDuration);
      setHoldProgress(progress);
      updateProbability(progress);
      if (progress > 0.035) {
        rewindFrame?.classList.add('is-visible');
        showRewindImage(Math.min(rewindList.length - 1, Math.floor(progress * rewindList.length)));
      }
      if (typeof drawRedThread === 'function') drawRedThread(progress);

      if (progress < 1) holdReq = requestAnimationFrame(holdLoop);
      else finishRewind();
    };

    const finishRewind = () => {
      isHolding = false;
      isRewound = true;
      window.isRewindActive = false;
      rewindBtn.classList.remove('is-holding');
      rewindBtn.setAttribute('aria-disabled', 'true');
      saSection.classList.add('is-rewound');
      document.body.classList.add('act0-rewound');
      ensureExpandedAct0Height();
      saPresent.style.pointerEvents = 'none';
      rewindFrame?.classList.remove('is-visible');
      updateProbability(1);
      if (typeof clearRedThread === 'function') clearRedThread();
      renderAct0();
    };

    function setScene(scene, opacity, translateY, scale) {
      if (!scene) return;
      scene.style.display = 'flex';
      scene.style.visibility = 'visible';
      scene.style.opacity = opacity.toFixed(3);
      scene.style.transform = `translate3d(0, ${translateY.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
      scene.style.filter = 'none';
      scene.setAttribute('aria-hidden', opacity > 0.08 ? 'false' : 'true');
    }

    function renderAct0() {
      act0Frame = 0;
      if (!isRewound) return;

      const sectionRect = saSection.getBoundingClientRect();
      const isNearAct0 = sectionRect.top < window.innerHeight * 1.5 && sectionRect.bottom > -window.innerHeight;
      if (!isNearAct0) return;
      const travel = Math.max(1, sectionRect.height - window.innerHeight);
      const progress = clamp(-sectionRect.top / travel);
      const alternateOpacity = envelope(progress, 0, .035, .18, .27);
      const parallelOpacity = envelope(progress, .18, .27, .58, .69);
      const convergenceOpacity = envelope(progress, .58, .66, .79, .88);
      const finaleOpacity = segment(progress, .79, .9);
      const parallelProgress = segment(progress, .22, .61);
      const convergenceProgress = segment(progress, .61, .84);
      const finaleProgress = segment(progress, .8, .98);

      saSection.style.setProperty('--act0-progress', progress.toFixed(4));
      saSection.style.setProperty('--parallel-progress', parallelProgress.toFixed(4));
      saSection.style.setProperty('--convergence-progress', convergenceProgress.toFixed(4));
      saSection.style.setProperty('--finale-progress', finaleProgress.toFixed(4));
      if (scrollProgressBar) scrollProgressBar.style.width = `${Math.round(progress * 100)}%`;
      if (scrollProgressText) scrollProgressText.textContent = `${Math.round(progress * 100)}%`;

      const presentOpacity = 1 - segment(progress, 0, .04);
      saPresent.style.opacity = presentOpacity.toFixed(3);
      saPresent.style.transform = `translate3d(0, ${(-24 * segment(progress, 0, .06)).toFixed(1)}px, 0)`;
      saPresent.style.filter = `blur(${((safariRendering ? 4 : 8) * (1 - presentOpacity)).toFixed(2)}px)`;

      setScene(saAlternate, alternateOpacity, 20 * (1 - alternateOpacity), 1);
      setScene(saParallel, parallelOpacity, 16 * (1 - parallelOpacity), .985 + parallelOpacity * .015);
      setScene(saConvergence, convergenceOpacity, 10 * (1 - convergenceOpacity), 1);
      setScene(saFinale, finaleOpacity, 0, 1.025 - finaleOpacity * .025);

      const alternateProgress = segment(progress, 0, .24);
      alternateLines.forEach((line, index) => {
        const lineProgress = segment(progress, .006 + index * .03, .055 + index * .035) * alternateOpacity;
        line.style.opacity = lineProgress.toFixed(3);
        line.style.transform = `translateY(${((1 - lineProgress) * 22).toFixed(1)}px)`;
        line.style.filter = `blur(${((1 - lineProgress) * (safariRendering ? 2.5 : 5)).toFixed(1)}px)`;
      });
      silhouettes.forEach((silhouette, index) => {
        const travelPercent = 8 + alternateProgress * 84;
        if (index === 0) silhouette.style.left = `${travelPercent}%`;
        else silhouette.style.right = `${travelPercent}%`;
      });
      glitchItems.forEach((item, index) => {
        const itemStart = .035 + index * .045;
        const itemOpacity = envelope(progress, itemStart, itemStart + .018, itemStart + .055, itemStart + .085) * alternateOpacity;
        item.style.opacity = itemOpacity.toFixed(3);
        item.style.transform = `translate3d(${((1 - itemOpacity) * (index % 2 ? 14 : -14)).toFixed(1)}px,0,0)`;
        item.style.filter = `blur(${((1 - itemOpacity) * 2).toFixed(1)}px)`;
      });

      timelineRows.forEach((row, index) => {
        const threshold = (index + .45) / timelineRows.length;
        row.classList.toggle('is-active', parallelProgress >= threshold);
      });

      if (oneGlyph) {
        const morph = segment(convergenceProgress, .25, .72);
        oneGlyph.style.opacity = (1 - morph).toFixed(3);
        oneGlyph.style.transform = `scaleY(${(1 - morph * .68).toFixed(3)}) scaleX(${(1 - morph * .78).toFixed(3)}) translateY(${(morph * 28).toFixed(1)}px)`;
        oneGlyph.style.filter = `blur(${(morph * 5).toFixed(1)}px)`;
      }
      if (rainDrop) {
        const dropProgress = segment(convergenceProgress, .46, 1);
        rainDrop.style.opacity = clamp(dropProgress * 1.7).toFixed(3);
        rainDrop.style.transform = `translate(-50%, calc(-50% + ${Math.round(dropProgress * 46)}vh)) rotate(45deg) scale(${(0.65 + dropProgress * .55).toFixed(2)})`;
      }
      threadEnds.forEach((thread, index) => {
        const join = segment(convergenceProgress, .18, .84);
        thread.style.width = `${44 + join * 6}%`;
        thread.style.opacity = clamp(join * 1.4).toFixed(3);
        thread.style.transform = index === 1 ? 'rotate(180deg)' : '';
      });
      particles.forEach((particle, index) => {
        const gather = segment(convergenceProgress, .08 + (index % 4) * .035, .82);
        particle.style.opacity = (1 - gather * .45).toFixed(3);
        particle.style.transform = `translateX(${(index < 4 ? 1 : -1) * gather * (34 - (index % 4) * 7)}vw) scale(${(1 + gather * .7).toFixed(2)})`;
      });

      finaleTexts.forEach((text, index) => {
        const textProgress = segment(finaleProgress, .42 + index * .16, .62 + index * .16);
        text.style.opacity = textProgress.toFixed(3);
        text.style.transform = `translateY(${((1 - textProgress) * 18).toFixed(1)}px)`;
      });
      if (nextCue) nextCue.style.opacity = segment(finaleProgress, .82, 1).toFixed(3);
    }

    function scheduleAct0Render() {
      if (!act0Frame) act0Frame = requestAnimationFrame(renderAct0);
    }

    function isInsideRewindButton(event) {
      if (event.target && event.target.closest && event.target.closest('#rewind-btn')) return true;

      // Fallback theo tọa độ: vẫn nhận được thao tác nếu một lớp hiệu ứng trong
      // suốt vô tình nằm trên nút và trở thành event target.
      const rect = rewindBtn.getBoundingClientRect();
      return event.clientX >= rect.left && event.clientX <= rect.right &&
             event.clientY >= rect.top && event.clientY <= rect.bottom;
    }

    function pointerStart(event) {
      if (event.isPrimary === false || !isInsideRewindButton(event)) return;
      startHold(event);
    }

    function pointerMove(event) {
      if (isHolding && event.cancelable) event.preventDefault();
    }

    // Capture phase nhận sự kiện trước mọi canvas/overlay của concept.
    if ('PointerEvent' in window) {
      document.addEventListener('pointerdown', pointerStart, { capture: true, passive: false });
      document.addEventListener('pointermove', pointerMove, { capture: true, passive: false });
      document.addEventListener('pointerup', stopHold, true);
      document.addEventListener('pointercancel', stopHold, true);
    } else {
      // Fallback cho WebView/Safari cũ chưa hỗ trợ Pointer Events.
      rewindBtn.addEventListener('mousedown', startHold);
      window.addEventListener('mouseup', stopHold);
      rewindBtn.addEventListener('touchstart', startHold, { passive: false });
      window.addEventListener('touchend', stopHold, { passive: false });
      window.addEventListener('touchcancel', stopHold, { passive: false });
    }
    window.addEventListener('blur', stopHold);
    rewindBtn.addEventListener('contextmenu', function (event) { event.preventDefault(); });
    rewindBtn.addEventListener('dragstart', function (event) { event.preventDefault(); });
    rewindBtn.dataset.rewindBound = 'true';

    // Cho phép giữ Space/Enter khi điều khiển bằng bàn phím.
    rewindBtn.addEventListener('keydown', function (event) {
      if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) startHold(event);
    });
    rewindBtn.addEventListener('keyup', function (event) {
      if (event.key === 'Enter' || event.key === ' ') stopHold(event);
    });

    const saObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          saPresent.classList.add('play-anim');
          saObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    saObserver.observe(saSection);
    window.storyFrames.subscribe(scheduleAct0Render);
    window.addEventListener('resize', function () {
      ensureExpandedAct0Height();
      scheduleAct0Render();
    }, { passive: true });

    const act1Shell = document.getElementById('act-1');
    if (act1Shell && 'IntersectionObserver' in window) {
      const act1Observer = new IntersectionObserver(entries => {
        if (document.body.classList.contains('act0-rewound') && entries.some(entry => entry.isIntersecting)) {
          if (typeof window.initFogCanvas === 'function') window.initFogCanvas();
          act1Observer.disconnect();
        }
      }, { rootMargin: '35% 0px', threshold: 0.01 });
      act1Observer.observe(act1Shell);
    }

  } // Khóa đóng của lệnh if (rewindBtn && circle)

  /* ==========================================================
     ACT I ENGINE — 17:42 / GẶP NHAU
     ========================================================== */
  const act1Section = document.getElementById('act-1');
  const act1Cinematic = document.getElementById('act-1-cinematic');
  const act1PerspectiveScene = document.getElementById('a1-perspective-scene');
  const act1TimeScene = document.getElementById('a1-time-scene');
  const act1OutroScene = document.getElementById('a1-outro-scene');
  const act1Perspective = document.getElementById('a1-perspective');
  const act1PerspectiveRange = document.getElementById('a1-perspective-range');
  const act1LiveTime = document.getElementById('a1-live-time');
  const act1ProgressBar = document.getElementById('a1-scroll-progress');
  const act1ProgressText = document.getElementById('a1-scroll-percent');
  const act1HiddenJourney = document.getElementById('hidden-journey');

  if (act1Section && act1Cinematic) {
    let act1Frame = 0;
    let act1FogCleared = false;
    let act2FlowRevealed = false;

    const a1Clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
    const a1Segment = (value, start, end) => a1Clamp((value - start) / (end - start));
    const a1Envelope = (value, inStart, inEnd, outStart, outEnd) => {
      const fadeIn = a1Segment(value, inStart, inEnd);
      const fadeOut = outEnd <= outStart ? 1 : 1 - a1Segment(value, outStart, outEnd);
      return a1Clamp(Math.min(fadeIn, fadeOut));
    };

    function revealAct2Flow() {
      if (act2FlowRevealed || !act1HiddenJourney) return;
      act2FlowRevealed = true;
      act1HiddenJourney.style.display = 'block';
      requestAnimationFrame(() => {
        act1HiddenJourney.style.opacity = '1';
        window.dispatchEvent(new Event('resize'));
      });
    }

    function setAct1Scene(scene, opacity, translateY = 0, scale = 1) {
      if (!scene) return;
      scene.style.display = 'flex';
      scene.style.visibility = 'visible';
      scene.style.opacity = opacity.toFixed(3);
      scene.style.transform = `translate3d(0, ${translateY.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
      const isInteractivePerspective = scene === act1PerspectiveScene && opacity > .62;
      const isInteractiveFog = scene === act1Cinematic && opacity > .18;
      scene.style.pointerEvents = isInteractivePerspective || isInteractiveFog ? 'auto' : 'none';
      scene.setAttribute('aria-hidden', opacity > .08 ? 'false' : 'true');
    }

    function updateAct1Perspective(value) {
      if (!act1Perspective) return;
      const split = a1Clamp(Number(value), 0, 100);
      act1Perspective.style.setProperty('--a1-split', `${split}%`);
      act1Perspective.classList.toggle('is-centered', split >= 45 && split <= 55);
      if (act1PerspectiveRange) act1PerspectiveRange.setAttribute('aria-valuetext', `${Math.round(split)}% giữa góc nhìn của anh và em`);
    }

    function renderAct1() {
      act1Frame = 0;
      if (!document.body.classList.contains('act0-rewound')) return;

      const rect = act1Section.getBoundingClientRect();
      const shouldRenderAct1 = rect.top < window.innerHeight * 1.5 && rect.bottom > -window.innerHeight;
      const travel = Math.max(1, rect.height - window.innerHeight);
      const progress = a1Clamp(-rect.top / travel);
      const isNearAct1 = rect.top < window.innerHeight * 1.15 && rect.bottom > 0;
      document.body.classList.toggle('act1-active', isNearAct1);
      if (!shouldRenderAct1) return;

      if (isNearAct1) revealAct2Flow();
      if (isNearAct1 && typeof window.initFogCanvas === 'function') window.initFogCanvas();

      // Giữ nguyên màn kính cho tới khi người xem chủ động lau hoặc bỏ qua.
      // Việc clamp này cũng bảo vệ scene nếu trang bị cuộn bằng bàn phím hay script.
      const storyProgress = act1FogCleared ? progress : Math.min(progress, .08);
      const openingOpacity = 1 - a1Segment(storyProgress, .14, .24);
      const perspectiveOpacity = a1Envelope(storyProgress, .16, .25, .5, .61);
      const timeOpacity = a1Envelope(storyProgress, .51, .61, .75, .85);
      const outroOpacity = a1Segment(storyProgress, .76, .87);
      const openingProgress = a1Segment(storyProgress, 0, .2);
      const timeProgress = a1Segment(storyProgress, .56, .79);
      const outroProgress = a1Segment(storyProgress, .79, .98);

      act1Section.style.setProperty('--a1-progress', storyProgress.toFixed(4));
      act1Section.style.setProperty('--a1-opening-p', openingProgress.toFixed(4));
      act1Section.style.setProperty('--a1-time-p', timeProgress.toFixed(4));
      act1Section.style.setProperty('--a1-outro-p', outroProgress.toFixed(4));
      if (act1ProgressBar) act1ProgressBar.style.width = `${Math.round(storyProgress * 100)}%`;
      if (act1ProgressText) act1ProgressText.textContent = `${Math.round(storyProgress * 100)}%`;

      setAct1Scene(act1Cinematic, openingOpacity, -12 * (1 - openingOpacity), 1);
      setAct1Scene(act1PerspectiveScene, perspectiveOpacity, 16 * (1 - perspectiveOpacity), .985 + perspectiveOpacity * .015);
      setAct1Scene(act1TimeScene, timeOpacity, 12 * (1 - timeOpacity), 1);
      setAct1Scene(act1OutroScene, outroOpacity, 0, 1.02 - outroOpacity * .02);

      if (act1LiveTime) {
        const showNextMinute = timeProgress >= .46;
        act1LiveTime.textContent = showNextMinute ? '17:43' : '17:42';
        act1LiveTime.style.color = showNextMinute ? '#d9a19a' : '#f3ece6';
        act1LiveTime.style.transform = `translateY(${showNextMinute ? '-2px' : '0'})`;
      }
    }

    function scheduleAct1Render() {
      if (!act1Frame) act1Frame = requestAnimationFrame(renderAct1);
    }

    if (act1PerspectiveRange) {
      act1PerspectiveRange.addEventListener('input', event => updateAct1Perspective(event.target.value));
      updateAct1Perspective(act1PerspectiveRange.value);
    }
    window.addEventListener('act1:fog-cleared', () => {
      act1FogCleared = true;
      scheduleAct1Render();
    });
    window.storyFrames.subscribe(scheduleAct1Render);
  }

  /* ---------- MANUAL FOCUS GALLERY LOGIC ---------- */
  var focusSlider = document.getElementById('focus-slider');
  var focusImg = document.getElementById('focus-img');
  var focusPeaking = document.getElementById('focus-peaking');
  var focusHint = document.getElementById('focus-hint');
  var epilogueSection = document.getElementById('epilogue');
  var proposalAnswer = document.getElementById('proposal-answer');
  var lastFocusRender = -1;

  window.setEpilogueFocus = function(value, fromManualInput) {
    var focusValue = Math.max(0, Math.min(100, Number(value) || 0));
    if (!fromManualInput && Math.abs(focusValue - lastFocusRender) < 0.3) return;
    lastFocusRender = focusValue;
    var ratio = focusValue / 100;
    if (focusSlider && !fromManualInput) focusSlider.value = String(Math.round(focusValue));
    if (epilogueSection) epilogueSection.style.setProperty('--epi-focus-value', ratio.toFixed(4));
    if (focusImg) {
      focusImg.style.filter = 'blur(' + ((1 - ratio) * (safariRendering ? 12 : 20)).toFixed(2) + 'px)';
      focusImg.style.transform = 'scale(' + (1.06 - ratio * .06).toFixed(4) + ')';
    }
    if (proposalAnswer) {
      proposalAnswer.style.opacity = String(Math.max(0, Math.min(1, (ratio - .72) / .28)));
      proposalAnswer.style.transform = 'translateY(' + ((1 - ratio) * 16).toFixed(1) + 'px)';
    }
    if (focusPeaking) focusPeaking.classList.toggle('peaked', focusValue > 95);
    if (focusHint) {
      focusHint.textContent = focusValue > 95 ? 'Khoảnh khắc đã rõ nét' : 'Trượt để lấy nét…';
      focusHint.style.color = focusValue > 95 ? 'var(--rose-deep)' : '';
    }
  };

  if (focusSlider && focusImg) {
     focusSlider.addEventListener('input', function(e) {
        window.setEpilogueFocus(e.target.value, true);
     });
     window.setEpilogueFocus(0, false);
  }

  // Accessibility UI: cho phép các card tương tác bằng Enter/Space như button thật.
  function enableKeyboardActivation(element, label) {
    if (!element) return;
    element.setAttribute('role', 'button');
    element.setAttribute('tabindex', '0');
    if (label) element.setAttribute('aria-label', label);
    element.addEventListener('keydown', function(event) {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      element.click();
    });
  }

/* ---------- 10) GACHA MEMORY BOX (ROLL CƠ CHẾ NHÂN PHẨM) ---------- */
  var lootPool = [
    { id: 1, rarity: 'common', type: 'Common', icon: '☕', title: 'Cà phê lề đường', story: 'Trú mưa dưới mái hiên, uống chung một ly cà phê ấm nóng.' },
    { id: 2, rarity: 'common', type: 'Common', icon: '🎫', title: 'Vé xem phim cũ', story: 'Bộ phim đầu tiên xem cùng nhau. Em đã khóc, còn anh thì cười.' },
    { id: 3, rarity: 'common', type: 'Common', icon: '📸', title: 'Ảnh Polaroid', story: 'Tấm ảnh chụp vội ở phố đi bộ, mờ nhòe nhưng đầy tiếng cười.' },
    { id: 4, rarity: 'epic', type: 'Epic', icon: '✈️', title: 'Vé bay Đà Lạt', story: 'Chuyến đi xa đầu tiên. Nơi hoàng hôn nhuộm tím mặt hồ.' },
    { id: 5, rarity: 'epic', type: 'Epic', icon: '🎁', title: 'Quà sinh nhật', story: 'Cuốn sách em tặng, cùng lời nhắn nhủ yêu thương phía sau bìa.' },
    { id: 6, rarity: 'mythic', type: 'Mythic', icon: '💍', title: 'Nhẫn Cầu Hôn', story: 'Khoảnh khắc anh quỳ gối, cả thế giới như thu bé lại bằng một cái gật đầu.' },
    { id: 7, rarity: 'mythic', type: 'Mythic', icon: '✨', title: 'Nụ Cười Của Em', story: 'Đích đến cuối cùng của mọi nỗ lực, là giữ được nụ cười rạng rỡ này mãi mãi.' }
  ];

  var gachaBtn = document.getElementById('gacha-btn');
  var gachaStage = document.getElementById('gacha-stage');
  var gachaFlash = document.getElementById('gacha-flash');
  var inventoryGrid = document.getElementById('inventory-grid');
  var inventoryCount = document.getElementById('inventory-count');
  
  var unlockedItems = new Set();
  var totalRolls = 0;
  var isRolling = false;

  // Khởi tạo khung chứa Inventory ban đầu (khóa xám)
  function initInventory() {
    if(!inventoryGrid) return;
    inventoryGrid.innerHTML = '';
    lootPool.forEach(function(item) {
      var div = document.createElement('div');
      div.className = 'inv-item';
      div.id = 'inv-' + item.id;
      div.innerHTML = item.icon;
      div.setAttribute('aria-disabled', 'true');
      enableKeyboardActivation(div, 'Ký ức chưa mở khóa: ' + item.title);
      div.addEventListener('click', function() {
        if(unlockedItems.has(item.id)) openMemoryModal(item);
      });
      inventoryGrid.appendChild(div);
    });
  }
  initInventory();

  // Thuật toán Roll có Pity System (Bảo hiểm)
  function performRoll() {
    totalRolls++;
    var rand = Math.random() * 100;
    var pulledRarity = 'common';
    
    // Tỉ lệ: 5% Mythic | 30% Epic | 65% Common
    // Bảo hiểm: Roll 10 lần chắc chắn nổ Mythic nếu chưa ra
    if (rand <= 5 || totalRolls % 10 === 0) {
        pulledRarity = 'mythic';
    } else if (rand <= 35) {
        pulledRarity = 'epic';
    }

    var pool = lootPool.filter(function(i) { return i.rarity === pulledRarity; });
    return pool[Math.floor(Math.random() * pool.length)];
  }

  if (gachaBtn) {
    gachaBtn.addEventListener('click', function() {
      if (isRolling) return;
      isRolling = true;
      gachaBtn.style.opacity = '0.5';
      gachaBtn.textContent = 'Đang giải mã...';

      // Xóa thẻ cũ
      var oldCard = gachaStage.querySelector('.gacha-card');
      var placeholder = document.getElementById('gacha-placeholder');
      if (oldCard) oldCard.remove();
      if (placeholder) placeholder.style.display = 'none';

      // Lấy kết quả
      var result = performRoll();

      // Hiệu ứng nháy sáng
      gachaFlash.className = 'gacha-flash';
      void gachaFlash.offsetWidth; // Trigger reflow
      gachaFlash.classList.add(result.rarity === 'mythic' ? 'active-mythic' : 'active');

      // Tạo thẻ bài mới
      setTimeout(function() {
        var card = document.createElement('div');
        card.className = 'gacha-card rarity-' + result.rarity;
        card.innerHTML = `
          <span class="rarity-label">${result.type}</span>
          <span class="g-icon">${result.icon}</span>
          <h3 class="g-title">${result.title}</h3>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin:0;">Chạm để xem câu chuyện</p>
        `;
        enableKeyboardActivation(card, 'Mở câu chuyện: ' + result.title);
        card.addEventListener('click', function() { openMemoryModal(result); });
        gachaStage.appendChild(card);

        // Hiệu ứng bùng nổ rung màn hình nếu ra Mythic
        if (result.rarity === 'mythic') {
           document.body.classList.add('mythic-shake-active');
           if(window.triggerPetalBurst) {
               var rect = card.getBoundingClientRect();
               window.triggerPetalBurst(rect.left + rect.width/2, rect.top + rect.height/2, 50);
           }
           setTimeout(function() { document.body.classList.remove('mythic-shake-active'); }, 600);
        }

        // Cập nhật kho đồ
        if (!unlockedItems.has(result.id)) {
          unlockedItems.add(result.id);
          inventoryCount.textContent = unlockedItems.size;
          var invEl = document.getElementById('inv-' + result.id);
          if (invEl) {
            invEl.classList.add('unlocked');
            invEl.classList.add('r-' + result.rarity);
            invEl.setAttribute('aria-disabled', 'false');
            invEl.setAttribute('aria-label', 'Mở ký ức: ' + result.title);
          }
        }

        isRolling = false;
        gachaBtn.style.opacity = '1';
        gachaBtn.textContent = 'Roll Ký Ức (1x)';
      }, 300); // Đợi giữa chừng ánh sáng lóe lên thì rớt thẻ
    });
  }

  // Tái sử dụng Modal cũ cho Gacha
  var memoryModal = document.createElement('div');
  memoryModal.className = 'memory-modal';
  memoryModal.id = 'memory-modal';
  memoryModal.setAttribute('aria-hidden', 'true');
  memoryModal.setAttribute('role', 'dialog');
  memoryModal.setAttribute('aria-modal', 'true');
  memoryModal.innerHTML = `<div class="memory-modal-content"><button class="memory-modal-close" id="memory-modal-close" type="button" aria-label="Đóng ký ức">&times;</button><span class="memory-modal-icon" id="memory-modal-icon"></span><h3 class="memory-modal-title" id="memory-modal-title"></h3><p class="memory-modal-story" id="memory-modal-story"></p></div>`;
  document.body.appendChild(memoryModal);

  function openMemoryModal(item) {
    document.getElementById('memory-modal-icon').textContent = item.icon; 
    document.getElementById('memory-modal-title').textContent = item.title; 
    document.getElementById('memory-modal-story').textContent = item.story;
    memoryModal.classList.add('open'); 
    memoryModal.setAttribute('aria-hidden', 'false'); 
    document.body.style.overflow = 'hidden';
  }

  function closeMemoryModal() {
    memoryModal.classList.remove('open'); 
    memoryModal.setAttribute('aria-hidden', 'true'); 
    document.body.style.overflow = '';
  }

  document.getElementById('memory-modal-close').addEventListener('click', closeMemoryModal);
  memoryModal.addEventListener('click', function (e) { if (e.target === memoryModal) closeMemoryModal(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && memoryModal.classList.contains('open')) closeMemoryModal(); });

  /* ---------- 13) MEMORY MAP ---------- */
  var mapLocations = [
    { icon: '📍', name: 'Quán cà phê ABC', desc: 'Nơi gặp nhau lần đầu tiên.' },
    { icon: '📍', name: 'Đà Lạt', desc: 'Chuyến đi chơi xa đầu tiên, nơi chúng mình nhận ra mình thuộc về nhau.' },
    { icon: '📍', name: 'Công viên XYZ', desc: 'Nơi anh đã cầu hôn em vào một chiều mưa.' },
    { icon: '📍', name: 'Nhà hàng DEF', desc: 'Bữa tối đầu tiên của chúng mình, em đã ăn hết phần của anh.' }
  ];

  function renderMapLocations() {
    var container = document.getElementById('map-locations');
    if (!container) return;
    container.innerHTML = '';
    mapLocations.forEach(function (loc) {
      var div = document.createElement('div');
      div.className = 'map-location-item glass-shine';
      div.innerHTML = `<span class="loc-icon">${loc.icon}</span><div class="loc-info"><div class="loc-name">${loc.name}</div><div class="loc-desc">${loc.desc}</div></div>`;
      enableKeyboardActivation(div, 'Mở thông tin địa điểm: ' + loc.name);
      div.addEventListener('click', function () { showToast(loc.name, loc.desc); });
      container.appendChild(div);
    });
  }
  renderMapLocations();

  /* ---------- 14) ITINERARY ---------- */
  var itineraryData = [
    { time: '08:00', event: 'Lễ Gia Tiên' }, { time: '10:00', event: 'Đón dâu' }, { time: '12:00', event: 'Tiệc trưa (gia đình)' },
    { time: '17:30', event: 'Tiệc cưới' }, { time: '19:00', event: 'Cắt bánh kem' }, { time: '20:00', event: 'Bắn pháo hoa' }
  ];

  function renderItinerary() {
    var container = document.getElementById('itinerary-list');
    if (!container) return;
    container.innerHTML = '';
    itineraryData.forEach(function (item) {
      var div = document.createElement('div');
      div.className = 'itinerary-item';
      div.innerHTML = `<span class="it-time">${item.time}</span><span class="it-event">${item.event}</span>`;
      container.appendChild(div);
    });
  }
  renderItinerary();

  /* ---------- 16) INVISIBLE GALLERY ---------- */
  var invisibleData = [
    { img: 'images/anh_invisible_1.jpg', hint: '💕 Nơi chúng mình gặp nhau lần đầu?', caption: 'Quán cà phê ABC - nơi mọi chuyện bắt đầu.' },
    { img: 'images/anh_invisible_2.jpg', hint: '🌹 Chúng mình đã cầu hôn ở đâu?', caption: 'Công viên XYZ - khoảnh khắc em nói "Đồng ý".' },
    { img: 'images/anh_invisible_3.jpg', hint: '✈️ Chuyến du lịch đầu tiên của chúng mình?', caption: 'Đà Lạt - thành phố ngàn hoa, nơi chúng mình yêu nhau nhiều hơn.' },
    { img: 'images/anh_invisible_4.jpg', hint: '🎄 Giáng sinh đầu tiên bên nhau?', caption: 'Nhà riêng - ấm cúng với cây thông và những món quà nhỏ.' },
    { img: 'images/anh_invisible_5.jpg', hint: '🌊 Chuyến biển đầu tiên của chúng mình?', caption: 'Nha Trang - những con sóng và nụ cười.' },
    { img: 'images/anh_invisible_6.jpg', hint: '🎂 Sinh nhật đầu tiên bên nhau?', caption: 'Nhà hàng DEF - bữa tối lãng mạn và chiếc bánh kem.' }
  ];

  function renderInvisibleGallery() {
    var grid = document.getElementById('invisible-grid');
    if (!grid) return;
    grid.innerHTML = '';
    invisibleData.forEach(function (item) {
      var card = document.createElement('div');
      card.className = 'invisible-card spotlight-card glass-shine reveal';
      card.innerHTML = `<img class="inv-image" src="${item.img}" alt="Kỷ niệm" loading="lazy" /><div class="spotlight-overlay"><span class="spotlight-text">🔦 Di chuột để khám phá</span></div><div class="inv-caption">${item.caption}</div>`;
      card.setAttribute('aria-pressed', 'false');
      enableKeyboardActivation(card, 'Mở ảnh ký ức: ' + item.caption);
      card.addEventListener('click', function () {
        this.classList.toggle('revealed');
        this.setAttribute('aria-pressed', this.classList.contains('revealed') ? 'true' : 'false');
      });
      grid.appendChild(card);
    });
  }
  renderInvisibleGallery();

  /* ---------- 17) PLAYLIST SUGGESTION ---------- */
  var suggestedSongs = [];
  var suggestedList = document.getElementById('suggested-list');
  var suggestionForm = document.getElementById('playlist-suggestion-form');

  function renderSuggestedSongs() {
    if (!suggestedList) return;
    suggestedList.innerHTML = '';
    if (suggestedSongs.length === 0) {
      suggestedList.innerHTML = '<span style="color:var(--text-muted);font-size:0.85rem;">Chưa có gợi ý nào. Hãy là người đầu tiên!</span>'; return;
    }
    suggestedSongs.forEach(function (song) {
      var span = document.createElement('span'); span.className = 'suggested-song-item';
      span.innerHTML = `<strong>${song.name}</strong> - ${song.artist} <span class="suggested-by">(gợi ý bởi ${song.by || 'bạn'})</span>`;
      suggestedList.appendChild(span);
    });
  }

  if (suggestionForm) {
    suggestionForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('song-name').value.trim(), artist = document.getElementById('song-artist').value.trim(), reason = document.getElementById('song-reason').value.trim();
      if (!name || !artist) { showToast('⚠️', 'Vui lòng nhập tên bài hát và nghệ sĩ.'); return; }
      suggestedSongs.push({ name: name, artist: artist, by: 'bạn', reason: reason });
      renderSuggestedSongs(); showToast('🎵', 'Cảm ơn bạn! Bài hát "' + name + '" đã được thêm vào danh sách gợi ý.'); suggestionForm.reset();
    });
  }
  renderSuggestedSongs();

  /* ---------- 18) DOT NAV ---------- */
  var sections = document.querySelectorAll('section[id], .act[id]');
  var navLinks = document.querySelectorAll('.dot-nav a');
  if (sections.length && navLinks.length && 'IntersectionObserver' in window) {
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          navLinks.forEach(function (link) { link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id); });
        }
      });
    }, { threshold: 0.5 });
    sections.forEach(function (section) { navObserver.observe(section); });
  }

  /* ---------- 19) NHẠC NỀN (Toggle Control) ---------- */
  if (musicBtn && music) {
    musicBtn.addEventListener('click', function () {
      if (music.paused) {
        music.play().catch(function () {});
        musicBtn.classList.add('playing'); musicBtn.setAttribute('aria-pressed', 'true');
      } else {
        music.pause(); musicBtn.classList.remove('playing'); musicBtn.setAttribute('aria-pressed', 'false');
      }
    });
  }

  /* ---------- 21) EPILOGUE ALBUM ---------- */
  var galleryImages = [
    'images/anh_cuoi_1.jpg', 'images/anh_cuoi_2.jpg', 'images/anh_cuoi_3.jpg',
    'images/anh_cuoi_4.jpg', 'images/anh_cuoi_5.jpg', 'images/anh_cuoi_6.jpg',
    'images/anh_cuoi_7.jpg', 'images/anh_cuoi_8.jpg'
  ];

  var galleryWrapper = document.getElementById('gallery-wrapper');
  if (galleryWrapper) {
    galleryImages.forEach(function (src, index) {
      var slide = document.createElement('div');
      slide.className = 'epilogue-album-slide';
      slide.innerHTML = '<img src="' + src + '" alt="Ảnh cưới" loading="lazy" decoding="async" />';
      slide.addEventListener('click', function () { openLightbox(index); });
      galleryWrapper.appendChild(slide);
    });
  }

/* ---------- 22) LIGHTBOX ---------- */
  var lightbox = document.getElementById('lightbox'), 
      lightboxImg = document.getElementById('lightbox-img'), 
      lightboxClose = document.getElementById('lightbox-close'), 
      lightboxPrev = document.getElementById('lightbox-prev'), 
      lightboxNext = document.getElementById('lightbox-next'), 
      currentIndex = 0;

  // Gọi DOM cho hiệu ứng màn trập thị giác.
  var shutterBlackout = document.getElementById('shutter-blackout');

  // Hàm tạo chớp đen mô phỏng tốc độ chụp 1/15s.
  function triggerShutter() {
    if (shutterBlackout) {
      shutterBlackout.classList.remove('fade');
      shutterBlackout.classList.add('active');
      // Đóng băng chớp đen trong 60ms mô phỏng tốc độ chụp 1/15s
      setTimeout(function() {
        shutterBlackout.classList.remove('active');
        shutterBlackout.classList.add('fade');
      }, 60); 
    }
  }

  function openLightbox(index) {
    if (!lightbox || !lightboxImg) return;
    triggerShutter(); // Kích hoạt màn trập khi mở
    currentIndex = index; 
    lightboxImg.src = galleryImages[currentIndex] || '';
    lightbox.classList.add('open'); 
    lightbox.setAttribute('aria-hidden', 'false'); 
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lightbox) return; 
    lightbox.classList.remove('open'); 
    lightbox.setAttribute('aria-hidden', 'true'); 
    document.body.style.overflow = '';
  }

  function prevImage() {
    if (galleryImages.length === 0) return;
    triggerShutter(); // Kích hoạt màn trập khi vuốt trái
    currentIndex = (currentIndex - 1 + galleryImages.length) % galleryImages.length; 
    lightboxImg.src = galleryImages[currentIndex];
  }

  function nextImage() {
    if (galleryImages.length === 0) return;
    triggerShutter(); // Kích hoạt màn trập khi vuốt phải
    currentIndex = (currentIndex + 1) % galleryImages.length; 
    lightboxImg.src = galleryImages[currentIndex];
  }

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxPrev) lightboxPrev.addEventListener('click', prevImage);
  if (lightboxNext) lightboxNext.addEventListener('click', nextImage);
  if (lightbox) lightbox.addEventListener('click', function (e) { if (e.target === lightbox) closeLightbox(); });

  document.addEventListener('keydown', function (e) {
    if (!lightbox || !lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox(); 
    if (e.key === 'ArrowLeft') prevImage(); 
    if (e.key === 'ArrowRight') nextImage();
  });

  /* ---------- 23) LIVE PHOTO WALL ---------- */
  var photoTrack = document.getElementById('photo-track'), PHOTO_STORAGE_KEY = 'love-story-shared-photos',
      MAX_STORED_PHOTOS = window.matchMedia('(max-width: 760px), (pointer: coarse)').matches ? 6 : 10,
      albumPhotos = typeof invisibleData !== 'undefined' ? invisibleData.slice(0, 6).map(function(item) { return item.img; }) : galleryImages.slice(0, 6);
  function loadUploadedPhotos() { try { var raw = localStorage.getItem(PHOTO_STORAGE_KEY); return raw ? JSON.parse(raw) : []; } catch (e) { return []; } }
  function saveUploadedPhotos(list) { try { localStorage.setItem(PHOTO_STORAGE_KEY, JSON.stringify(list)); } catch (e) {} }
  var uploadedPhotos = loadUploadedPhotos();

  function renderPhotoMarquee() {
    if (!photoTrack) return; photoTrack.innerHTML = '';
    var allSrcs = uploadedPhotos.concat(albumPhotos);
    allSrcs.concat(allSrcs).forEach(function (src) {
      var figure = document.createElement('figure'), img = document.createElement('img');
      img.src = src; img.alt = 'Khoảnh khắc'; img.loading = 'lazy'; figure.appendChild(img); photoTrack.appendChild(figure);
    });
  }
  renderPhotoMarquee();

  var uploadInput = document.getElementById('photo-upload-input'), uploadHint = document.getElementById('upload-hint');
  function preparePhoto(file) {
    return new Promise(function (resolve) {
      if (!file || !file.type.startsWith('image/')) return resolve(null);
      var image = new Image();
      var objectUrl = URL.createObjectURL(file);
      image.onload = function () {
        var maxEdge = 1280;
        var scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));
        var output = document.createElement('canvas');
        output.width = Math.max(1, Math.round(image.naturalWidth * scale));
        output.height = Math.max(1, Math.round(image.naturalHeight * scale));
        output.getContext('2d', { alpha: false }).drawImage(image, 0, 0, output.width, output.height);
        URL.revokeObjectURL(objectUrl);
        // Thu nhỏ trước khi lưu giúp Safari không phải giữ nhiều ảnh full-resolution trong RAM.
        resolve(output.toDataURL('image/jpeg', 0.82));
      };
      image.onerror = function () { URL.revokeObjectURL(objectUrl); resolve(null); };
      image.src = objectUrl;
    });
  }
  if (uploadInput) {
    uploadInput.addEventListener('change', function () {
      var files = Array.prototype.slice.call(uploadInput.files || []); if (!files.length) return;
      var readPromises = files.map(preparePhoto);
      Promise.all(readPromises).then(function (results) {
        var validResults = results.filter(Boolean);
        uploadedPhotos = validResults.concat(uploadedPhotos).slice(0, MAX_STORED_PHOTOS); saveUploadedPhotos(uploadedPhotos); renderPhotoMarquee();
        if (uploadHint) { uploadHint.textContent = 'Đã gửi ' + validResults.length + ' ảnh — cảm ơn bạn!'; uploadHint.style.color = '#5B6B4F'; }
      });
      uploadInput.value = '';
    });
  }

  /* ---------- 24) FAQ ACCORDION ---------- */
  document.querySelectorAll('.faq-question').forEach(function (btn) {
    var answer = btn.nextElementSibling;
    btn.addEventListener('click', function () {
      var isOpen = btn.getAttribute('aria-expanded') === 'true';
      document.querySelectorAll('.faq-question').forEach(function (other) { other.setAttribute('aria-expanded', 'false'); other.nextElementSibling.style.maxHeight = null; other.nextElementSibling.classList.remove('is-open'); });
      if (!isOpen) { btn.setAttribute('aria-expanded', 'true'); answer.classList.add('is-open'); answer.style.maxHeight = answer.scrollHeight + 'px'; }
    });
  });

/* ---------- 25) MẠNG LƯỚI NODE GUESTBOOK (1+3+4 COMBINED) ---------- */
  var STORAGE_KEY = 'wedding-guestbook-wishes';
  var seedWishes = [
    { name: 'Người bạn thân thiết', text: 'Chúc hai bạn trăm năm hạnh phúc, mãi yêu thương như ngày đầu!' },
    { name: 'Đồng nghiệp cũ', text: 'Chúc cuộc sống chung luôn có thật nhiều tiếng cười.' },
    { name: 'Một người bạn Đà Lạt', text: 'Mong hai bạn luôn tìm thấy sự ấm áp trong nhau.' },
    { name: 'Team cà phê', text: 'Chúc mọi buổi sáng sau này đều bắt đầu bằng bình yên.' },
    { name: 'Người chứng kiến từ đầu', text: 'Cuối cùng hai dòng thời gian cũng đã về chung một phía.' },
    { name: 'Một người em', text: 'Chúc anh chị luôn chọn nói chuyện và chọn ở lại.' },
    { name: 'Bạn học cũ', text: 'Mong những chương chưa viết đều đầy ắp kỷ niệm đẹp.' },
    { name: 'Gia đình', text: 'Chúc hai con xây nên một mái nhà đầy yêu thương.' },
    { name: 'Người bạn phương xa', text: 'Gửi một cái ôm thật xa tới ngày vui của hai bạn.' },
    { name: 'Hội mê du lịch', text: 'Chúc hai bạn có thêm thật nhiều hành trình cùng nhau.' },
    { name: 'Một vị khách', text: 'Mong tình yêu này luôn dịu dàng trong cả những ngày bình thường.' },
    { name: 'Team 17:42', text: 'Chúc khoảnh khắc 17:42 kéo dài thành một đời hạnh phúc.' }
  ];
  function loadWishes() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var saved = raw ? JSON.parse(raw) : [];
      var merged = Array.isArray(saved) ? saved.slice() : [];
      seedWishes.forEach(function(seed) {
        if (!merged.some(function(item) { return item.text === seed.text; })) merged.push(seed);
      });
      return merged;
    } catch (e) { return seedWishes.slice(); }
  }
  function saveWishes(wishes) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(wishes)); } catch (e) {} }
  var currentWishes = loadWishes();

  var gbCanvas = document.getElementById('guestbook-canvas');
  var gbCtx = gbCanvas ? gbCanvas.getContext('2d') : null;
  var gbTooltip = document.getElementById('guestbook-tooltip');
  var gbTooltipText = document.getElementById('gb-tooltip-text');
  var gbTooltipName = document.getElementById('gb-tooltip-name');
  
  var nodes = [];
  var gbW, gbH;
  var gbInView = false;
  var gbFrame = 0;
  var balloonPalette = [
    ['#d9a79d', '#8f5559'],
    ['#e2c6a8', '#9f7656'],
    ['#c6b7d6', '#6e607f'],
    ['#b9cbd1', '#637c83'],
    ['#e0b6bd', '#915c69']
  ];
  
  // Biến kiểm soát 3 trạng thái
  var autoNode = null;        // Trạng thái 4: Hạt đang tự động thở
  var autoPlayTimer = null;
  var mousePos = { x: -1000, y: -1000 }; 
  var isHoveringCanvas = false; // Trạng thái 3: Nam châm
  var newWishNode = null;     // Trạng thái 1: Sao băng

  function initGuestbookNetwork() {
    if(!gbCanvas) return;
    gbW = gbCanvas.width = gbCanvas.parentElement.clientWidth;
    gbH = gbCanvas.height = gbCanvas.parentElement.clientHeight;
    
    var visibleWishLimit = window.matchMedia('(max-width: 760px), (pointer: coarse)').matches ? 28 : 40;
    nodes = currentWishes.slice(-visibleWishLimit).map(function(w, index) {
      return {
        x: 24 + Math.random() * Math.max(1, gbW - 48), y: 34 + Math.random() * Math.max(1, gbH - 68),
        vx: (Math.random() - 0.5) * 0.34, vy: (Math.random() - 0.5) * 0.28,
        baseRadius: 8 + Math.random() * 4, wish: w,
        palette: balloonPalette[index % balloonPalette.length]
      };
    });
    startAutoBreathing();
  }

  function scheduleGuestbook() {
    if (gbCtx && gbInView && !document.hidden && !gbFrame) {
      gbFrame = requestAnimationFrame(animateGB);
    }
  }

  function showNodeTooltip(node, isSuperHighlight) {
    if(!node) return;
    gbTooltipText.textContent = '"' + node.wish.text + '"';
    gbTooltipName.textContent = '— ' + node.wish.name;
    var tooltipHalf = Math.min(155, gbW / 2 - 12);
    gbTooltip.style.left = Math.max(tooltipHalf, Math.min(gbW - tooltipHalf, node.x)) + 'px';
    gbTooltip.style.top = Math.max(112, node.y - (isSuperHighlight ? 25 : 18)) + 'px';
    gbTooltip.classList.add('visible');
    if(isSuperHighlight) gbTooltip.style.borderColor = '#FF6496'; // Màu nhấn mạnh sao băng
    else gbTooltip.style.borderColor = 'var(--rose-deep)';
  }

  // TRẠNG THÁI 4: AUTO-BREATHING
  function startAutoBreathing() {
    if (autoPlayTimer) clearInterval(autoPlayTimer);
    autoPlayTimer = setInterval(function() {
      // Chỉ tự thở khi không có sao băng và không ai quơ chuột
      if (gbInView && !document.hidden && !isHoveringCanvas && !newWishNode && nodes.length > 0) {
        var nextNode = autoNode;
        while (nodes.length > 1 && nextNode === autoNode) nextNode = nodes[Math.floor(Math.random() * nodes.length)];
        autoNode = nextNode;
      }
    }, 5200);
  }

  function animateGB() {
    gbFrame = 0;
    if(!gbCtx || !gbInView || document.hidden) return;
    gbCtx.clearRect(0, 0, gbW, gbH);
    
    var hoveredNode = null;
    var minDist = 60; // Bán kính lực hút nam châm

    // Cập nhật vị trí & Vẽ từng hạt
    for(var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      
      // TRẠNG THÁI 3: TỪ TRƯỜNG NAM CHÂM (Magnetic Pull)
      if (isHoveringCanvas && !newWishNode) {
        var dxMouse = mousePos.x - n.x, dyMouse = mousePos.y - n.y;
        var distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
        if (distMouse < 80) {
          n.vx += dxMouse * 0.002; // Bị hút nhẹ về phía chuột
          n.vy += dyMouse * 0.002;
          if (distMouse < minDist) { minDist = distMouse; hoveredNode = n; }
        }
      }

      // Giới hạn tốc độ bay & Ma sát nhẹ
      n.vx *= 0.99; n.vy *= 0.99; 
      // Duy trì vận tốc tối thiểu để không bị đứng im
      if(Math.abs(n.vx) < 0.2) n.vx += (Math.random() > 0.5 ? 0.02 : -0.02);
      if(Math.abs(n.vy) < 0.2) n.vy += (Math.random() > 0.5 ? 0.02 : -0.02);

      n.x += n.vx; n.y += n.vy;
      
      // Đập viền dội lại
      if(n.x < 18 || n.x > gbW - 18) n.vx *= -1;
      if(n.y < 24 || n.y > gbH - 36) n.vy *= -1;
      
      // Tính toán độ phát sáng
      var currentRadius = n.baseRadius;
      var isSuper = false;
      var palette = n.palette || balloonPalette[0];

      if (n === newWishNode) {
         currentRadius = n.baseRadius * 2.1; isSuper = true;
      } else if (n === hoveredNode) {
         currentRadius = n.baseRadius * 1.8;
      } else if (n === autoNode && !isHoveringCanvas && !newWishNode) {
         currentRadius = n.baseRadius * 1.5;
      }

      gbCtx.shadowColor = isSuper ? 'rgba(255, 100, 150, 0.8)' : 'rgba(255, 215, 150, 0.6)';
      gbCtx.shadowBlur = isSuper ? 20 : (n === hoveredNode || n === autoNode ? 12 : 6);
      var balloonFill = gbCtx.createRadialGradient(n.x - currentRadius * .3, n.y - currentRadius * .38, 1, n.x, n.y, currentRadius * 1.2);
      balloonFill.addColorStop(0, 'rgba(255,255,255,.92)');
      balloonFill.addColorStop(.18, palette[0]);
      balloonFill.addColorStop(1, palette[1]);
      gbCtx.beginPath();
      gbCtx.ellipse(n.x, n.y, currentRadius * .84, currentRadius, 0, 0, Math.PI * 2);
      gbCtx.fillStyle = balloonFill; gbCtx.fill();
      gbCtx.shadowBlur = 0;
      gbCtx.beginPath();
      gbCtx.ellipse(n.x - currentRadius * .27, n.y - currentRadius * .34, currentRadius * .13, currentRadius * .24, -.5, 0, Math.PI * 2);
      gbCtx.fillStyle = 'rgba(255,255,255,.34)'; gbCtx.fill();
      gbCtx.beginPath();
      gbCtx.moveTo(n.x - 2.5, n.y + currentRadius);
      gbCtx.lineTo(n.x, n.y + currentRadius + 4);
      gbCtx.lineTo(n.x + 2.5, n.y + currentRadius);
      gbCtx.fillStyle = palette[1]; gbCtx.fill();
      gbCtx.beginPath();
      gbCtx.moveTo(n.x, n.y + currentRadius + 4);
      gbCtx.quadraticCurveTo(n.x + 6, n.y + currentRadius + 13, n.x + 1, n.y + currentRadius + 23);
      gbCtx.strokeStyle = 'rgba(230, 205, 190, .3)';
      gbCtx.lineWidth = 1; gbCtx.stroke();
    }

    // LOGIC ƯU TIÊN HIỂN THỊ TOOLTIP (1 > 3 > 4)
    if (newWishNode) {
       showNodeTooltip(newWishNode, true);
       gbCanvas.style.cursor = 'default';
    } else if (isHoveringCanvas && hoveredNode) {
       showNodeTooltip(hoveredNode, false);
       gbCanvas.style.cursor = 'crosshair';
       autoNode = null; // Cắt mạch tự thở
    } else if (!isHoveringCanvas && autoNode) {
       showNodeTooltip(autoNode, false);
       gbCanvas.style.cursor = 'default';
    } else {
       gbTooltip.classList.remove('visible');
       gbCanvas.style.cursor = 'default';
    }

    gbFrame = requestAnimationFrame(animateGB);
  }
  
  if(gbCanvas) {
    initGuestbookNetwork();
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function(entries) {
        gbInView = entries.some(function(entry) { return entry.isIntersecting; });
        scheduleGuestbook();
      }, { rootMargin: '15% 0px' }).observe(gbCanvas.parentElement);
    } else {
      gbInView = true;
      scheduleGuestbook();
    }
    document.addEventListener('visibilitychange', scheduleGuestbook);
    gbCanvas.addEventListener('mousemove', function(e) {
      isHoveringCanvas = true;
      var rect = gbCanvas.getBoundingClientRect();
      mousePos.x = e.clientX - rect.left; mousePos.y = e.clientY - rect.top;
    });
    gbCanvas.addEventListener('mouseleave', function() { 
       isHoveringCanvas = false; mousePos = { x: -1000, y: -1000 };
       if(!newWishNode) gbTooltip.classList.remove('visible');
    });
    gbCanvas.addEventListener('pointerdown', function(e) {
      var rect = gbCanvas.getBoundingClientRect();
      var px = e.clientX - rect.left, py = e.clientY - rect.top;
      var nearest = null, nearestDistance = 42;
      nodes.forEach(function(node) {
        var dx = node.x - px, dy = node.y - py, distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < nearestDistance) { nearest = node; nearestDistance = distance; }
      });
      if (nearest) { autoNode = nearest; showNodeTooltip(nearest, false); }
    });
    function resizeGuestbookCanvas() {
      var nextW = gbCanvas.parentElement.clientWidth;
      var nextH = gbCanvas.parentElement.clientHeight;
      if (nextW < 2 || nextH < 2) return;
      var wasCollapsed = !gbW || !gbH || gbW < 2 || gbH < 2;
      gbW = gbCanvas.width = nextW;
      gbH = gbCanvas.height = nextH;
      nodes.forEach(function(node) {
        if (wasCollapsed) {
          node.x = 24 + Math.random() * Math.max(1, gbW - 48);
          node.y = 34 + Math.random() * Math.max(1, gbH - 68);
        } else {
          node.x = Math.max(18, Math.min(gbW - 18, node.x));
          node.y = Math.max(24, Math.min(gbH - 36, node.y));
        }
      });
    }
    window.addEventListener('resize', resizeGuestbookCanvas);
    if ('ResizeObserver' in window) new ResizeObserver(resizeGuestbookCanvas).observe(gbCanvas.parentElement);
  }
  
  // TRẠNG THÁI 1: SHOOTING STAR (Thêm lời chúc mới)
  function addWishToWall(name, text) {
    var newWish = { name: name, text: text };
    currentWishes.push(newWish); saveWishes(currentWishes); 
    
    if(gbCanvas) {
      var newNode = {
        x: gbW / 2, y: gbH + 30, // Bắn từ dưới lên trung tâm
        vx: (Math.random() - 0.5) * 1.5, vy: -4 - Math.random() * 2, // Lực đẩy mạnh lên trên
        baseRadius: 11, wish: newWish,
        palette: balloonPalette[Math.floor(Math.random() * balloonPalette.length)]
      };
      nodes.push(newNode);
      
      // Chặn mọi tương tác khác, đưa hạt mới làm Star
      newWishNode = newNode; 
      
      // Giảm tốc dần khi đến giữa màn hình (Hiệu ứng Parachute)
      setTimeout(function() { newNode.vy *= 0.2; newNode.vx *= 0.2; }, 800);

      // Trả lại mạng lưới sau 6 giây
      setTimeout(function() {
         newWishNode = null; 
      }, 6000);
    }
  }

  /* ---------- 26) FORM GỬI LỜI CHÚC ---------- */
  var form = document.getElementById('wish-form'), note = document.getElementById('rsvp-note'), submitBtn = document.getElementById('wish-submit');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('guest-name').value.trim(), messageVal = document.getElementById('guest-message').value.trim();
      if (!name || !messageVal) { note.textContent = 'Vui lòng điền đầy đủ họ tên và lời chúc.'; note.style.color = '#C08D82'; return; }
      completeSubmit(name, messageVal);
    });

    function completeSubmit(name, messageVal) {
      note.textContent = 'Cảm ơn ' + name + '! Lời chúc của bạn đã được gửi đến chúng mình.'; note.style.color = '#5B6B4F';
      addWishToWall(name, messageVal); showThankModal(name); showToast(name, messageVal);
      if (submitBtn) { var rect = submitBtn.getBoundingClientRect(); createHeartBurst(rect.left + rect.width / 2, rect.top + rect.height / 2); }
      form.reset();
    }
  }

  function createHeartBurst(x, y) {
    var emojis = ['❤️', '💕', '💖', '💗', '💝'];
    for (var i = 0; i < 25; i++) {
      var heart = document.createElement('div'); heart.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      var size = 14 + Math.random() * 28, angle = Math.random() * Math.PI * 2, dist = 80 + Math.random() * 200, dx = Math.cos(angle) * dist, dy = Math.sin(angle) * dist - 100 - Math.random() * 150;
      heart.style.cssText = `position: fixed; left: ${x}px; top: ${y}px; font-size: ${size}px; pointer-events: none; z-index: 9999; transition: all ${1.2 + Math.random() * 1}s cubic-bezier(0.2, 0.8, 0.4, 1); opacity: 1; transform: translate(0,0) scale(0.5);`;
      document.body.appendChild(heart);
      requestAnimationFrame(function () { heart.style.transform = `translate(${dx}px, ${dy}px) scale(1.2) rotate(${Math.random() * 60 - 30}deg)`; heart.style.opacity = '0'; });
      setTimeout(function () { heart.remove(); }, 2500);
    }
  }

  /* ---------- 27) POPUP CẢM ƠN & TOAST ---------- */
  var thankModal = document.getElementById('thank-modal'), thankModalAutoClose;
  function closeThankModal() { if (!thankModal) return; thankModal.classList.remove('is-open'); thankModal.setAttribute('aria-hidden', 'true'); clearTimeout(thankModalAutoClose); }
  function showThankModal(name) {
    if (!thankModal) return; var thankText = document.getElementById('thank-modal-text'); if (thankText) thankText.textContent = 'Cảm ơn ' + name + '! Lời chúc của bạn đã được gửi đến chúng mình.';
    thankModal.classList.add('is-open'); thankModal.setAttribute('aria-hidden', 'false'); clearTimeout(thankModalAutoClose); thankModalAutoClose = setTimeout(closeThankModal, 4000);
  }
  document.getElementById('thank-modal-close')?.addEventListener('click', closeThankModal);
  document.getElementById('thank-modal-backdrop')?.addEventListener('click', closeThankModal);

  function showToast(title, message) {
    var toastContainer = document.getElementById('toast-container'); if (!toastContainer) return;
    var toast = document.createElement('div'); toast.className = 'toast';
    toast.innerHTML = `<strong>${title}</strong><p>${message || ''}</p>`;
    toastContainer.appendChild(toast);
    requestAnimationFrame(function () { requestAnimationFrame(function () { toast.classList.add('show'); }); });
    setTimeout(function () { toast.classList.remove('show'); toast.classList.add('hide'); setTimeout(function () { toast.remove(); }, 400); }, 4000);
  }

  /* ---------- 31) SCROLL PROGRESS ---------- */
  var progress = document.getElementById('scroll-progress');
  if (progress) {
    window.storyFrames.subscribe(function () {
      var scrollRange = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      var percent = (window.scrollY / scrollRange) * 100;
      progress.style.width = percent + '%';
    });
  }

  /* ---------- 32) REVEAL ON SCROLL ---------- */
  window.probTriggered = false;
  window.observeReveal = function() {
    var revealEls = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
      var revealObserver = new IntersectionObserver(function (entries) { 
        entries.forEach(function (entry) { 
          if (entry.isIntersecting) { 
            entry.target.classList.add('is-visible'); 
            
            // Trigger Probability Chart khi lướt tới
            if (entry.target.closest('#probability') && !window.probTriggered) {
               window.probTriggered = true;
               setTimeout(window.runProbability, 800);
            }
            revealObserver.unobserve(entry.target); 
          } 
        }); 
      }, { threshold: 0.15 });
      revealEls.forEach(function (el) { revealObserver.observe(el); });
    } else { revealEls.forEach(function (el) { el.classList.add('is-visible'); }); }
  }
  window.observeReveal();

  /* ---------- 33) SCROLL-TRIGGERED 3D TRANSFORM ---------- */
  window.observe3D = function() {
    var els = document.querySelectorAll('.scroll-3d, .section-3d');
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) { entries.forEach(function (entry) { if (entry.isIntersecting) entry.target.classList.add('is-visible'); }); }, { threshold: 0.15 });
      els.forEach(function (el) { observer.observe(el); });
    } else { els.forEach(function (el) { el.classList.add('is-visible'); }); }
  }

  /* ---------- 34) GLASSMORPHISM 2.0 & SPOTLIGHT ---------- */
  document.querySelectorAll('.glass-shine').forEach(function (el) {
    el.addEventListener('mousemove', function (e) {
      var rect = this.getBoundingClientRect(); this.style.setProperty('--shine-x', ((e.clientX - rect.left) / rect.width) * 100 + '%'); this.style.setProperty('--shine-y', ((e.clientY - rect.top) / rect.height) * 100 + '%');
    });
  });

  document.querySelectorAll('.spotlight-card').forEach(function (card) {
    card.addEventListener('mousemove', function (e) {
      var rect = this.getBoundingClientRect(), overlay = this.querySelector('.spotlight-overlay');
      if (overlay) { overlay.style.setProperty('--mouse-x', ((e.clientX - rect.left) / rect.width) * 100 + '%'); overlay.style.setProperty('--mouse-y', ((e.clientY - rect.top) / rect.height) * 100 + '%'); }
    });
  });

  /* ---------- 36) MOUSE TRAILS ---------- */
  var trailEmojis = ['❤️', '💕', '🌸', '🌹', '✨', '💖'], trailTimer = null;
  document.addEventListener('mousemove', function(e) {
    if (!window.isGateOpened) return;
    if (!trailTimer) {
      trailTimer = setTimeout(function() {
        var trails = document.querySelectorAll('.mouse-trail'); if (trails.length > 30) trails[0].remove();
        var el = document.createElement('div'); el.className = 'mouse-trail'; el.textContent = trailEmojis[Math.floor(Math.random() * trailEmojis.length)];
        el.style.left = e.clientX + 'px'; el.style.top = e.clientY + 'px'; el.style.fontSize = (12 + Math.random() * 14) + 'px';
        document.body.appendChild(el); setTimeout(function() { if (el.parentNode) el.remove(); }, 800);
        trailTimer = null;
      }, 30);
    }
  });

  /* ---------- 37) MAGNETIC & TILT BUTTONS ---------- */
  document.querySelectorAll('.magnetic-btn').forEach(function (btn) {
    btn.addEventListener('mousemove', function (e) {
      var rect = btn.getBoundingClientRect(), cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2, dist = Math.sqrt((e.clientX - cx)**2 + (e.clientY - cy)**2);
      var strength = Math.min(1, 1 - dist / 120); btn.style.transform = `translate(${(e.clientX - cx) * 0.12 * strength}px, ${(e.clientY - cy) * 0.12 * strength}px)`;
    });
    btn.addEventListener('mouseleave', function () { btn.style.transform = 'translate(0, 0)'; });
  });

  document.querySelectorAll('.tilt-card').forEach(function (card) {
    card.addEventListener('mousemove', function (e) {
      var rect = card.getBoundingClientRect(), centerX = rect.width / 2, centerY = rect.height / 2;
      card.style.transform = `rotateX(${((centerY - (e.clientY - rect.top)) / centerY) * 8}deg) rotateY(${((e.clientX - rect.left - centerX) / centerX) * 8}deg) scale(1.02)`;
    });
    card.addEventListener('mouseleave', function () { card.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)'; });
  });

  /* ---------- MEDIA PREWARM + OFFSCREEN LIFECYCLE ---------- */
  var deferredBackgrounds = document.querySelectorAll('[data-bg]:not(.night-bg-img)');
  if ('IntersectionObserver' in window) {
    var backgroundGroups = new Map();
    deferredBackgrounds.forEach(function (element) {
      var anchor = element.closest('section') || element;
      if (!backgroundGroups.has(anchor)) backgroundGroups.set(anchor, []);
      backgroundGroups.get(anchor).push(element);
    });
    var mediaObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        (backgroundGroups.get(entry.target) || []).forEach(function (element) {
          if (!element.dataset.bg) return;
          element.style.backgroundImage = 'url("' + element.dataset.bg + '")';
          delete element.dataset.bg;
        });
        mediaObserver.unobserve(entry.target);
      });
    }, { rootMargin: '125% 0px', threshold: 0.01 });
    backgroundGroups.forEach(function (_, anchor) { mediaObserver.observe(anchor); });

    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        entry.target.classList.toggle('is-near-viewport', entry.isIntersecting);
      });
    }, { rootMargin: '75% 0px', threshold: 0 });
    document.querySelectorAll('.section-3d').forEach(function (section) { sectionObserver.observe(section); });
  } else {
    deferredBackgrounds.forEach(function (element) {
      if (element.dataset.bg) element.style.backgroundImage = 'url("' + element.dataset.bg + '")';
    });
  }

  /* ---------- SLIDESHOW ẢNH NỀN NIGHT GARDEN ---------- */
  var nightImages = document.querySelectorAll('.night-bg-img');
  function loadDeferredNightBackgrounds() {
    var load = function() {
      nightImages.forEach(function(image) {
        if (!image.dataset.bg) return;
        image.style.backgroundImage = 'url("' + image.dataset.bg + '")';
        delete image.dataset.bg;
      });
    };
    if ('requestIdleCallback' in window) requestIdleCallback(load, { timeout: 1800 });
    else setTimeout(load, 400);
  }
  if (nightImages.length > 1) {
    var currentNightImg = 0;
    setInterval(function () {
      if (!sparkleInView || document.hidden) return;
      nightImages[currentNightImg].classList.remove('active');
      currentNightImg = (currentNightImg + 1) % nightImages.length;
      nightImages[currentNightImg].classList.add('active');
    }, 5000);
  }
});

/* ==========================================================================
   THE OPTICS JOURNEY - FINAL ENGINE (3 ZONES - FULL STORYTELLING)
   ========================================================================== */
var optCanvas = document.getElementById('optics-canvas');
if (optCanvas) {
  var oCtx = optCanvas.getContext('2d', { alpha: true });
  var oWidth, oHeight;
  var lights = [];
  var compactOptics = window.matchMedia('(max-width: 760px), (pointer: coarse)').matches;
  var safariOptics = Boolean(window.storyIsSafari);
  var totalLights = compactOptics ? 14 : (safariOptics ? 16 : 20);
  var currentZone = 1; // Bắt buộc khởi đầu ở Zone 1 (Mới quen)
  var opticsFrame = 0;

  function resizeOptics() {
    oWidth = optCanvas.width = window.innerWidth;
    oHeight = optCanvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeOptics);
  resizeOptics();

  // Hàm vẽ Bokeh lục giác
  function drawHexagon(ctx, x, y, r) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      let angle = (i * Math.PI) / 3;
      let hx = x + r * Math.cos(angle);
      let hy = y + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.fill();
  }

  // Khởi tạo hạt
  var LightNode = function () {
    this.x = Math.random() * oWidth;
    this.y = Math.random() * oHeight;
    this.baseRadius = 25 + Math.random() * 45; // Bokeh bự
    this.currentRadius = this.baseRadius;
    this.vx = 0;
    this.vy = 0;
    this.history = [];
    this.speed = 0.55 + Math.random() * 0.45;
  };

LightNode.prototype.update = function (zone) {
    if (zone !== 3 && this.history.length > 0) {
      this.history = [];
    }

    if (zone === 3) {
      this.history.push({ x: this.x, y: this.y });
      if (this.history.length > (compactOptics ? 7 : (safariOptics ? 8 : 10))) this.history.shift();
    }

    // VẬT LÝ & TÂM LÝ
    if (zone === 1) {
      this.currentRadius += (this.baseRadius - this.currentRadius) * 0.025;
      this.x += Math.sin(this.y * 0.008) * 0.22;
      this.y -= 0.08;
    } 
    else if (zone === 2) {
      // ACT II không đổi bokeh thành chấm ngay lập tức: kích thước đi theo
      // toàn bộ hành trình cuộn của ACT, vì vậy cuộn ngược cũng phục hồi bokeh.
      var shrink = Math.max(0, Math.min(1, window.act2OpticsProgress || 0));
      var dustSize = 1.8 + this.speed * 1.2;
      var targetRadius = this.baseRadius * (1 - shrink) + dustSize * shrink;
      this.currentRadius += (targetRadius - this.currentRadius) * 0.075;
      this.x += Math.sin(this.y * 0.012) * (0.2 + shrink * 0.22);
      this.y += 0.12 + shrink * 0.42;
    } 
    else if (zone === 3) {
      var coreSize = 1.3 + this.speed;
      var direction = window.act3StreakDirection || -1;
      var targetVelocity = direction * this.speed;
      if (window.isTimeFrozen) targetVelocity *= 0.12;
      this.currentRadius += (coreSize - this.currentRadius) * 0.08;
      this.vy += (targetVelocity - this.vy) * 0.035;
      this.x += Math.sin((this.y + this.x) * 0.004) * 0.08;
      this.y += this.vy;
    }

    // Tái sinh
    if (this.y < -150 || this.y > oHeight + 150) {
      this.x = Math.random() * oWidth;
      this.history = [];
      if (zone === 3) {
        this.y = (window.act3StreakDirection || -1) < 0 ? oHeight + 80 : -80;
        this.vy = 0;
      } else if (zone === 2) {
        this.y = -100;
      } else {
        this.y = Math.random() * oHeight;
      }
    }
  };

LightNode.prototype.draw = function (zone) {
    oCtx.save();
    if (zone === 1) {
      oCtx.fillStyle = 'rgba(216, 167, 156, 0.25)';
      oCtx.strokeStyle = 'rgba(216, 167, 156, 0.4)';
      oCtx.lineWidth = 1;
      drawHexagon(oCtx, this.x, this.y, this.currentRadius);
      oCtx.stroke();
    } 
    else if (zone === 2) {
      var shrink = Math.max(0, Math.min(1, window.act2OpticsProgress || 0));
      if (shrink < 1) {
        oCtx.fillStyle = `rgba(216, 167, 156, ${0.2 * (1 - shrink)})`;
        drawHexagon(oCtx, this.x, this.y, this.currentRadius);
      }
      oCtx.fillStyle = `rgba(255, 145, 88, ${0.12 + shrink * 0.1})`;
      oCtx.beginPath();
      oCtx.arc(this.x, this.y, this.currentRadius * 2.5, 0, Math.PI * 2);
      oCtx.fill();
      oCtx.fillStyle = `rgba(255, 178, 116, ${0.28 + shrink * 0.46})`;
      oCtx.beginPath();
      oCtx.arc(this.x, this.y, this.currentRadius, 0, Math.PI * 2);
      oCtx.fill();
    } 
    else if (zone === 3) {
      if (this.history.length > 1) {
        oCtx.beginPath();
        oCtx.moveTo(this.history[0].x, this.history[0].y);
        for (let i = 1; i < this.history.length; i++) {
          oCtx.lineTo(this.history[i].x, this.history[i].y);
        }
        oCtx.lineCap = 'round';
        
        oCtx.strokeStyle = 'rgba(255, 156, 92, 0.07)';
        oCtx.lineWidth = this.currentRadius * 2.2;
        oCtx.stroke();

        oCtx.strokeStyle = 'rgba(255, 202, 148, 0.38)';
        oCtx.lineWidth = Math.max(.7, this.currentRadius * .72);
        oCtx.stroke();
      }
      
      oCtx.fillStyle = 'rgba(255, 242, 226, 0.1)';
      oCtx.beginPath();
      oCtx.arc(this.x, this.y, this.currentRadius * 3, 0, Math.PI * 2);
      oCtx.fill();
      
      oCtx.fillStyle = 'rgba(255, 245, 232, .62)';
      oCtx.beginPath();
      oCtx.arc(this.x, this.y, this.currentRadius * 1.5, 0, Math.PI * 2);
      oCtx.fill();
    }
    oCtx.restore();
  };

  for (let i = 0; i < totalLights; i++) {
    lights.push(new LightNode());
  }

  function animateOptics() {
    opticsFrame = 0;
    if (document.hidden || !document.body.classList.contains('optics-visible')) return;
    oCtx.clearRect(0, 0, oWidth, oHeight);
    for (let i = 0; i < lights.length; i++) {
      lights[i].update(currentZone);
      lights[i].draw(currentZone);
    }
    opticsFrame = requestAnimationFrame(animateOptics);
  }

  function scheduleOptics() {
    if (!opticsFrame && !document.hidden && document.body.classList.contains('optics-visible')) {
      opticsFrame = requestAnimationFrame(animateOptics);
    }
  }

/* =========================================================
     BỘ ĐIỀU PHỐI ZONE (CHỈ KÍCH HOẠT TẠI ACT 1, 2, 3)
     ========================================================= */
  function updateOpticsZone() {
    // Khóa mục tiêu 3 Section dựa trên Class của template
    var act1 = document.getElementById('act-1');
    var act2 = document.getElementById('act-2');
    var act3 = document.getElementById('act-3');
    
    var isOpticsActive = false;
    var targetZone = 1;

    // Hàm kiểm tra xem Section có đang chiếm sóng trên màn hình không
    function isInView(el) {
      if (!el) return false;
      var rect = el.getBoundingClientRect();
      // Trả về TRUE nếu Section lọt vào khoảng giữa màn hình
      return (rect.top < window.innerHeight * 0.7 && rect.bottom > window.innerHeight * 0.3);
    }

    // Quét Radar từ dưới lên trên
    if (isInView(act3)) {
      isOpticsActive = true;
      targetZone = 3; // Kích hoạt vệt sao bay ngược
      document.body.classList.add('shutter-drag-active'); // Sập màn trập
    } 
    else if (isInView(act2)) {
      isOpticsActive = true;
      targetZone = 2; // Kích hoạt bụi rơi
      document.body.classList.remove('shutter-drag-active');
    } 
    else if (isInView(act1)) {
      isOpticsActive = true;
      targetZone = 1; // Kích hoạt Bokeh lắc lư
      document.body.classList.remove('shutter-drag-active');
    } 
    else {
      // NẾU KHÔNG Ở TRONG BẤT KỲ ACT NÀO -> TẮT TOÀN BỘ ÁNH SÁNG
      isOpticsActive = false;
      document.body.classList.remove('shutter-drag-active');
    }

    // Cập nhật trạng thái hiển thị của Canvas
    if (isOpticsActive) {
      document.body.classList.add('optics-visible');
      currentZone = targetZone;
      scheduleOptics();
    } else {
      // Fade out Canvas đi, trả lại sân khấu cho cánh hoa
      document.body.classList.remove('optics-visible');
      oCtx.clearRect(0, 0, oWidth, oHeight);
    }
  }

  window.storyFrames.subscribe(updateOpticsZone);
  document.addEventListener('visibilitychange', scheduleOptics);

  // Gọi thử hàm scroll 1 lần lúc vừa load xong web để set trạng thái ban đầu
  updateOpticsZone();
}

/* ==========================================================================
   DUAL PERSPECTIVE SLIDER ENGINE — MORPH EDITION (NÂNG CẤP)
   ========================================================================== */
window.addEventListener('DOMContentLoaded', () => {
  try {
    const splitContainers = document.querySelectorAll('.split-perspective');

    splitContainers.forEach(container => {
      let isDragging = false;

      // Lấy nội dung từ data attributes
      const groomText = container.dataset.groomText || '';
      const brideText = container.dataset.brideText || '';
      const centerText = container.dataset.centerText || '';
      const quoteEl = container.querySelector('.split-quote');

      const startDrag = (e) => {
        isDragging = true;
        updateSlider(e);
      };

      const stopDrag = () => {
        isDragging = false;
      };

      const updateSlider = (e) => {
        if (!isDragging) return;

        let clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        let rect = container.getBoundingClientRect();
        let x = clientX - rect.left;
        let percentage = (x / rect.width) * 100;

        if (percentage < 5) percentage = 5;
        if (percentage > 95) percentage = 95;

        // Cập nhật vị trí thanh kéo
        container.style.setProperty('--split-pos', `${percentage}%`);

        // ===== MORPH LOGIC =====
        if (percentage < 40) {
          // Góc nhìn Chú rể
          if (quoteEl) quoteEl.textContent = groomText;
          container.style.setProperty('--warmth-opacity', '0.25');
          container.style.setProperty('--coolness-opacity', '0.05');
          container.classList.remove('show-quote');
        } else if (percentage > 60) {
          // Góc nhìn Cô dâu
          if (quoteEl) quoteEl.textContent = brideText;
          container.style.setProperty('--warmth-opacity', '0.05');
          container.style.setProperty('--coolness-opacity', '0.25');
          container.classList.remove('show-quote');
        } else {
          // Ở giữa (40%–60%): hiển thị thông điệp chung
          if (quoteEl) quoteEl.textContent = centerText;
          container.classList.add('show-quote');
          // Đưa màu về trung tính
          container.style.setProperty('--warmth-opacity', '0');
          container.style.setProperty('--coolness-opacity', '0');
        }
        // ===== END MORPH =====
      };

      // Lắng nghe sự kiện Chuột
      container.addEventListener('mousedown', startDrag);
      window.addEventListener('mouseup', stopDrag);
      window.addEventListener('mousemove', updateSlider);

      // Lắng nghe sự kiện Cảm ứng
      container.addEventListener('touchstart', startDrag, { passive: true });
      window.addEventListener('touchend', stopDrag);
      window.addEventListener('touchmove', updateSlider, { passive: true });

      // ===== THIẾT LẬP TRẠNG THÁI KHỞI TẠO =====
      // Ép thanh kéo về giữa (50%) và hiển thị thông điệp chung
      container.style.setProperty('--split-pos', '50%');
      container.classList.add('show-quote');
      if (quoteEl) quoteEl.textContent = centerText;
      // Đặt màu trung tính
      container.style.setProperty('--hue-groom', '0');
      container.style.setProperty('--hue-bride', '0');
    });
  } catch (error) {
    console.error("Lỗi Dual Perspective Morph:", error);
  }

/* ==========================================================
     ACT 1: KÍNH SƯƠNG MÙ TƯƠNG TÁC
     ========================================================== */
  function initFogCanvas() {
    const canvas = document.getElementById('fog-canvas');
    if (!canvas) return;

    // Tránh gắn trùng listener nếu timeline được kích hoạt lại.
    if (canvas.dataset.fogInitialized === 'true') return;
    canvas.dataset.fogInitialized = 'true';

    const ctx = canvas.getContext('2d');
    const fogContainer = document.getElementById('fog-container');
    const core = document.getElementById('a1-core');
    const act1StartSection = document.getElementById('act-1');
    const hint = document.getElementById('wipe-instruction');
    const progressFill = document.getElementById('wipe-progress-fill');
    const skipButton = document.getElementById('fog-skip');
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const maskCanvas = document.createElement('canvas');
    const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = 96;
    sampleCanvas.height = 54;
    const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });
    const noiseCanvas = document.createElement('canvas');
    const noiseCtx = noiseCanvas.getContext('2d');
    const listeners = new AbortController();

    let activePointer = null;
    let lastPoint = null;
    let isUnlocked = false;
    let scrollReleased = false;
    let resizeFrame = 0;
    let animationFrame = 0;
    let lastRenderAt = 0;
    let lastAreaCheckAt = 0;
    let wisps = [];
    let droplets = [];
    let fogWidth = 1;
    let fogHeight = 1;
    let pixelRatio = 1;
    // Chỉ mở kính khi lau đủ khoảng 30% hoặc chủ động bấm bỏ qua.
    const unlockRatio = 0.30;

    function buildFogDetails() {
      const compactFog = window.innerWidth <= 760 || window.matchMedia('(pointer: coarse)').matches;
      const safariFog = Boolean(window.storyIsSafari);
      wisps = Array.from({ length: compactFog ? 7 : (safariFog ? 8 : 10) }, (_, i) => ({
        x: (0.08 + ((i * 0.137) % 0.86)) * fogWidth,
        y: (0.08 + ((i * 0.219) % 0.84)) * fogHeight,
        radius: (0.18 + (i % 3) * 0.055) * Math.max(fogWidth, fogHeight),
        speed: 0.00011 + (i % 4) * 0.000025,
        phase: i * 1.71,
        alpha: 0.16 + (i % 3) * 0.045
      }));

      droplets = Array.from({ length: compactFog ? 32 : (safariFog ? 40 : 48) }, (_, i) => ({
        x: ((i * 47) % 101) / 101 * fogWidth,
        y: ((i * 71) % 103) / 103 * fogHeight,
        r: (1.2 + (i % 5) * 0.75) * pixelRatio,
        stretch: 1 + (i % 4) * 0.32,
        alpha: 0.20 + (i % 4) * 0.045
      }));

      noiseCanvas.width = 96;
      noiseCanvas.height = 54;
      const noise = noiseCtx.createImageData(noiseCanvas.width, noiseCanvas.height);
      for (let i = 0; i < noise.data.length; i += 4) {
        const value = 175 + Math.floor(Math.random() * 80);
        noise.data[i] = value;
        noise.data[i + 1] = value;
        noise.data[i + 2] = value;
        noise.data[i + 3] = 15 + Math.floor(Math.random() * 24);
      }
      noiseCtx.putImageData(noise, 0, 0);
    }

    function resizeCanvas() {
      if (isUnlocked) return;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const oldMask = document.createElement('canvas');
      oldMask.width = maskCanvas.width;
      oldMask.height = maskCanvas.height;
      if (oldMask.width && oldMask.height) {
        oldMask.getContext('2d').drawImage(maskCanvas, 0, 0);
      }

      const compactFog = window.innerWidth <= 760 || window.matchMedia('(pointer: coarse)').matches;
      const ratioLimit = compactFog ? 1 : (window.storyIsSafari ? 1.25 : 1.75);
      pixelRatio = Math.min(window.devicePixelRatio || 1, ratioLimit);
      fogWidth = Math.max(1, Math.round(rect.width * pixelRatio));
      fogHeight = Math.max(1, Math.round(rect.height * pixelRatio));
      canvas.width = fogWidth;
      canvas.height = fogHeight;
      maskCanvas.width = fogWidth;
      maskCanvas.height = fogHeight;

      if (oldMask.width && oldMask.height) {
        maskCtx.drawImage(oldMask, 0, 0, oldMask.width, oldMask.height, 0, 0, fogWidth, fogHeight);
      }

      buildFogDetails();
      renderFog(performance.now());
      updateWipedArea(true);
      if (fogContainer) {
        fogContainer.classList.add('is-ready');
    }
    }

    function renderFog(now) {
      if (isUnlocked) return;
      ctx.save();
      ctx.clearRect(0, 0, fogWidth, fogHeight);
      ctx.globalCompositeOperation = 'source-over';

      const base = ctx.createLinearGradient(0, 0, fogWidth, fogHeight);
      base.addColorStop(0, 'rgba(220, 227, 228, 0.96)');
      base.addColorStop(0.48, 'rgba(177, 190, 194, 0.94)');
      base.addColorStop(1, 'rgba(229, 233, 232, 0.96)');
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, fogWidth, fogHeight);

      // Những mảng sương trôi chậm tạo chiều sâu thay vì một lớp màu phẳng.
      wisps.forEach((wisp, index) => {
        const driftX = Math.sin(now * wisp.speed + wisp.phase) * fogWidth * 0.055;
        const driftY = Math.cos(now * wisp.speed * 0.72 + wisp.phase) * fogHeight * 0.035;
        const x = wisp.x + driftX;
        const y = wisp.y + driftY;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, wisp.radius);
        const light = index % 2 === 0 ? 255 : 135;
        gradient.addColorStop(0, `rgba(${light}, ${light}, ${light}, ${wisp.alpha})`);
        gradient.addColorStop(1, `rgba(${light}, ${light}, ${light}, 0)`);
        ctx.fillStyle = gradient;
        ctx.fillRect(x - wisp.radius, y - wisp.radius, wisp.radius * 2, wisp.radius * 2);
      });

      ctx.globalAlpha = 0.34;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(noiseCanvas, 0, 0, fogWidth, fogHeight);
      ctx.globalAlpha = 1;

      // Hạt ngưng tụ rất nhẹ trên mặt kính.
      droplets.forEach(drop => {
        ctx.beginPath();
        ctx.ellipse(drop.x, drop.y, drop.r, drop.r * drop.stretch, 0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(235,245,248,${drop.alpha * 0.38})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(255,255,255,${drop.alpha})`;
        ctx.lineWidth = Math.max(1.2, pixelRatio * 0.85);
        ctx.stroke();

        // Điểm phản quang giúp giọt nước hiện rõ trên cả mảng sương sáng.
        ctx.beginPath();
        ctx.arc(drop.x - drop.r * 0.28, drop.y - drop.r * 0.35, Math.max(0.7, drop.r * 0.22), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${Math.min(0.7, drop.alpha * 1.8)})`;
        ctx.fill();
      });

      // Mask trắng là vùng đã lau; destination-out tạo lỗ trong lớp sương.
      ctx.globalCompositeOperation = 'destination-out';
      ctx.drawImage(maskCanvas, 0, 0);
      ctx.restore();
    }

    function animateFog(now) {
      if (isUnlocked) return;
      if (now - lastRenderAt > 15) {
        renderFog(now);
        lastRenderAt = now;
      }
      animationFrame = requestAnimationFrame(animateFog);
    }

    function getPoint(e) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height)
      };
    }

    function paintSoftBrush(from, to) {
      const brushSize = Math.max(94 * pixelRatio, Math.min(fogWidth, fogHeight) * 0.115);
      maskCtx.save();
      maskCtx.globalCompositeOperation = 'source-over';
      maskCtx.lineCap = 'round';
      maskCtx.lineJoin = 'round';
      maskCtx.lineWidth = brushSize * 0.62;
      maskCtx.strokeStyle = 'rgba(255,255,255,.82)';
      maskCtx.shadowColor = 'rgba(255,255,255,.9)';
      maskCtx.shadowBlur = brushSize * 0.26;
      maskCtx.beginPath();
      maskCtx.moveTo(from.x, from.y);
      maskCtx.lineTo(to.x, to.y);
      maskCtx.stroke();

      const glow = maskCtx.createRadialGradient(to.x, to.y, brushSize * 0.12, to.x, to.y, brushSize * 0.58);
      glow.addColorStop(0, 'rgba(255,255,255,.98)');
      glow.addColorStop(0.62, 'rgba(255,255,255,.72)');
      glow.addColorStop(1, 'rgba(255,255,255,0)');
      maskCtx.shadowBlur = 0;
      maskCtx.fillStyle = glow;
      maskCtx.beginPath();
      maskCtx.arc(to.x, to.y, brushSize * 0.58, 0, Math.PI * 2);
      maskCtx.fill();
      maskCtx.restore();
    }

    function updateWipedArea(force) {
      const now = performance.now();
      if (!force && now - lastAreaCheckAt < 180) return;
      lastAreaCheckAt = now;

      // Hạ mask xuống một lưới nhỏ trước khi đo để tránh getImageData toàn màn hình gây giật.
      sampleCtx.clearRect(0, 0, sampleCanvas.width, sampleCanvas.height);
      sampleCtx.drawImage(maskCanvas, 0, 0, sampleCanvas.width, sampleCanvas.height);
      const image = sampleCtx.getImageData(0, 0, sampleCanvas.width, sampleCanvas.height).data;
      let alphaTotal = 0;
      const samples = sampleCanvas.width * sampleCanvas.height;
      for (let i = 3; i < image.length; i += 4) {
        alphaTotal += image[i] / 255;
      }

      const wipedRatio = samples ? alphaTotal / samples : 0;
      const progress = Math.min(1, wipedRatio / unlockRatio);
      if (progressFill) progressFill.style.width = `${Math.round(progress * 100)}%`;
      if (progress >= 1) unlockFog();
    }

    function unlockFog() {
      if (isUnlocked) return;
      isUnlocked = true;
      activePointer = null;
      cancelAnimationFrame(animationFrame);
      cancelAnimationFrame(resizeFrame);

      // Trong lúc lau, một số cách điều hướng vẫn có thể làm scrollY tiến vào ACT I.
      // Đưa viewport về đúng frame mở đầu trước khi gỡ lớp sương để không nhảy cảnh.
      if (act1StartSection) {
        const sectionTop = window.scrollY + act1StartSection.getBoundingClientRect().top;
        const scroller = document.scrollingElement || document.documentElement;
        const root = document.documentElement;
        const previousScrollBehavior = root.style.scrollBehavior;
        // CSS toàn trang dùng smooth-scroll; tạm tắt để thao tác reset được che hoàn toàn dưới lớp sương.
        root.style.scrollBehavior = 'auto';
        scroller.scrollTop = Math.max(0, sectionTop);
        requestAnimationFrame(() => { root.style.scrollBehavior = previousScrollBehavior; });
      }

      if (progressFill) progressFill.style.width = '100%';
      if (hint) hint.style.opacity = '0';
      if (core) core.classList.add('revealed');
      if (fogContainer) fogContainer.classList.add('is-clearing');

      // Giữ progress ở frame đầu trong lúc kính tan và nội dung ACT I hiện lên.
      const revealDelay = reduceMotion ? 260 : 1250;
      setTimeout(() => {
        scrollReleased = true;
        listeners.abort();
        window.dispatchEvent(new Event('act1:fog-cleared'));
        window.dispatchEvent(new Event('resize'));
      }, revealDelay);
    }

    function pointerDown(e) {
      if (isUnlocked || (e.button !== undefined && e.button !== 0)) return;
      e.preventDefault();
      activePointer = e.pointerId;
      canvas.setPointerCapture?.(e.pointerId);
      lastPoint = getPoint(e);
      paintSoftBrush(lastPoint, lastPoint);
      if (hint) hint.classList.add('is-wiping');
      renderFog(performance.now());
      updateWipedArea(false);
    }

    function pointerMove(e) {
      if (isUnlocked || activePointer !== e.pointerId || !lastPoint) return;
      e.preventDefault();
      const events = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : [e];
      events.forEach(pointEvent => {
        const point = getPoint(pointEvent);
        paintSoftBrush(lastPoint, point);
        lastPoint = point;
      });
      if (reduceMotion) renderFog(performance.now());
      updateWipedArea(false);
    }

    function pointerEnd(e) {
      if (activePointer !== e.pointerId) return;
      updateWipedArea(true);
      try { canvas.releasePointerCapture?.(e.pointerId); } catch (_) {}
      activePointer = null;
      lastPoint = null;
      if (hint && !isUnlocked) hint.classList.remove('is-wiping');
    }

    function holdScrollAtFog(e) {
      if (scrollReleased || e.deltaY <= 0 || !act1StartSection) return;
      const rect = act1StartSection.getBoundingClientRect();
      const isAtAct1 = rect.top <= window.innerHeight * .08 && rect.bottom > 0;
      if (isAtAct1 && e.cancelable) e.preventDefault();
    }

    canvas.addEventListener('pointerdown', pointerDown, { signal: listeners.signal });
    canvas.addEventListener('pointermove', pointerMove, { signal: listeners.signal });
    canvas.addEventListener('pointerup', pointerEnd, { signal: listeners.signal });
    canvas.addEventListener('pointercancel', pointerEnd, { signal: listeners.signal });
    canvas.addEventListener('lostpointercapture', pointerEnd, { signal: listeners.signal });
    window.addEventListener('wheel', holdScrollAtFog, { capture: true, passive: false, signal: listeners.signal });
    if (skipButton) skipButton.addEventListener('click', unlockFog, { signal: listeners.signal });
    window.addEventListener('resize', () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(resizeCanvas);
    }, { signal: listeners.signal });

    resizeCanvas();
    if (!reduceMotion) animationFrame = requestAnimationFrame(animateFog);
  }

  // Timeline Rewind được khởi tạo trong một DOMContentLoaded listener khác.
  // Công khai hàm này để bước chuyển sang Act I luôn khởi tạo được kính sương.
  window.initFogCanvas = initFogCanvas;
});

/* Grand Finale được điều khiển cùng scroll engine với ACT II và ACT III. */

/* ---------- ACT II – CHÒM SAO NHỮNG LẦN CHỌN NHAU ---------- */
(function initConstellation() {
  var canvas = document.getElementById('constellation-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var container = canvas.parentElement;
  var stars = container.querySelectorAll('.memory-star');
  var starCount = document.getElementById('star-count');
  var progressFill = document.getElementById('star-progress-fill');
  var completeEl = document.getElementById('constellation-complete');

  // Popup elements
  var popup = document.getElementById('star-modal');
  var popupClose = document.getElementById('star-modal-close');
  var popupImg = document.getElementById('star-modal-img');
  var popupTitle = document.getElementById('star-modal-title');
  var popupStory = document.getElementById('star-modal-story');

  var unlocked = new Set();
  var totalStars = stars.length;
  var starPositions = [];
  var connections = [];
  var scrollProgress = 0;
  // Ba cạnh đầu là cán; bốn cạnh cuối khép thành phần "gáo" của Bắc Đẩu.
  var dipperSegments = [
    [0, 1], [1, 2], [2, 3],
    [3, 4], [4, 5], [5, 6], [6, 3]
  ];

  // Sao chỉ vào tab order khi đã sáng và có thể tương tác.
  stars.forEach(function(star) { star.setAttribute('tabindex', '-1'); });

  function resizeCanvas() {
    var rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    getStarPositions();
    drawConstellation();
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  function getStarPositions() {
    starPositions = [];
    stars.forEach(function(star) {
      var x = parseFloat(star.style.getPropertyValue('--x')) / 100 * canvas.width;
      var y = parseFloat(star.style.getPropertyValue('--y')) / 100 * canvas.height;
      starPositions.push({ x: x, y: y, id: parseInt(star.dataset.id) });
    });
  }
  getStarPositions();

  function drawConstellation() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (starPositions.length < 2) return;

    // Quỹ đạo mờ cho thấy trước hình dạng, nhưng không tranh sự chú ý với ký ức đang sáng.
    ctx.beginPath();
    dipperSegments.forEach(function(segment) {
      var from = starPositions[segment[0]];
      var to = starPositions[segment[1]];
      if (!from || !to) return;
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
    });
    ctx.strokeStyle = 'rgba(183, 204, 239, 0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Scroll vẽ đường nối theo đúng thứ tự bảy ký ức, hỗ trợ cả cuộn xuôi và cuộn ngược.
    var pathProgress = scrollProgress * dipperSegments.length;
    ctx.beginPath();
    for (var segmentIndex = 0; segmentIndex < dipperSegments.length; segmentIndex++) {
      if (pathProgress <= segmentIndex) break;
      var segment = dipperSegments[segmentIndex];
      var from = starPositions[segment[0]];
      var to = starPositions[segment[1]];
      if (!from || !to) continue;
      var amount = Math.min(1, pathProgress - segmentIndex);
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(from.x + (to.x - from.x) * amount, from.y + (to.y - from.y) * amount);
    }
    ctx.strokeStyle = 'rgba(216, 167, 156, 0.82)';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(216, 167, 156, 0.55)';
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  window.setConstellationScrollProgress = function(value) {
    scrollProgress = Math.max(0, Math.min(1, Number(value) || 0));
    var visibleCount = Math.min(totalStars, Math.floor(scrollProgress * totalStars + 0.35));
    unlocked.clear();
    connections = [];

    stars.forEach(function(star, index) {
      var isVisible = index < visibleCount;
      star.classList.toggle('scroll-lit', isVisible);
      star.classList.toggle('unlocked', isVisible);
      star.setAttribute('tabindex', isVisible ? '0' : '-1');
      star.setAttribute('aria-disabled', isVisible ? 'false' : 'true');
      if (isVisible) {
        var id = parseInt(star.dataset.id);
        unlocked.add(id);
        if (starPositions[index]) connections.push(starPositions[index]);
      }
    });

    if (starCount) starCount.textContent = visibleCount;
    if (progressFill) progressFill.style.width = (scrollProgress * 100) + '%';
    if (completeEl) {
      var isComplete = scrollProgress >= 0.94;
      completeEl.classList.toggle('is-scroll-complete', isComplete);
      completeEl.setAttribute('aria-hidden', isComplete ? 'false' : 'true');
    }
    drawConstellation();
  };

  // Mở popup
  function openPopup(starEl) {
    var title = starEl.dataset.title || 'Ký ức';
    var story = starEl.dataset.story || 'Một khoảnh khắc đẹp.';
    var image = starEl.dataset.image || 'images/anh_story_1.jpg';
    
    popupTitle.textContent = title;
    popupStory.textContent = story;
    popupImg.src = image;
    popupImg.alt = title;
    
    popup.classList.add('open');
    popup.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closePopup() {
    popup.classList.remove('open');
    popup.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // Mở khóa ngôi sao và hiển thị popup
  function unlockStar(id) {
    if (unlocked.has(id)) return;
    unlocked.add(id);
    
    var pos = starPositions.find(function(p) { return p.id === id; });
    if (pos) connections.push({ x: pos.x, y: pos.y });
    
    var starEl = container.querySelector('.memory-star[data-id="' + id + '"]');
    if (starEl) {
      starEl.classList.add('unlocked');
      openPopup(starEl);
    }
    
    var count = unlocked.size;
    starCount.textContent = count;
    progressFill.style.width = (count / totalStars * 100) + '%';
    
    drawConstellation();
    
    if (count === totalStars) {
        // Thay vì hiện thông báo ngay lập tức, ta bật "cờ" chờ tắt popup
        window.pendingConstellationComplete = true; 
      }
  }

  // Sự kiện click vào sao
  stars.forEach(function(star) {
    star.addEventListener('click', function(e) {
      e.stopPropagation();
      var id = parseInt(this.dataset.id);
      if (unlocked.has(id)) {
        openPopup(this);
      } else {
        unlockStar(id);
      }
    });
    star.addEventListener('keydown', function(e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      this.click();
    });
  });

  // Đóng popup
  if (popupClose) popupClose.addEventListener('click', closePopup);
  if (popup) popup.addEventListener('click', function(e) {
    if (e.target === popup) closePopup();
  });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && popup && popup.classList.contains('open')) {
      closePopup();
    }
  });

  /* ==========================================================
     THÊM ĐOẠN NÀY: ĐÓNG BẢNG THÔNG BÁO HOÀN THÀNH KHI CLICK RA NGOÀI
     ========================================================== */

     document.addEventListener('click', function(e) {
    
    // 1. Nếu click ra ngoài bảng thông báo -> Chạy animation mờ dần rồi tắt
    if (completeEl && completeEl.style.display === 'block' && !completeEl.contains(e.target)) {
      completeEl.style.animation = 'completeHide 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards';
      setTimeout(function() {
        completeEl.style.display = 'none';
        completeEl.style.animation = ''; 
      }, 400);
    }

    // 2. Nếu click tắt Popup của Ngôi sao (nút X hoặc click ra ngoài popup)
    if (e.target.closest('.star-modal-close') || e.target.classList.contains('star-modal') || e.target.id === 'star-modal') {
      
      // Kiểm tra xem có phải là đang tắt ngôi sao thứ 7 không?
      if (window.pendingConstellationComplete) {
        window.pendingConstellationComplete = false; // Tắt cờ chờ
        
        // Đợi 400ms cho popup ngôi sao chìm xuống hẳn rồi mới bung Bảng thông báo
        setTimeout(function() {
          if (completeEl) completeEl.style.display = 'block';
          var container = document.querySelector('.constellation-container');
          if (container) {
             container.style.animation = 'mythicShake 0.6s ease';
             setTimeout(function() { container.style.animation = ''; }, 700);
          }
        }, 400); 
      }
    }
  });

  // Khởi tạo
  setTimeout(function() {
    resizeCanvas();
  }, 300);

})();
/* ==========================================================================
   NARRATIVE SCROLL ENGINE — ACT II / ACT III / EPILOGUE / GRAND FINALE
   Không timer, không auto-scroll; cuộn ngược sẽ trả scene về trạng thái trước.
   ========================================================================== */
window.addEventListener('DOMContentLoaded', () => {
  const act2 = document.getElementById('act-2');
  const act3 = document.getElementById('act-3');
  const epilogue = document.getElementById('epilogue');
  const finale = document.querySelector('.grand-finale');
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let narrativeFrame = 0;

  document.querySelectorAll('#did-grid .did-card').forEach(card => {
    card.addEventListener('click', () => {
      const flipped = card.classList.toggle('flipped');
      card.setAttribute('aria-expanded', String(flipped));
    });
  });

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const segment = (value, start, end) => clamp((value - start) / Math.max(.0001, end - start));
  const envelope = (value, inStart, inEnd, outStart, outEnd) => {
    const fadeIn = segment(value, inStart, inEnd);
    const fadeOut = 1 - segment(value, outStart, outEnd);
    return clamp(Math.min(fadeIn, fadeOut));
  };
  const scrollProgress = (section, knownRect) => {
    if (!section) return 0;
    const rect = knownRect || section.getBoundingClientRect();
    const travel = Math.max(1, rect.height - window.innerHeight);
    return clamp(-rect.top / travel);
  };

  function renderAct2(knownRect) {
    if (!act2) return;
    const progress = scrollProgress(act2, knownRect);
    const gather = segment(progress, .09, .27);
    const titleOpacity = envelope(progress, 0, .045, .23, .34);
    const memoryOpacity = envelope(progress, .07, .15, .28, .39);
    const constellationOpacity = envelope(progress, .29, .39, .94, 1);
    const horizontalTravel = Math.min(window.innerWidth * .34, 430);

    act2.style.setProperty('--a2-progress', progress.toFixed(4));
    act2.style.setProperty('--a2-title-opacity', titleOpacity.toFixed(4));
    act2.style.setProperty('--a2-memory-opacity', memoryOpacity.toFixed(4));
    act2.style.setProperty('--a2-constellation-opacity', constellationOpacity.toFixed(4));
    act2.style.setProperty('--a2-orbit-scale', (.2 + gather * .8).toFixed(4));
    act2.style.setProperty('--a2-card-left-x', `${(-horizontalTravel * (1 - gather)).toFixed(1)}px`);
    act2.style.setProperty('--a2-card-right-x', `${(horizontalTravel * (1 - gather)).toFixed(1)}px`);
    act2.style.setProperty('--a2-left-rotate', `${(-8 * (1 - gather)).toFixed(2)}deg`);
    act2.style.setProperty('--a2-right-rotate', `${(8 * (1 - gather)).toFixed(2)}deg`);

    const constellationProgress = segment(progress, .34, .9);
    window.act2OpticsProgress = segment(progress, .08, .86);
    if (typeof window.setConstellationScrollProgress === 'function') {
      window.setConstellationScrollProgress(constellationProgress);
    }
  }

  function renderAct3(knownRect) {
    if (!act3) return;
    const progress = scrollProgress(act3, knownRect);
    const headingOpacity = envelope(progress, 0, .045, .2, .3);
    const unpromiseOpacity = envelope(progress, .12, .2, .34, .43);
    const pagesOpacity = envelope(progress, .29, .37, .57, .65);
    const pageMerge = segment(progress, .38, .57);
    const mergeOpacity = envelope(progress, .48, .55, .6, .67);
    const pageCopyOpacity = 1 - segment(progress, .46, .55);
    const lightOpacity = envelope(progress, .035, .12, .91, .995);
    const cueOpacity = envelope(progress, .895, .925, .955, .995);
    const horizontalTravel = Math.min(window.innerWidth * .34, 440);

    act3.style.setProperty('--a3-progress', progress.toFixed(4));
    act3.style.setProperty('--a3-heading-opacity', headingOpacity.toFixed(4));
    act3.style.setProperty('--a3-unpromise-opacity', unpromiseOpacity.toFixed(4));
    act3.style.setProperty('--a3-pages-opacity', pagesOpacity.toFixed(4));
    act3.style.setProperty('--a3-page-left-x', `${(-horizontalTravel * (1 - pageMerge)).toFixed(1)}px`);
    act3.style.setProperty('--a3-page-right-x', `${(horizontalTravel * (1 - pageMerge)).toFixed(1)}px`);
    act3.style.setProperty('--a3-page-rotate', `${(7 * (1 - pageMerge)).toFixed(2)}deg`);
    act3.style.setProperty('--a3-left-page-rotate', `${(-7 * (1 - pageMerge)).toFixed(2)}deg`);
    act3.style.setProperty('--a3-merge-opacity', mergeOpacity.toFixed(4));
    act3.style.setProperty('--a3-page-copy-opacity', pageCopyOpacity.toFixed(4));
    act3.style.setProperty('--a3-light-opacity', lightOpacity.toFixed(4));
    act3.style.setProperty('--a3-cue-opacity', cueOpacity.toFixed(4));

    act3.querySelectorAll('.unpromise-item').forEach((item, index) => {
      const isVisible = progress >= .15 + index * .055 && progress < .44;
      item.classList.toggle('visible', isVisible);
    });

    const promises = document.getElementById('act-3-promises');
    const signatures = document.getElementById('act-3-signatures');
    const proposalCue = document.getElementById('a3-proposal-cue');
    const promiseActive = progress >= .59 && progress < .85;
    const signaturesActive = progress >= .83 && progress < .93;
    const cueActive = progress >= .895 && progress < .999;

    promises?.classList.toggle('active', promiseActive);
    signatures?.classList.toggle('active', signaturesActive);
    proposalCue?.classList.toggle('show', cueActive);
    act3.classList.toggle('streaks-down', progress >= .91);

    const ringThresholds = [.62, .71, .80];
    ['p-item-1', 'p-item-2', 'p-item-3'].forEach((id, index) => {
      document.getElementById(id)?.classList.toggle('show', promiseActive && progress >= ringThresholds[index]);
    });
    act3.querySelectorAll('.promise-rings .ring').forEach((ring, index) => {
      ring.classList.toggle('draw', promiseActive && progress >= ringThresholds[index]);
    });
    act3.querySelector('.sign-groom')?.classList.toggle('draw', signaturesActive && progress >= .83);
    act3.querySelector('.sign-amp')?.classList.toggle('draw', signaturesActive && progress >= .86);
    act3.querySelector('.sign-bride')?.classList.toggle('draw', signaturesActive && progress >= .89);
    act3.classList.toggle('transition-to-focus', cueActive);

    const rect = knownRect || act3.getBoundingClientRect();
    const isNearAct3 = rect.top < window.innerHeight && rect.bottom > 0;
    window.isTimeFrozen = false;
    window.act3StreakDirection = progress >= .91 ? 1 : -1;
    window.isStarTrailsActive = isNearAct3;
  }

  function renderEpilogue(knownRect) {
    if (!epilogue) return;
    const progress = scrollProgress(epilogue, knownRect);
    const focusOpacity = envelope(progress, 0, .075, .27, .36);
    const focusValue = segment(progress, .045, .235);
    const ringOpacity = envelope(progress, .23, .3, .36, .44);
    const ringProgress = segment(progress, .24, .4);
    const albumOpacity = envelope(progress, .31, .4, .61, .7);
    const albumProgress = segment(progress, .36, .64);
    const coupleOpacity = envelope(progress, .61, .7, .8, .88);
    const coupleProgress = segment(progress, .63, .76);
    const announcementOpacity = envelope(progress, .76, .82, .88, .93);
    const futureOpacity = segment(progress, .91, .97);
    const coupleTravel = Math.min(window.innerWidth * .28, 330) * (1 - coupleProgress);
    const albumTrack = document.getElementById('gallery-wrapper');
    const albumTravel = albumTrack ? Math.max(0, albumTrack.scrollWidth - window.innerWidth * .76) : 0;

    epilogue.style.setProperty('--epi-progress', progress.toFixed(4));
    epilogue.style.setProperty('--epi-focus-opacity', focusOpacity.toFixed(4));
    epilogue.style.setProperty('--epi-ring-opacity', ringOpacity.toFixed(4));
    epilogue.style.setProperty('--epi-ring-scale', (.25 + ringProgress * 2.25).toFixed(4));
    epilogue.style.setProperty('--epi-album-opacity', albumOpacity.toFixed(4));
    epilogue.style.setProperty('--epi-album-x', `${(-albumTravel * albumProgress).toFixed(1)}px`);
    epilogue.style.setProperty('--epi-couple-opacity', coupleOpacity.toFixed(4));
    epilogue.style.setProperty('--epi-couple-left-shift', `${(-coupleTravel).toFixed(1)}px`);
    epilogue.style.setProperty('--epi-couple-shift', `${coupleTravel.toFixed(1)}px`);
    epilogue.style.setProperty('--epi-announcement-opacity', announcementOpacity.toFixed(4));
    epilogue.style.setProperty('--epi-future-opacity', futureOpacity.toFixed(4));

    if (typeof window.setEpilogueFocus === 'function') {
      window.setEpilogueFocus(focusValue * 100, false);
    }

    const focusScene = document.getElementById('epilogue-focus-scene');
    const albumScene = document.getElementById('gallery');
    const coupleScene = document.getElementById('couple');
    const announcementScene = document.getElementById('events');
    const futureScene = document.getElementById('future-timeline');
    if (focusScene) focusScene.style.pointerEvents = focusOpacity > .2 ? 'auto' : 'none';
    if (albumScene) albumScene.style.pointerEvents = albumOpacity > .55 ? 'auto' : 'none';
    if (coupleScene) coupleScene.style.pointerEvents = coupleOpacity > .55 ? 'auto' : 'none';
    if (announcementScene) announcementScene.style.pointerEvents = announcementOpacity > .55 ? 'auto' : 'none';
    if (futureScene) futureScene.style.pointerEvents = futureOpacity > .55 ? 'auto' : 'none';

    futureScene?.querySelector('.quote-part-1')?.classList.toggle('show', progress >= .94);
    futureScene?.querySelector('.quote-part-2')?.classList.toggle('show', progress >= .97);

    const progressFill = document.getElementById('epilogue-progress-fill');
    const progressText = document.getElementById('epilogue-progress-text');
    if (progressFill) progressFill.style.width = `${Math.round(progress * 100)}%`;
    if (progressText) progressText.textContent = `${Math.round(progress * 100)}%`;
  }

  function renderFinale(knownRect) {
    if (!finale) return;
    const rect = knownRect || finale.getBoundingClientRect();
    const progress = clamp((window.innerHeight - rect.top) / (window.innerHeight * 1.25));
    const thresholds = [.06, .22, .39, .57];
    thresholds.forEach((threshold, index) => {
      finale.classList.toggle(`step-${index + 1}`, progress >= threshold);
    });
    document.body.classList.toggle('finale-in-view', rect.top < window.innerHeight && rect.bottom > 0);
    document.body.classList.toggle('past-finale', rect.bottom <= 0);
  }

  function renderNarrative() {
    narrativeFrame = 0;
    const viewportHeight = window.innerHeight;
    const act2Rect = act2?.getBoundingClientRect();
    const act3Rect = act3?.getBoundingClientRect();
    const epilogueRect = epilogue?.getBoundingClientRect();
    const finaleRect = finale?.getBoundingClientRect();
    const isNear = rect => rect && rect.top < viewportHeight * 2 && rect.bottom > -viewportHeight;
    const occupiesViewport = rect => rect && rect.top < viewportHeight && rect.bottom > 0;

    // Chỉ ghi style cho scene đang tới gần; section xa không còn chiếm main thread.
    if (isNear(act2Rect)) renderAct2(act2Rect);
    if (isNear(act3Rect)) renderAct3(act3Rect);
    if (isNear(epilogueRect)) renderEpilogue(epilogueRect);
    renderFinale(finaleRect);
    document.body.classList.toggle('narrative-petals-hidden', occupiesViewport(act2Rect) || occupiesViewport(act3Rect) || occupiesViewport(epilogueRect));
  }

  function scheduleNarrativeRender() {
    if (!narrativeFrame) narrativeFrame = requestAnimationFrame(renderNarrative);
  }

  window.storyFrames.subscribe(scheduleNarrativeRender);
  renderNarrative();

  if (reduceMotion) {
    act2?.classList.add('reduced-motion');
    act3?.classList.add('reduced-motion');
    epilogue?.classList.add('reduced-motion');
  }
});
