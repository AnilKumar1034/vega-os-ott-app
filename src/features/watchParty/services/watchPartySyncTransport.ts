/**
 * Watch Party Playback Synchronization Transport Abstraction (Day 4)
 * Transport-agnostic contract for publishing, subscribing to, and monitoring
 * Watch Party room synchronization events.
 * LogiXstream Amazon Vega OS React Native Application
 */

import {
  WatchPartySyncEvent,
  WatchPartyTransportConnectionState,
} from '../types/watchPartySync.types';

export interface WatchPartySyncTransport {
  /**
   * Connects to the room's synchronization channel.
   */
  connect(roomId: string): Promise<void>;

  /**
   * Disconnects from the room's synchronization channel and cleans up subscriptions.
   */
  disconnect(roomId: string): Promise<void>;

  /**
   * Publishes a playback synchronization event to the room.
   */
  publish(event: WatchPartySyncEvent): Promise<void>;

  /**
   * Subscribes a listener to room synchronization events.
   * Returns an unsubscribe function.
   */
  subscribe(
    roomId: string,
    listener: (event: WatchPartySyncEvent) => void,
  ): () => void;

  /**
   * Retrieves the current transport connection state for the room.
   */
  getConnectionState(roomId: string): WatchPartyTransportConnectionState;

  /**
   * Registers a listener for connection state changes.
   * Returns an unsubscribe function.
   */
  onConnectionStateChange?(
    roomId: string,
    listener: (state: WatchPartyTransportConnectionState) => void,
  ): () => void;
}
