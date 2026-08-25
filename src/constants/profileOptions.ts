export const PROFILE_AVATARS = [
  {
    id: 'avatar-1',
    label: 'Cinematic',
    monogram: 'LX',
    background: '#E50914',
    accent: '#FF7B82',
  },
  {
    id: 'avatar-2',
    label: 'Neon Blue',
    monogram: 'NB',
    background: '#0284C7',
    accent: '#7DD3FC',
  },
  {
    id: 'avatar-3',
    label: 'Amber Glow',
    monogram: 'AG',
    background: '#D97706',
    accent: '#FDE68A',
  },
  {
    id: 'avatar-4',
    label: 'Royal Purple',
    monogram: 'RP',
    background: '#7C3AED',
    accent: '#C4B5FD',
  },
  {
    id: 'avatar-kids-1',
    label: 'Kids Dino',
    monogram: 'KD',
    background: '#059669',
    accent: '#A7F3D0',
  },
  {
    id: 'avatar-kids-2',
    label: 'Kids Star',
    monogram: 'KS',
    background: '#E11D48',
    accent: '#FECDD3',
  },
  {
    id: 'initial',
    label: 'Initials',
    monogram: '',
    background: '#E50914',
    accent: '#FF7B82',
  },
  {
    id: 'star',
    label: 'Studio',
    monogram: 'LX',
    background: '#C2410C',
    accent: '#FDBA74',
  },
  {
    id: 'bolt',
    label: 'Ultra',
    monogram: '4K',
    background: '#0369A1',
    accent: '#7DD3FC',
  },
  {
    id: 'wave',
    label: 'Cinema',
    monogram: 'TV',
    background: '#166534',
    accent: '#86EFAC',
  },
] as const;

export const PROFILE_THEMES = [
  {
    id: 'cinematic',
    label: 'Cinematic',
    description: 'Bold red highlights',
    color: '#E50914',
  },
  {
    id: 'midnight',
    label: 'Midnight',
    description: 'Cool blue highlights',
    color: '#38BDF8',
  },
  {
    id: 'sunrise',
    label: 'Sunrise',
    description: 'Warm amber highlights',
    color: '#F59E0B',
  },
] as const;

export type ProfileAvatarId = (typeof PROFILE_AVATARS)[number]['id'];
export type ProfileThemeId = (typeof PROFILE_THEMES)[number]['id'];

export const getProfileAvatar = (avatar?: string) =>
  PROFILE_AVATARS.find((option) => option.id === avatar) || PROFILE_AVATARS[0];

export const getProfileTheme = (theme?: string) =>
  PROFILE_THEMES.find((option) => option.id === theme) || PROFILE_THEMES[0];

export const getSubscriptionQuality = (subscription: string) => {
  if (/4k|ultra/i.test(subscription)) {
    return '4K';
  }
  if (/premium|basic/i.test(subscription)) {
    return 'HD';
  }
  return 'SD';
};

export const getAvatarMonogram = (avatar: string | undefined, name: string) => {
  const option = getProfileAvatar(avatar);
  if (option.id === 'initial' || !option.monogram) {
    return name.trim().charAt(0).toUpperCase() || 'A';
  }
  return option.monogram;
};
