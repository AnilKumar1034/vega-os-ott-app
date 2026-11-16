import {StyleSheet} from 'react-native';
import {colors} from '../../theme/colors';
import {fontSizes, fontWeights, lineHeights} from '../../theme/fonts';
import {borderRadius, spacing} from '../../theme/sizes';

export const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlayDark,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalCard: {
    width: 320,
    maxHeight: 380,
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.xs,
    marginBottom: spacing.xs,
  },
  iconBadgeText: {
    color: colors.textPrimary,
    fontSize: 7,
    fontWeight: fontWeights.extraBold,
    letterSpacing: 1,
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
  speedListContainer: {
    width: '100%',
    maxHeight: 220,
    marginBottom: spacing.lg,
  },
  speedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: spacing.xs,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  speedItemActive: {
    backgroundColor: 'rgba(0, 168, 225, 0.15)',
    borderColor: 'rgba(0, 168, 225, 0.4)',
  },
  speedItemFocused: {
    backgroundColor: colors.controlFocusedBackground,
    borderColor: colors.heroAccent,
    transform: [{scale: 1.02}],
  },
  speedItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  speedItemLabel: {
    color: colors.textPrimary,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
  },
  speedItemLabelFocused: {
    color: colors.textPrimary,
    fontWeight: fontWeights.bold,
  },
  checkMark: {
    color: colors.heroAccent,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },
  checkMarkFocused: {
    color: '#00A8E1',
  },
  closeButton: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  closeButtonFocused: {
    backgroundColor: colors.controlFocusedBackground,
    borderColor: colors.heroAccent,
    transform: [{scale: 1.02}],
  },
  closeButtonText: {
    color: colors.textPrimary,
    fontSize: fontSizes.button,
    fontWeight: fontWeights.semibold,
  },
});
