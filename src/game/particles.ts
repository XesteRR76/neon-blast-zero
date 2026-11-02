import { BlockColor } from './constants';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: BlockColor;
  alpha: number;
  rotation: number;
  rotSpeed: number;
  life: number;
  maxLife: number;
}

export interface FloatingText {
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
  scale: number;
  vy: number;
  life: number;
  maxLife: number;
}

export class EffectsManager {
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];
  private shakeIntensity: number = 0;
  private shakeDecay: number = 0.9;

  public triggerScreenShake(intensity: number) {
    this.shakeIntensity = Math.min(this.shakeIntensity + intensity, 25);
  }

  public getScreenOffset(): { x: number; y: number } {
    if (this.shakeIntensity < 0.2) {
      this.shakeIntensity = 0;
      return { x: 0, y: 0 };
    }
    const x = (Math.random() * 2 - 1) * this.shakeIntensity;
    const y = (Math.random() * 2 - 1) * this.shakeIntensity;
    this.shakeIntensity *= this.shakeDecay;
    return { x, y };
  }

  public spawnBlockClearParticles(x: number, y: number, cellSize: number, color: BlockColor, count: number = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 2;
      this.particles.push({
        x: x + cellSize / 2,
        y: y + cellSize / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        size: Math.random() * (cellSize * 0.35) + 3,
        color,
        alpha: 1,
        rotation: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 0.2,
        life: 0,
        maxLife: Math.random() * 25 + 20
      });
    }
  }

  public spawnFloatingText(text: string, x: number, y: number, color: string = '#00f3ff') {
    this.floatingTexts.push({
      text,
      x,
      y,
      color,
      alpha: 1,
      scale: 1.2,
      vy: -2,
      life: 0,
      maxLife: 45
    });
  }

  public update() {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life++;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.18; // gravity
      p.vx *= 0.98; // drag
      p.rotation += p.rotSpeed;
      p.alpha = 1 - (p.life / p.maxLife);

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life++;
      ft.y += ft.vy;
      ft.vy *= 0.94;
      ft.scale = 1 + (0.3 * (1 - ft.life / ft.maxLife));
      ft.alpha = 1 - (ft.life / ft.maxLife);

      if (ft.life >= ft.maxLife) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    // Render particles
    for (const p of this.particles) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color.primary;
      ctx.shadowColor = p.color.border;
      ctx.shadowBlur = 8;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    }

    // Render floating text
    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.font = `900 ${Math.round(20 * ft.scale)}px 'Plus Jakarta Sans', system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = ft.color;
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 12;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }
}
