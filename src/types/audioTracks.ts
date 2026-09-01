export interface AudioTrack {
  id: string;
  language: string;
  label: string;
  audioCodec?: string;
  channels?: string;
  bitrate?: number;
  isDefault?: boolean;
  sourceType?: 'curated' | 'remote' | 'shaka' | 'native';
  streamUrl?: string;
}

export interface AudioTrackPreference {
  profileId: string;
  selectedTrackId: string;
  updatedAt: number;
}
