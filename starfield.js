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
    ribbonLifetime: 0.32,
    ribbonMaxPoints: 48,
    ribbonSpacing: 2,
    maxSparks: 70,
    sparkSpacing: 16,
    meteorInterval: [5, 11],
    mobileMeteorInterval: [10, 18],
    maxPixelRatio: 1.5
  };
  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const palette = getComputedStyle(document.documentElement);
  const colors = ["--color-primary", "--color-secondary", "--color-text"].map((token, index) => palette.getPropertyValue(token).trim() || ["#3ef2ff", "#c69cff", "#eef6ff"][index]);
  const hot = palette.getPropertyValue("--color-hot").trim() || "#ff4fd8";
  const sparkColors = [colors[0], colors[0], colors[1], hot, colors[2]];
  const stars = [];
  // Pointer effects: a tapered light ribbon (oldest point first), loose sparks and click rings.
  const ribbon = [];
  const sparks = [];
  const rings = [];
  let sparkDistance = 0;
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
  let trailDirty = false;
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
    clearEffects();
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

  function spawnSpark(x, y, vx = 0, vy = 0, burst = false) {
    const angle = random(0, Math.PI * 2);
    const speed = burst ? random(60, 190) : random(8, 36);
    sparks.push({
      x, y, age: 0, life: burst ? random(0.45, 0.8) : random(0.4, 0.75),
      vx: Math.cos(angle) * speed + vx * 0.12, vy: Math.sin(angle) * speed + vy * 0.12,
      radius: burst ? random(1.4, 2.8) : random(1, 2.4), rotation: random(0, Math.PI),
      spin: random(-4, 4), star: Math.random() < 0.35,
      color: sparkColors[Math.floor(Math.random() * sparkColors.length)]
    });
    if (sparks.length > SETTINGS.maxSparks) sparks.splice(0, sparks.length - SETTINGS.maxSparks);
  }

  function addPoint(x, y) {
    const previous = ribbon[ribbon.length - 1];
    if (previous && Math.hypot(x - previous.x, y - previous.y) < SETTINGS.ribbonSpacing) return;
    ribbon.push({ x, y, age: 0 });
    if (ribbon.length > SETTINGS.ribbonMaxPoints) ribbon.splice(0, ribbon.length - SETTINGS.ribbonMaxPoints);
  }

  function pointerMove(event) {
    if (paused || !trailEnabled || document.hidden || event.pointerType === "touch") return;
    // Coalesced events keep fast strokes smooth on high-rate mice.
    const coalesced = event.getCoalescedEvents?.() || [];
    for (const sample of coalesced.length ? coalesced : [event]) {
      const next = { x: sample.clientX, y: sample.clientY };
      if (!lastPointer) {
        lastPointer = next;
        addPoint(next.x, next.y);
        spawnSpark(next.x, next.y);
        continue;
      }
      const dx = next.x - lastPointer.x;
      const dy = next.y - lastPointer.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 0.5) continue;
      addPoint(next.x, next.y);
      sparkDistance += distance;
      // Faster movement sheds more sparks, capped so a flick never floods the canvas.
      const sparkCount = Math.min(4, Math.floor(sparkDistance / SETTINGS.sparkSpacing));
      if (sparkCount) {
        sparkDistance -= sparkCount * SETTINGS.sparkSpacing;
        for (let index = 1; index <= sparkCount; index += 1) {
          spawnSpark(lastPointer.x + dx * index / sparkCount, lastPointer.y + dy * index / sparkCount, dx * 60, dy * 60);
        }
      }
      lastPointer = next;
    }
    wakeTrail();
  }

  function pointerDown(event) {
    if (paused || !trailEnabled || document.hidden || event.pointerType === "touch") return;
    rings.push({ x: event.clientX, y: event.clientY, age: 0, life: 0.55 });
    for (let index = 0; index < 14; index += 1) spawnSpark(event.clientX, event.clientY, 0, 0, true);
    wakeTrail();
  }

  // Only request frames while an effect is fading or the optional sky is running.
  function wakeTrail() {
    if (frameId !== null) return;
    lastFrame = null;
    frameId = requestAnimationFrame(frame);
  }

  function hasEffects() {
    return ribbon.length > 0 || sparks.length > 0 || rings.length > 0;
  }

  function paintRibbon(delta) {
    for (const point of ribbon) point.age += delta;
    while (ribbon.length && ribbon[0].age >= SETTINGS.ribbonLifetime) ribbon.shift();
    if (ribbon.length < 2) return;
    const last = ribbon.length - 1;
    const head = ribbon[last];
    const tail = ribbon[0];
    // Strength tapers from the tail to the cursor and fades with each point's age.
    const strength = ribbon.map((point, index) => Math.max(0, 1 - point.age / SETTINGS.ribbonLifetime) * (index / last));
    const normals = ribbon.map((point, index) => {
      const before = ribbon[Math.max(0, index - 1)];
      const after = ribbon[Math.min(last, index + 1)];
      const dx = after.x - before.x;
      const dy = after.y - before.y;
      const length = Math.hypot(dx, dy) || 1;
      return { x: -dy / length, y: dx / length };
    });
    // One filled, tapered outline per layer: no overlapping joints, so no beading.
    const layer = (halfWidth, style, alpha) => {
      trailContext.beginPath();
      for (let index = 0; index <= last; index += 1) {
        const w = halfWidth(strength[index]);
        const x = ribbon[index].x + normals[index].x * w;
        const y = ribbon[index].y + normals[index].y * w;
        if (index === 0) trailContext.moveTo(x, y);
        else trailContext.lineTo(x, y);
      }
      for (let index = last; index >= 0; index -= 1) {
        const w = halfWidth(strength[index]);
        trailContext.lineTo(ribbon[index].x - normals[index].x * w, ribbon[index].y - normals[index].y * w);
      }
      trailContext.closePath();
      trailContext.globalAlpha = alpha;
      trailContext.fillStyle = style;
      trailContext.fill();
    };
    const sweep = trailContext.createLinearGradient(tail.x, tail.y, head.x, head.y);
    sweep.addColorStop(0, "transparent");
    sweep.addColorStop(0.35, colors[1]);
    sweep.addColorStop(1, colors[0]);
    const core = trailContext.createLinearGradient(tail.x, tail.y, head.x, head.y);
    core.addColorStop(0, "transparent");
    core.addColorStop(0.6, colors[0]);
    core.addColorStop(1, colors[2]);
    // Outer haze, coloured body, then a white-hot filament.
    layer(s => s * 9, sweep, 0.14);
    layer(s => s * 3.2, sweep, 0.45);
    layer(s => s * 1.1, core, 0.95);
    const headLife = Math.max(0, 1 - head.age / SETTINGS.ribbonLifetime);
    const glow = trailContext.createRadialGradient(head.x, head.y, 0, head.x, head.y, 16);
    glow.addColorStop(0, colors[2]);
    glow.addColorStop(0.25, colors[0]);
    glow.addColorStop(1, "transparent");
    trailContext.globalAlpha = headLife * 0.55;
    trailContext.fillStyle = glow;
    trailContext.beginPath();
    trailContext.arc(head.x, head.y, 16, 0, Math.PI * 2);
    trailContext.fill();
  }

  function paintSparks(delta) {
    const drag = Math.exp(-3.2 * delta);
    for (let index = sparks.length - 1; index >= 0; index -= 1) {
      const spark = sparks[index];
      spark.age += delta;
      if (spark.age >= spark.life) { sparks.splice(index, 1); continue; }
      const life = 1 - spark.age / spark.life;
      spark.vx *= drag;
      spark.vy = spark.vy * drag + 18 * delta;
      spark.x += spark.vx * delta;
      spark.y += spark.vy * delta;
      spark.rotation += spark.spin * delta;
      const radius = spark.radius * (0.4 + life * 0.6);
      trailContext.fillStyle = spark.color;
      trailContext.globalAlpha = life * life * 0.28;
      trailContext.beginPath();
      trailContext.arc(spark.x, spark.y, radius * 3.2, 0, Math.PI * 2);
      trailContext.fill();
      trailContext.globalAlpha = life * (0.75 + Math.sin(spark.age * 38) * 0.25);
      if (spark.star) starShape(trailContext, spark.x, spark.y, radius * 2.2, spark.rotation, 4);
      else {
        trailContext.beginPath();
        trailContext.arc(spark.x, spark.y, radius, 0, Math.PI * 2);
        trailContext.fill();
      }
    }
  }

  function paintRings(delta) {
    for (let index = rings.length - 1; index >= 0; index -= 1) {
      const ring = rings[index];
      ring.age += delta;
      if (ring.age >= ring.life) { rings.splice(index, 1); continue; }
      const progress = ring.age / ring.life;
      const eased = 1 - (1 - progress) ** 3;
      trailContext.lineWidth = 1.5;
      // A rotating hexagon reads as an interface pulse rather than a water ripple.
      trailContext.globalAlpha = (1 - progress) * 0.9;
      trailContext.strokeStyle = colors[0];
      trailContext.beginPath();
      for (let side = 0; side <= 6; side += 1) {
        const angle = side * Math.PI / 3 + progress * 0.6;
        const px = ring.x + Math.cos(angle) * (6 + eased * 30);
        const py = ring.y + Math.sin(angle) * (6 + eased * 30);
        if (side === 0) trailContext.moveTo(px, py);
        else trailContext.lineTo(px, py);
      }
      trailContext.stroke();
      trailContext.globalAlpha = (1 - progress) * 0.5;
      trailContext.strokeStyle = hot;
      trailContext.beginPath();
      trailContext.arc(ring.x, ring.y, 3 + eased * 18, 0, Math.PI * 2);
      trailContext.stroke();
    }
  }

  function paintTrails(delta) {
    trailContext.clearRect(0, 0, width, height);
    // Additive blending makes overlapping light brighten instead of muddying.
    trailContext.globalCompositeOperation = "lighter";
    paintRibbon(delta);
    paintSparks(delta);
    paintRings(delta);
    trailContext.globalCompositeOperation = "source-over";
    trailContext.globalAlpha = 1;
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
    if (hasEffects()) {
      paintTrails(delta);
      trailDirty = true;
    } else if (trailDirty) {
      trailContext.clearRect(0, 0, width, height);
      trailDirty = false;
    }
    if (motionEnabled || hasEffects()) frameId = requestAnimationFrame(frame);
    else lastFrame = null;
  }

  function clearEffects() {
    lastPointer = null;
    sparkDistance = 0;
    ribbon.length = 0;
    sparks.length = 0;
    rings.length = 0;
  }

  function clearTrails() {
    clearEffects();
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
    if (trailLabel) trailLabel.textContent = allowed && trailEnabled ? "鼠标光迹：开启" : "鼠标光迹：关闭";
    if (hint) hint.textContent = allowed ? "背景星空、随机流星与鼠标光迹默认开启；可分别切换，选择会保存在此浏览器。" : "系统已启用减少动态效果，背景动画与鼠标光迹保持关闭。";
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
  window.addEventListener("pointerdown", pointerDown, { passive: true });
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
