import {ContentMaturityRating} from '../types/maturity';
import {ImageSourcePropType} from 'react-native';

export type CardLayoutType = 'horizontal' | 'portrait' | 'grid';

export const WORKING_VIDEO_URLS = [
  'https://vjs.zencdn.net/v/oceans.mp4',
  'https://media.w3.org/2010/05/sintel/trailer.mp4',
  'https://media.w3.org/2010/05/bunny/trailer.mp4',
  'https://media.w3.org/2010/05/video/movie_300.mp4',
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
];

export const DEFAULT_MOCK_VIDEO_URL = WORKING_VIDEO_URLS[0];

export interface HomeContentItem {
  id: string;
  maturityRating?: ContentMaturityRating;
  title: string;
  image: ImageSourcePropType;
  progress?: number;
  badge?: string;
  description?: string;
  meta?: string[];
  rating?: string;
  genre?: string;
  cast?: string;
  director?: string;
  videoUrl?: string;
}

export interface HomeContentRow {
  id: string;
  title: string;
  layout?: CardLayoutType;
  items: HomeContentItem[];
}

export interface HeroSlide {
  id: string;
  maturityRating?: ContentMaturityRating;
  eyebrow?: string;
  title: string;
  description: string;
  meta?: string[];
  image: ImageSourcePropType;
  badge?: string;
  rating?: string;
  genre?: string;
  cast?: string;
  director?: string;
  videoUrl?: string;
}

