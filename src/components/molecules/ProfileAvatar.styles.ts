import {StyleSheet} from 'react-native';
import {colors} from '../../theme/colors';
import {fontSizes, fontWeights} from '../../theme/fonts';
import {borderRadius, sizes, spacing} from '../../theme/sizes';

export const styles = StyleSheet.create({
  avatar: {
    width: sizes.avatarSize + 32,
    height: sizes.avatarSize + 32,
    borderRadius: sizes.avatarRadius + 16,
    borderWidth: spacing.borderHeavy,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: colors.shadowDark,
    shadowOffset: {width: 0, height: spacing.xlarge},
    shadowOpacity: 0.5,
    shadowRadius: spacing.shadowMedium,
  },
  avatarCompact: {
    width: sizes.avatarSize - 36,
    height: sizes.avatarSize - 36,
    borderRadius: borderRadius.xl + 22,
  },
  avatarLarge: {
    width: sizes.tvAvatarSize + 28,
    height: sizes.tvAvatarSize + 28,
    borderRadius: sizes.tvAvatarRadius + 14,
    borderWidth: spacing.borderUltra,
  },
  accent: {
    position: 'absolute',
    width: spacing.xl + 14,
    height: sizes.tvAvatarSize + 30,
    right: -12,
    opacity: 0.24,
    transform: [{rotate: '22deg'}],
  },
  accentCompact: {
    width: spacing.xl + 4,
    height: sizes.avatarSize + 20,
  },
  accentLarge: {
    width: spacing.xl + 26,
    height: sizes.tvAvatarSize + 70,
    right: -16,
  },
  innerRing: {
    width: sizes.avatarSize + 4,
    height: sizes.avatarSize + 4,
    borderRadius: sizes.avatarRadius + 2,
    borderWidth: spacing.borderThin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerRingCompact: {
    width: sizes.avatarSize - 24,
    height: sizes.avatarSize - 24,
    borderRadius: sizes.avatarRadius - 12,
  },
  innerRingLarge: {
    width: sizes.tvAvatarSize - 8,
    height: sizes.tvAvatarSize - 8,
    borderRadius: sizes.tvAvatarRadius - 4,
  },
  monogram: {
    color: colors.textPrimary,
    fontSize: fontSizes.userName,
    fontWeight: fontWeights.black,
    letterSpacing: 1,
  },
  monogramCompact: {
    fontSize: fontSizes.cardTitle,
  },
  monogramLarge: {
    fontSize: fontSizes.avatar,
  },
});
