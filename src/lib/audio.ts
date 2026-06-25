/**
 * Minimal Audio Manager for Stadium Soundscapes
 */
class AudioManager {
  private ctx: AudioContext | null = null;
  private crowdGain: GainNode | null = null;
  private isEnabled: boolean = false;

  private initContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (enabled) {
      this.initContext();
      this.startCrowd();
    } else {
      this.stopCrowd();
    }
  }

  private startCrowd() {
    if (!this.ctx || !this.isEnabled) return;
    
    // Create a procedural "crowd" noise (brown noise + low pass)
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5; // Gain
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;

    this.crowdGain = this.ctx.createGain();
    this.crowdGain.gain.value = 0;
    this.crowdGain.gain.linearRampToValueAtTime(0.15, this.ctx.currentTime + 2);

    noise.connect(filter);
    filter.connect(this.crowdGain);
    this.crowdGain.connect(this.ctx.destination);
    
    noise.start();
  }

  private stopCrowd() {
    if (this.crowdGain && this.ctx) {
      this.crowdGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1);
    }
  }

  playWhistle() {
    if (!this.ctx || !this.isEnabled) return;
    this.initContext();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(2500, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(2000, this.ctx.currentTime + 0.1);
    osc.frequency.exponentialRampToValueAtTime(2500, this.ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  playGoalRoar() {
    if (!this.ctx || !this.isEnabled || !this.crowdGain) return;
    
    const now = this.ctx.currentTime;
    this.crowdGain.gain.cancelScheduledValues(now);
    this.crowdGain.gain.linearRampToValueAtTime(0.6, now + 0.1);
    this.crowdGain.gain.exponentialRampToValueAtTime(0.15, now + 4);
  }
}

export const audioManager = new AudioManager();
