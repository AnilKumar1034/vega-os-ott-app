import {StyleSheet} from 'react-native';
import {colors} from '../../theme/colors';
import {fontSizes} from '../../theme/fonts';
import {spacing} from '../../theme/sizes';

export const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: spacing.xl,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    paddingHorizontal: spacing.huge,
    paddingVertical: spacing.sm,
    height: 46,
    minWidth: 280,
    maxWidth: 420,
    marginLeft: 'auto',
    marginRight: spacing.xlarge,
  },
  focusedContainer: {
    backgroundColor: colors.inputFocusedBackground,
    borderColor: colors.focusRing,
    borderWidth: 2,
    shadowColor: colors.focusRing,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
  searchIcon: {
    marginRight: spacing.md,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fontSizes.body,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  clearButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
});
