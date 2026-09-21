import {EpisodeItem} from '../types/episode';
import {
  DEFAULT_MOCK_VIDEO_URL,
  MULTI_QUALITY_MOCK_VIDEO_URL,
  WORKING_VIDEO_URLS,
} from './home';

/**
 * Curated episode catalogs for series and episodic content in the app.
 */
export const curatedEpisodesMap: Record<string, EpisodeItem[]> = {
  // Star Trek: The Next Generation - Angel One & sequel episodes
  'angel-one': [
    {
      id: 'angel-one',
      seriesId: 'series-angel-one',
      seriesTitle: 'Star Trek: The Next Generation',
      seasonNumber: 1,
      episodeNumber: 14,
      title: 'Angel One',
      description:
        'The Enterprise visits the planet Angel One to search for survivors of the freighter Odin, discovering an isolated civilization.',
      duration: 2700,
      durationFormatted: '45m',
      videoUrl:
        'https://storage.googleapis.com/shaka-demo-assets/angel-one/dash.mpd',
      image: require('../assets/background.png'),
      badge: 'EPISODE 14',
      rating: '⭐ 8.9 / 10',
      maturityRating: '13_PLUS',
      genre: 'Sci-Fi • Adventure',
      seekbarType: 'break-markers',
    },
    {
      id: 'angel-one-ep-15',
      seriesId: 'series-angel-one',
      seriesTitle: 'Star Trek: The Next Generation',
      seasonNumber: 1,
      episodeNumber: 15,
      title: '11001001',
      description:
        'When the Enterprise docks at Starbase 74 for maintenance, a species of computer experts known as Bynars hijacks the ship.',
      duration: 2760,
      durationFormatted: '46m',
      videoUrl: MULTI_QUALITY_MOCK_VIDEO_URL,
      image: require('../assets/background.png'),
      badge: 'EPISODE 15',
      rating: '⭐ 9.1 / 10',
      maturityRating: '13_PLUS',
      genre: 'Sci-Fi • Adventure',
      seekbarType: 'markers',
    },
    {
      id: 'angel-one-ep-16',
      seriesId: 'series-angel-one',
      seriesTitle: 'Star Trek: The Next Generation',
      seasonNumber: 1,
      episodeNumber: 16,
      title: 'Too Short a Season',
      description:
        'The Enterprise transports an elderly Admiral to negotiations on Mordan IV, where an old adversary holds hostages.',
      duration: 2700,
      durationFormatted: '45m',
      videoUrl: WORKING_VIDEO_URLS[1] || DEFAULT_MOCK_VIDEO_URL,
      image: require('../assets/background.png'),
      badge: 'EPISODE 16',
      rating: '⭐ 8.7 / 10',
      maturityRating: '13_PLUS',
      genre: 'Sci-Fi • Drama',
      seekbarType: 'markers',
    },
    {
      id: 'angel-one-ep-17',
      seriesId: 'series-angel-one',
      seriesTitle: 'Star Trek: The Next Generation',
      seasonNumber: 1,
      episodeNumber: 17,
      title: 'When the Bough Breaks',
      description:
        'The crew discovers the legendary cloaked world of Aldea, whose sterile inhabitants kidnap children from the Enterprise.',
      duration: 2700,
      durationFormatted: '45m',
      videoUrl: WORKING_VIDEO_URLS[2] || DEFAULT_MOCK_VIDEO_URL,
      image: require('../assets/background.png'),
      badge: 'EPISODE 17',
      rating: '⭐ 8.8 / 10',
      maturityRating: '13_PLUS',
      genre: 'Sci-Fi • Mystery',
      seekbarType: 'thumbnail-images',
    },
  ],

  // Kalki Episodic Universe
  kalki: [
    {
      id: 'kalki',
      seriesId: 'series-kalki',
      seriesTitle: 'Kalki Chronicles',
      seasonNumber: 1,
      episodeNumber: 1,
      title: 'Prelude to Shambala',
      description:
        'In the dystopian post-apocalyptic world of Kasi, bounty hunter Bhairava seeks a gateway to the Complex.',
      duration: 3600,
      durationFormatted: '60m',
      videoUrl: MULTI_QUALITY_MOCK_VIDEO_URL,
      image: require('../assets/background.png'),
      badge: 'EPISODE 1',
      rating: '⭐ 8.6 / 10',
      maturityRating: '13_PLUS',
      genre: 'Sci-Fi • Action',
      seekbarType: 'long-press',
    },
    {
      id: 'kalki-ep-2',
      seriesId: 'series-kalki',
      seriesTitle: 'Kalki Chronicles',
      seasonNumber: 1,
      episodeNumber: 2,
      title: 'The Rise of Bhairava',
      description:
        'Ashwatthama awakens from slumber to protect the mother of the prophesied divine child from imperial forces.',
      duration: 3600,
      durationFormatted: '60m',
      videoUrl: DEFAULT_MOCK_VIDEO_URL,
      image: require('../assets/background.png'),
      badge: 'EPISODE 2',
      rating: '⭐ 9.0 / 10',
      maturityRating: '13_PLUS',
      genre: 'Sci-Fi • Action',
      seekbarType: 'markers',
    },
    {
      id: 'kalki-ep-3',
      seriesId: 'series-kalki',
      seriesTitle: 'Kalki Chronicles',
      seasonNumber: 1,
      episodeNumber: 3,
      title: 'The Complex Awakening',
      description:
        'Supreme Yaskin unveils Project K, setting in motion an epic showdown across the desert wasteland.',
      duration: 3600,
      durationFormatted: '60m',
      videoUrl: WORKING_VIDEO_URLS[1] || DEFAULT_MOCK_VIDEO_URL,
      image: require('../assets/background.png'),
      badge: 'EPISODE 3',
      rating: '⭐ 9.2 / 10',
      maturityRating: '13_PLUS',
      genre: 'Sci-Fi • Action',
      seekbarType: 'break-markers',
    },
  ],

  // Kids & Family series: The Lion Guard
  'the-lion-king': [
    {
      id: 'the-lion-king',
      seriesId: 'series-lion-king',
      seriesTitle: 'The Lion Guard',
      seasonNumber: 1,
      episodeNumber: 1,
      title: 'Return of the Roar',
      description:
        'Kion, son of Simba, discovers his destiny as the leader of the Lion Guard and brings together an unlikely team of animals.',
      duration: 2400,
      durationFormatted: '40m',
      videoUrl: DEFAULT_MOCK_VIDEO_URL,
      image: require('../assets/background.png'),
      badge: 'EPISODE 1',
      rating: '⭐ 7.8 / 10',
      maturityRating: 'KIDS',
      genre: 'Animation • Family',
      seekbarType: 'limits',
    },
    {
      id: 'the-lion-king-ep-2',
      seriesId: 'series-lion-king',
      seriesTitle: 'The Lion Guard',
      seasonNumber: 1,
      episodeNumber: 2,
      title: 'The Rise of Scar',
      description:
        'The Lion Guard must defend the Pride Lands when dark whispers echo from the Outlands.',
      duration: 2400,
      durationFormatted: '40m',
      videoUrl: MULTI_QUALITY_MOCK_VIDEO_URL,
      image: require('../assets/background.png'),
      badge: 'EPISODE 2',
      rating: '⭐ 8.0 / 10',
      maturityRating: 'KIDS',
      genre: 'Animation • Family',
      seekbarType: 'limits',
    },
  ],
};

