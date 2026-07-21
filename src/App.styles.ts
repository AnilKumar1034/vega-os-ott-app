import {StyleSheet} from 'react-native';
import {colors} from './theme/colors';
import {fontSizes, fontWeights, lineHeights} from './theme/fonts';

export const styles = StyleSheet.create({
  background: {
    flex: 1,
    padding: 160,
  },
  headerArea: {
    flex: 3,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.headerTitle,
    lineHeight: lineHeights.headerTitle,
    fontWeight: fontWeights.semibold,
  },
  headerSubtitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.headerSubtitle,
  },
  vegaLogo: {
    width: 500,
    height: 350,
    marginLeft: 120,
  },
  focusedTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.focusedTitle,
    lineHeight: lineHeights.focusedTitle,
    fontWeight: fontWeights.bold,
    width: 560,
  },
  focusedDescription: {
    color: colors.textPrimary,
    fontSize: fontSizes.focusedDescription,
    lineHeight: lineHeights.focusedDescription,
    flex: 1,
    marginLeft: 50,
    paddingTop: 20,
  },
  tileRowContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
});
