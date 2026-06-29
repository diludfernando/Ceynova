import React, { useEffect, useRef, useCallback } from 'react';

/**
 * HeroBackground – Animated electric circuit board background
 * 
 * Performance-optimized version:
 * - Static elements (grid, traces, chips) cached to offscreen canvas
 * - No shadowBlur (simulated with layered draws)
 * - Throttled to ~30fps
 * - IntersectionObserver pauses animation when off-screen
 * - Debounced resize handler
 * - Reduced DPR cap
 */
export default function HeroBackground() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const startTimeRef = useRef(null);
  const dataRef = useRef(null);
  const staticCanvasRef = useRef(null);
  const isVisibleRef = useRef(true);
  const lastFrameTimeRef = useRef(0);

  // Target ~30fps for a background animation (33ms between frames)
  const FRAME_INTERVAL = 33;

  const init = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // ── IntersectionObserver: pause when off-screen ──
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
        if (entry.isIntersecting && !animRef.current) {
          animRef.current = requestAnimationFrame(render);
        }
      },
      { threshold: 0 }
    );
    observer.observe(canvas);

    // Cap DPR at 1.5 to save fill-rate
    let dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let w, h;

    // Offscreen canvas for static elements
    let staticCanvas = document.createElement('canvas');
    let staticCtx = staticCanvas.getContext('2d');
    staticCanvasRef.current = staticCanvas;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Size offscreen canvas to match
      staticCanvas.width = w * dpr;
      staticCanvas.height = h * dpr;
      staticCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    // ───── HELPERS ─────
    const rand = (min, max) => min + Math.random() * (max - min);
    const randInt = (min, max) => Math.floor(rand(min, max + 1));

    // Distance from center as 0..1 (0 = center, 1 = edge)
    const edgeFactor = (x, y) => {
      const dx = (x - w / 2) / (w / 2);
      const dy = (y - h / 2) / (h / 2);
      return Math.min(1, Math.sqrt(dx * dx + dy * dy));
    };

    // ───── GENERATE CIRCUIT PATHS ─────
    const generateCircuits = () => {
      const circuits = [];
      const GRID = 40; // base grid spacing
      const snapTo = (v) => Math.round(v / GRID) * GRID;

      // Generate trace paths — each is a series of points connected by horizontal/vertical segments
      const generateTrace = (startX, startY, preferredDir, segCount) => {
        const points = [{ x: snapTo(startX), y: snapTo(startY) }];
        let dir = preferredDir; // 0=right, 1=down, 2=left, 3=up
        const dirDx = [1, 0, -1, 0];
        const dirDy = [0, 1, 0, -1];

        for (let s = 0; s < segCount; s++) {
          const prev = points[points.length - 1];
          const segLen = GRID * randInt(2, 8);
          let nx = prev.x + dirDx[dir] * segLen;
          let ny = prev.y + dirDy[dir] * segLen;

          // Keep traces away from center content area
          const cf = edgeFactor(nx, ny);
          if (cf < 0.42) {
            // Push strongly away from center
            const pushAngle = Math.atan2(ny - h / 2, nx - w / 2);
            nx += Math.cos(pushAngle) * GRID * 6;
            ny += Math.sin(pushAngle) * GRID * 6;
            nx = snapTo(nx);
            ny = snapTo(ny);
            // If still too close, skip this segment
            if (edgeFactor(nx, ny) < 0.35) continue;
          }

          // Clamp to screen bounds (with margin)
          nx = Math.max(-GRID * 2, Math.min(w + GRID * 2, nx));
          ny = Math.max(-GRID * 2, Math.min(h + GRID * 2, ny));

          points.push({ x: nx, y: ny });

          // Turn 90° with some randomness
          if (Math.random() < 0.65) {
            if (dir === 0 || dir === 2) {
              dir = Math.random() < 0.5 ? 1 : 3;
            } else {
              dir = Math.random() < 0.5 ? 0 : 2;
            }
          }
        }

        return points;
      };

      // Create traces from different regions
      const regions = [
        // Top-left region
        { x: [0, w * 0.3], y: [0, h * 0.3], dirs: [0, 1], count: 4 },
        // Top-right region
        { x: [w * 0.7, w], y: [0, h * 0.3], dirs: [2, 1], count: 4 },
        // Bottom-left region
        { x: [0, w * 0.3], y: [h * 0.7, h], dirs: [0, 3], count: 4 },
        // Bottom-right region
        { x: [w * 0.7, w], y: [h * 0.7, h], dirs: [2, 3], count: 4 },
        // Left edge
        { x: [0, w * 0.15], y: [h * 0.25, h * 0.75], dirs: [0, 1], count: 2 },
        // Right edge
        { x: [w * 0.85, w], y: [h * 0.25, h * 0.75], dirs: [2, 3], count: 2 },
        // Top edge
        { x: [w * 0.25, w * 0.75], y: [0, h * 0.1], dirs: [0, 1], count: 2 },
        // Bottom edge
        { x: [w * 0.25, w * 0.75], y: [h * 0.9, h], dirs: [2, 3], count: 2 },
      ];

      regions.forEach((region) => {
        for (let i = 0; i < region.count; i++) {
          const sx = rand(region.x[0], region.x[1]);
          const sy = rand(region.y[0], region.y[1]);
          const dir = region.dirs[randInt(0, region.dirs.length - 1)];
          const segs = randInt(4, 9);
          const points = generateTrace(sx, sy, dir, segs);

          // Calculate total path length
          let totalLen = 0;
          for (let j = 1; j < points.length; j++) {
            totalLen += Math.abs(points[j].x - points[j - 1].x) + Math.abs(points[j].y - points[j - 1].y);
          }

          // Assign visual properties based on distance from center
          const midIdx = Math.floor(points.length / 2);
          const midPt = points[midIdx];
          const ef = edgeFactor(midPt.x, midPt.y);

          const colorSets = [
            { trace: 'rgba(43, 123, 255, A)', glow: 'rgba(43, 123, 255, A)', pulse: 'rgba(100, 180, 255, A)' },
            { trace: 'rgba(54, 211, 255, A)', glow: 'rgba(54, 211, 255, A)', pulse: 'rgba(140, 230, 255, A)' },
            { trace: 'rgba(111, 139, 255, A)', glow: 'rgba(90, 70, 220, A)', pulse: 'rgba(160, 140, 255, A)' },
            { trace: 'rgba(30, 180, 240, A)', glow: 'rgba(30, 180, 240, A)', pulse: 'rgba(100, 210, 255, A)' },
          ];
          const colorSet = colorSets[randInt(0, colorSets.length - 1)];

          circuits.push({
            points,
            totalLen,
            width: rand(0.5, 1.5),
            alpha: Math.min(0.5, ef * 0.4 + 0.05),
            colorSet,
            pulseSpeed: rand(40, 120), // pixels per second
            pulsePhase: rand(0, totalLen),
            pulseLen: rand(60, 180),
            hasBranch: Math.random() < 0.3,
          });
        }
      });

      return circuits;
    };

    // ───── GENERATE NODES (JUNCTION DOTS) ─────
    const generateNodes = (circuits) => {
      const nodes = [];
      const seen = new Set();

      circuits.forEach((c) => {
        c.points.forEach((p, i) => {
          // Add nodes at turns (not at every point)
          if (i > 0 && i < c.points.length - 1) {
            const key = `${Math.round(p.x / 20)},${Math.round(p.y / 20)}`;
            if (!seen.has(key) && Math.random() < 0.6) {
              seen.add(key);
              const ef = edgeFactor(p.x, p.y);
              nodes.push({
                x: p.x,
                y: p.y,
                radius: rand(2, 4.5),
                alpha: Math.min(0.7, ef * 0.5 + 0.1),
                pulsePhase: rand(0, Math.PI * 2),
                type: Math.random() < 0.15 ? 'square' : 'circle',
              });
            }
          }
          // Terminal nodes
          if ((i === 0 || i === c.points.length - 1) && Math.random() < 0.5) {
            const key = `${Math.round(p.x / 20)},${Math.round(p.y / 20)}`;
            if (!seen.has(key)) {
              seen.add(key);
              const ef = edgeFactor(p.x, p.y);
              nodes.push({
                x: p.x,
                y: p.y,
                radius: rand(2.5, 5),
                alpha: Math.min(0.7, ef * 0.5 + 0.1),
                pulsePhase: rand(0, Math.PI * 2),
                type: 'circle',
              });
            }
          }
        });
      });

      return nodes;
    };

    // ───── IC CHIPS (small rectangles) ─────
    const generateChips = () => {
      const chips = [];
      const count = randInt(4, 8);
      for (let i = 0; i < count; i++) {
        let x, y;
        // Place away from center
        do {
          x = rand(0, w);
          y = rand(0, h);
        } while (edgeFactor(x, y) < 0.35);

        chips.push({
          x, y,
          w: rand(20, 50),
          h: rand(14, 30),
          pins: randInt(3, 6),
          alpha: rand(0.06, 0.15),
          rotation: [0, Math.PI / 2][randInt(0, 1)],
        });
      }
      return chips;
    };

    // ───── PARTICLES (reduced count) ─────
    const PARTICLE_COUNT = 20;
    const generateParticles = () => {
      const particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          radius: 0.5 + Math.random() * 1.8,
          alpha: 0.15 + Math.random() * 0.35,
          phase: Math.random() * Math.PI * 2,
          pulseSpeed: 0.5 + Math.random() * 1.5,
        });
      }
      return particles;
    };

    // ───── BUILD DATA ─────
    const buildData = () => {
      const circuits = generateCircuits();
      const nodes = generateNodes(circuits);
      const chips = generateChips();
      const particles = generateParticles();
      dataRef.current = { circuits, nodes, chips, particles };
    };
    buildData();

    // ───── RENDER STATIC LAYER (cached to offscreen canvas) ─────
    // Grid, traces, and chips don't animate — render them once
    const renderStaticLayer = () => {
      const data = dataRef.current;
      if (!data) return;

      staticCtx.clearRect(0, 0, w, h);

      // Background fill
      staticCtx.fillStyle = '#03070f';
      staticCtx.fillRect(0, 0, w, h);

      // Subtle grid pattern (like PCB substrate) — batched into a single path
      staticCtx.beginPath();
      staticCtx.strokeStyle = 'rgba(43, 123, 255, 0.025)';
      staticCtx.lineWidth = 0.5;
      const gridSize = 40;
      for (let x = 0; x <= w; x += gridSize) {
        staticCtx.moveTo(x, 0);
        staticCtx.lineTo(x, h);
      }
      for (let y = 0; y <= h; y += gridSize) {
        staticCtx.moveTo(0, y);
        staticCtx.lineTo(w, y);
      }
      staticCtx.stroke();

      // IC chips (static — no shadowBlur)
      data.chips.forEach((chip) => {
        staticCtx.save();
        staticCtx.translate(chip.x, chip.y);
        staticCtx.rotate(chip.rotation);

        const a = chip.alpha * 0.85;

        // Chip body
        staticCtx.strokeStyle = `rgba(43, 123, 255, ${(a * 0.6).toFixed(3)})`;
        staticCtx.lineWidth = 0.8;
        staticCtx.strokeRect(-chip.w / 2, -chip.h / 2, chip.w, chip.h);

        // Subtle fill
        staticCtx.fillStyle = `rgba(10, 20, 50, ${(a * 0.5).toFixed(3)})`;
        staticCtx.fillRect(-chip.w / 2, -chip.h / 2, chip.w, chip.h);

        // Pins on top and bottom — batched into one path
        const pinSpacing = chip.w / (chip.pins + 1);
        staticCtx.beginPath();
        staticCtx.strokeStyle = `rgba(54, 211, 255, ${(a * 0.5).toFixed(3)})`;
        staticCtx.lineWidth = 0.6;

        for (let p = 1; p <= chip.pins; p++) {
          const px = -chip.w / 2 + pinSpacing * p;
          // Top pins
          staticCtx.moveTo(px, -chip.h / 2);
          staticCtx.lineTo(px, -chip.h / 2 - 6);
          // Bottom pins
          staticCtx.moveTo(px, chip.h / 2);
          staticCtx.lineTo(px, chip.h / 2 + 6);
        }
        staticCtx.stroke();

        // Notch indicator
        staticCtx.beginPath();
        staticCtx.arc(-chip.w / 2 + 5, 0, 2, 0, Math.PI * 2);
        staticCtx.strokeStyle = `rgba(54, 211, 255, ${(a * 0.4).toFixed(3)})`;
        staticCtx.stroke();

        staticCtx.restore();
      });

      // Circuit traces (base lines — static, no shadow)
      data.circuits.forEach((circuit) => {
        const { points, width, alpha, colorSet } = circuit;
        if (points.length < 2) return;

        // Draw base trace line
        staticCtx.beginPath();
        staticCtx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          staticCtx.lineTo(points[i].x, points[i].y);
        }

        const traceColor = colorSet.trace.replace('A', (alpha * 0.35).toFixed(3));
        staticCtx.strokeStyle = traceColor;
        staticCtx.lineWidth = width;
        staticCtx.lineCap = 'round';
        staticCtx.lineJoin = 'round';
        staticCtx.stroke();

        // Simulated glow: wider line with lower alpha (NO shadowBlur)
        staticCtx.beginPath();
        staticCtx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          staticCtx.lineTo(points[i].x, points[i].y);
        }
        staticCtx.strokeStyle = colorSet.glow.replace('A', (alpha * 0.08).toFixed(3));
        staticCtx.lineWidth = width + 5;
        staticCtx.stroke();
      });

      // Pre-render atmospheric glow orbs (static base positions)
      const orbs = [
        { x: w * 0.1, y: h * 0.18, r: Math.min(w, h) * 0.18, color: [10, 50, 180], a: 0.06 },
        { x: w * 0.9, y: h * 0.8, r: Math.min(w, h) * 0.2, color: [20, 150, 220], a: 0.05 },
        { x: w * 0.12, y: h * 0.85, r: Math.min(w, h) * 0.15, color: [70, 40, 200], a: 0.05 },
        { x: w * 0.85, y: h * 0.12, r: Math.min(w, h) * 0.14, color: [40, 100, 230], a: 0.04 },
      ];

      orbs.forEach((orb) => {
        const grad = staticCtx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r);
        const [r, g, b] = orb.color;
        grad.addColorStop(0, `rgba(${r},${g},${b},${orb.a})`);
        grad.addColorStop(0.5, `rgba(${r},${g},${b},${orb.a * 0.4})`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        staticCtx.fillStyle = grad;
        staticCtx.beginPath();
        staticCtx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
        staticCtx.fill();
      });

      // Center vignette
      const vigGrad = staticCtx.createRadialGradient(
        w * 0.5, h * 0.45, 0,
        w * 0.5, h * 0.45, Math.max(w, h) * 0.5
      );
      vigGrad.addColorStop(0, 'rgba(3, 7, 15, 0.55)');
      vigGrad.addColorStop(0.3, 'rgba(3, 7, 15, 0.2)');
      vigGrad.addColorStop(0.65, 'rgba(3, 7, 15, 0)');
      vigGrad.addColorStop(1, 'rgba(3, 7, 15, 0)');
      staticCtx.fillStyle = vigGrad;
      staticCtx.fillRect(0, 0, w, h);
    };

    renderStaticLayer();

    // Debounced resize
    let resizeTimer = null;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resize();
        buildData();
        renderStaticLayer();
      }, 200);
    };
    window.addEventListener('resize', handleResize);

    // ───── DYNAMIC DRAWING (per-frame — lightweight) ─────

    // Draw energy pulse traveling along a circuit (NO shadowBlur)
    const drawPulse = (circuit, time) => {
      const { points, totalLen, pulseSpeed, pulsePhase, pulseLen, colorSet, alpha, width } = circuit;
      if (points.length < 2 || totalLen < 1) return;

      // Calculate pulse position along path (looping)
      const pulsePos = ((time * pulseSpeed + pulsePhase) % (totalLen + pulseLen * 2)) - pulseLen;

      // Walk the path and find where to draw the pulse
      let walked = 0;

      for (let i = 1; i < points.length; i++) {
        const dx = points[i].x - points[i - 1].x;
        const dy = points[i].y - points[i - 1].y;
        const segLen = Math.abs(dx) + Math.abs(dy);

        if (segLen === 0) continue;

        const segStart = walked;
        const segEnd = walked + segLen;

        // Check if pulse overlaps this segment
        const pStart = pulsePos;
        const pEnd = pulsePos + pulseLen;

        if (pEnd > segStart && pStart < segEnd) {
          // Calculate clipped start/end within this segment
          const clipStart = Math.max(0, (pStart - segStart) / segLen);
          const clipEnd = Math.min(1, (pEnd - segStart) / segLen);

          const sx = points[i - 1].x + (dx !== 0 ? (dx > 0 ? 1 : -1) * Math.abs(dx) * clipStart : 0);
          const sy = points[i - 1].y + (dy !== 0 ? (dy > 0 ? 1 : -1) * Math.abs(dy) * clipStart : 0);
          const ex = points[i - 1].x + (dx !== 0 ? (dx > 0 ? 1 : -1) * Math.abs(dx) * clipEnd : 0);
          const ey = points[i - 1].y + (dy !== 0 ? (dy > 0 ? 1 : -1) * Math.abs(dy) * clipEnd : 0);

          // Intensity fades at pulse edges
          const midFrac = ((segStart + segLen * (clipStart + clipEnd) / 2) - pStart) / pulseLen;
          const intensity = Math.sin(midFrac * Math.PI) * Math.min(1, alpha * 2.5);

          if (intensity > 0.02) {
            const col = colorSet.pulse;

            // Simulated glow: wider, lower-alpha line (replaces shadowBlur = 30)
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(ex, ey);
            ctx.strokeStyle = col.replace('A', (intensity * 0.12).toFixed(3));
            ctx.lineWidth = width + 8;
            ctx.lineCap = 'round';
            ctx.stroke();

            // Bright core
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(ex, ey);
            ctx.strokeStyle = col.replace('A', (intensity * 0.8).toFixed(3));
            ctx.lineWidth = width + 1.5;
            ctx.lineCap = 'round';
            ctx.stroke();
          }
        }

        walked += segLen;
      }
    };

    // Draw junction nodes (NO shadowBlur — simulated with layered draws)
    const drawNodes = (nodes, time) => {
      const sinLookup = Math.sin(time * 1.5);
      const cosLookup = Math.cos(time * 1.5);

      nodes.forEach((node) => {
        // Approximate sin with mix of precomputed sin/cos for variety
        const pulse = 0.6 + 0.4 * (sinLookup * Math.cos(node.pulsePhase) + cosLookup * Math.sin(node.pulsePhase));
        const a = node.alpha * pulse;

        if (a < 0.02) return;

        if (node.type === 'square') {
          const s = node.radius * 1.6;
          ctx.fillStyle = `rgba(54, 211, 255, ${(a * 0.5).toFixed(3)})`;
          ctx.fillRect(node.x - s / 2, node.y - s / 2, s, s);
          // Border
          ctx.strokeStyle = `rgba(54, 211, 255, ${(a * 0.7).toFixed(3)})`;
          ctx.lineWidth = 0.5;
          ctx.strokeRect(node.x - s / 2, node.y - s / 2, s, s);
        } else {
          // Simulated glow: larger circle at low alpha (replaces shadowBlur)
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(43, 123, 255, ${(a * 0.08).toFixed(3)})`;
          ctx.fill();

          // Core dot
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(100, 190, 255, ${(a * 0.6).toFixed(3)})`;
          ctx.fill();

          // Bright center
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius * 0.4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(200, 235, 255, ${(a * 0.8).toFixed(3)})`;
          ctx.fill();
        }
      });
    };

    // Draw floating particles (NO shadowBlur)
    const drawParticles = (particles, time) => {
      const t = time * 0.4;

      particles.forEach((p) => {
        const px = p.x + Math.sin(t + p.phase) * 25;
        const py = p.y + Math.cos(t * 0.7 + p.phase) * 18;

        const alpha = p.alpha * (0.4 + 0.6 * Math.sin(t * p.pulseSpeed + p.phase));
        const ef = edgeFactor(px, py);
        const centerFade = Math.min(1, Math.max(0, ef - 0.15) / 0.4);
        const finalAlpha = alpha * centerFade;

        if (finalAlpha < 0.02) return;

        const wrappedX = ((px % w) + w) % w;
        const wrappedY = ((py % h) + h) % h;

        // Simulated glow: larger circle at low alpha (replaces shadowBlur = 10)
        ctx.beginPath();
        ctx.arc(wrappedX, wrappedY, p.radius + 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(54, 211, 255, ${(finalAlpha * 0.3).toFixed(3)})`;
        ctx.fill();

        // Core particle
        ctx.beginPath();
        ctx.arc(wrappedX, wrappedY, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180, 220, 255, ${finalAlpha.toFixed(3)})`;
        ctx.fill();
      });
    };

    // ───── MAIN RENDER LOOP (throttled to ~30fps) ─────
    const render = (timestamp) => {
      if (!isVisibleRef.current) {
        animRef.current = null;
        return;
      }

      // Throttle frame rate
      const delta = timestamp - lastFrameTimeRef.current;
      if (delta < FRAME_INTERVAL) {
        animRef.current = requestAnimationFrame(render);
        return;
      }
      lastFrameTimeRef.current = timestamp - (delta % FRAME_INTERVAL);

      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = (timestamp - startTimeRef.current) / 1000;
      const data = dataRef.current;
      if (!data) return;

      // Blit the cached static layer (grid, traces, chips, orbs, vignette)
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(staticCanvas, 0, 0, w * dpr, h * dpr, 0, 0, w, h);

      // Dynamic elements only: pulses, nodes, particles
      ctx.globalCompositeOperation = 'screen';

      // Energy pulses
      data.circuits.forEach((c) => drawPulse(c, elapsed));

      // Junction nodes
      drawNodes(data.nodes, elapsed);

      // Particles
      drawParticles(data.particles, elapsed);

      // Reset
      ctx.globalCompositeOperation = 'source-over';

      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
      observer.disconnect();
      if (animRef.current) cancelAnimationFrame(animRef.current);
      animRef.current = null;
    };
  }, []);

  useEffect(() => {
    const cleanup = init();
    return cleanup;
  }, [init]);

  return (
    <canvas
      ref={canvasRef}
      className="hero-bg-canvas"
      aria-hidden="true"
    />
  );
}