// Aliases for HLS and seek-preview demo IDs
curatedEpisodesMap['angel-one-hls'] = curatedEpisodesMap['angel-one'];
curatedEpisodesMap['mock-video-seek-preview'] = curatedEpisodesMap['angel-one'];
curatedEpisodesMap['the-lion-king-hero'] = curatedEpisodesMap['the-lion-king'];

/**
 * Returns all episodes for a content ID or title.
 */
export function getEpisodesForContent(
  contentId?: string,
  contentTitle?: string,
): EpisodeItem[] {
  const normId = (contentId || '').toLowerCase().trim();
  const normTitle = (contentTitle || '').toLowerCase().trim();

  if (normId && curatedEpisodesMap[normId]) {
    return curatedEpisodesMap[normId];
  }

  for (const key of Object.keys(curatedEpisodesMap)) {
    if (
      (normId && (normId.includes(key) || key.includes(normId))) ||
      (normTitle && (normTitle.includes(key) || key.includes(normTitle)))
    ) {
      return curatedEpisodesMap[key];
    }
  }

  return [];
}

/**
 * Resolves the next episode for the currently playing content.
 * Follows priority:
 * 1. Explicit content.nextEpisode
 * 2. Explicit content.episodes array
 * 3. Curated episodes map lookup
 * 4. Episodic metadata (seriesId & episodeNumber)
 * 5. Returns null if not episodic or already at final episode
 */
