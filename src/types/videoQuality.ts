export interface VideoQualityOption {
  id: string;
  label: string;
  shortLabel: string;
  resolution?: string;
  height?: number;
  bitrate?: string;
  bitrateBps?: number;
  badge?: string;
  isDefault?: boolean;
  sourceType?: 'curated' | 'shaka' | 'native';
  rawTrack?: any;
}

export interface VideoQualityPreference {
  profileId: string;
  selectedQualityId: string;
  updatedAt: number;
}

export const AUTO_QUALITY_ID = 'auto';
