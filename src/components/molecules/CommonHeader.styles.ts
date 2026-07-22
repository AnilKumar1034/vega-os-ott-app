import {StyleSheet} from 'react-native';
import {colors} from '../../theme/colors';
import {fontSizes, fontWeights, lineHeights} from '../../theme/fonts';

export const styles = StyleSheet.create({
  container: {
    minHeight: 110,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderRadius: 0,
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
    borderRadius: 24,
    marginLeft: 26,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.headerBadge,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
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
