export class NightAudio {
  private context?: AudioContext;
  enabled = false;
  async toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) {
      try { this.context ??= new AudioContext(); await this.context.resume(); this.tick(); }
      catch { this.enabled = false; }
    }
    return this.enabled;
  }
  tick(frequency = 110) {
    if (!this.enabled || !this.context) return;
    const ctx = this.context;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(0.045, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
    oscillator.connect(gain); gain.connect(ctx.destination); oscillator.start(); oscillator.stop(ctx.currentTime + 0.3);
  }
}
