export interface SubtitleCue {
  id?: string | number;
  startTime: number; // in seconds
  endTime: number; // in seconds
  text: string;
}

export interface SubtitleTrack {
  id: string;
  language: string;
  label: string;
  kind?: 'subtitles' | 'captions';
  isDefault?: boolean;
  uri?: string;
  sourceType?: 'curated' | 'remote' | 'shaka' | 'native';
  cues?: SubtitleCue[];
}

export interface SubtitlePreference {
  profileId: string;
  selectedTrackId: string;
  updatedAt: number;
}
