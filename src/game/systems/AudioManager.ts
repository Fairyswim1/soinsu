export type SoundName =
  | "button"
  | "select"
  | "chain"
  | "invalid"
  | "pop"
  | "drop"
  | "special"
  | "combo"
  | "complete"
  | "success"
  | "fail";

export class AudioManager {
  private context?: AudioContext;
  private muted = false;
  private sfxVolume = 0.65;
  private musicVolume = 0.35;
  private musicTimer?: number;
  private musicStep = 0;
  private musicRequested = false;

  setMuted(value: boolean): void {
    this.muted = value;
    if (value) {
      this.stopMusic();
    } else if (this.musicRequested) {
      this.startMusic();
    }
  }

  setVolume(value: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, value));
  }

  setMusicVolume(value: number): void {
    this.musicVolume = Math.max(0, Math.min(1, value));
  }

  unlock(): void {
    if (!this.context) {
      this.context = new AudioContext();
    }
    if (this.context.state === "suspended") {
      void this.context.resume();
    }
  }

  play(name: SoundName, step = 0): void {
    if (this.muted) return;
    this.unlock();
    if (!this.context) return;
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const base = this.frequencyFor(name) + step * 24;
    oscillator.frequency.setValueAtTime(base, now);
    oscillator.type = name === "invalid" ? "sawtooth" : "triangle";
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.18 * this.sfxVolume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    oscillator.connect(gain).connect(this.context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.18);
  }

  startMusic(): void {
    this.musicRequested = true;
    if (this.muted || this.musicTimer !== undefined) return;
    this.unlock();
    this.playMusicStep();
    this.musicTimer = window.setInterval(() => this.playMusicStep(), 240);
  }

  stopMusic(): void {
    if (this.musicTimer !== undefined) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = undefined;
    }
  }

  private playMusicStep(): void {
    if (this.muted) return;
    this.unlock();
    if (!this.context) return;
    const now = this.context.currentTime;
    const melody = [523.25, 659.25, 783.99, 987.77, 880, 783.99, 659.25, 587.33];
    const bass = [130.81, 130.81, 196, 196, 146.83, 146.83, 196, 196];
    const index = this.musicStep % melody.length;
    this.playTone(melody[index], now, 0.18, "triangle", 0.055 * this.musicVolume);
    if (this.musicStep % 2 === 0) {
      this.playTone(bass[index], now, 0.22, "sine", 0.04 * this.musicVolume);
    }
    this.musicStep += 1;
  }

  private playTone(frequency: number, startTime: number, duration: number, type: OscillatorType, volume: number): void {
    if (!this.context || volume <= 0) return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), startTime + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    oscillator.connect(gain).connect(this.context.destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.02);
  }

  private frequencyFor(name: SoundName): number {
    switch (name) {
      case "invalid":
        return 140;
      case "complete":
        return 620;
      case "success":
        return 760;
      case "special":
        return 520;
      case "combo":
        return 680;
      case "drop":
        return 220;
      case "button":
        return 330;
      case "chain":
        return 410;
      case "pop":
        return 490;
      case "fail":
        return 120;
      case "select":
      default:
        return 370;
    }
  }
}

export const sharedAudioManager = new AudioManager();
