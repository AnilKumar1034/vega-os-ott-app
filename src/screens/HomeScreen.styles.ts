import {StyleSheet} from 'react-native';
import {colors} from '../theme/colors';
import {fontSizes, fontWeights} from '../theme/fonts';
import {spacing} from '../theme/sizes';

export const styles = StyleSheet.create({
  background: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.screenBackground,
  },
  content: {
    flex: 1,
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
