import {HeroSlide, HomeContentItem, HomeContentRow} from '../src/data/home';
import {UserProfile} from '../src/profiles/types/Profile';
import {
  ContentMaturityRating,
  DEFAULT_KIDS_MATURITY_LIMIT,
  MATURITY_LEVELS,
} from '../src/types/maturity';
import {
  canProfileAccessContent,
  filterContentForProfile,
  filterContentRowsForProfile,
  filterHeroSlidesForProfile,
  getEffectiveKidsMaturityLimit,
  isValidMaturityRating,
} from '../src/utils/contentAccessPolicy';

describe('Content Access Policy & Maturity Filtering', () => {
  const adultProfile: UserProfile = {
    id: 'profile-adult',
    name: 'Adult User',
    avatarId: 'avatar-1',
    isKids: false,
    createdAt: 1000,
    updatedAt: 1000,
  };

  const kidsProfileDefault: UserProfile = {
    id: 'profile-kids-default',
    name: 'Kids User',
    avatarId: 'avatar-kids',
    isKids: true,
    kidsMaturityLimit: 'KIDS',
    createdAt: 1000,
    updatedAt: 1000,
  };

  const kidsProfile7Plus: UserProfile = {
    id: 'profile-kids-7',
    name: 'Older Kids',
    avatarId: 'avatar-kids',
    isKids: true,
    kidsMaturityLimit: '7_PLUS',
    createdAt: 1000,
    updatedAt: 1000,
  };

  const kidsProfile13Plus: UserProfile = {
    id: 'profile-kids-13',
    name: 'Teen',
    avatarId: 'avatar-kids',
    isKids: true,
    kidsMaturityLimit: '13_PLUS',
    createdAt: 1000,
    updatedAt: 1000,
  };

  const mockImage = {uri: 'https://example.com/image.jpg'};

  const contentItems: Record<string, HomeContentItem> = {
    allAges: {
      id: 'c-all',
      title: '12th Fail',
      maturityRating: 'ALL',
      image: mockImage,
    },
    kidsOnly: {
      id: 'c-kids',
      title: 'The Lion King',
      maturityRating: 'KIDS',
      image: mockImage,
    },
    sevenPlus: {
      id: 'c-7',
      title: 'Spider-Man Across the Spider-Verse',
      maturityRating: '7_PLUS',
      image: mockImage,
    },
    thirteenPlus: {
      id: 'c-13',
      title: 'The Dark Knight',
      maturityRating: '13_PLUS',
      image: mockImage,
    },
    sixteenPlus: {
      id: 'c-16',
      title: 'Oppenheimer',
      maturityRating: '16_PLUS',
      image: mockImage,
    },
    eighteenPlus: {
      id: 'c-18',
      title: 'Animal',
      maturityRating: '18_PLUS',
      image: mockImage,
    },
    unclassified: {
      id: 'c-unclassified',
      title: 'Mystery Film',
      image: mockImage,
    },
  };

  describe('Maturity ordering and rating validation', () => {
    it('has strictly increasing hierarchical levels from ALL to 18_PLUS', () => {
      expect(MATURITY_LEVELS.ALL).toBeLessThan(MATURITY_LEVELS.KIDS);
      expect(MATURITY_LEVELS.KIDS).toBeLessThan(MATURITY_LEVELS['7_PLUS']);
      expect(MATURITY_LEVELS['7_PLUS']).toBeLessThan(MATURITY_LEVELS['13_PLUS']);
      expect(MATURITY_LEVELS['13_PLUS']).toBeLessThan(MATURITY_LEVELS['16_PLUS']);
      expect(MATURITY_LEVELS['16_PLUS']).toBeLessThan(MATURITY_LEVELS['18_PLUS']);
    });

    it('validates known rating strings and rejects invalid values', () => {
      expect(isValidMaturityRating('ALL')).toBe(true);
      expect(isValidMaturityRating('KIDS')).toBe(true);
      expect(isValidMaturityRating('7_PLUS')).toBe(true);
      expect(isValidMaturityRating('13_PLUS')).toBe(true);
      expect(isValidMaturityRating('16_PLUS')).toBe(true);
      expect(isValidMaturityRating('18_PLUS')).toBe(true);
      expect(isValidMaturityRating('PG-13')).toBe(false);
      expect(isValidMaturityRating('')).toBe(false);
      expect(isValidMaturityRating(null)).toBe(false);
      expect(isValidMaturityRating(undefined)).toBe(false);
    });

    it('falls back to default kids limit when not explicitly defined on kids profile', () => {
      const kidsWithoutExplicitLimit: UserProfile = {
        id: 'kids-no-limit',
        name: 'Little Kid',
        avatarId: 'avatar-1',
        isKids: true,
        createdAt: 1000,
        updatedAt: 1000,
      };
      expect(getEffectiveKidsMaturityLimit(kidsWithoutExplicitLimit)).toBe(
        DEFAULT_KIDS_MATURITY_LIMIT,
      );
    });
  });

  describe('canProfileAccessContent policy', () => {
    it('returns false for null or undefined content', () => {
      expect(canProfileAccessContent(adultProfile, null)).toBe(false);
      expect(canProfileAccessContent(kidsProfileDefault, undefined)).toBe(false);
    });

    it('allows adult profiles to access ALL content, including mature and unclassified', () => {
      expect(canProfileAccessContent(adultProfile, contentItems.allAges)).toBe(true);
      expect(canProfileAccessContent(adultProfile, contentItems.kidsOnly)).toBe(true);
      expect(canProfileAccessContent(adultProfile, contentItems.sevenPlus)).toBe(true);
      expect(canProfileAccessContent(adultProfile, contentItems.thirteenPlus)).toBe(true);
      expect(canProfileAccessContent(adultProfile, contentItems.sixteenPlus)).toBe(true);
      expect(canProfileAccessContent(adultProfile, contentItems.eighteenPlus)).toBe(true);
      expect(canProfileAccessContent(adultProfile, contentItems.unclassified)).toBe(true);
    });

    it('allows guest/null profile to access content by default', () => {
      expect(canProfileAccessContent(null, contentItems.kidsOnly)).toBe(true);
      expect(canProfileAccessContent(undefined, contentItems.eighteenPlus)).toBe(true);
    });

    it('blocks unclassified content for Kids profile (safe default)', () => {
      expect(canProfileAccessContent(kidsProfileDefault, contentItems.unclassified)).toBe(false);
      expect(canProfileAccessContent(kidsProfile7Plus, contentItems.unclassified)).toBe(false);
      expect(canProfileAccessContent(kidsProfile13Plus, contentItems.unclassified)).toBe(false);
      expect(
        canProfileAccessContent(kidsProfileDefault, {
          ...contentItems.kidsOnly,
          maturityRating: undefined,
        }),
      ).toBe(false);
    });

    it('blocks invalid rating content for Kids profile', () => {
      expect(
        canProfileAccessContent(kidsProfileDefault, {
          ...contentItems.kidsOnly,
          maturityRating: 'UNKNOWN_RATING' as any,
        }),
      ).toBe(false);
    });

    it('enforces limit for default Kids profile (KIDS limit: ALL and KIDS only)', () => {
      expect(canProfileAccessContent(kidsProfileDefault, contentItems.allAges)).toBe(true);
      expect(canProfileAccessContent(kidsProfileDefault, contentItems.kidsOnly)).toBe(true);
      expect(canProfileAccessContent(kidsProfileDefault, contentItems.sevenPlus)).toBe(false);
      expect(canProfileAccessContent(kidsProfileDefault, contentItems.thirteenPlus)).toBe(false);
      expect(canProfileAccessContent(kidsProfileDefault, contentItems.sixteenPlus)).toBe(false);
      expect(canProfileAccessContent(kidsProfileDefault, contentItems.eighteenPlus)).toBe(false);
    });

    it('enforces limit for 7_PLUS Kids profile (allows ALL, KIDS, and 7_PLUS)', () => {
      expect(canProfileAccessContent(kidsProfile7Plus, contentItems.allAges)).toBe(true);
      expect(canProfileAccessContent(kidsProfile7Plus, contentItems.kidsOnly)).toBe(true);
      expect(canProfileAccessContent(kidsProfile7Plus, contentItems.sevenPlus)).toBe(true);
      expect(canProfileAccessContent(kidsProfile7Plus, contentItems.thirteenPlus)).toBe(false);
      expect(canProfileAccessContent(kidsProfile7Plus, contentItems.sixteenPlus)).toBe(false);
      expect(canProfileAccessContent(kidsProfile7Plus, contentItems.eighteenPlus)).toBe(false);
    });

    it('enforces limit for 13_PLUS Kids profile (allows ALL, KIDS, 7_PLUS, 13_PLUS)', () => {
      expect(canProfileAccessContent(kidsProfile13Plus, contentItems.allAges)).toBe(true);
      expect(canProfileAccessContent(kidsProfile13Plus, contentItems.kidsOnly)).toBe(true);
      expect(canProfileAccessContent(kidsProfile13Plus, contentItems.sevenPlus)).toBe(true);
      expect(canProfileAccessContent(kidsProfile13Plus, contentItems.thirteenPlus)).toBe(true);
      expect(canProfileAccessContent(kidsProfile13Plus, contentItems.sixteenPlus)).toBe(false);
      expect(canProfileAccessContent(kidsProfile13Plus, contentItems.eighteenPlus)).toBe(false);
    });
  });

  describe('filterContentForProfile', () => {
    it('returns empty array when input is null or empty', () => {
      expect(filterContentForProfile(kidsProfileDefault, [] as any)).toEqual([]);
      expect(filterContentForProfile(adultProfile, null as any)).toEqual([]);
    });

    it('filters out restricted items for Kids profile', () => {
      const allItems = Object.values(contentItems);
      const filtered = filterContentForProfile(kidsProfileDefault, allItems);
      expect(filtered.map((i) => i.id)).toEqual(['c-all', 'c-kids']);
    });

    it('retains all items for adult profile', () => {
      const allItems = Object.values(contentItems);
      const filtered = filterContentForProfile(adultProfile, allItems);
      expect(filtered.length).toBe(allItems.length);
    });
  });

  describe('filterHeroSlidesForProfile', () => {
    const slides: HeroSlide[] = [
      {
        id: 's-kids',
        title: 'The Lion King',
        maturityRating: 'KIDS',
        description: 'Kids slide',
        image: mockImage,
      },
      {
        id: 's-adult',
        title: 'RRR',
        maturityRating: '13_PLUS',
        description: 'Adult slide',
        image: mockImage,
      },
    ];

    it('filters hero slides according to profile maturity limit', () => {
      const kidsSlides = filterHeroSlidesForProfile(kidsProfileDefault, slides);
      expect(kidsSlides.length).toBe(1);
      expect(kidsSlides[0].id).toBe('s-kids');

      const adultSlides = filterHeroSlidesForProfile(adultProfile, slides);
      expect(adultSlides.length).toBe(2);
    });
  });

  describe('filterContentRowsForProfile', () => {
    const rows: HomeContentRow[] = [
      {
        id: 'row-mixed',
        title: 'Mixed Row',
        items: [contentItems.kidsOnly, contentItems.eighteenPlus],
      },
      {
        id: 'row-adult-only',
        title: 'Adult Thrillers',
        items: [contentItems.sixteenPlus, contentItems.eighteenPlus],
      },
      {
        id: 'row-kids-only',
        title: 'Kids Fun',
        items: [contentItems.allAges, contentItems.kidsOnly],
      },
    ];

    it('filters items within rows and omits rows that become completely empty', () => {
      const filteredRows = filterContentRowsForProfile(kidsProfileDefault, rows);
      // row-adult-only should be dropped because all items are restricted!
      expect(filteredRows.length).toBe(2);
      expect(filteredRows[0].id).toBe('row-mixed');
      expect(filteredRows[0].items.length).toBe(1);
      expect(filteredRows[0].items[0].id).toBe('c-kids');
      expect(filteredRows[1].id).toBe('row-kids-only');
      expect(filteredRows[1].items.length).toBe(2);
    });
  });
});
