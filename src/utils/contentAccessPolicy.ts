import {HeroSlide, HomeContentItem, HomeContentRow} from '../data/home';
import {UserProfile} from '../profiles/types/Profile';
import {
  ContentMaturityRating,
  DEFAULT_KIDS_MATURITY_LIMIT,
  MATURITY_LEVELS,
} from '../types/maturity';

export const isValidMaturityRating = (
  rating?: any,
): rating is ContentMaturityRating => {
  if (!rating || typeof rating !== 'string') {
    return false;
  }
  return Object.prototype.hasOwnProperty.call(MATURITY_LEVELS, rating);
};

export const getEffectiveKidsMaturityLimit = (
  profile?: UserProfile | null,
): ContentMaturityRating => {
  if (profile?.kidsMaturityLimit && isValidMaturityRating(profile.kidsMaturityLimit)) {
    return profile.kidsMaturityLimit;
  }
  return DEFAULT_KIDS_MATURITY_LIMIT;
};

export const canProfileAccessContent = (
  profile: UserProfile | null | undefined,
  content: {maturityRating?: ContentMaturityRating | string} | null | undefined,
): boolean => {
  if (!content) {
    return false;
  }

  // Adult profiles or unauthenticated/guest contexts without Kids restriction
  if (!profile || !profile.isKids) {
    return true;
  }

  // Kids profile: content MUST have a valid maturity rating
  if (!content.maturityRating || !isValidMaturityRating(content.maturityRating)) {
    // Unclassified content is blocked by default for Kids profiles
    return false;
  }

  const contentLevel = MATURITY_LEVELS[content.maturityRating];
  const maxAllowedLimit = getEffectiveKidsMaturityLimit(profile);
  const maxAllowedLevel = MATURITY_LEVELS[maxAllowedLimit];

  return contentLevel <= maxAllowedLevel;
};

export const filterContentForProfile = <
  T extends {maturityRating?: ContentMaturityRating | string}
>(
  profile: UserProfile | null | undefined,
  items: T[],
): T[] => {
  if (!items || !Array.isArray(items)) {
    return [];
  }
  return items.filter((item) => canProfileAccessContent(profile, item));
};

export const filterHeroSlidesForProfile = (
  profile: UserProfile | null | undefined,
  slides: HeroSlide[],
): HeroSlide[] => {
  if (!slides || !Array.isArray(slides)) {
    return [];
  }
  return slides.filter((slide) => canProfileAccessContent(profile, slide));
};

export const filterContentRowsForProfile = (
  profile: UserProfile | null | undefined,
  rows: HomeContentRow[],
): HomeContentRow[] => {
  if (!rows || !Array.isArray(rows)) {
    return [];
  }

  return rows
    .map((row) => ({
      ...row,
      items: filterContentForProfile(profile, row.items),
    }))
    .filter((row) => row.items.length > 0);
};
