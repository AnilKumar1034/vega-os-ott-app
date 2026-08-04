import {StyleSheet} from 'react-native';
import {colors} from '../../theme/colors';
import {fontSizes, fontWeights, lineHeights} from '../../theme/fonts';
import {spacing} from '../../theme/sizes';

export const styles = StyleSheet.create({
  container: {
    minHeight: spacing.headerMinHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xlarge,
    borderRadius: spacing.none,
    borderBottomWidth: spacing.borderThin,
    borderColor: colors.headerBorder,
    backgroundColor: colors.headerBackground,
  },
  title: {
    flexShrink: 1,
    color: colors.heroAccent,
    fontSize: fontSizes.commonHeaderTitle,
    lineHeight: lineHeights.commonHeaderTitle,
    fontWeight: fontWeights.semibold,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: spacing.huge,
    marginLeft: spacing.giant,
    paddingHorizontal: spacing.xxxl,
    paddingVertical: spacing.md,
    backgroundColor: colors.headerBadge,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
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
    width: spacing.headerLogoWidth,
    height: spacing.headerLogoHeight,
    marginLeft: spacing.xlarge,
  },
});
