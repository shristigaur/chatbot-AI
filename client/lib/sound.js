class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = false;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined' && window.AudioContext) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (enabled) this.init();
  }

  playTone(freq, type, duration, vol) {
    if (!this.enabled || !this.ctx) return;
    
    // Resume context if suspended (browser autoplay policy)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playSend() {
    // A soft ascending pop
    this.playTone(400, 'sine', 0.1, 0.05);
    setTimeout(() => this.playTone(600, 'sine', 0.15, 0.05), 50);
  }

  playReceive() {
    // A soft descending pop
    this.playTone(600, 'sine', 0.1, 0.05);
    setTimeout(() => this.playTone(400, 'sine', 0.15, 0.05), 50);
  }

  playLevelUp() {
    // A subtle ascending chime
    this.playTone(440, 'triangle', 0.15, 0.05);
    setTimeout(() => this.playTone(554, 'triangle', 0.15, 0.05), 100);
    setTimeout(() => this.playTone(659, 'triangle', 0.4, 0.05), 200);
  }
}

export const soundEngine = new SoundEngine();