export const homeHeroSlides: HeroSlide[] = [
  {
    id: 'the-lion-king-hero',
    eyebrow: 'DISNEY CLASSIC • KIDS SPECIAL',
    title: 'The Lion King',
    maturityRating: 'KIDS',
    description:
      'A young lion prince flees his kingdom only to learn the true meaning of responsibility and bravery.',
    meta: ['2019', 'ENGLISH', '1h 58m', '4K UHD', 'IMDb 6.9', 'KIDS'],
    image: {
      uri: 'https://image.tmdb.org/t/p/w1280/sKCr78MXSLixwmZ8DyJLrpMsd15.jpg',
    },
    badge: 'KIDS FAVORITE',
    rating: '⭐ 7.7 / 10',
    genre: 'Animation • Adventure • Family',
    director: 'Jon Favreau',
    cast: 'Donald Glover, Beyoncé, Seth Rogen, Chiwetel Ejiofor',
    videoUrl:
      'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    id: 'horizon',
    eyebrow: 'TELUGU SUPERHIT • RRR',
    title: 'The Last Horizon',
    maturityRating: '13_PLUS',
    description:
      'A fearless revolutionary and a dedicated officer in British India form an unshakeable bond to battle colonial tyranny.',
    meta: ['2022', 'TELUGU', '3h 07m', '4K UHD', 'IMDb 7.9', 'OSCAR WINNER'],
    image: {
      uri: 'https://image.tmdb.org/t/p/w1280/u0XUBNQWlOvrh0Gd97ARGpIkL0.jpg',
    },
    badge: 'OSCAR WINNER',
    rating: '⭐ 7.9 / 10',
    genre: 'Action • Drama • Historical',
    director: 'S. S. Rajamouli',
    cast: 'N. T. Rama Rao Jr., Ram Charan, Ajay Devgn, Alia Bhatt',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
  },
  {
    id: 'kalki',
    eyebrow: 'TELUGU SCI-FI EPIC',
    title: 'Kalki 2898 AD',
    maturityRating: '13_PLUS',
    description:
      'In a post-apocalyptic dystopian world, a heroic warrior awakens to protect the unborn savior of mankind.',
    meta: ['2024', 'TELUGU', '3h 01m', '4K UHD', 'IMDb 7.7'],
    image: {
      uri: 'https://image.tmdb.org/t/p/w1280/rstcAnBeCkxNQjNp3YXrF6IP1tW.jpg',
    },
    badge: 'TELUGU BLOCKBUSTER',
    rating: '⭐ 7.7 / 10',
    genre: 'Sci-Fi • Action • Mythology',
    director: 'Nag Ashwin',
    cast: 'Prabhas, Amitabh Bachchan, Kamal Haasan, Deepika Padukone',
    videoUrl:
      'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    id: 'kgf-2',
    eyebrow: 'KANNADA MEGAHIT',
    title: 'K.G.F: Chapter 2',
    maturityRating: '16_PLUS',
    description:
      'Rocky rules over Kolar Gold Fields, striking terror into his enemies while fighting off government and criminal forces.',
    meta: ['2022', 'KANNADA', '2h 48m', 'HDR10', 'IMDb 8.3'],
    image: {
      uri: 'https://image.tmdb.org/t/p/w1280/khNVygolU0TxLIDWff5tQlAhZ23.jpg',
    },
    badge: 'KANNADA HIT',
    rating: '⭐ 8.3 / 10',
    genre: 'Action • Crime • Drama',
    director: 'Prashanth Neel',
    cast: 'Yash, Sanjay Dutt, Raveena Tandon, Srinidhi Shetty',
    videoUrl:
      'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    id: 'jawan',
    eyebrow: 'HINDI ACTION THRILLER',
    title: 'Jawan',
    maturityRating: '13_PLUS',
    description:
      'A vigilante commander leads a team of women in daring missions to expose high-level corruption and fight for justice.',
    meta: ['2023', 'HINDI', '2h 49m', '4K UHD', 'IMDb 7.0'],
    image: {
      uri: 'https://image.tmdb.org/t/p/w1280/jFt1gS4BGHlK8xt76Y81Alp4dbt.jpg',
    },
    badge: 'HINDI BLOCKBUSTER',
    rating: '⭐ 7.0 / 10',
    genre: 'Action • Thriller • Drama',
    director: 'Atlee',
    cast: 'Shah Rukh Khan, Nayanthara, Vijay Sethupathi, Deepika Padukone',
    videoUrl:
      'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    id: 'interstellar',
    eyebrow: 'ENGLISH SCI-FI MASTERPIECE',
    title: 'Interstellar',
    maturityRating: '13_PLUS',
    description:
      'When Earth becomes uninhabitable, a pilot and researchers travel through a wormhole in space to find a new home.',
    meta: ['2014', 'ENGLISH', '2h 49m', 'Dolby Vision', 'IMDb 8.7'],
    image: {
      uri: 'https://image.tmdb.org/t/p/w1280/yQvGrMoipbRoddT0ZR8tPoR7NfX.jpg',
    },
    badge: 'ENGLISH CLASSIC',
    rating: '⭐ 8.7 / 10',
    genre: 'Sci-Fi • Adventure • Drama',
    director: 'Christopher Nolan',
    cast: 'Matthew McConaughey, Anne Hathaway, Jessica Chastain, Michael Caine',
    videoUrl:
      'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
];

export const homeHero = homeHeroSlides[0];

export const homeContentRows: HomeContentRow[] = [
  {
    id: 'continue-watching',
    title: 'Continue Watching',
    layout: 'horizontal',
    items: [
      {
        id: 'horizon',
        title: 'RRR',
        maturityRating: '13_PLUS',
        description:
          'RRR - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/tjpiEnZBUAA8pdNPRKa5vP2Zpqw.jpg',
        },
        progress: 0.2,
        badge: 'TELUGU',
        rating: '⭐ 7.5 / 10',
        genre: 'Action • Thriller',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'continue-watching-2',
        title: 'Pushpa: The Rise',
        maturityRating: '13_PLUS',
        description:
          'Pushpa: The Rise - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/w2RG8J3um9F3eggUeJVuuAI0RFk.jpg',
        },
        progress: 0.24000000000000002,
        badge: 'ENGLISH',
        rating: '⭐ 7.6 / 10',
        genre: 'Drama • Sci-Fi',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'continue-watching-3',
        title: 'Jawan',
        maturityRating: '13_PLUS',
        description:
          'Jawan - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/jFt1gS4BGHlK8xt76Y81Alp4dbt.jpg',
        },
        progress: 0.28,
        badge: 'TELUGU',
        rating: '⭐ 7.7 / 10',
        genre: 'Action • Thriller',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'continue-watching-4',
        title: 'Kantara',
        maturityRating: '13_PLUS',
        description:
          'Kantara - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/9kZSZlmj0nxxYvrBhKcs615xUIL.jpg',
        },
        progress: 0.32,
        badge: 'ENGLISH',
        rating: '⭐ 7.8 / 10',
        genre: 'Drama • Sci-Fi',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'continue-watching-5',
        title: 'Inception',
        maturityRating: '13_PLUS',
        description:
          'Inception - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/xlaY2zyzMfkhk0HSC5VUwzoZPU1.jpg',
        },
        progress: 0.36,
        badge: 'TELUGU',
        rating: '⭐ 7.9 / 10',
        genre: 'Action • Thriller',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'continue-watching-6',
        title: 'Kalki 2898 AD',
        maturityRating: '13_PLUS',
        description:
          'Kalki 2898 AD - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/rstcAnBeCkxNQjNp3YXrF6IP1tW.jpg',
        },
        progress: 0.4,
        badge: 'ENGLISH',
        rating: '⭐ 8.0 / 10',
        genre: 'Drama • Sci-Fi',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'continue-watching-7',
        title: 'K.G.F: Chapter 2',
        maturityRating: '16_PLUS',
        description:
          'K.G.F: Chapter 2 - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/khNVygolU0TxLIDWff5tQlAhZ23.jpg',
        },
        progress: 0.44,
        badge: 'TELUGU',
        rating: '⭐ 8.1 / 10',
        genre: 'Action • Thriller',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'continue-watching-8',
        title: 'Baahubali 2: The Conclusion',
        maturityRating: '13_PLUS',
        description:
          'Baahubali 2: The Conclusion - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/sXf30F2HFpsFPXlNz7jpOySSV9I.jpg',
        },
        progress: 0.48000000000000004,
        badge: 'ENGLISH',
        rating: '⭐ 8.2 / 10',
        genre: 'Drama • Sci-Fi',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'continue-watching-9',
        title: 'Salaar',
        maturityRating: '13_PLUS',
        description:
          'Salaar - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/hD0iBcmNIbXLVle5NoCnKF1hpQo.jpg',
        },
        progress: 0.52,
        badge: 'TELUGU',
        rating: '⭐ 8.3 / 10',
        genre: 'Action • Thriller',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'continue-watching-10',
        title: 'Devara',
        maturityRating: '13_PLUS',
        description:
          'Devara - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/lQfuaXjANoTsdx5iS0gCXlK9D2L.jpg',
        },
        progress: 0.56,
        badge: 'ENGLISH',
        rating: '⭐ 8.4 / 10',
        genre: 'Drama • Sci-Fi',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'continue-watching-11',
        title: 'HanuMan',
        maturityRating: '7_PLUS',
        description:
          'HanuMan - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/Awj3a9EGjNGrEFAQ9iBmF6gBnJ9.jpg',
        },
        progress: 0.6000000000000001,
        badge: 'TELUGU',
        rating: '⭐ 8.5 / 10',
        genre: 'Action • Thriller',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'continue-watching-12',
        title: 'Pathaan',
        maturityRating: '13_PLUS',
        description:
          'Pathaan - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/arf00BkwvXo0CFKbaD9OpqdE4Nu.jpg',
        },
        progress: 0.64,
        badge: 'ENGLISH',
        rating: '⭐ 8.6 / 10',
        genre: 'Drama • Sci-Fi',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'continue-watching-13',
        title: 'Dangal',
        maturityRating: 'ALL',
        description:
          'Dangal - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/cJRPOLEexI7qp2DKtFfCh7YaaUG.jpg',
        },
        progress: 0.6799999999999999,
        badge: 'TELUGU',
        rating: '⭐ 8.7 / 10',
        genre: 'Action • Thriller',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'continue-watching-14',
        title: 'Brahmastra',
        maturityRating: '13_PLUS',
        description:
          'Brahmastra - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/mxJxyHoc8OqYK1f7YtbhRTLOl0k.jpg',
        },
        progress: 0.72,
        badge: 'ENGLISH',
        rating: '⭐ 8.8 / 10',
        genre: 'Drama • Sci-Fi',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'continue-watching-15',
        title: 'Stree 2',
        maturityRating: '13_PLUS',
        description:
          'Stree 2 - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/2NC7sj8rheKxWqLYAbHnCa4mYBH.jpg',
        },
        progress: 0.76,
        badge: 'TELUGU',
        rating: '⭐ 8.9 / 10',
        genre: 'Action • Thriller',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'continue-watching-16',
        title: '3 Idiots',
        maturityRating: 'ALL',
        description:
          '3 Idiots - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/gmSRHU1Wtiatj8KoyVt8rT9ockx.jpg',
        },
        progress: 0.8,
        badge: 'ENGLISH',
        rating: '⭐ 7.5 / 10',
        genre: 'Drama • Sci-Fi',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'continue-watching-17',
        title: '777 Charlie',
        maturityRating: 'KIDS',
        description:
          '777 Charlie - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/672ObvXhKf4LH8LFBE4QiqQu2TL.jpg',
        },
        progress: 0.8400000000000001,
        badge: 'TELUGU',
        rating: '⭐ 7.6 / 10',
        genre: 'Action • Thriller',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'continue-watching-18',
        title: 'Vikrant Rona',
        maturityRating: '13_PLUS',
        description:
          'Vikrant Rona - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/5Asi3kN5sCzNyN0V9VkjD99fA1J.jpg',
        },
        progress: 0.8800000000000001,
        badge: 'ENGLISH',
        rating: '⭐ 7.7 / 10',
        genre: 'Drama • Sci-Fi',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'continue-watching-19',
        title: 'Kabzaa',
        maturityRating: '16_PLUS',
        description:
          'Kabzaa - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/w42lRSLlnwc3WJG8bUG8YDxabcb.jpg',
        },
        progress: 0.22000000000000003,
        badge: 'TELUGU',
        rating: '⭐ 7.8 / 10',
        genre: 'Action • Thriller',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'continue-watching-20',
        title: 'Interstellar',
        maturityRating: '13_PLUS',
        description:
          'Interstellar - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/yQvGrMoipbRoddT0ZR8tPoR7NfX.jpg',
        },
        progress: 0.26000000000000006,
        badge: 'ENGLISH',
        rating: '⭐ 7.9 / 10',
        genre: 'Drama • Sci-Fi',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
    ],
  },
  {
    id: 'trending',
    title: 'Trending Now',
    layout: 'portrait',
    items: [
      {
        id: 'summit',
        title: 'The Dark Knight',
        maturityRating: '13_PLUS',
        description:
          'The Dark Knight - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
        },
        badge: 'SUPERHIT',
        rating: '⭐ 7.5 / 10',
        genre: 'Action • Thriller',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'trending-2',
        title: 'Avatar: The Way of Water',
        maturityRating: '13_PLUS',
        description:
          'Avatar: The Way of Water - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/qnzQm0PCVnSyv1dqpVmRgMWHbLD.jpg',
        },
        badge: 'TRENDING',
        rating: '⭐ 7.6 / 10',
        genre: 'Drama • Sci-Fi',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'trending-3',
        title: 'Dune: Part Two',
        maturityRating: '13_PLUS',
        description:
          'Dune: Part Two - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/3HzGtM0JpfH2pWFGugJK22LRP6b.jpg',
        },
        badge: 'SUPERHIT',
        rating: '⭐ 7.7 / 10',
        genre: 'Action • Thriller',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'trending-4',
        title: 'Oppenheimer',
        maturityRating: '16_PLUS',
        description:
          'Oppenheimer - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
        },
        badge: 'TRENDING',
        rating: '⭐ 7.8 / 10',
        genre: 'Drama • Sci-Fi',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'trending-5',
        title: 'Avengers: Endgame',
        maturityRating: '13_PLUS',
        description:
          'Avengers: Endgame - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/ulzhLuWrPK07P1YkdWQLZnQh1JL.jpg',
        },
        badge: 'SUPERHIT',
        rating: '⭐ 7.9 / 10',
        genre: 'Action • Thriller',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'trending-6',
        title: 'Spiderman: No Way Home',
        maturityRating: '13_PLUS',
        description:
          'Spiderman: No Way Home - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/tJ44EffQBBUMc61xa8QDz0oijQT.jpg',
        },
        badge: 'TRENDING',
        rating: '⭐ 8.0 / 10',
        genre: 'Drama • Sci-Fi',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'trending-7',
        title: 'Gladiator',
        maturityRating: '16_PLUS',
        description:
          'Gladiator - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/wN2xWp1eIwCKOD0BHTcErTBv1Uq.jpg',
        },
        badge: 'SUPERHIT',
        rating: '⭐ 8.1 / 10',
        genre: 'Action • Thriller',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'trending-8',
        title: 'Titanic',
        maturityRating: '13_PLUS',
        description:
          'Titanic - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg',
        },
        badge: 'TRENDING',
        rating: '⭐ 8.2 / 10',
        genre: 'Drama • Sci-Fi',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'trending-9',
        title: 'The Matrix',
        maturityRating: '16_PLUS',
        description:
          'The Matrix - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg',
        },
        badge: 'SUPERHIT',
        rating: '⭐ 8.3 / 10',
        genre: 'Action • Thriller',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'trending-10',
        title: 'Fight Club',
        maturityRating: '18_PLUS',
        description:
          'Fight Club - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/jSziioSwPVrOy9Yow3XhWIBDjq1.jpg',
        },
        badge: 'TRENDING',
        rating: '⭐ 8.4 / 10',
        genre: 'Drama • Sci-Fi',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'trending-11',
        title: 'Pulp Fiction',
        maturityRating: '18_PLUS',
        description:
          'Pulp Fiction - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/vQWk5YBFWF4bZaofAbv0tShwBvQ.jpg',
        },
        badge: 'SUPERHIT',
        rating: '⭐ 8.5 / 10',
        genre: 'Action • Thriller',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'trending-12',
        title: 'Forrest Gump',
        maturityRating: '13_PLUS',
        description:
          'Forrest Gump - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/Cw4hIUIAmSYfK9QfaUW5igp9La.jpg',
        },
        badge: 'TRENDING',
        rating: '⭐ 8.6 / 10',
        genre: 'Drama • Sci-Fi',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'trending-13',
        title: 'The Godfather',
        maturityRating: '18_PLUS',
        description:
          'The Godfather - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/wWJbBo5yjw22AIjE8isBFoiBI3S.jpg',
        },
        badge: 'SUPERHIT',
        rating: '⭐ 8.7 / 10',
        genre: 'Action • Thriller',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'trending-14',
        title: 'The Shawshank Redemption',
        maturityRating: '16_PLUS',
        description:
          'The Shawshank Redemption - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg',
        },
        badge: 'TRENDING',
        rating: '⭐ 8.8 / 10',
        genre: 'Drama • Sci-Fi',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'trending-15',
        title: 'Jurassic Park',
        maturityRating: '13_PLUS',
        description:
          'Jurassic Park - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/4vaXzwsRtyRA7cGNFevFA2pTocv.jpg',
        },
        badge: 'SUPERHIT',
        rating: '⭐ 8.9 / 10',
        genre: 'Action • Thriller',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'trending-16',
        title: 'Top Gun: Maverick',
        maturityRating: '13_PLUS',
        description:
          'Top Gun: Maverick - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/n0YuM4f5lvGAP6MAW2kBIzugXnc.jpg',
        },
        badge: 'TRENDING',
        rating: '⭐ 7.5 / 10',
        genre: 'Drama • Sci-Fi',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'trending-17',
        title: 'Spider-Man: Across the Spider-Verse',
        maturityRating: '7_PLUS',
        description:
          'Spider-Man: Across the Spider-Verse - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
        },
        badge: 'SUPERHIT',
        rating: '⭐ 7.6 / 10',
        genre: 'Action • Thriller',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'trending-18',
        title: 'The Lion King',
        maturityRating: 'KIDS',
        description:
          'The Lion King - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/sKCr78MXSLixwmZ8DyJLrpMsd15.jpg',
        },
        badge: 'TRENDING',
        rating: '⭐ 7.7 / 10',
        genre: 'Drama • Sci-Fi',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'trending-19',
        title: 'Black Panther',
        maturityRating: '13_PLUS',
        description:
          'Black Panther - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/5WRGN4lwJf7xrewfqY6I5aUmlEI.jpg',
        },
        badge: 'SUPERHIT',
        rating: '⭐ 7.8 / 10',
        genre: 'Action • Thriller',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'trending-20',
        title: 'Doctor Strange',
        maturityRating: '13_PLUS',
        description:
          'Doctor Strange - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/xf8PbyQcR5ucXErmZNzdKR0s8ya.jpg',
        },
        badge: 'TRENDING',
        rating: '⭐ 7.9 / 10',
        genre: 'Drama • Sci-Fi',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
    ],
  },
  {
    id: 'telugu-blockbusters',
    title: 'Trending Telugu Blockbusters (తెలుగు)',
    layout: 'portrait',
    items: [
      {
        id: 'telugu-blockbusters-1',
        title: 'Baahubali: The Beginning',
        maturityRating: '13_PLUS',
        description:
          'Baahubali: The Beginning - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/9BAjt8nSSms62uOVYn1t3C3dVto.jpg',
        },
        badge: 'TELUGU',
        rating: '⭐ 7.5 / 10',
        genre: 'Action • Thriller',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'telugu-blockbusters-2',
        title: 'Magadheera',
        maturityRating: '13_PLUS',
        description:
          'Magadheera - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/xK7MEV56GF291VG0U5XnVJuvNv3.jpg',
        },
        badge: 'TELUGU',
        rating: '⭐ 7.6 / 10',
        genre: 'Drama • Sci-Fi',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'telugu-blockbusters-4',
        title: 'Ala Vaikunthapurramuloo',
        maturityRating: '13_PLUS',
        description:
          'Ala Vaikunthapurramuloo - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/aWTQLqS5bdxeusr6mMBhH9TNJ1n.jpg',
        },
        badge: 'TELUGU',
        rating: '⭐ 7.7 / 10',
        genre: 'Action • Thriller',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'telugu-blockbusters-5',
        title: 'Sarileru Neekevvaru',
        maturityRating: '13_PLUS',
        description:
          'Sarileru Neekevvaru - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/66MSawKC7nkqjD1BMlQHXl6y3C.jpg',
        },
        badge: 'TELUGU',
        rating: '⭐ 7.8 / 10',
        genre: 'Drama • Sci-Fi',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'telugu-blockbusters-6',
        title: 'Pushpa 2: The Rule',
        maturityRating: '16_PLUS',
        description:
          'Pushpa 2: The Rule - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/xkYGdKuK8jfqvGNCZV1uNdYkIfS.jpg',
        },
        badge: 'TELUGU',
        rating: '⭐ 7.9 / 10',
        genre: 'Action • Thriller',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'telugu-blockbusters-7',
        title: 'Guntur Kaaram',
        maturityRating: '13_PLUS',
        description:
          'Guntur Kaaram - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/qvBt4YLy274ZmoMAfVlwmHkjVkq.jpg',
        },
        badge: 'TELUGU',
        rating: '⭐ 8.0 / 10',
        genre: 'Drama • Sci-Fi',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'telugu-blockbusters-8',
        title: 'Sita Ramam',
        maturityRating: '13_PLUS',
        description:
          'Sita Ramam - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/t1O94ZBzsQXJihtVkrsStRLyUDR.jpg',
        },
        badge: 'TELUGU',
        rating: '⭐ 8.1 / 10',
        genre: 'Action • Thriller',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'telugu-blockbusters-9',
        title: 'Dasara',
        maturityRating: '16_PLUS',
        description:
          'Dasara - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/4OTVoCVXa5aHDZl8opKoIV9Ezr5.jpg',
        },
        badge: 'TELUGU',
        rating: '⭐ 8.2 / 10',
        genre: 'Drama • Sci-Fi',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'telugu-blockbusters-10',
        title: 'Baby 2023',
        maturityRating: '18_PLUS',
        description:
          'Baby 2023 - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/defNhSbEQnZ0PuYQqF2Umbd7nHg.jpg',
        },
        badge: 'TELUGU',
        rating: '⭐ 8.3 / 10',
        genre: 'Action • Thriller',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'telugu-blockbusters-11',
        title: 'Hi Nanna',
        maturityRating: '7_PLUS',
        description:
          'Hi Nanna - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/hhMLtq9m1aK0dpY9Wcq26XeDH2z.jpg',
        },
        badge: 'TELUGU',
        rating: '⭐ 8.4 / 10',
        genre: 'Drama • Sci-Fi',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'telugu-blockbusters-12',
        title: 'Tillu Square',
        maturityRating: '16_PLUS',
        description:
          'Tillu Square - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/unRseguQgs9YQbzSHTZKIE3qXa7.jpg',
        },
        badge: 'TELUGU',
        rating: '⭐ 8.5 / 10',
        genre: 'Action • Thriller',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'telugu-blockbusters-13',
        title: 'Major',
        maturityRating: '13_PLUS',
        description:
          'Major - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/iUMwMeRI3nhbXzUsJhdp5col6oi.jpg',
        },
        badge: 'TELUGU',
        rating: '⭐ 8.6 / 10',
        genre: 'Drama • Sci-Fi',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'telugu-blockbusters-14',
        title: 'DJ Tillu',
        maturityRating: '16_PLUS',
        description:
          'DJ Tillu - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/2XKg3VhpFDXdAktwKvFMSuIneE3.jpg',
        },
        badge: 'TELUGU',
        rating: '⭐ 8.7 / 10',
        genre: 'Action • Thriller',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'telugu-blockbusters-15',
        title: 'Bheemla Nayak',
        maturityRating: '13_PLUS',
        description:
          'Bheemla Nayak - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/14KeWSkgzTbfJmmD4bXT9mwkaYz.jpg',
        },
        badge: 'TELUGU',
        rating: '⭐ 8.8 / 10',
        genre: 'Drama • Sci-Fi',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'telugu-blockbusters-16',
        title: 'Akhanda',
        maturityRating: '13_PLUS',
        description:
          'Akhanda - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/2WcKS34CTbJ9PdFiQ3QzgA4hp3G.jpg',
        },
        badge: 'TELUGU',
        rating: '⭐ 8.9 / 10',
        genre: 'Action • Thriller',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'telugu-blockbusters-17',
        title: 'Waltair Veerayya',
        maturityRating: '13_PLUS',
        description:
          'Waltair Veerayya - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/phZS1ofnk382L7BiE8qi8S5slr3.jpg',
        },
        badge: 'TELUGU',
        rating: '⭐ 7.5 / 10',
        genre: 'Drama • Sci-Fi',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'telugu-blockbusters-18',
        title: 'Veera Simha Reddy',
        maturityRating: '13_PLUS',
        description:
          'Veera Simha Reddy - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/4xBFmIiIqbzEes6Nnh27Q1jOKBa.jpg',
        },
        badge: 'TELUGU',
        rating: '⭐ 7.6 / 10',
        genre: 'Action • Thriller',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'telugu-blockbusters-19',
        title: 'Geetha Govindam',
        maturityRating: '13_PLUS',
        description:
          'Geetha Govindam - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/sTreb0ajewXqeIqAyZ0IWtafoB5.jpg',
        },
        badge: 'TELUGU',
        rating: '⭐ 7.7 / 10',
        genre: 'Drama • Sci-Fi',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'telugu-blockbusters-20',
        title: 'Arjun Reddy',
        maturityRating: '18_PLUS',
        description:
          'Arjun Reddy - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/kHubDgL59I5hCn7ccBYvU7bKY1r.jpg',
        },
        badge: 'TELUGU',
        rating: '⭐ 7.8 / 10',
        genre: 'Action • Thriller',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
    ],
  },
  {
    id: 'hindi-cinema',
    title: 'Popular Hindi Cinema (हिंदी)',
    layout: 'grid',
    items: [
      {
        id: 'hindi-cinema-1',
        title: 'Animal 2023',
        maturityRating: '18_PLUS',
        description:
          'Animal 2023 - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/mWjgnkjyfNxxdfNwc8YmObGCZGf.jpg',
        },
        badge: 'HINDI',
        rating: '⭐ 7.5 / 10',
        genre: 'Action • Thriller',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'hindi-cinema-2',
        title: 'Gadar 2',
        maturityRating: '13_PLUS',
        description:
          'Gadar 2 - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/ipoUI3FzVTczg2r8mYxNlE5SsMh.jpg',
        },
        badge: 'HINDI',
        rating: '⭐ 7.6 / 10',
        genre: 'Drama • Sci-Fi',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'hindi-cinema-3',
        title: '12th Fail',
        maturityRating: 'ALL',
        description:
          '12th Fail - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/u7BeOSx3bkXkFNlMg8Ik5h5Jpl8.jpg',
        },
        badge: 'HINDI',
        rating: '⭐ 7.7 / 10',
        genre: 'Action • Thriller',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'hindi-cinema-4',
        title: 'Bhool Bhulaiyaa 2',
        maturityRating: '13_PLUS',
        description:
          'Bhool Bhulaiyaa 2 - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/txQHSmrYFQWLR2rjZvtsMM1X9av.jpg',
        },
        badge: 'HINDI',
        rating: '⭐ 7.8 / 10',
        genre: 'Drama • Sci-Fi',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'hindi-cinema-5',
        title: 'Drishyam 2',
        maturityRating: '13_PLUS',
        description:
          'Drishyam 2 - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/8RJBCUGE27LX06tAES4jTELN0KA.jpg',
        },
        badge: 'HINDI',
        rating: '⭐ 7.9 / 10',
        genre: 'Action • Thriller',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'hindi-cinema-6',
        title: 'War 2019',
        maturityRating: '13_PLUS',
        description:
          'War 2019 - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/aY2vDrUiqVQTfhodnGpePLbgPgs.jpg',
        },
        badge: 'HINDI',
        rating: '⭐ 8.0 / 10',
        genre: 'Drama • Sci-Fi',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'hindi-cinema-7',
        title: 'Kabir Singh',
        maturityRating: '18_PLUS',
        description:
          'Kabir Singh - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/unqiPjtc6CGqs13zho7ZvWU85zu.jpg',
        },
        badge: 'HINDI',
        rating: '⭐ 8.1 / 10',
        genre: 'Action • Thriller',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'hindi-cinema-8',
        title: 'Sanju',
        maturityRating: '16_PLUS',
        description:
          'Sanju - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/q1wkN4VQuBTj1AeyTLLz2w6awMA.jpg',
        },
        badge: 'HINDI',
        rating: '⭐ 8.2 / 10',
        genre: 'Drama • Sci-Fi',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'hindi-cinema-9',
        title: 'PK',
        maturityRating: 'ALL',
        description:
          'PK - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/i9V1uuUzJFPjdXOg6knfHci8Mha.jpg',
        },
        badge: 'HINDI',
        rating: '⭐ 8.3 / 10',
        genre: 'Action • Thriller',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'hindi-cinema-10',
        title: 'Bajrangi Bhaijaan',
        maturityRating: '7_PLUS',
        description:
          'Bajrangi Bhaijaan - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/vhlliI7HZZlWfo5d6CiyfBAGLrW.jpg',
        },
        badge: 'HINDI',
        rating: '⭐ 8.4 / 10',
        genre: 'Drama • Sci-Fi',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'hindi-cinema-11',
        title: 'Sultan',
        maturityRating: '13_PLUS',
        description:
          'Sultan - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/oDELdOgQuGW0L80MCPpdV9gID7L.jpg',
        },
        badge: 'HINDI',
        rating: '⭐ 8.5 / 10',
        genre: 'Action • Thriller',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'hindi-cinema-12',
        title: 'Padmaavat',
        maturityRating: '13_PLUS',
        description:
          'Padmaavat - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/5kk71s8Vmvt8XQOojevhTA5QcB0.jpg',
        },
        badge: 'HINDI',
        rating: '⭐ 8.6 / 10',
        genre: 'Drama • Sci-Fi',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'hindi-cinema-13',
        title: 'Chhichhore',
        maturityRating: '13_PLUS',
        description:
          'Chhichhore - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/56snL7jpuKS80WBSXJCg59XdvM3.jpg',
        },
        badge: 'HINDI',
        rating: '⭐ 8.7 / 10',
        genre: 'Action • Thriller',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'hindi-cinema-14',
        title: 'Uri: The Surgical Strike',
        maturityRating: '16_PLUS',
        description:
          'Uri: The Surgical Strike - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/yNySAgpAnWmPpYinim9E0tUzJWG.jpg',
        },
        badge: 'HINDI',
        rating: '⭐ 8.8 / 10',
        genre: 'Drama • Sci-Fi',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'hindi-cinema-15',
        title: 'Andhadhun',
        maturityRating: '16_PLUS',
        description:
          'Andhadhun - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/dy3K6hNvwE05siGgiLJcEiwgpdO.jpg',
        },
        badge: 'HINDI',
        rating: '⭐ 8.9 / 10',
        genre: 'Action • Thriller',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'hindi-cinema-16',
        title: 'Tumbbad',
        maturityRating: '18_PLUS',
        description:
          'Tumbbad - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/z1xOCxw780WFJC5uCTMfCkQ4Agi.jpg',
        },
        badge: 'HINDI',
        rating: '⭐ 7.5 / 10',
        genre: 'Drama • Sci-Fi',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'hindi-cinema-17',
        title: 'Om Shanti Om',
        maturityRating: 'ALL',
        description:
          'Om Shanti Om - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/oArsQTD4bPPMtRjqr03SO9W6phF.jpg',
        },
        badge: 'HINDI',
        rating: '⭐ 7.6 / 10',
        genre: 'Action • Thriller',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'hindi-cinema-18',
        title: 'Zindagi Na Milegi Dobara',
        maturityRating: 'ALL',
        description:
          'Zindagi Na Milegi Dobara - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/hKO9O715wYxjkQSEv47giCYcyO8.jpg',
        },
        badge: 'HINDI',
        rating: '⭐ 7.7 / 10',
        genre: 'Drama • Sci-Fi',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'hindi-cinema-19',
        title: 'Dilwale Dulhania Le Jayenge',
        maturityRating: 'ALL',
        description:
          'Dilwale Dulhania Le Jayenge - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/2CAL2433ZeIihfX1Hb2139CX0pW.jpg',
        },
        badge: 'HINDI',
        rating: '⭐ 7.8 / 10',
        genre: 'Action • Thriller',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'hindi-cinema-20',
        title: 'Sholay',
        maturityRating: '13_PLUS',
        description:
          'Sholay - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/ya9bwgqA4eNl5bQ9QqS0jcmRoBS.jpg',
        },
        badge: 'HINDI',
        rating: '⭐ 7.9 / 10',
        genre: 'Drama • Sci-Fi',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
    ],
  },
  {
    id: 'global-blockbusters',
    title: 'Global English Hits',
    layout: 'horizontal',
    items: [
      {
        id: 'global-blockbusters-12',
        title: 'Pacific Rim',
        maturityRating: '13_PLUS',
        description:
          'Pacific Rim - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/8wo4eN8dWKaKlxhSvBz19uvj8gA.jpg',
        },
        badge: '4K UHD',
        rating: '⭐ 7.5 / 10',
        genre: 'Action • Thriller',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'global-blockbusters-13',
        title: 'Ready Player One',
        maturityRating: '13_PLUS',
        description:
          'Ready Player One - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/pU1ULUq8D3iRxl1fdX2lZIzdHuI.jpg',
        },
        badge: '4K UHD',
        rating: '⭐ 7.6 / 10',
        genre: 'Drama • Sci-Fi',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'global-blockbusters-14',
        title: 'Tron: Legacy',
        maturityRating: '7_PLUS',
        description:
          'Tron: Legacy - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/8Nc6R8k7bG8frSiDJo0oLucF7dN.jpg',
        },
        badge: '4K UHD',
        rating: '⭐ 7.7 / 10',
        genre: 'Action • Thriller',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'global-blockbusters-15',
        title: 'Oblivion 2013',
        maturityRating: '13_PLUS',
        description:
          'Oblivion 2013 - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/bYLM3GpNUZnoFElPXp1zlhDPdtv.jpg',
        },
        badge: '4K UHD',
        rating: '⭐ 7.8 / 10',
        genre: 'Drama • Sci-Fi',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'global-blockbusters-16',
        title: 'Prometheus',
        maturityRating: '18_PLUS',
        description:
          'Prometheus - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/qsYQflQhOuhDpQ0W2aOcwqgDAeI.jpg',
        },
        badge: '4K UHD',
        rating: '⭐ 7.9 / 10',
        genre: 'Action • Thriller',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'global-blockbusters-17',
        title: 'Avatar',
        maturityRating: '13_PLUS',
        description:
          'Avatar - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/lzZpWEaqzP0qVA5nkCc5ASbNcSy.jpg',
        },
        badge: '4K UHD',
        rating: '⭐ 8.0 / 10',
        genre: 'Drama • Sci-Fi',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'global-blockbusters-18',
        title: 'Guardians of the Galaxy',
        maturityRating: '13_PLUS',
        description:
          'Guardians of the Galaxy - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/r7vmZjiyZw9rpJMQJdXpjgiCOk9.jpg',
        },
        badge: '4K UHD',
        rating: '⭐ 8.1 / 10',
        genre: 'Action • Thriller',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'global-blockbusters-19',
        title: 'Thor: Ragnarok',
        maturityRating: '13_PLUS',
        description:
          'Thor: Ragnarok - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/rzRwTcFvttcN1ZpX2xv4j3tSdJu.jpg',
        },
        badge: '4K UHD',
        rating: '⭐ 8.2 / 10',
        genre: 'Drama • Sci-Fi',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
      {
        id: 'global-blockbusters-20',
        title: 'Iron Man 2008',
        maturityRating: '13_PLUS',
        description:
          'Iron Man 2008 - An extraordinary cinematic masterpiece featuring stellar performances, high-octane drama, and magnificent direction.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/78lPtwv72eTNqFW9COBYI0dWDJa.jpg',
        },
        badge: '4K UHD',
        rating: '⭐ 8.3 / 10',
        genre: 'Action • Thriller',
        director: 'Renowned Director',
        cast: 'Star Cast & Ensemble',
      },
    ],
  },
  {
    id: 'kids-family',
    title: 'Kids & Family Favorites (పిల్లల సినిమాలు)',
    layout: 'portrait',
    items: [
      {
        id: 'the-lion-king',
        title: 'The Lion King',
        maturityRating: 'KIDS',
        description:
          'A young lion prince flees his kingdom only to learn the true meaning of responsibility and bravery.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/sKCr78MXSLixwmZ8DyJLrpMsd15.jpg',
        },
        badge: 'KIDS FAVORITE',
        rating: '⭐ 7.7 / 10',
        genre: 'Animation • Adventure • Family',
        director: 'Jon Favreau',
        cast: 'Donald Glover, Beyoncé, Seth Rogen',
      },
      {
        id: 'frozen-2',
        title: 'Frozen II',
        maturityRating: 'KIDS',
        description:
          'Elsa, Anna, Kristoff, Olaf and Sven journey into the enchanted forest to discover the origin of Elsas magical powers.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/qdfGSpdaQJJ4be30aEZWNxXKiAc.jpg',
        },
        badge: 'DISNEY HIT',
        rating: '⭐ 7.5 / 10',
        genre: 'Animation • Adventure • Musical',
        director: 'Chris Buck, Jennifer Lee',
        cast: 'Kristen Bell, Idina Menzel, Josh Gad',
      },
      {
        id: 'moana',
        title: 'Moana',
        maturityRating: 'KIDS',
        description:
          'An adventurous teenager sails out on a daring mission to save her people, meeting the mighty demigod Maui along the way.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/4JeeYYAzvB4cb0Mrlp8lI5V7qP4.jpg',
        },
        badge: 'FAMILY FAVORITE',
        rating: '⭐ 7.8 / 10',
        genre: 'Animation • Adventure • Comedy',
        director: 'Ron Clements, John Musker',
        cast: 'Auliʻi Cravalho, Dwayne Johnson, Rachel House',
      },
      {
        id: 'finding-nemo',
        title: 'Finding Nemo',
        maturityRating: 'KIDS',
        description:
          'After his son is captured in the Great Barrier Reef and taken to Sydney, a timid clownfish embarks on a journey to bring him home.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/eHuGQ10FUzK1mdOY69Tu8osAQ7N.jpg',
        },
        badge: 'PIXAR CLASSIC',
        rating: '⭐ 8.2 / 10',
        genre: 'Animation • Adventure • Comedy',
        director: 'Andrew Stanton',
        cast: 'Albert Brooks, Ellen DeGeneres, Alexander Gould',
      },
      {
        id: 'spider-man-spider-verse',
        title: 'Spider-Man: Across the Spider-Verse',
        maturityRating: '7_PLUS',
        description:
          'Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence.',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
        },
        badge: 'ANIMATION HIT',
        rating: '⭐ 8.7 / 10',
        genre: 'Animation • Action • Sci-Fi',
        director: 'Joaquim Dos Santos, Kemp Powers',
        cast: 'Shameik Moore, Hailee Steinfeld, Oscar Isaac',
      },
    ],
  },
];

homeHeroSlides.forEach((slide, index) => {
  slide.videoUrl = WORKING_VIDEO_URLS[index % WORKING_VIDEO_URLS.length];
});

homeContentRows.forEach((row) => {
  row.items.forEach((item, index) => {
    if (!item.videoUrl) {
      item.videoUrl = WORKING_VIDEO_URLS[index % WORKING_VIDEO_URLS.length];
    }
  });
});
