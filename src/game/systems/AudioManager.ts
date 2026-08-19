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
  private music?: Phaser.Sound.BaseSound;
  private muted = false;
  private sfxVolume = 0.65;
  private musicVolume = 0.35;
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
    this.applyMusicVolume();
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

  startMusic(scene?: Phaser.Scene, key?: string): void {
    this.musicRequested = true;
    if (scene && key && (!this.music || !this.music.isPlaying)) {
      this.music?.destroy();
      this.music = scene.sound.add(key, {
        loop: true,
        volume: this.muted ? 0 : this.musicVolume,
      });
    }
    if (this.muted || !this.music || this.music.isPlaying) return;
    this.music.play();
    this.applyMusicVolume();
  }

  stopMusic(): void {
    if (this.music?.isPlaying) {
      this.music.stop();
    }
  }

  private applyMusicVolume(): void {
    const music = this.music as (Phaser.Sound.BaseSound & { setVolume?: (value: number) => void; volume?: number }) | undefined;
    if (!music) return;
    const volume = this.muted ? 0 : this.musicVolume;
    if (music.setVolume) {
      music.setVolume(volume);
    } else {
      music.volume = volume;
    }
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
