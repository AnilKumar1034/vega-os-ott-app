import {ImageSourcePropType} from 'react-native';
import {
  buildDynamicVideoThumbnailUrl,
  fetchDynamicVideoThumbnail,
  getDynamicVideoThumbnail,
  prefetchDynamicVideoThumbnails,
  clearThumbnailCache,
  getThumbnailCacheSize,
  DynamicVideoThumbnailOptions,
} from '../services/videoThumbnailService';
import {
  MOVIE_EXACT_THUMBNAILS,
  ANGEL_ONE_EXACT_VIDEO_FRAMES,
  getMovieExactDynamicFrames,
} from './movieThumbnails';

export type {DynamicVideoThumbnailOptions};

export interface ExactVideoThumbnailOptions extends DynamicVideoThumbnailOptions {}

/**
 * Returns dynamic video frame thumbnail fetched directly from the video stream or movie.
 * Accurately shows the exact thumbnail for the specific video being previewed.
 */
export const getExactVideoThumbnail = (
  options: ExactVideoThumbnailOptions,
): ImageSourcePropType => {
  return getDynamicVideoThumbnail(options);
};

export {
  buildDynamicVideoThumbnailUrl,
  fetchDynamicVideoThumbnail,
  getDynamicVideoThumbnail,
  prefetchDynamicVideoThumbnails,
  clearThumbnailCache,
  getThumbnailCacheSize,
  MOVIE_EXACT_THUMBNAILS,
  ANGEL_ONE_EXACT_VIDEO_FRAMES,
  getMovieExactDynamicFrames,
};
