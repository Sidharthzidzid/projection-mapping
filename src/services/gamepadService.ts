export interface GamepadActionPayload {
  nudgeX: number; // -1 to 1
  nudgeY: number; // -1 to 1
  triggerDimmer?: number; // 0 to 1
  cueIndex?: number;
  toggleBlackout?: boolean;
  cycleSurface?: 'next' | 'prev';
}

type GamepadListener = (action: GamepadActionPayload) => void;

class GamepadService {
  private listeners: Set<GamepadListener> = new Set();
  private isConnected: boolean = false;
  private gamepadName: string = '';
  private pollAnimId: number | null = null;
  private lastButtonState: boolean[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('gamepadconnected', (e: GamepadEvent) => {
        this.isConnected = true;
        this.gamepadName = e.gamepad.id;
        this.startPolling();
      });

      window.addEventListener('gamepaddisconnected', () => {
        const pads = navigator.getGamepads ? navigator.getGamepads() : [];
        const hasPad = Array.from(pads).some((p) => p !== null);
        if (!hasPad) {
          this.isConnected = false;
          this.gamepadName = '';
          this.stopPolling();
        }
      });
    }
  }

  public subscribe(fn: GamepadListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  public getStatus(): { isConnected: boolean; name: string } {
    return {
      isConnected: this.isConnected,
      name: this.gamepadName,
    };
  }

  private startPolling() {
    if (this.pollAnimId) return;

    const poll = () => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      const pad = gamepads[0];

      if (pad) {
        // Deadzone check on left analog stick
        const deadzone = 0.15;
        let axisX = pad.axes[0] || 0;
        let axisY = pad.axes[1] || 0;

        if (Math.abs(axisX) < deadzone) axisX = 0;
        if (Math.abs(axisY) < deadzone) axisY = 0;

        const payload: GamepadActionPayload = {
          nudgeX: axisX,
          nudgeY: axisY,
        };

        // Buttons: A(0), B(1), X(2), Y(3)
        const btnA = pad.buttons[0]?.pressed;
        const btnB = pad.buttons[1]?.pressed;
        const btnX = pad.buttons[2]?.pressed;
        const btnY = pad.buttons[3]?.pressed;
        const btnLB = pad.buttons[4]?.pressed;
        const btnRB = pad.buttons[5]?.pressed;
        const btnStart = pad.buttons[9]?.pressed;

        // Triggers (RT - button 7)
        const rt = pad.buttons[7]?.value;
        if (rt !== undefined && rt > 0.05) {
          payload.triggerDimmer = rt;
        }

        // Rising edge check for single button clicks
        if (btnA && !this.lastButtonState[0]) payload.cueIndex = 0;
        if (btnB && !this.lastButtonState[1]) payload.cueIndex = 1;
        if (btnX && !this.lastButtonState[2]) payload.cueIndex = 2;
        if (btnY && !this.lastButtonState[3]) payload.cueIndex = 3;
        if (btnLB && !this.lastButtonState[4]) payload.cycleSurface = 'prev';
        if (btnRB && !this.lastButtonState[5]) payload.cycleSurface = 'next';
        if (btnStart && !this.lastButtonState[9]) payload.toggleBlackout = true;

        this.lastButtonState[0] = !!btnA;
        this.lastButtonState[1] = !!btnB;
        this.lastButtonState[2] = !!btnX;
        this.lastButtonState[3] = !!btnY;
        this.lastButtonState[4] = !!btnLB;
        this.lastButtonState[5] = !!btnRB;
        this.lastButtonState[9] = !!btnStart;

        // Notify listeners if action detected
        if (
          Math.abs(axisX) > 0 ||
          Math.abs(axisY) > 0 ||
          payload.cueIndex !== undefined ||
          payload.cycleSurface !== undefined ||
          payload.toggleBlackout ||
          payload.triggerDimmer !== undefined
        ) {
          this.listeners.forEach((fn) => fn(payload));
        }
      }

      this.pollAnimId = requestAnimationFrame(poll);
    };

    this.pollAnimId = requestAnimationFrame(poll);
  }

  private stopPolling() {
    if (this.pollAnimId) {
      cancelAnimationFrame(this.pollAnimId);
      this.pollAnimId = null;
    }
  }
}

export const gamepadService = new GamepadService();

