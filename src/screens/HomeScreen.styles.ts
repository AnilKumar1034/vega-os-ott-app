import {StyleSheet} from 'react-native';
import {colors} from '../theme/colors';
import {fontSizes, fontWeights} from '../theme/fonts';
import {sizes, spacing} from '../theme/sizes';

export const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: colors.screenBackground,
  },
  content: {
    flex: 1,
    paddingLeft: sizes.menuWidthCollapsed || 90,
    paddingBottom: spacing.contentBottom,
  },
  contentGuide: {
    flex: 1,
    paddingLeft: spacing.screenPadding,
    paddingRight: spacing.screenHorizontal,
  },
  contentList: {
    paddingBottom: spacing.section,
  },
  toast: {
    position: 'absolute',
    top: spacing.xl,
    left: '50%',
    transform: [{translateX: -220 / 2}],
    width: 220,
    paddingHorizontal: spacing.large,
    paddingVertical: spacing.md,
    borderRadius: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderWidth: 1,
    borderColor: colors.borderLight,
    zIndex: 50,
  },
  toastText: {
    color: colors.textPrimary,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
    textAlign: 'center',
  },
  moviesHeader: {
    marginVertical: spacing.huge,
  },
  moviesTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.moviesTitle,
    fontWeight: fontWeights.bold,
  },
  moviesSubtitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.subheading,
    opacity: 0.8,
    marginTop: spacing.md,
  },
});
