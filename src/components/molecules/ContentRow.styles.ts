import {StyleSheet} from 'react-native';
import {colors} from '../../theme/colors';
import {fontSizes, fontWeights} from '../../theme/fonts';
import {spacing} from '../../theme/sizes';

export const styles = StyleSheet.create({
  guide: {marginTop: spacing.giant},
  title: {
    color: colors.textPrimary,
    fontSize: fontSizes.rowTitle,
    fontWeight: fontWeights.bold,
    marginBottom: spacing.large,
  },
  list: {paddingHorizontal: spacing.md, paddingVertical: spacing.lg},
});
