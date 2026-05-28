/* ============================================================
   Star-field Canvas Animation
   Renders parallax star layers, shooting stars, and floating particles
   ============================================================ */

class Starfield {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.stars = [];
    this.shootingStars = [];
    this.particles = [];
    this.mouseX = 0;
    this.mouseY = 0;
    this.frame = 0;
    this.running = true;

    this.resize();
    this.createStars();
    this.createParticles();

    window.addEventListener('resize', () => this.resize());
    document.addEventListener('mousemove', (e) => {
      this.mouseX = (e.clientX / this.width - 0.5) * 2;
      this.mouseY = (e.clientY / this.height - 0.5) * 2;
    });

    this.animate();
  }

  resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
  }

  createStars() {
    this.stars = [];
    const count = Math.min(160, Math.floor((this.width * this.height) / 6000));
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius: Math.random() * 1.5 + 0.3,
        opacity: Math.random() * 0.5 + 0.15,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinklePhase: Math.random() * Math.PI * 2,
        depth: Math.random() * 3 + 1, // parallax depth layer
      });
    }
  }

  createParticles() {
    this.particles = [];
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 2 + 1,
        opacity: Math.random() * 0.3 + 0.1,
        hue: Math.random() > 0.5 ? 200 : 190, // blue-cyan range
      });
    }
  }

  spawnShootingStar() {
    if (this.shootingStars.length >= 2) return;
    this.shootingStars.push({
      x: Math.random() * this.width * 0.8,
      y: Math.random() * this.height * 0.4,
      length: Math.random() * 100 + 60,
      speed: Math.random() * 8 + 6,
      angle: (Math.random() * 20 + 20) * (Math.PI / 180),
      opacity: 1,
      trail: [],
    });
  }

  drawStar(star) {
    const twinkle = Math.sin(this.frame * star.twinkleSpeed + star.twinklePhase);
    const opacity = star.opacity * (0.6 + 0.4 * twinkle);

    // Parallax offset
    const px = star.x + this.mouseX * star.depth * 3;
    const py = star.y + this.mouseY * star.depth * 3;

    this.ctx.beginPath();
    this.ctx.arc(px, py, star.radius, 0, Math.PI * 2);
    this.ctx.fillStyle = `rgba(200, 220, 255, ${opacity})`;
    this.ctx.fill();

    // Glow for larger stars
    if (star.radius > 1) {
      this.ctx.beginPath();
      this.ctx.arc(px, py, star.radius * 3, 0, Math.PI * 2);
      const gradient = this.ctx.createRadialGradient(px, py, 0, px, py, star.radius * 3);
      gradient.addColorStop(0, `rgba(100, 180, 255, ${opacity * 0.08})`);
      gradient.addColorStop(1, 'transparent');
      this.ctx.fillStyle = gradient;
      this.ctx.fill();
    }
  }

  drawShootingStars() {
    for (let i = this.shootingStars.length - 1; i >= 0; i--) {
      const s = this.shootingStars[i];
      s.x += Math.cos(s.angle) * s.speed;
      s.y += Math.sin(s.angle) * s.speed;
      s.opacity -= 0.012;

      // Draw trail
      const tailX = s.x - Math.cos(s.angle) * s.length;
      const tailY = s.y - Math.sin(s.angle) * s.length;

      const gradient = this.ctx.createLinearGradient(tailX, tailY, s.x, s.y);
      gradient.addColorStop(0, 'transparent');
      gradient.addColorStop(1, `rgba(180, 220, 255, ${s.opacity})`);

      this.ctx.beginPath();
      this.ctx.moveTo(tailX, tailY);
      this.ctx.lineTo(s.x, s.y);
      this.ctx.strokeStyle = gradient;
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();

      // Head glow
      this.ctx.beginPath();
      this.ctx.arc(s.x, s.y, 2, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(200, 235, 255, ${s.opacity})`;
      this.ctx.fill();

      if (s.opacity <= 0 || s.x > this.width + 100 || s.y > this.height + 100) {
        this.shootingStars.splice(i, 1);
      }
    }
  }

  drawParticles() {
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;

      // Wrap around
      if (p.x < -10) p.x = this.width + 10;
      if (p.x > this.width + 10) p.x = -10;
      if (p.y < -10) p.y = this.height + 10;
      if (p.y > this.height + 10) p.y = -10;

      const pulse = Math.sin(this.frame * 0.015 + p.hue) * 0.5 + 0.5;

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 8);
      gradient.addColorStop(0, `hsla(${p.hue}, 100%, 70%, ${p.opacity * pulse})`);
      gradient.addColorStop(1, 'transparent');
      this.ctx.fillStyle = gradient;
      this.ctx.fill();
    }

    // Draw faint connection lines between nearby particles
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dx = this.particles[i].x - this.particles[j].x;
        const dy = this.particles[i].y - this.particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 300) {
          this.ctx.beginPath();
          this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
          this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
          this.ctx.strokeStyle = `rgba(0, 136, 255, ${0.02 * (1 - dist / 300)})`;
          this.ctx.lineWidth = 0.5;
          this.ctx.stroke();
        }
      }
    }
  }

  animate() {
    if (!this.running) return;
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Draw all stars
    for (const star of this.stars) {
      this.drawStar(star);
    }

    // Shooting stars
    this.drawShootingStars();
    if (this.frame % 350 === 0 && Math.random() > 0.4) {
      this.spawnShootingStar();
    }

    // Floating particles
    this.drawParticles();

    this.frame++;
    requestAnimationFrame(() => this.animate());
  }

  destroy() {
    this.running = false;
  }
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
  new Starfield('hero-canvas');
});
