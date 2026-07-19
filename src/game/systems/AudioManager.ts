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
  private volume = 0.65;

  setMuted(value: boolean): void {
    this.muted = value;
  }

  setVolume(value: number): void {
    this.volume = Math.max(0, Math.min(1, value));
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
    gain.gain.exponentialRampToValueAtTime(0.18 * this.volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    oscillator.connect(gain).connect(this.context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.18);
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
