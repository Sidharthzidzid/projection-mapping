class BpmClock {
  public bpm: number = 124;
  private tapTimes: number[] = [];
  private lastTapResetTimeout: number | null = null;

  public tap(): number {
    const now = performance.now();
    this.tapTimes.push(now);

    if (this.lastTapResetTimeout) {
      clearTimeout(this.lastTapResetTimeout);
    }

    // Reset taps if user stops tapping for > 2 seconds
    this.lastTapResetTimeout = window.setTimeout(() => {
      this.tapTimes = [];
    }, 2000);

    // Keep last 6 taps
    if (this.tapTimes.length > 6) {
      this.tapTimes.shift();
    }

    if (this.tapTimes.length >= 2) {
      let totalDiff = 0;
      for (let i = 1; i < this.tapTimes.length; i++) {
        totalDiff += this.tapTimes[i] - this.tapTimes[i - 1];
      }
      const avgIntervalMs = totalDiff / (this.tapTimes.length - 1);
      const calculatedBpm = Math.round(60000 / avgIntervalMs);
      if (calculatedBpm >= 40 && calculatedBpm <= 240) {
        this.bpm = calculatedBpm;
      }
    }

    return this.bpm;
  }

  public setBpm(val: number) {
    this.bpm = Math.max(40, Math.min(240, val));
  }
}

export const bpmClock = new BpmClock();

