import {homeContentRows, homeHeroSlides, HomeContentItem} from '../data/home';

export const DEEPLINK_PREFIX = 'logixstream://';

export const DeeplinkRoutes = {
  Home: 'home',
  Movies: 'movies',
  LiveTV: 'live-tv',
  Search: 'search',
  Details: 'movie',
  Player: 'play',
  Profile: 'profile',
  Profiles: 'profiles',
  Settings: 'settings',
  MyList: 'my-list',
} as const;

export const findContentById = (contentId?: string): HomeContentItem | null => {
  if (!contentId) {
    return null;
  }

  const allItems = [
    ...homeHeroSlides.map((slide) => ({
      id: slide.id,
      maturityRating: slide.maturityRating,
      title: slide.title,
      image: slide.image,
      badge: slide.badge,
      rating: slide.rating,
      genre: slide.genre,
      cast: slide.cast,
      director: slide.director,
      videoUrl: slide.videoUrl,
      description: slide.description,
      meta: slide.meta,
      seekbarType: slide.seekbarType,
      thumbnails: slide.thumbnails,
    })),
    ...homeContentRows.flatMap((row) => row.items),
  ];

  return allItems.find((item) => item.id === contentId) || null;
};

export const buildDeeplinkUrl = (path: string) =>
  `${DEEPLINK_PREFIX}${path.replace(/^\/+/, '')}`;

export const buildVideoDeeplinkUrl = ({
  movieId,
  seek,
}: {
  movieId: string;
  seek?: number;
}) => {
  const searchParams =
    typeof seek === 'number' && Number.isFinite(seek) && seek > 0
      ? `?seek=${Math.floor(seek)}`
      : '';
  return buildDeeplinkUrl(`${DeeplinkRoutes.Player}/${movieId}${searchParams}`);
};
