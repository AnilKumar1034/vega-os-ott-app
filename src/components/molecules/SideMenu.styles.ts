import {StyleSheet} from 'react-native';
import {colors} from '../../theme/colors';
import {fontSizes, fontWeights} from '../../theme/fonts';

export const styles = StyleSheet.create({
  container: {
    width: 420,
    paddingHorizontal: 36,
    paddingTop: 72,
    backgroundColor: colors.menuBackground,
  },
  collapsedContainer: {
    width: 112,
    paddingHorizontal: 16,
  },
  menuTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.sideMenuTitle,
    fontWeight: fontWeights.semibold,
    letterSpacing: 1.5,
    marginBottom: 52,
  },
  option: {
    height: 92,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderLeftWidth: 8,
    borderLeftColor: 'transparent',
    paddingHorizontal: 24,
    marginBottom: 14,
  },
  collapsedOption: {
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  activeOption: {
    borderLeftColor: colors.heroAccent,
  },
  focusedOption: {
    backgroundColor: colors.menuFocused,
  },
  icon: {
    width: 42,
    height: 42,
    tintColor: colors.textPrimary,
    marginRight: 24,
  },
  collapsedIcon: {
    marginRight: 0,
  },
  optionTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.sideMenuOption,
    letterSpacing: 0.5,
  },
  activeTitle: {
    fontWeight: fontWeights.bold,
  },
});
