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
    borderWidth: 1.5,
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
  toast: {
    position: 'absolute',
    top: spacing.huge,
    left: spacing.huge,
    right: spacing.huge,
    zIndex: 10,
    backgroundColor: colors.darkCardBackground,
    borderColor: colors.focusRing,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  toastText: {
    color: colors.textPrimary,
    fontSize: fontSizes.caption,
    textAlign: 'center',
  },
  errorText: {
    color: colors.errorText,
    backgroundColor: colors.errorBackground,
    borderColor: colors.errorText,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    fontSize: fontSizes.error,
    textAlign: 'center',
    marginBottom: spacing.huge,
  },
  fullInputGroup: {
    marginBottom: spacing.huge,
  },
  label: {
    color: colors.textPrimary,
    fontSize: fontSizes.label,
    fontWeight: fontWeights.semibold,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    color: colors.textPrimary,
    fontSize: fontSizes.input,
    paddingHorizontal: spacing.huge,
    paddingVertical: spacing.lg,
  },
  inputFocused: {
    borderColor: colors.focusRing,
    backgroundColor: colors.inputFocusedBackground,
    borderWidth: 2.5,
  },
  submitButton: {
    backgroundColor: colors.heroAccent,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.huge,
    alignItems: 'center',
    marginTop: spacing.huge,
    borderWidth: 2,
    borderColor: colors.transparent,
  },
  submitButtonFocused: {
    borderColor: colors.focusRing,
    borderWidth: 2.5,
    backgroundColor: colors.logoutButtonFocused,
    transform: [{scale: 1.03}],
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
