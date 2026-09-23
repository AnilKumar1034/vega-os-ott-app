// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import {getMovieExactDynamicFrames} from './movieThumbnails';

/**
 * Thumbnail configuration constants referenced from AmazonAppDev/vega-seekbar-sample
 * (src/constants/thumbnails.ts).
 */
export const THUMBNAIL_BASE_URL =
  'https://d1v0fxmwkpxbrg.cloudfront.net/seekbar-assets/images/thumbnail-examples/';

export const TOTAL_IMAGES = 68;

/**
 * Verified 68-frame sequential 16:9 widescreen video preview thumbnails
 * for mock video seeking along the playback timeline.
 */
export const MOCK_VIDEO_EXACT_FRAMES: string[] = Array.from(
  {length: TOTAL_IMAGES},
  (_, i) => `${THUMBNAIL_BASE_URL}${i < 10 ? `0${i}` : `${i}`}.jpg`,
);

/**
 * Generates thumbnail image URL for recorded content preview during seek interactions.
 * If movie or video context is provided, it dynamically resolves the exact thumbnail.
 * Sequential fallback URLs: baseurl/01.jpg, baseurl/02.jpg, ... baseurl/68.jpg
 */
export const getSeekbarThumbnailSource = (
  thumbValue: number,
  stepValue: number = 10,
  movieOrUrl?: any,
) => {
  if (movieOrUrl) {
    const movie = typeof movieOrUrl === 'object' ? movieOrUrl : undefined;
    const videoUrl = typeof movieOrUrl === 'string' ? movieOrUrl : movie?.videoUrl;
    const frames = getMovieExactDynamicFrames(movie, videoUrl);
    if (frames.length > 0) {
      const safeThumb = Math.max(0, Math.floor(thumbValue || 0));
      const step = Math.max(1, Math.floor(stepValue || 10));
      const index = Math.floor(safeThumb / step);
      const frameIndex = index % frames.length;
      return { uri: frames[frameIndex] };
    }
  }

  const safeThumb = Math.max(0, Math.floor(thumbValue || 0));
  const step = Math.max(1, Math.floor(stepValue || 10));
  const index = Math.floor(safeThumb / step);
  const imageNumber = index % TOTAL_IMAGES;
  const paddedNumber =
    imageNumber < 10 ? `0${imageNumber}` : `${imageNumber}`;

  return {
    uri: `${THUMBNAIL_BASE_URL}${paddedNumber}.jpg`,
  };
};
