/**
 * SHADERS & VISUAL CANVAS ENGINE
 * Provides pixelated backgrounds, CRT scanline grids, chromatic aberration, and audio-reactive particle fields.
 */

class ShaderEngine {
  constructor() {
    this.canvas = document.getElementById('shader-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.mode = 'aurora-pixel'; // 'aurora-pixel', 'cyber-grid', 'liquid-chrome', 'y2k-stars', 'retro-crt'
    this.pixelSize = 8;
    this.pixelationEnabled = true;
    this.particles = [];
    this.time = 0;
    this.mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2, targetX: window.innerWidth / 2, targetY: window.innerHeight / 2 };
    this.audioIntensity = 0;
    this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('mousemove', (e) => {
      this.mouse.targetX = e.clientX;
      this.mouse.targetY = e.clientY;
    });

    this.createParticles(60);
    this.animate();
  }

  resize() {
    if (!this.canvas) return;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  setMode(newMode) {
    this.mode = newMode;
    if (newMode === 'cyber-grid' || newMode === 'glitchcore') {
      this.pixelSize = 6;
    } else if (newMode === 'y2k' || newMode === 'vaporwave') {
      this.pixelSize = 10;
    } else {
      this.pixelSize = 8;
    }
  }

  setAudioIntensity(val) {
    this.audioIntensity = val;
  }

  createParticles(count) {
    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        size: Math.random() * 3 + 1,
        color: this.getRandomColor(),
        baseAlpha: Math.random() * 0.6 + 0.2
      });
    }
  }

  getRandomColor() {
    const palette = ['#00F0FF', '#7000FF', '#FF007A', '#00FF66', '#FFE600'];
    return palette[Math.floor(Math.random() * palette.length)];
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    if (this.isReducedMotion) {
      this.renderStatic();
      return;
    }

    this.time += 0.015;
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    this.render();
  }

  renderStatic() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    const grad = ctx.createLinearGradient(0, 0, this.width, this.height);
    grad.addColorStop(0, '#0a0a12');
    grad.addColorStop(1, '#050508');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    if (this.mode === 'cyber-grid' || this.mode === 'sci-fi-hud') {
      this.renderCyberGrid(ctx, w, h);
    } else if (this.mode === 'y2k' || this.mode === 'vaporwave') {
      this.renderVaporwaveSky(ctx, w, h);
    } else if (this.mode === 'liquid-chrome' || this.mode === 'metallic') {
      this.renderLiquidChrome(ctx, w, h);
    } else if (this.mode === 'brutalist' || this.mode === 'anti-design') {
      this.renderBrutalistGrid(ctx, w, h);
    } else if (this.mode === 'frutiger-aero') {
      this.renderFrutigerAero(ctx, w, h);
    } else {
      this.renderAurora(ctx, w, h);
    }

    // Render interactive particle floaters
    this.renderParticles(ctx, w, h);

    // Apply pixelation effect if active
    if (this.pixelationEnabled && this.pixelSize > 1) {
      this.applyPixelation(ctx, w, h, this.pixelSize);
    }
  }

  renderAurora(ctx, w, h) {
    const grad = ctx.createRadialGradient(
      this.mouse.x, this.mouse.y, 50,
      w / 2, h / 2, Math.max(w, h) * 0.8
    );
    const pulse = Math.sin(this.time) * 0.15 + (this.audioIntensity * 0.3);
    grad.addColorStop(0, `rgba(112, 0, 255, ${0.35 + pulse})`);
    grad.addColorStop(0.4, `rgba(0, 240, 255, ${0.2 + pulse * 0.5})`);
    grad.addColorStop(0.8, 'rgba(10, 10, 20, 0.95)');
    grad.addColorStop(1, 'rgba(5, 5, 10, 1)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  renderCyberGrid(ctx, w, h) {
    ctx.fillStyle = '#05070e';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(0, 255, 136, 0.12)';
    ctx.lineWidth = 1;

    const gridSize = 32;
    const offsetX = (this.time * 20) % gridSize;
    const offsetY = (this.time * 20) % gridSize;

    ctx.beginPath();
    for (let x = offsetX; x < w; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let y = offsetY; y < h; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();

    // Subtle center glow
    const glow = ctx.createRadialGradient(this.mouse.x, this.mouse.y, 10, this.mouse.x, this.mouse.y, 300);
    glow.addColorStop(0, 'rgba(0, 255, 136, 0.18)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
  }

  renderVaporwaveSky(ctx, w, h) {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#19002e');
    grad.addColorStop(0.6, '#3a0066');
    grad.addColorStop(0.85, '#ff007f');
    grad.addColorStop(1, '#ffaa00');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Retro sun
    const sunY = h * 0.65;
    const sunR = Math.min(w, h) * 0.22;
    const sunGrad = ctx.createLinearGradient(0, sunY - sunR, 0, sunY + sunR);
    sunGrad.addColorStop(0, '#ffff00');
    sunGrad.addColorStop(1, '#ff007f');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(w / 2, sunY, sunR, 0, Math.PI * 2);
    ctx.fill();

    // Sun blind bars
    ctx.fillStyle = '#3a0066';
    for (let i = 0; i < 7; i++) {
      const barH = 3 + i * 2;
      const barY = sunY + (i * 14);
      ctx.fillRect(w / 2 - sunR, barY, sunR * 2, barH);
    }
  }

  renderLiquidChrome(ctx, w, h) {
    ctx.fillStyle = '#08080a';
    ctx.fillRect(0, 0, w, h);

    // Specular reflective blobs
    for (let i = 0; i < 4; i++) {
      const angle = this.time * 0.8 + (i * Math.PI / 2);
      const cx = w / 2 + Math.cos(angle) * (w * 0.25);
      const cy = h / 2 + Math.sin(angle * 1.3) * (h * 0.25);
      const r = (w * 0.3) + Math.sin(this.time + i) * 40;

      const blobGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, r);
      blobGrad.addColorStop(0, 'rgba(230, 240, 255, 0.45)');
      blobGrad.addColorStop(0.3, 'rgba(120, 140, 180, 0.3)');
      blobGrad.addColorStop(0.7, 'rgba(30, 35, 50, 0.15)');
      blobGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = blobGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  renderBrutalistGrid(ctx, w, h) {
    ctx.fillStyle = '#f4f4f0';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#e0e0dc';
    ctx.lineWidth = 1.5;
    const step = 40;
    ctx.beginPath();
    for (let x = 0; x < w; x += step) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let y = 0; y < h; y += step) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();

    // Crosshairs
    ctx.fillStyle = '#111';
    for (let x = 0; x < w; x += step * 3) {
      for (let y = 0; y < h; y += step * 3) {
        ctx.fillRect(x - 2, y - 2, 4, 4);
      }
    }
  }

  renderFrutigerAero(ctx, w, h) {
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#38a3d1');
    sky.addColorStop(0.5, '#7bc9e8');
    sky.addColorStop(0.8, '#a2f0c8');
    sky.addColorStop(1, '#4caf50');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // Glossy light streaks
    const streak = ctx.createLinearGradient(0, 0, w, h * 0.4);
    streak.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
    streak.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
    streak.addColorStop(1, 'transparent');
    ctx.fillStyle = streak;
    ctx.beginPath();
    ctx.ellipse(w * 0.4, h * 0.2, w * 0.6, h * 0.25, -Math.PI / 8, 0, Math.PI * 2);
    ctx.fill();
  }

  renderParticles(ctx, w, h) {
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = w;
      if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h;
      if (p.y > h) p.y = 0;

      // Mouse proximity repulsion
      const dx = p.x - this.mouse.x;
      const dy = p.y - this.mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        const force = (120 - dist) / 120;
        p.x += (dx / dist) * force * 3;
        p.y += (dy / dist) * force * 3;
      }

      const pulseSize = p.size * (1 + this.audioIntensity * 1.5);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.baseAlpha + (this.audioIntensity * 0.3);
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(1, pulseSize), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }
  }

  applyPixelation(ctx, w, h, size) {
    if (size <= 1) return;
    try {
      const offW = Math.max(1, Math.floor(w / size));
      const offH = Math.max(1, Math.floor(h / size));

      if (!this.offCanvas) {
        this.offCanvas = document.createElement('canvas');
        this.offCtx = this.offCanvas.getContext('2d');
      }
      this.offCanvas.width = offW;
      this.offCanvas.height = offH;

      // Draw downscaled
      this.offCtx.drawImage(this.canvas, 0, 0, offW, offH);

      // Draw upscaled with pixelated nearest-neighbor
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(this.offCanvas, 0, 0, offW, offH, 0, 0, w, h);
      ctx.imageSmoothingEnabled = true;
    } catch (e) {
      // Fallback if canvas read fails
    }
  }
}

window.ShaderEngine = ShaderEngine;