export function getNextEpisodeForContent(
  currentContent: any,
  currentEpisodeId?: string,
): EpisodeItem | null {
  if (!currentContent) {
    return null;
  }

  // 1. Explicit nextEpisode on content or route params
  if (currentContent.nextEpisode) {
    return currentContent.nextEpisode;
  }

  // 2. Explicit episodes array on content
  if (
    Array.isArray(currentContent.episodes) &&
    currentContent.episodes.length > 0
  ) {
    const episodes = currentContent.episodes as EpisodeItem[];
    const targetId = currentEpisodeId || currentContent.id;
    const currentIndex = episodes.findIndex(
      (ep) =>
        ep.id === targetId ||
        (ep.episodeNumber !== undefined &&
          ep.episodeNumber === currentContent.episodeNumber),
    );
    if (currentIndex >= 0 && currentIndex < episodes.length - 1) {
      return episodes[currentIndex + 1];
    }
    if (currentIndex === -1 && episodes.length > 1) {
      return episodes[1];
    }
    return null;
  }

  // 3. Match from curated catalog map
  const contentId = currentEpisodeId || currentContent.id;
  const contentTitle = currentContent.title;
  const episodes = getEpisodesForContent(contentId, contentTitle);
  if (episodes && episodes.length > 0) {
    const currentIndex = episodes.findIndex(
      (ep) =>
        ep.id === contentId ||
        (currentContent.episodeNumber !== undefined &&
          ep.episodeNumber === currentContent.episodeNumber),
    );
    if (currentIndex >= 0 && currentIndex < episodes.length - 1) {
      return episodes[currentIndex + 1];
    }
    if (currentIndex === -1 && episodes.length > 1) {
      return episodes[1];
    }
    // If it's the last episode in the series, return null
    if (currentIndex === episodes.length - 1) {
      return null;
    }
  }

  // 4. Episodic content with season and episode numbers
  if (
    currentContent.seriesId &&
    typeof currentContent.episodeNumber === 'number'
  ) {
    const nextEpNum = currentContent.episodeNumber + 1;
    const seasonNum = currentContent.seasonNumber || 1;
    return {
      id: `${currentContent.seriesId}-s${seasonNum}-e${nextEpNum}`,
      seriesId: currentContent.seriesId,
      seriesTitle: currentContent.seriesTitle || currentContent.title,
      seasonNumber: seasonNum,
      episodeNumber: nextEpNum,
      title: `Episode ${nextEpNum}`,
      description: `Next exciting episode of ${
        currentContent.seriesTitle || currentContent.title
      }.`,
      duration: 2700,
      durationFormatted: '45m',
      videoUrl: currentContent.videoUrl || DEFAULT_MOCK_VIDEO_URL,
      image: currentContent.image,
      badge: `EPISODE ${nextEpNum}`,
      rating: currentContent.rating,
      maturityRating: currentContent.maturityRating,
      genre: currentContent.genre,
    };
  }

  return null;
}
