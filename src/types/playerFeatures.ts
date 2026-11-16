export interface SkipInterval {
  start: number;
  end: number;
  label?: string;
  type?: 'intro' | 'recap';
}

export type PlaybackSpeed = 0.5 | 0.75 | 1.0 | 1.25 | 1.5 | 2.0;

export const SUPPORTED_PLAYBACK_SPEEDS: PlaybackSpeed[] = [
  0.5, 0.75, 1.0, 1.25, 1.5, 2.0,
];

export const DEFAULT_PLAYBACK_SPEED: PlaybackSpeed = 1.0;

export interface PlaybackSpeedOption {
  label: string;
  value: PlaybackSpeed;
  isDefault?: boolean;
}

export interface SubtitleAppearanceSettings {
  fontSize?: 'small' | 'medium' | 'large';
  contrast?: 'standard' | 'high' | 'translucent';
}

export interface PlaybackRecoveryState {
  isRecovering: boolean;
  attempt: number;
  maxAttempts: number;
  lastError: any;
  savedPosition: number;
}
