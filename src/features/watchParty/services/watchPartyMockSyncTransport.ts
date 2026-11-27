/**
 * Deterministic Mock Synchronization Transport (Day 4)
 * Simulates real-time room-scoped event delivery, connection states,
 * network delays, stale events, and disconnect/reconnect scenarios for testing.
 * LogiXstream Amazon Vega OS React Native Application
 */

import {
  WatchPartySyncEvent,
  WatchPartyTransportConnectionState,
} from '../types/watchPartySync.types';
import {WatchPartySyncTransport} from './watchPartySyncTransport';

export class WatchPartyMockSyncTransport implements WatchPartySyncTransport {
  private listeners: Map<string, Set<(event: WatchPartySyncEvent) => void>> =
    new Map();
  private stateListeners: Map<
    string,
    Set<(state: WatchPartyTransportConnectionState) => void>
  > = new Map();
  private connectionStates: Map<string, WatchPartyTransportConnectionState> =
    new Map();
  private publishedEvents: Map<string, WatchPartySyncEvent[]> = new Map();
  private shouldFailPublish: Map<string, boolean> = new Map();
  private shouldFailConnect: Map<string, boolean> = new Map();
  private deliveryDelayMs: number = 0;

  constructor() {}

  async connect(roomId: string): Promise<void> {
    if (!roomId) {
      throw new Error('roomId is required to connect transport.');
    }
    if (this.shouldFailConnect.get(roomId)) {
      this.setConnectionState(roomId, 'failed');
      throw new Error(`Mock transport connection failed for room ${roomId}`);
    }

    this.setConnectionState(roomId, 'connected');
    if (!this.listeners.has(roomId)) {
      this.listeners.set(roomId, new Set());
    }
    if (!this.publishedEvents.has(roomId)) {
      this.publishedEvents.set(roomId, []);
    }
  }

  async disconnect(roomId: string): Promise<void> {
    this.setConnectionState(roomId, 'disconnected');
    this.listeners.delete(roomId);
  }

  async publish(event: WatchPartySyncEvent): Promise<void> {
    if (!event || !event.roomId) {
      throw new Error('Cannot publish event without roomId');
    }
    const {roomId} = event;

    if (this.shouldFailPublish.get(roomId)) {
      throw new Error(`Mock transport failed to publish event ${event.eventId}`);
    }

    const state = this.getConnectionState(roomId);
    if (state !== 'connected') {
      throw new Error(
        `Cannot publish event: Transport is not connected (state=${state})`,
      );
    }

    // Record published event for verification in tests
    const history = this.publishedEvents.get(roomId) || [];
    history.push(event);
    this.publishedEvents.set(roomId, history);

    // Deliver to room listeners
    this.deliverEvent(event);
  }

  subscribe(
    roomId: string,
    listener: (event: WatchPartySyncEvent) => void,
  ): () => void {
    if (!roomId || typeof listener !== 'function') {
      return () => {};
    }

    let roomListeners = this.listeners.get(roomId);
    if (!roomListeners) {
      roomListeners = new Set();
      this.listeners.set(roomId, roomListeners);
    }

    roomListeners.add(listener);

    return () => {
      const current = this.listeners.get(roomId);
      if (current) {
        current.delete(listener);
        if (current.size === 0) {
          this.listeners.delete(roomId);
        }
      }
    };
  }

  getConnectionState(roomId: string): WatchPartyTransportConnectionState {
    return this.connectionStates.get(roomId) || 'disconnected';
  }

  onConnectionStateChange(
    roomId: string,
    listener: (state: WatchPartyTransportConnectionState) => void,
  ): () => void {
    let stateList = this.stateListeners.get(roomId);
    if (!stateList) {
      stateList = new Set();
      this.stateListeners.set(roomId, stateList);
    }
    stateList.add(listener);

    return () => {
      const current = this.stateListeners.get(roomId);
      if (current) {
        current.delete(listener);
      }
    };
  }

  // --- Test & Simulation Utilities ---

  public setConnectionState(
    roomId: string,
    state: WatchPartyTransportConnectionState,
  ): void {
    this.connectionStates.set(roomId, state);
    const roomStateListeners = this.stateListeners.get(roomId);
    if (roomStateListeners) {
      roomStateListeners.forEach(listener => {
        try {
          listener(state);
        } catch (e) {
          console.error('[MockTransport] Error in state listener:', e);
        }
      });
    }
  }

  public simulateEvent(event: WatchPartySyncEvent): void {
    this.deliverEvent(event);
  }

  public simulateDuplicateEvent(event: WatchPartySyncEvent): void {
    this.deliverEvent(event);
    this.deliverEvent({...event});
  }

  public simulateOutOfOrderEvents(events: WatchPartySyncEvent[]): void {
    // Deliver in the order provided (caller arranges them out of sequence)
    events.forEach(evt => this.deliverEvent(evt));
  }

  public simulateDisconnect(roomId: string): void {
    this.setConnectionState(roomId, 'disconnected');
  }

  public simulateReconnect(roomId: string): void {
    this.setConnectionState(roomId, 'reconnecting');
    this.setConnectionState(roomId, 'connected');
  }

  public setPublishFailure(roomId: string, shouldFail: boolean): void {
    this.shouldFailPublish.set(roomId, shouldFail);
  }

  public setConnectFailure(roomId: string, shouldFail: boolean): void {
    this.shouldFailConnect.set(roomId, shouldFail);
  }

  public setDeliveryDelayMs(delayMs: number): void {
    this.deliveryDelayMs = Math.max(0, delayMs);
  }

  public getPublishedEvents(roomId: string): WatchPartySyncEvent[] {
    return this.publishedEvents.get(roomId) || [];
  }

  public getActiveListenerCount(roomId: string): number {
    return this.listeners.get(roomId)?.size || 0;
  }

  public reset(): void {
    this.listeners.clear();
    this.stateListeners.clear();
    this.connectionStates.clear();
    this.publishedEvents.clear();
    this.shouldFailPublish.clear();
    this.shouldFailConnect.clear();
    this.deliveryDelayMs = 0;
  }

  private deliverEvent(event: WatchPartySyncEvent): void {
    const roomListeners = this.listeners.get(event.roomId);
    if (!roomListeners || roomListeners.size === 0) {
      return;
    }

    const dispatch = () => {
      roomListeners.forEach(listener => {
        try {
          listener(event);
        } catch (err) {
          console.error('[MockTransport] Error dispatching event:', err);
        }
      });
    };

    if (this.deliveryDelayMs > 0) {
      setTimeout(dispatch, this.deliveryDelayMs);
    } else {
      dispatch();
    }
  }
}

export const mockSyncTransport = new WatchPartyMockSyncTransport();
