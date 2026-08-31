import {StyleSheet} from 'react-native';
import {colors} from '../../theme/colors';
import {fontSizes, fontWeights, lineHeights} from '../../theme/fonts';
import {borderRadius, sizes, spacing} from '../../theme/sizes';

export const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlayDark,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalCard: {
    width: 600,
    maxHeight: 680,
    backgroundColor: colors.dialogBackground,
    borderRadius: borderRadius.dialog,
    borderWidth: spacing.borderThick,
    borderColor: colors.cardBorder,
    padding: spacing.xxl,
    alignItems: 'center',
    shadowColor: colors.shadowDark,
    shadowOffset: {width: 0, height: spacing.lg},
    shadowOpacity: 0.7,
    shadowRadius: spacing.xlarge,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconBadge: {
    backgroundColor: colors.heroAccent,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  iconBadgeText: {
    color: colors.textPrimary,
    fontSize: fontSizes.cardBadge,
    fontWeight: fontWeights.extraBold,
    letterSpacing: 1.5,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSizes.subheading,
    fontWeight: fontWeights.extraBold,
    marginBottom: spacing.xxs,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSizes.caption,
    lineHeight: lineHeights.dialogBody,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  trackListContainer: {
    width: '100%',
    maxHeight: 380,
    marginBottom: spacing.xl,
  },
  trackListContent: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  trackButton: {
    width: '100%',
    height: 52,
    backgroundColor: colors.cardBorder,
    borderRadius: borderRadius.lg,
    borderWidth: spacing.borderThick,
    borderColor: colors.transparent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  trackButtonFocused: {
    borderColor: colors.focusRing,
    backgroundColor: colors.controlFocusedBackground,
  },
  trackButtonSelected: {
    backgroundColor: 'rgba(229, 9, 20, 0.22)',
    borderColor: 'rgba(229, 9, 20, 0.6)',
  },
  trackInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  trackLabel: {
    color: colors.textPrimary,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.boldWeight,
  },
  trackLabelSelected: {
    color: colors.textPrimary,
    fontWeight: fontWeights.extraBold,
  },
  selectedBadge: {
    backgroundColor: colors.heroAccent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.xs,
  },
  selectedBadgeText: {
    color: colors.textPrimary,
    fontSize: fontSizes.cardBadge,
    fontWeight: fontWeights.boldWeight,
  },
  checkmark: {
    color: colors.heroAccent,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.extraBold,
  },
  closeButton: {
    height: sizes.dialogButtonHeight,
    minWidth: 160,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.cardBorder,
    borderWidth: spacing.borderThick,
    borderColor: colors.transparent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonFocused: {
    borderColor: colors.textPrimary,
    backgroundColor: colors.heroAccent,
    transform: [{scale: 1.04}],
  },
  closeButtonText: {
    color: colors.textPrimary,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.boldWeight,
  },
});
