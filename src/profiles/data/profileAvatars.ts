export interface ProfileAvatarConfig {
  id: string;
  label: string;
  category: 'standard' | 'kids';
  background: string;
  accent: string;
  monogram: string;
  description: string;
}

export const PROFILE_AVATARS: ProfileAvatarConfig[] = [
  {
    id: 'avatar-1',
    label: 'Cinematic',
    category: 'standard',
    background: '#E50914',
    accent: '#FF7B82',
    monogram: 'LX',
    description: 'Classic OTT Cinema',
  },
  {
    id: 'avatar-2',
    label: 'Neon Blue',
    category: 'standard',
    background: '#0284C7',
    accent: '#7DD3FC',
    monogram: 'NB',
    description: 'Futuristic Sci-Fi Blue',
  },
  {
    id: 'avatar-3',
    label: 'Amber Glow',
    category: 'standard',
    background: '#D97706',
    accent: '#FDE68A',
    monogram: 'AG',
    description: 'Warm Horizon Glow',
  },
  {
    id: 'avatar-4',
    label: 'Royal Purple',
    category: 'standard',
    background: '#7C3AED',
    accent: '#C4B5FD',
    monogram: 'RP',
    description: 'Premium Royal Velvet',
  },
  {
    id: 'avatar-kids-1',
    label: 'Kids Dino',
    category: 'kids',
    background: '#059669',
    accent: '#A7F3D0',
    monogram: 'KD',
    description: 'Adventure & Fun',
  },
  {
    id: 'avatar-kids-2',
    label: 'Kids Star',
    category: 'kids',
    background: '#E11D48',
    accent: '#FECDD3',
    monogram: 'KS',
    description: 'Bright Star Animation',
  },
];

export const DEFAULT_AVATAR_ID = 'avatar-1';
export const DEFAULT_KIDS_AVATAR_ID = 'avatar-kids-1';

export const getProfileAvatarById = (
  avatarId?: string,
): ProfileAvatarConfig => {
  return (
    PROFILE_AVATARS.find((avatar) => avatar.id === avatarId) ||
    PROFILE_AVATARS[0]
  );
};

export const getAvatarMonogram = (
  avatarId: string | undefined,
  name: string,
): string => {
  const avatar = getProfileAvatarById(avatarId);
  if (name && name.trim().length > 0) {
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.trim().slice(0, 2).toUpperCase();
  }
  return avatar.monogram;
};
