(() => {
  const canvas = document.getElementById("starfield");
  const trailCanvas = document.getElementById("star-trail");
  const context = canvas?.getContext("2d");
  const trailContext = trailCanvas?.getContext("2d");
  const toggle = document.getElementById("motion-toggle");
  const label = document.getElementById("motion-label");
  if (!context || !trailContext) {
    if (toggle) toggle.hidden = true;
    return;
  }

  const SETTINGS = {
    maxStars: 260,
    starArea: 4300,
    driftSpeed: 1,
    maxTrailStars: 72,
    trailLifetime: 0.85,
    trailSpacing: 13,
    maxPixelRatio: 1.75
  };
  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const colors = ["#a8edda", "#c3bbff", "#ffe1a5", "#bddeff"];
  const stars = [];
  const trails = [];
  let width = 0;
  let height = 0;
  let lastPointer = null;
  let frameId = null;
  let lastFrame = null;
  let backgroundAge = 0;
  let time = 0;
  let paused = motionPreference.matches;
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
    lastPointer = null;
    const count = Math.min(SETTINGS.maxStars, Math.max(75, Math.floor(width * height / SETTINGS.starArea)));
    for (let index = 0; index < count; index += 1) {
      const depth = random(0.2, 1);
      stars.push({
        x: random(0, width), y: random(0, height),
        radius: 0.4 + depth * 1.05, depth,
        alpha: random(0.35, 0.82), phase: random(0, Math.PI * 2),
        twinkle: random(0.5, 1.2), color: colors[index % colors.length]
      });
    }
    paintBackground(0);
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
    context.globalAlpha = 1;
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
    if (paused || document.hidden || event.pointerType === "touch") return;
    const next = { x: event.clientX, y: event.clientY };
    if (!lastPointer) {
      lastPointer = next;
      spawnTrail(next.x, next.y);
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
    if (backgroundAge >= 1 / 30) {
      paintBackground(backgroundAge);
      backgroundAge = 0;
    }
    if (trails.length) paintTrails(delta);
    frameId = requestAnimationFrame(frame);
  }

  function clearTrails() {
    lastPointer = null;
    trails.length = 0;
    trailContext.clearRect(0, 0, width, height);
  }

  function syncMotion() {
    if (frameId !== null) cancelAnimationFrame(frameId);
    frameId = null;
    lastFrame = null;
    backgroundAge = 0;
    clearTrails();
    document.documentElement.classList.toggle("motion-paused", paused || document.hidden);
    toggle?.setAttribute("aria-pressed", String(!paused));
    if (label) label.textContent = paused ? "星空动态：暂停" : "星空动态：开启";
    if (!paused && !document.hidden) frameId = requestAnimationFrame(frame);
  }

  toggle?.addEventListener("click", () => { paused = !paused; syncMotion(); });
  motionPreference.addEventListener("change", () => { paused = motionPreference.matches; syncMotion(); });
  document.addEventListener("visibilitychange", syncMotion);
  window.addEventListener("resize", resize, { passive: true });
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
