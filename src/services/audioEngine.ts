import { AudioBands } from '../types';

class AudioEngine {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private mediaStream: MediaStream | null = null;
  private isRunning: boolean = false;
  private isSimulated: boolean = true;
  private beatThreshold: number = 0.65;
  private lastBeatTime: number = 0;

  public bands: AudioBands = {
    subBass: 0,
    bass: 0,
    mid: 0,
    high: 0,
    peak: 0,
    beat: false,
  };

  public init() {
    // Start with simulated audio so animations look alive immediately!
    this.isSimulated = true;
    this.isRunning = true;
  }

  public async enableMicrophone(): Promise<boolean> {
    try {
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      this.mediaStream = stream;

      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
      const source = this.audioCtx.createMediaStreamSource(stream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.75;
      source.connect(this.analyser);

      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.isSimulated = false;
      this.isRunning = true;
      return true;
    } catch (err) {
      console.warn('Microphone access denied or failed, falling back to simulated audio reactive pulse', err);
      this.isSimulated = true;
      this.isRunning = true;
      return false;
    }
  }

  public disableMicrophone() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
    }
    this.analyser = null;
    this.isSimulated = true;
  }

  public getIsUsingMic(): boolean {
    return !this.isSimulated && this.mediaStream !== null;
  }

  public getBands(): AudioBands {
    return this.bands;
  }

  public update(timeMs: number): AudioBands {
    if (!this.isRunning) return this.bands;

    if (!this.isSimulated && this.analyser && this.dataArray) {
      this.analyser.getByteFrequencyData(this.dataArray as any);
      const binCount = this.dataArray.length;

      // Extract frequency ranges
      // Sub-bass: bins 0 - 3 (approx 20 - 80 Hz)
      // Bass: bins 4 - 15 (approx 80 - 300 Hz)
      // Mid: bins 16 - 80 (approx 300 - 2000 Hz)
      // High: bins 81 - 250 (approx 2000 - 10000 Hz)
      const subBass = this.getAverageRange(0, 3) / 255;
      const bass = this.getAverageRange(4, 15) / 255;
      const mid = this.getAverageRange(16, 80) / 255;
      const high = this.getAverageRange(81, 240) / 255;
      const peak = Math.max(subBass, bass, mid, high);

      // Beat detection
      const now = performance.now();
      let beat = false;
      if (bass > this.beatThreshold && now - this.lastBeatTime > 250) {
        beat = true;
        this.lastBeatTime = now;
      }

      this.bands = { subBass, bass, mid, high, peak, beat };
      return this.bands;
    }

    // High quality synthetic audio pulse (128 BPM simulation)
    const t = timeMs * 0.001;
    const bpm = 124;
    const beatPhase = (t * (bpm / 60)) % 1; // 0 to 1 per beat
    const beatDecay = Math.pow(Math.max(0, 1 - beatPhase * 1.8), 2.5);

    const bass = 0.2 + beatDecay * 0.7 + Math.sin(t * 3) * 0.1;
    const subBass = Math.min(1, bass * 1.1);
    const mid = 0.25 + Math.sin(t * 7) * 0.2 + Math.cos(t * 2.5) * 0.15;
    const high = 0.2 + Math.sin(t * 13) * 0.2 + (beatPhase < 0.15 ? 0.4 : 0);
    const peak = Math.max(subBass, bass, mid, high);
    const beat = beatPhase < 0.08;

    this.bands = {
      subBass: Math.max(0, Math.min(1, subBass)),
      bass: Math.max(0, Math.min(1, bass)),
      mid: Math.max(0, Math.min(1, mid)),
      high: Math.max(0, Math.min(1, high)),
      peak: Math.max(0, Math.min(1, peak)),
      beat,
    };

    return this.bands;
  }

  private getAverageRange(startBin: number, endBin: number): number {
    if (!this.dataArray) return 0;
    let sum = 0;
    const count = endBin - startBin + 1;
    for (let i = startBin; i <= endBin && i < this.dataArray.length; i++) {
      sum += this.dataArray[i];
    }
    return count > 0 ? sum / count : 0;
  }
}

export const audioEngine = new AudioEngine();
