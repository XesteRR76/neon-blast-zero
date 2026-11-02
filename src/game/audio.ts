/**
 * Procedural Web Audio API sound synthesis.
 * Zero external audio files required, zero load latency, guaranteed offline playback.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;

  constructor() {
    this.isMuted = localStorage.getItem('nbz_muted') === 'true';
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('nbz_muted', String(this.isMuted));
    return this.isMuted;
  }

  /**
   * Subtle soft click on grabbing a block from tray
   */
  public playPickup() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  /**
   * Solid tactile drop sound when placing a block
   */
  public playPlace() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(90, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.09);
  }

  /**
   * Harmonic combo chime. Escalates in pitch based on combo streak!
   * Uses pentatonic scale for pleasant harmony: C, D, E, G, A
   */
  public playClear(comboCount: number, linesCleared: number) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const pentatonic = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];
    const baseIndex = Math.min(comboCount - 1, pentatonic.length - 1);
    const rootFreq = pentatonic[Math.max(0, baseIndex)];

    // Play chime note (synth bell)
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(rootFreq, this.ctx.currentTime);

    const duration = 0.35 + Math.min(comboCount * 0.05, 0.4);
    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);

    // If 2 or more lines, add a harmonious upper 5th bell
    if (linesCleared >= 2) {
      const harmOsc = this.ctx.createOscillator();
      const harmGain = this.ctx.createGain();
      harmOsc.type = 'triangle';
      harmOsc.frequency.setValueAtTime(rootFreq * 1.5, this.ctx.currentTime + 0.03);

      harmGain.gain.setValueAtTime(0.15, this.ctx.currentTime + 0.03);
      harmGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      harmOsc.connect(harmGain);
      harmGain.connect(this.ctx.destination);
      harmOsc.start(this.ctx.currentTime + 0.03);
      harmOsc.stop(this.ctx.currentTime + duration);
    }

    // Heavy bass impact if multi-line clear
    if (linesCleared >= 2) {
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(140, this.ctx.currentTime);
      subOsc.frequency.exponentialRampToValueAtTime(45, this.ctx.currentTime + 0.25);

      subGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      subGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

      subOsc.connect(subGain);
      subGain.connect(this.ctx.destination);
      subOsc.start();
      subOsc.stop(this.ctx.currentTime + 0.26);
    }
  }

  /**
   * Game Over descending sound
   */
  public playGameOver() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [330, 294, 261, 196];
    notes.forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const startTime = this.ctx.currentTime + i * 0.14;
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, startTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.85, startTime + 0.12);

      gain.gain.setValueAtTime(0.15, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.13);
    });
  }
}

export const sound = new SoundEngine();
