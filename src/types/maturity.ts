export type ContentMaturityRating =
  | 'ALL'
  | 'KIDS'
  | '7_PLUS'
  | '13_PLUS'
  | '16_PLUS'
  | '18_PLUS';

export const MATURITY_LEVELS: Record<ContentMaturityRating, number> = {
  ALL: 0,
  KIDS: 1,
  '7_PLUS': 2,
  '13_PLUS': 3,
  '16_PLUS': 4,
  '18_PLUS': 5,
};

export const MATURITY_LABELS: Record<
  ContentMaturityRating,
  {label: string; description: string; ageHint: string}
> = {
  ALL: {
    label: 'All Ages (General Audience)',
    description: 'Suitable for all ages with no restricted themes.',
    ageHint: 'All',
  },
  KIDS: {
    label: 'Kids (Preschool & Early Childhood)',
    description: 'Specially created for young children and toddlers.',
    ageHint: 'Kids',
  },
  '7_PLUS': {
    label: 'Older Kids (7+)',
    description: 'Suitable for children aged 7 and above.',
    ageHint: '7+',
  },
  '13_PLUS': {
    label: 'Teens (13+)',
    description: 'Parents strongly cautioned. Suitable for teens 13+.',
    ageHint: '13+',
  },
  '16_PLUS': {
    label: 'Young Adults (16+)',
    description: 'Suitable for audiences aged 16 and above.',
    ageHint: '16+',
  },
  '18_PLUS': {
    label: 'Adults (18+)',
    description: 'Mature audience content only.',
    ageHint: '18+',
  },
};

export const DEFAULT_KIDS_MATURITY_LIMIT: ContentMaturityRating = 'KIDS';

export const ALL_MATURITY_RATINGS: ContentMaturityRating[] = [
  'ALL',
  'KIDS',
  '7_PLUS',
  '13_PLUS',
  '16_PLUS',
  '18_PLUS',
];
