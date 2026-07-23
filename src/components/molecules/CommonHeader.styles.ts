import {StyleSheet} from 'react-native';
import {colors} from '../../theme/colors';
import {fontSizes, fontWeights, lineHeights} from '../../theme/fonts';
import {spacing} from '../../theme/sizes';

export const styles = StyleSheet.create({
  container: {
    minHeight: 110,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xlarge,
    borderRadius: spacing.none,
    borderBottomWidth: 1,
    borderColor: colors.headerBorder,
    backgroundColor: colors.headerBackground,
  },
  title: {
    color: colors.heroAccent,
    fontSize: fontSizes.commonHeaderTitle,
    lineHeight: lineHeights.commonHeaderTitle,
    fontWeight: fontWeights.semibold,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: spacing.huge,
    marginLeft: 26,
    paddingHorizontal: spacing.xxxl,
    paddingVertical: spacing.md,
    backgroundColor: colors.headerBadge,
  },
  statusDot: {
    width: spacing.xl,
    height: spacing.xl,
    borderRadius: spacing.sm,
    marginRight: spacing.lg,
    backgroundColor: colors.heroAccent,
  },
  statusText: {
    color: colors.textPrimary,
    fontSize: fontSizes.commonHeaderStatus,
    fontWeight: fontWeights.bold,
    letterSpacing: 1,
  },
  logo: {
    width: 150,
    height: 84,
    marginLeft: 'auto',
  },
});
