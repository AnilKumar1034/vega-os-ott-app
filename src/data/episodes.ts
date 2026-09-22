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
    {
      id: 'angel-one-ep-18',
      seriesId: 'series-angel-one',
      seriesTitle: 'Star Trek: The Next Generation',
      seasonNumber: 1,
      episodeNumber: 18,
      title: 'Home Soil',
      description:
        'The Enterprise crew discovers an inorganic crystal lifeform on Velara III that threatens terraforming efforts.',
      duration: 2700,
      durationFormatted: '45m',
      videoUrl: DEFAULT_MOCK_VIDEO_URL,
      image: require('../assets/background.png'),
      badge: 'EPISODE 18',
      rating: '⭐ 8.5 / 10',
      maturityRating: '13_PLUS',
      genre: 'Sci-Fi • Mystery',
      seekbarType: 'markers',
    },
    {
      id: 'angel-one-ep-19',
      seriesId: 'series-angel-one',
      seriesTitle: 'Star Trek: The Next Generation',
      seasonNumber: 1,
      episodeNumber: 19,
      title: 'Coming of Age',
      description:
        'While Wesley takes the Starfleet entrance exams, Picard faces an investigation by Admiral Quinn and Remmick.',
      duration: 2700,
      durationFormatted: '45m',
      videoUrl: MULTI_QUALITY_MOCK_VIDEO_URL,
      image: require('../assets/background.png'),
      badge: 'EPISODE 19',
      rating: '⭐ 8.7 / 10',
      maturityRating: '13_PLUS',
      genre: 'Sci-Fi • Drama',
      seekbarType: 'fast-forward-rewind',
    },
    {
      id: 'angel-one-ep-20',
      seriesId: 'series-angel-one',
      seriesTitle: 'Star Trek: The Next Generation',
      seasonNumber: 1,
      episodeNumber: 20,
      title: 'Heart of Glory',
      description:
        'Worf finds his loyalty torn between Starfleet and a rogue band of Klingon warriors rescued by the Enterprise.',
      duration: 2700,
      durationFormatted: '45m',
      videoUrl: WORKING_VIDEO_URLS[0] || DEFAULT_MOCK_VIDEO_URL,
      image: require('../assets/background.png'),
      badge: 'EPISODE 20',
      rating: '⭐ 9.0 / 10',
      maturityRating: '13_PLUS',
      genre: 'Sci-Fi • Action',
      seekbarType: 'break-markers',
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
    {
      id: 'kalki-ep-4',
      seriesId: 'series-kalki',
      seriesTitle: 'Kalki Chronicles',
      seasonNumber: 1,
      episodeNumber: 4,
      title: 'The Prophecy of Kasi',
      description:
        'Rebels assemble at the outskirts of Kasi as celestial omens signal the beginning of the end of the Kali Yuga.',
      duration: 3600,
      durationFormatted: '60m',
      videoUrl: DEFAULT_MOCK_VIDEO_URL,
      image: require('../assets/background.png'),
      badge: 'EPISODE 4',
      rating: '⭐ 9.3 / 10',
      maturityRating: '13_PLUS',
      genre: 'Sci-Fi • Action',
      seekbarType: 'thumbnail-images',
    },
    {
      id: 'kalki-ep-5',
      seriesId: 'series-kalki',
      seriesTitle: 'Kalki Chronicles',
      seasonNumber: 1,
      episodeNumber: 5,
      title: 'The Battle for Shambala',
      description:
        'The fortress of Shambala faces an all-out assault as supreme destiny reveals itself in the desert skies.',
      duration: 3600,
      durationFormatted: '60m',
      videoUrl: MULTI_QUALITY_MOCK_VIDEO_URL,
      image: require('../assets/background.png'),
      badge: 'EPISODE 5',
      rating: '⭐ 9.5 / 10',
      maturityRating: '13_PLUS',
      genre: 'Sci-Fi • Action',
      seekbarType: 'limits',
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
    {
      id: 'the-lion-king-ep-3',
      seriesId: 'series-lion-king',
      seriesTitle: 'The Lion Guard',
      seasonNumber: 1,
      episodeNumber: 3,
      title: 'Battle of the Pride Lands',
      description:
        'The Army of Scar attacks the Pride Lands in full force, forcing the Lion Guard to take a stand.',
      duration: 2400,
      durationFormatted: '40m',
      videoUrl: WORKING_VIDEO_URLS[1] || DEFAULT_MOCK_VIDEO_URL,
      image: require('../assets/background.png'),
      badge: 'EPISODE 3',
      rating: '⭐ 8.4 / 10',
      maturityRating: 'KIDS',
      genre: 'Animation • Family',
      seekbarType: 'markers',
    },
    {
      id: 'the-lion-king-ep-4',
      seriesId: 'series-lion-king',
      seriesTitle: 'The Lion Guard',
      seasonNumber: 1,
      episodeNumber: 4,
      title: 'The Tree of Life',
      description:
        'The Guard journeys across treacherous lands to reach the legendary Tree of Life for healing.',
      duration: 2400,
      durationFormatted: '40m',
      videoUrl: DEFAULT_MOCK_VIDEO_URL,
      image: require('../assets/background.png'),
      badge: 'EPISODE 4',
      rating: '⭐ 8.6 / 10',
      maturityRating: 'KIDS',
      genre: 'Animation • Family',
      seekbarType: 'break-markers',
    },
  ],
};

