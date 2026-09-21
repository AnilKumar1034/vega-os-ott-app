import {ImageSourcePropType} from 'react-native';
import {ContentMaturityRating} from './maturity';

export interface EpisodeItem {
  id: string;
  seriesId: string;
  seriesTitle?: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  description?: string;
  duration?: number;
  durationFormatted?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  image?: ImageSourcePropType;
  badge?: string;
  rating?: string;
  maturityRating?: ContentMaturityRating;
  genre?: string;
  cast?: string;
  director?: string;
  seekbarType?: any;
}

export interface NextEpisodeState {
  isOpen: boolean;
  countdownSeconds: number;
  isAutoPlayActive: boolean;
  nextEpisode: EpisodeItem | null;
}
