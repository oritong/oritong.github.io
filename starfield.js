(() => {
  const canvas = document.getElementById("starfield");
  const trailCanvas = document.getElementById("star-trail");
  const context = canvas?.getContext("2d");
  const trailContext = trailCanvas?.getContext("2d");
  const toggle = document.getElementById("motion-toggle");
  const label = document.getElementById("motion-label");
  const trailToggle = document.getElementById("trail-toggle");
  const trailLabel = document.getElementById("trail-label");
  const hint = document.getElementById("motion-hint");
  if (!context || !trailContext) {
    if (toggle) toggle.hidden = true;
    if (trailToggle) trailToggle.hidden = true;
    if (hint) hint.textContent = "当前浏览器不支持星空效果，页面保持静态。";
    return;
  }

  const SETTINGS = {
    maxStars: 64,
    starArea: 18000,
    driftSpeed: 0.35,
    maxTrailStars: 28,
    trailLifetime: 0.8,
    trailSpacing: 11,
    meteorInterval: [5, 11],
    mobileMeteorInterval: [10, 18],
    maxPixelRatio: 1.5
  };
  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const palette = getComputedStyle(document.documentElement);
  const colors = ["--color-primary", "--color-secondary", "--color-text"].map((token, index) => palette.getPropertyValue(token).trim() || ["#82e5f5", "#b9acfa", "#edf5ff"][index]);
  const stars = [];
  const trails = [];
  const meteors = [];
  let meteorDelay = 0;
  let width = 0;
  let height = 0;
  let lastPointer = null;
  let frameId = null;
  let lastFrame = null;
  let backgroundAge = 0;
  let time = 0;
  const readPreference = (key, fallback = false) => {
    try {
      const value = localStorage.getItem(key);
      return value === "on" ? true : value === "off" ? false : fallback;
    } catch { return fallback; }
  };
  const savePreference = (key, value) => { try { localStorage.setItem(key, value ? "on" : "off"); } catch { /* Storage may be unavailable for file:// previews. */ } };
  let motionEnabled = readPreference("oritong-motion", true);
  let trailEnabled = readPreference("oritong-trail", true);
  let paused = true;
  let resizeFrame = null;
  const random = (min, max) => min + Math.random() * (max - min);

  function resize() {
    width = document.documentElement.clientWidth || window.innerWidth;
    height = window.innerHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, SETTINGS.maxPixelRatio);
    for (const [surface, ctx] of [[canvas, context], [trailCanvas, trailContext]]) {
      surface.width = Math.round(width * ratio);
      surface.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    stars.length = 0;
    trails.length = 0;
    meteors.length = 0;
    meteorDelay = random(1.5, 3);
    lastPointer = null;
    const count = Math.min(SETTINGS.maxStars, Math.max(15, Math.floor(width * height / SETTINGS.starArea)));
    for (let index = 0; index < count; index += 1) {
      const depth = random(0.2, 1);
      stars.push({
        x: random(0, width), y: random(0, height),
        radius: 0.4 + depth * 1.05, depth,
        alpha: random(0.35, 0.82), phase: random(0, Math.PI * 2),
        twinkle: random(0.5, 1.2), color: colors[index % colors.length]
      });
    }
    if (motionEnabled && !motionPreference.matches) paintBackground(0);
  }

  function starShape(ctx, x, y, radius, rotation = 0, points = 5) {
    ctx.beginPath();
    for (let index = 0; index < points * 2; index += 1) {
      const angle = rotation - Math.PI / 2 + index * Math.PI / points;
      const length = radius * (index % 2 ? 0.42 : 1);
      const px = x + Math.cos(angle) * length;
      const py = y + Math.sin(angle) * length;
      if (index === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  function paintBackground(delta) {
    context.clearRect(0, 0, width, height);
    for (const star of stars) {
      // Pixels per second; near stars move faster than distant ones.
      star.x += (2 + star.depth * 7) * delta * SETTINGS.driftSpeed;
      star.y += (1 + star.depth * 3) * delta * SETTINGS.driftSpeed;
      if (star.x > width + 4) star.x = -4;
      if (star.y > height + 4) star.y = -4;
      context.globalAlpha = Math.min(1, star.alpha + Math.sin(time * star.twinkle + star.phase) * 0.14);
      context.fillStyle = star.color;
      if (star.depth > 0.91) {
        context.shadowColor = star.color;
        context.shadowBlur = 6;
        starShape(context, star.x, star.y, star.radius * 2.4, 0, 4);
        context.shadowBlur = 0;
      } else {
        context.beginPath();
        context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        context.fill();
      }
    }
    paintMeteors(delta);
    context.globalAlpha = 1;
  }

  function paintMeteors(delta) {
    meteorDelay -= delta;
    if (meteorDelay <= 0) {
      const angle = random(0.45, 0.85);
      const speed = random(180, 270);
      meteors.push({
        x: random(width * 0.08, width * 0.65), y: random(height * 0.06, height * 0.42),
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        age: 0, life: random(1.1, 1.8), length: Math.min(width * 0.22, random(75, 130)),
        angle, color: colors[Math.floor(Math.random() * colors.length)]
      });
      const interval = width < 640 ? SETTINGS.mobileMeteorInterval : SETTINGS.meteorInterval;
      meteorDelay = random(...interval);
    }
    for (let index = meteors.length - 1; index >= 0; index -= 1) {
      const meteor = meteors[index];
      meteor.age += delta;
      if (meteor.age >= meteor.life) { meteors.splice(index, 1); continue; }
      meteor.x += meteor.vx * delta;
      meteor.y += meteor.vy * delta;
      const tailX = meteor.x - Math.cos(meteor.angle) * meteor.length;
      const tailY = meteor.y - Math.sin(meteor.angle) * meteor.length;
      const gradient = context.createLinearGradient(tailX, tailY, meteor.x, meteor.y);
      gradient.addColorStop(0, 'transparent');
      gradient.addColorStop(1, meteor.color);
      context.globalAlpha = Math.sin(Math.PI * meteor.age / meteor.life) * 0.85;
      context.strokeStyle = gradient;
      context.lineWidth = 1.4;
      context.lineCap = 'round';
      context.beginPath();
      context.moveTo(tailX, tailY);
      context.lineTo(meteor.x, meteor.y);
      context.stroke();
      context.fillStyle = meteor.color;
      starShape(context, meteor.x, meteor.y, 2.5, 0, 4);
    }
  }

  function spawnTrail(x, y) {
    trails.push({
      x, y, age: 0, life: random(0.65, 1) * SETTINGS.trailLifetime,
      radius: random(3.5, 7), rotation: random(0, Math.PI),
      spin: random(-1.8, 1.8), vx: random(-12, 12), vy: random(8, 22),
      color: colors[Math.floor(Math.random() * colors.length)]
    });
    if (trails.length > SETTINGS.maxTrailStars) trails.splice(0, trails.length - SETTINGS.maxTrailStars);
  }

  function pointerMove(event) {
    if (paused || !trailEnabled || document.hidden || event.pointerType === "touch") return;
    const next = { x: event.clientX, y: event.clientY };
    if (!lastPointer) {
      lastPointer = next;
      spawnTrail(next.x, next.y);
      wakeTrail();
      return;
    }
    const dx = next.x - lastPointer.x;
    const dy = next.y - lastPointer.y;
    const distance = Math.hypot(dx, dy);
    if (distance < SETTINGS.trailSpacing) return;
    const count = Math.min(8, Math.floor(distance / SETTINGS.trailSpacing));
    for (let index = 1; index <= count; index += 1) {
      spawnTrail(lastPointer.x + dx * index / count, lastPointer.y + dy * index / count);
    }
    lastPointer = next;
    wakeTrail();
  }

  // Only request frames while a star is fading or the optional sky is running.
  function wakeTrail() {
    if (frameId !== null) return;
    lastFrame = null;
    frameId = requestAnimationFrame(frame);
  }

  function paintTrails(delta) {
    trailContext.clearRect(0, 0, width, height);
    for (let index = trails.length - 1; index >= 0; index -= 1) {
      const star = trails[index];
      star.age += delta;
      if (star.age >= star.life) { trails.splice(index, 1); continue; }
      const life = 1 - star.age / star.life;
      star.x += star.vx * delta;
      star.y += star.vy * delta;
      star.rotation += star.spin * delta;
      trailContext.globalAlpha = life * 0.9;
      trailContext.fillStyle = star.color;
      trailContext.shadowColor = star.color;
      trailContext.shadowBlur = 9 * life;
      starShape(trailContext, star.x, star.y, star.radius * (0.35 + life * 0.65), star.rotation);
    }
    trailContext.globalAlpha = 1;
    trailContext.shadowBlur = 0;
  }

  function frame(timestamp) {
    frameId = null;
    if (paused || document.hidden) return;
    const delta = lastFrame === null ? 0 : Math.min((timestamp - lastFrame) / 1000, 0.05);
    lastFrame = timestamp;
    time += delta;
    backgroundAge += delta;
    // The background needs only 30 fps; pointer stars follow the display refresh rate.
    if (motionEnabled && backgroundAge >= 1 / 30) {
      paintBackground(backgroundAge);
      backgroundAge = 0;
    }
    if (trails.length) paintTrails(delta);
    if (motionEnabled || trails.length) frameId = requestAnimationFrame(frame);
    else lastFrame = null;
  }

  function clearTrails() {
    lastPointer = null;
    trails.length = 0;
    trailContext.clearRect(0, 0, width, height);
  }

  function syncMotion() {
    paused = motionPreference.matches || (!motionEnabled && !trailEnabled);
    if (frameId !== null) cancelAnimationFrame(frameId);
    frameId = null;
    lastFrame = null;
    backgroundAge = 0;
    clearTrails();
    meteors.length = 0;
    meteorDelay = random(1.5, 3);
    document.documentElement.classList.toggle("motion-paused", paused || document.hidden);
    const allowed = !motionPreference.matches;
    toggle?.setAttribute("aria-pressed", String(allowed && motionEnabled));
    trailToggle?.setAttribute("aria-pressed", String(allowed && trailEnabled));
    if (toggle) toggle.disabled = !allowed;
    if (trailToggle) trailToggle.disabled = !allowed;
    if (label) label.textContent = allowed && motionEnabled ? "背景星空与流星：开启" : "背景星空与流星：关闭";
    if (trailLabel) trailLabel.textContent = allowed && trailEnabled ? "星星拖尾：开启" : "星星拖尾：关闭";
    if (hint) hint.textContent = allowed ? "背景星空、随机流星与鼠标拖尾默认开启；可分别切换背景和拖尾，选择会保存在此浏览器。" : "系统已启用减少动态效果，背景动画与星星拖尾保持关闭。";
    context.clearRect(0, 0, width, height);
    if (allowed && motionEnabled) paintBackground(0);
    if (!paused && motionEnabled && !document.hidden) frameId = requestAnimationFrame(frame);
  }

  toggle?.addEventListener("click", () => { motionEnabled = !motionEnabled; savePreference("oritong-motion", motionEnabled); syncMotion(); });
  trailToggle?.addEventListener("click", () => { trailEnabled = !trailEnabled; savePreference("oritong-trail", trailEnabled); syncMotion(); });
  motionPreference.addEventListener("change", syncMotion);
  document.addEventListener("visibilitychange", syncMotion);
  window.addEventListener("resize", () => { if (resizeFrame !== null) cancelAnimationFrame(resizeFrame); resizeFrame = requestAnimationFrame(() => { resizeFrame = null; resize(); }); }, { passive: true });
  window.addEventListener("pointermove", pointerMove, { passive: true });
  document.documentElement.addEventListener("pointerleave", () => { lastPointer = null; });
  window.addEventListener("blur", clearTrails);
  window.addEventListener("pagehide", () => {
    if (frameId !== null) cancelAnimationFrame(frameId);
    frameId = null;
    clearTrails();
  });
  window.addEventListener("pageshow", syncMotion);
  resize();
  syncMotion();
})();
