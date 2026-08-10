import {StyleSheet} from 'react-native';
import {colors} from '../../../theme/colors';
import {fontSizes, fontWeights} from '../../../theme/fonts';
import {borderRadius, sizes, spacing} from '../../../theme/sizes';

export const styles = StyleSheet.create({
  background: {flex: 1, backgroundColor: colors.screenBackground},
  content: {
    flex: 1,
    paddingLeft: sizes.menuWidthCollapsed,
    paddingBottom: spacing.contentBottom,
  },
  titleSection: {
    marginHorizontal: spacing.screenPadding,
    marginBottom: spacing.large,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSizes.moviesTitle,
    fontWeight: fontWeights.bold,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSizes.body,
    marginTop: spacing.xs,
  },
  guide: {
    flex: 1,
    marginLeft: spacing.screenPadding,
    marginRight: spacing.screenHorizontal,
  },
  details: {
    minHeight: 126,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.screenPadding,
    marginTop: spacing.large,
    paddingHorizontal: spacing.huge,
    paddingVertical: spacing.xl,
    borderWidth: spacing.borderThin,
    borderColor: colors.cardBorder,
    borderRadius: borderRadius.md,
    backgroundColor: colors.detailOverlay,
  },
  detailsText: {flex: 1, marginRight: spacing.huge},
  detailsTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.rowTitle,
    fontWeight: fontWeights.bold,
  },
  detailsTime: {
    color: colors.focusedTint,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
    marginTop: spacing.xs,
  },
  detailsDescription: {
    color: colors.textSecondary,
    fontSize: fontSizes.body,
    marginTop: spacing.xs,
  },
  detailsLive: {
    color: colors.success,
    fontSize: fontSizes.button,
    fontWeight: fontWeights.bold,
  },
  emptyDetails: {color: colors.textSecondary, fontSize: fontSizes.body},
});
