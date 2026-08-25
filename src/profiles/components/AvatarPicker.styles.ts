import {StyleSheet} from 'react-native';
import {colors} from '../../theme/colors';
import {fontSizes, fontWeights} from '../../theme/fonts';
import {borderRadius, sizes, spacing} from '../../theme/sizes';

export const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xl,
  },
  label: {
    color: colors.textSecondary,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
    marginBottom: spacing.lg,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  avatarRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xl,
  },
  avatarOption: {
    width: sizes.avatarOptionCardWidth,
    height: sizes.avatarOptionCardHeight,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.cardBackgroundSubtle,
    borderWidth: spacing.borderThick,
    borderColor: colors.transparent,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
  },
  avatarOptionFocused: {
    borderColor: colors.textPrimary,
    backgroundColor: colors.controlBackground,
    transform: [{scale: 1.08}],
  },
  avatarOptionSelected: {
    borderColor: colors.heroAccent,
    backgroundColor: colors.avatarSelectedBackground,
  },
  avatarCircle: {
    width: sizes.avatarCircleDiameter,
    height: sizes.avatarCircleDiameter,
    borderRadius: sizes.avatarCircleRadius,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: spacing.borderMedium,
    marginBottom: spacing.sm,
  },
  avatarMonogram: {
    color: colors.textPrimary,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.boldWeight,
  },
  avatarLabel: {
    color: colors.textSecondary,
    fontSize: fontSizes.rating,
    fontWeight: fontWeights.semibold,
    textAlign: 'center',
  },
  avatarLabelSelected: {
    color: colors.textPrimary,
    fontWeight: fontWeights.boldWeight,
  },
});
