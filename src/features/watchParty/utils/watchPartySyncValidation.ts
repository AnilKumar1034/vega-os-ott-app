/**
 * Watch Party Playback Synchronization Validation Utilities (Day 4)
 * Validates synchronization events, rejects stale/out-of-order events,
 * and manages bounded event deduplication.
 * LogiXstream Amazon Vega OS React Native Application
 */

import {
  WatchPartyAuthoritativeState,
  WatchPartySyncEvent,
  WatchPartySyncEventType,
} from '../types/watchPartySync.types';

const VALID_EVENT_TYPES: Set<WatchPartySyncEventType> = new Set([
  'PLAY',
  'PAUSE',
  'SEEK',
  'STATE_SNAPSHOT',
  'BUFFERING',
  'PLAYBACK_READY',
  'PLAYBACK_ENDED',
  'PLAYER_RECOVERED',
  'SYNC_REQUEST',
  'ROOM_CLOSED',
]);

/**
 * Validates that an incoming synchronization event meets all protocol schema requirements.
 */
export function validateSyncEvent(event: any): {
  isValid: boolean;
  error?: string;
} {
  if (!event || typeof event !== 'object') {
    return {isValid: false, error: 'Event must be a non-null object'};
  }

  if (typeof event.eventId !== 'string' || !event.eventId.trim()) {
    return {isValid: false, error: 'Event must contain a valid eventId'};
  }

  if (typeof event.roomId !== 'string' || !event.roomId.trim()) {
    return {isValid: false, error: 'Event must contain a valid roomId'};
  }

  if (typeof event.sessionId !== 'string' || !event.sessionId.trim()) {
    return {isValid: false, error: 'Event must contain a valid sessionId'};
  }

  if (typeof event.contentId !== 'string' || !event.contentId.trim()) {
    return {isValid: false, error: 'Event must contain a valid contentId'};
  }

  if (!VALID_EVENT_TYPES.has(event.type)) {
    return {isValid: false, error: `Invalid event type: ${event.type}`};
  }

  if (
    typeof event.sequenceNumber !== 'number' ||
    isNaN(event.sequenceNumber) ||
    event.sequenceNumber < 0
  ) {
    return {isValid: false, error: 'Event sequenceNumber must be a non-negative number'};
  }

  if (
    typeof event.playbackPositionMs !== 'number' ||
    isNaN(event.playbackPositionMs) ||
    event.playbackPositionMs < 0
  ) {
    return {isValid: false, error: 'Event playbackPositionMs must be a non-negative number'};
  }

  if (
    typeof event.clientTimestamp !== 'number' ||
    isNaN(event.clientTimestamp) ||
    event.clientTimestamp <= 0
  ) {
    return {isValid: false, error: 'Event clientTimestamp must be a positive number'};
  }

  return {isValid: true};
}

/**
 * Checks whether an incoming synchronization event is stale compared to the current authoritative session and sequence.
 */
export function isEventStale(
  event: WatchPartySyncEvent,
  activeSessionId: string | null | undefined,
  currentSequenceNumber: number = 0,
): boolean {
  // If activeSessionId is defined and mismatches event sessionId, event is stale/unrelated
  if (activeSessionId && event.sessionId !== activeSessionId) {
    return true;
  }

  // If the event sequence number is strictly less than our highest recorded sequence, it is stale
  if (event.sequenceNumber < currentSequenceNumber) {
    return true;
  }

  return false;
}

/**
 * Validates an authoritative playback state object.
 */
export function validateAuthoritativeState(state: any): {
  isValid: boolean;
  error?: string;
} {
  if (!state || typeof state !== 'object') {
    return {isValid: false, error: 'Authoritative state must be a non-null object'};
  }

  if (typeof state.roomId !== 'string' || !state.roomId.trim()) {
    return {isValid: false, error: 'Authoritative state requires roomId'};
  }

  if (typeof state.sessionId !== 'string' || !state.sessionId.trim()) {
    return {isValid: false, error: 'Authoritative state requires sessionId'};
  }

  if (typeof state.contentId !== 'string' || !state.contentId.trim()) {
    return {isValid: false, error: 'Authoritative state requires contentId'};
  }

  if (
    typeof state.positionMs !== 'number' ||
    isNaN(state.positionMs) ||
    state.positionMs < 0
  ) {
    return {isValid: false, error: 'positionMs must be non-negative'};
  }

  return {isValid: true};
}

/**
 * Factory for creating a bounded, memory-safe event deduplicator.
 */
export function createEventDeduplicator(maxSize: number = 100) {
  const eventIds: string[] = [];
  const eventSet = new Set<string>();

  return {
    has(eventId: string): boolean {
      return eventSet.has(eventId);
    },
    add(eventId: string): void {
      if (!eventId || eventSet.has(eventId)) {
        return;
      }
      if (eventIds.length >= maxSize) {
        const oldest = eventIds.shift();
        if (oldest) {
          eventSet.delete(oldest);
        }
      }
      eventIds.push(eventId);
      eventSet.add(eventId);
    },
    clear(): void {
      eventIds.length = 0;
      eventSet.clear();
    },
    size(): number {
      return eventSet.size;
    },
  };
}
