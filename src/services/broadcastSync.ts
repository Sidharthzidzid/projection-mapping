import { ProjectData, Surface } from '../types';

export type SyncMessage =
  | { type: 'SYNC_FULL'; project: ProjectData }
  | { type: 'SYNC_SURFACES'; surfaces: Surface[]; activeSceneId: string }
  | { type: 'SYNC_BLACKOUT'; blackout: boolean }
  | { type: 'SYNC_DIMMER'; dimmer: number }
  | { type: 'SYNC_TEST_PATTERN'; pattern: string | null }
  | { type: 'PROJECTOR_READY' }
  | { type: 'REQUEST_SYNC' };

const CHANNEL_NAME = 'lumina_projection_sync_channel';

class BroadcastSyncService {
  private channel: BroadcastChannel | null = null;
  private listeners: ((msg: SyncMessage) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          this.notifyListeners(event.data);
        };
      } catch (err) {
        console.warn('BroadcastChannel initialization error:', err);
      }
    }

    // Fallback to storage events for cross-tab communication
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'lumina_sync_payload' && e.newValue) {
          try {
            const data = JSON.parse(e.newValue);
            this.notifyListeners(data);
          } catch {
            // ignore JSON parse errors
          }
        }
      });
    }
  }

  private notifyListeners(msg: SyncMessage) {
    for (const listener of this.listeners) {
      listener(msg);
    }
  }

  public subscribe(callback: (msg: SyncMessage) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  public send(msg: SyncMessage) {
    if (this.channel) {
      try {
        this.channel.postMessage(msg);
      } catch (err) {
        console.warn('Failed to send broadcast message:', err);
      }
    }

    // Also write to localStorage for fallback
    try {
      localStorage.setItem('lumina_sync_payload', JSON.stringify({
        ...msg,
        _timestamp: Date.now(),
      }));
    } catch {
      // ignore storage quota errors
    }
  }
}

export const syncService = new BroadcastSyncService();

