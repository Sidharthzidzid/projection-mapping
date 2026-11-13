import { MidiBinding } from '../types';

export type MidiListener = (data: {
  channel: number;
  type: 'cc' | 'note';
  controller: number;
  value: number; // 0 to 127
  normalized: number; // 0 to 1
}) => void;

class MidiService {
  private midiAccess: any = null;
  private isAvailable: boolean = false;
  private listeners: MidiListener[] = [];
  public bindings: MidiBinding[] = [];
  public learningTarget: {
    action: MidiBinding['action'];
    targetId?: string;
    paramName?: string;
    label: string;
  } | null = null;

  constructor() {
    this.initMidi();
  }

  public async initMidi(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator) {
      try {
        this.midiAccess = await (navigator as any).requestMIDIAccess({ sysex: false });
        this.isAvailable = true;

        for (const input of this.midiAccess.inputs.values()) {
          input.onmidimessage = this.handleMidiMessage.bind(this);
        }

        this.midiAccess.onstatechange = (e: any) => {
          const port = e.port;
          if (port.type === 'input' && port.state === 'connected') {
            port.onmidimessage = this.handleMidiMessage.bind(this);
          }
        };

        return true;
      } catch (err) {
        console.warn('Web MIDI API not permitted or no device attached:', err);
        this.isAvailable = false;
        return false;
      }
    }
    return false;
  }

  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator;
  }

  public isConnected(): boolean {
    if (!this.midiAccess) return false;
    return this.midiAccess.inputs.size > 0;
  }

  public getDeviceNames(): string[] {
    if (!this.midiAccess) return [];
    const names: string[] = [];
    for (const input of this.midiAccess.inputs.values()) {
      names.push(input.name || 'Unnamed MIDI Device');
    }
    return names;
  }

  public subscribe(listener: MidiListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public startLearn(target: {
    action: MidiBinding['action'];
    targetId?: string;
    paramName?: string;
    label: string;
  }) {
    this.learningTarget = target;
  }

  public cancelLearn() {
    this.learningTarget = null;
  }

  public handleMidiMessage(event: any) {
    const data = event.data;
    if (!data || data.length < 3) return;

    const status = data[0];
    const controller = data[1];
    const value = data[2];

    const channel = (status & 0x0f) + 1;
    const messageType = status >> 4;

    let type: 'cc' | 'note' | null = null;
    if (messageType === 0x0b) {
      type = 'cc'; // Control Change (knob / slider)
    } else if (messageType === 0x09 && value > 0) {
      type = 'note'; // Note On (pad / key)
    }

    if (!type) return;

    const normalized = value / 127;

    // Check if in learn mode
    if (this.learningTarget) {
      const newBinding: MidiBinding = {
        id: `midi_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        channel,
        controller,
        type,
        action: this.learningTarget.action,
        targetId: this.learningTarget.targetId,
        paramName: this.learningTarget.paramName,
        label: this.learningTarget.label,
      };

      // Filter out duplicate binding for same controller
      this.bindings = this.bindings.filter(
        b => !(b.channel === channel && b.controller === controller && b.type === type)
      );
      this.bindings.push(newBinding);
      this.learningTarget = null;
      this.saveBindings();
    }

    // Notify listeners
    for (const listener of this.listeners) {
      listener({ channel, type, controller, value, normalized });
    }
  }

  /**
   * Virtual MIDI message trigger for testing without physical MIDI hardware.
   */
  public triggerVirtualMidi(type: 'cc' | 'note', controller: number, value: number) {
    const event = {
      data: new Uint8Array([
        type === 'cc' ? 0xb0 : 0x90,
        controller,
        value,
      ]),
    } as any;

    this.handleMidiMessage(event);
  }

  private saveBindings() {
    try {
      localStorage.setItem('lumina_midi_bindings', JSON.stringify(this.bindings));
    } catch {
      // ignore
    }
  }

  public loadBindings() {
    try {
      const data = localStorage.getItem('lumina_midi_bindings');
      if (data) {
        this.bindings = JSON.parse(data);
      }
    } catch {
      // ignore
    }
  }
}

export const midiService = new MidiService();
