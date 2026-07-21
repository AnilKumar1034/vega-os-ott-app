import {StyleSheet} from 'react-native';
import {colors} from '../theme/colors';
import {fontSizes, fontWeights} from '../theme/fonts';

export const styles = StyleSheet.create({
  container: {
    width: 360,
    paddingHorizontal: 32,
    paddingTop: 90,
    backgroundColor: colors.menuBackground,
  },
  menuTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.sideMenuTitle,
    fontWeight: fontWeights.semibold,
    marginBottom: 60,
  },
  option: {
    height: 96,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  activeOption: {
    backgroundColor: colors.tileDefault,
  },
  focusedOption: {
    borderWidth: 3,
    borderColor: colors.textPrimary,
  },
  icon: {
    width: 48,
    height: 48,
    tintColor: colors.textPrimary,
    marginRight: 20,
  },
  optionTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.sideMenuOption,
  },
  activeTitle: {
    fontWeight: fontWeights.bold,
  },
});
