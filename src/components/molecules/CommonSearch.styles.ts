import {StyleSheet} from 'react-native';
import {colors} from '../../theme/colors';
import {fontSizes, fontWeights} from '../../theme/fonts';
import {borderRadius, spacing} from '../../theme/sizes';

export const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.circle,
    borderWidth: spacing.borderThick,
    borderColor: colors.cardBorder,
    width: spacing.commonSearchMaxWidth,
    height: spacing.commonSearchHeight,
    paddingHorizontal: spacing.md,
  },
  focusedContainer: {
    backgroundColor: colors.inputFocusedBackground,
    borderColor: colors.focusRing,
    borderWidth: spacing.borderHeavy,
    shadowColor: colors.focusRing,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.45,
    shadowRadius: spacing.xl,
    elevation: 6,
  },
  searchIconContainer: {
    width: spacing.extraHuge,
    height: spacing.extraHuge,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: spacing.borderThin,
    borderRightColor: colors.cardBorder,
  },
  searchIcon: {
    opacity: 0.9,
  },
  input: {
    flex: 1,
    height: '100%',
    color: colors.textPrimary,
    fontSize: fontSizes.cardTitle,
    fontWeight: fontWeights.medium,
    paddingVertical: spacing.none,
    paddingHorizontal: spacing.large,
  },
  clearButton: {
    width: spacing.extraHuge,
    height: spacing.extraHuge,
    borderRadius: borderRadius.circle,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: spacing.borderThick,
    borderColor: colors.transparent,
  },
  clearButtonFocused: {
    backgroundColor: colors.heroAccent,
    borderColor: colors.focusRing,
    transform: [{scale: 1.08}],
  },
  inputHint: {
    color: colors.textSecondary,
    fontSize: fontSizes.rating,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    borderRadius: borderRadius.circle,
    backgroundColor: colors.cardHoverBackground,
  },
});
