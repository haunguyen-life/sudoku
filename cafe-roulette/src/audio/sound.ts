const STORAGE_KEY = 'cafe-roulette-sound';

function readStoredSound(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== '0';
  } catch {
    return true;
  }
}

interface ToneOptions {
  type?: OscillatorType;
  volume: number;
  sweepTo?: number;
  delay?: number;
}

// Âm thanh tổng hợp bằng Web Audio API, không cần file audio.
// AudioContext chỉ được tạo sau cú click đầu tiên của người dùng.
export class SoundEngine {
  private ctx: AudioContext | null = null;
  private enabled: boolean;

  constructor() {
    this.enabled = readStoredSound();
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    try {
      localStorage.setItem(STORAGE_KEY, on ? '1' : '0');
    } catch {
      // localStorage có thể bị chặn, bỏ qua và giữ trạng thái trong bộ nhớ.
    }
  }

  click(): void {
    this.tone(520, 0.09, { type: 'triangle', volume: 0.25, sweepTo: 300 });
  }

  tick(): void {
    this.tone(1400, 0.03, { type: 'square', volume: 0.05 });
  }

  win(): void {
    [523, 659, 784, 1047].forEach((freq, i) =>
      this.tone(freq, 0.35, { type: 'triangle', volume: 0.22, delay: i * 0.12 }),
    );
  }

  private getContext(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.ctx) {
      const AudioCtor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) return null;
      this.ctx = new AudioCtor();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  private tone(freq: number, duration: number, opts: ToneOptions): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const start = ctx.currentTime + (opts.delay ?? 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = opts.type ?? 'sine';
    osc.frequency.setValueAtTime(freq, start);
    if (opts.sweepTo) {
      osc.frequency.exponentialRampToValueAtTime(opts.sweepTo, start + duration);
    }
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(opts.volume, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }
}

export const sound = new SoundEngine();