// Aliases for HLS and seek-preview demo IDs
curatedEpisodesMap['angel-one-hls'] = curatedEpisodesMap['angel-one'];
curatedEpisodesMap['mock-video-seek-preview'] = curatedEpisodesMap['angel-one'];
curatedEpisodesMap['the-lion-king-hero'] = curatedEpisodesMap['the-lion-king'];
curatedEpisodesMap['sample-video'] = curatedEpisodesMap['angel-one'];

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

  // 5. Fallback for non-live content to guarantee Next Episode option is available in seekbar
  if (currentContent && !currentContent.isLive) {
    const nextEpNum = (currentContent.episodeNumber || 1) + 1;
    const seriesTitle =
      currentContent.seriesTitle || currentContent.title || 'Series';
    return {
      id: `${currentContent.id || 'video'}-next-ep`,
      seriesId: currentContent.seriesId || currentContent.id || 'series',
      seriesTitle,
      seasonNumber: currentContent.seasonNumber || 1,
      episodeNumber: nextEpNum,
      title: `${seriesTitle} - Next Episode`,
      description: `Next installment following ${
        currentContent.title || 'current playback'
      }.`,
      duration: currentContent.duration || 2700,
      durationFormatted: '45m',
      videoUrl: currentContent.videoUrl || DEFAULT_MOCK_VIDEO_URL,
      image: currentContent.image,
      badge: 'NEXT EPISODE',
      rating: currentContent.rating,
      maturityRating: currentContent.maturityRating,
      genre: currentContent.genre,
    };
  }

  return null;
}

/**
 * Returns all upcoming episodes that follow the currently playing episode.
 */
export function getNextEpisodesForContent(
  currentContent: any,
  currentEpisodeId?: string,
): EpisodeItem[] {
  if (!currentContent) {
    return [];
  }

  if (currentContent.isLive) {
    return [];
  }

  // 1. Explicit episodes array on content
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
      return episodes.slice(currentIndex + 1);
    }
    if (currentIndex === -1 && episodes.length > 1) {
      return episodes.slice(1);
    }
    return [];
  }

  // 2. Curated catalog map lookup
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
      return episodes.slice(currentIndex + 1);
    }
    if (currentIndex === -1 && episodes.length > 1) {
      return episodes.slice(1);
    }
    if (currentIndex === episodes.length - 1) {
      return [];
    }
  }

  // 3. Episodic content with season and episode numbers
  if (
    currentContent.seriesId &&
    typeof currentContent.episodeNumber === 'number'
  ) {
    const currentEpNum = currentContent.episodeNumber;
    const seasonNum = currentContent.seasonNumber || 1;
    const upcomingList: EpisodeItem[] = [];
    for (let i = 1; i <= 3; i++) {
      const epNum = currentEpNum + i;
      upcomingList.push({
        id: `${currentContent.seriesId}-s${seasonNum}-e${epNum}`,
        seriesId: currentContent.seriesId,
        seriesTitle: currentContent.seriesTitle || currentContent.title,
        seasonNumber: seasonNum,
        episodeNumber: epNum,
        title: `Episode ${epNum}`,
        description: `Upcoming episode ${epNum} of ${
          currentContent.seriesTitle || currentContent.title
        }.`,
        duration: 2700,
        durationFormatted: '45m',
        videoUrl: currentContent.videoUrl || DEFAULT_MOCK_VIDEO_URL,
        image: currentContent.image,
        badge: `EPISODE ${epNum}`,
        rating: currentContent.rating,
        maturityRating: currentContent.maturityRating,
        genre: currentContent.genre,
      });
    }
    return upcomingList;
  }

  // 4. Single explicit nextEpisode fallback
  if (currentContent.nextEpisode) {
    return [currentContent.nextEpisode];
  }

  // 5. Fallback for non-live content
  const fallbackNext = getNextEpisodeForContent(
    currentContent,
    currentEpisodeId,
  );
  if (fallbackNext) {
    return [fallbackNext];
  }

  return [];
}

/**
 * Returns all episodes available for the current content / series.
 */
export function getAllEpisodesForContent(
  currentContent: any,
  currentEpisodeId?: string,
): EpisodeItem[] {
  if (!currentContent) {
    return [];
  }

  if (currentContent.isLive) {
    return [];
  }

  if (
    Array.isArray(currentContent.episodes) &&
    currentContent.episodes.length > 0
  ) {
    return currentContent.episodes as EpisodeItem[];
  }

  const contentId = currentEpisodeId || currentContent.id;
  const contentTitle = currentContent.title;
  const episodes = getEpisodesForContent(contentId, contentTitle);
  if (episodes && episodes.length > 0) {
    return episodes;
  }

  const nextEpisodes = getNextEpisodesForContent(
    currentContent,
    currentEpisodeId,
  );
  if (nextEpisodes && nextEpisodes.length > 0) {
    return [
      {
        id: currentContent.id || 'current-episode',
        seriesId: currentContent.seriesId || 'series-current',
        seriesTitle: currentContent.seriesTitle || currentContent.title,
        seasonNumber: currentContent.seasonNumber || 1,
        episodeNumber: currentContent.episodeNumber || 1,
        title: currentContent.title || 'Current Episode',
        description: currentContent.description,
        duration: currentContent.duration || 2700,
        durationFormatted: currentContent.durationFormatted || '45m',
        videoUrl: currentContent.videoUrl || DEFAULT_MOCK_VIDEO_URL,
        image: currentContent.image,
        badge: currentContent.badge || 'CURRENT',
        rating: currentContent.rating,
        maturityRating: currentContent.maturityRating,
        genre: currentContent.genre,
      },
      ...nextEpisodes,
    ];
  }

  return [];
}
