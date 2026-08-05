import {StyleSheet} from 'react-native';
import {colors} from '../theme/colors';
import {fontSizes, fontWeights} from '../theme/fonts';
import {borderRadius, sizes, spacing} from '../theme/sizes';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.darkScreenBackground,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.huge,
  },
  card: {
    width: '100%',
    maxWidth: sizes.authCardMaxWidth,
    backgroundColor: colors.darkCardBackground,
    borderRadius: borderRadius.card,
    padding: spacing.cardPadding,
    borderWidth: spacing.borderMedium,
    borderColor: colors.cardBorder,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSizes.userName,
    fontWeight: fontWeights.bold,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.textPrimary,
    opacity: 0.7,
    fontSize: fontSizes.caption,
    textAlign: 'center',
    marginBottom: spacing.huge,
  },
  errorText: {
    color: colors.errorText,
    backgroundColor: colors.errorBackground,
    borderColor: colors.errorText,
    borderWidth: spacing.borderThin,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    fontSize: fontSizes.error,
    textAlign: 'center',
    marginBottom: spacing.huge,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  halfInputGroup: {
    flex: 0.48,
  },
  fullInputGroup: {
    marginBottom: spacing.xl,
  },
  label: {
    color: colors.textPrimary,
    fontSize: fontSizes.label,
    fontWeight: fontWeights.semibold,
    marginVertical: spacing.xl,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.md,
    borderWidth: spacing.borderMedium,
    borderColor: colors.borderLight,
    color: colors.textPrimary,
    fontSize: fontSizes.input,
    paddingHorizontal: spacing.huge,
    paddingVertical: spacing.lg,
  },
  inputFocused: {
    borderColor: colors.focusRing,
    backgroundColor: colors.inputFocusedBackground,
    borderWidth: spacing.borderExtraUltra,
  },
  subscriptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  subPill: {
    flex: 1,
    marginHorizontal: spacing.xxs,
    backgroundColor: colors.subPillBackground,
    borderRadius: borderRadius.md,
    borderWidth: spacing.borderMedium,
    borderColor: colors.borderLight,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  subPillActive: {
    backgroundColor: colors.subPillActiveBackground,
    borderColor: colors.focusRing,
  },
  subPillFocused: {
    borderColor: colors.focusRing,
    borderWidth: spacing.borderExtraUltra,
  },
  subPillText: {
    color: colors.textPrimary,
    fontSize: fontSizes.small,
    fontWeight: fontWeights.semibold,
  },
  subPillTextActive: {
    fontWeight: fontWeights.bold,
  },
  submitButton: {
    backgroundColor: colors.heroAccent,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.huge,
    alignItems: 'center',
    marginTop: spacing.huge,
    borderWidth: spacing.borderThick,
    borderColor: colors.transparent,
  },
  submitButtonFocused: {
    borderColor: colors.focusRing,
    borderWidth: spacing.borderExtraUltra,
    backgroundColor: colors.logoutButtonFocused,
  },
  submitButtonText: {
    color: colors.textPrimary,
    fontSize: fontSizes.button,
    fontWeight: fontWeights.bold,
  },
  switchButton: {
    alignItems: 'center',
    marginTop: spacing.huge,
    paddingVertical: spacing.md,
  },
  switchButtonFocused: {
    transform: [{scale: 1.05}],
  },
  switchButtonText: {
    color: colors.focusRing,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
  },
});
