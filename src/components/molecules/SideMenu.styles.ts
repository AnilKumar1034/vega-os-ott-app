import {StyleSheet} from 'react-native';
import {colors} from '../../theme/colors';
import {fontSizes, fontWeights} from '../../theme/fonts';
import {sizes, spacing} from '../../theme/sizes';

export const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 100,
    width: sizes.menuWidthExpanded,
    paddingHorizontal: spacing.xxxl,
    paddingTop: spacing.topMenu,
    backgroundColor: colors.menuBackground,
  },
  collapsedContainer: {
    width: sizes.menuWidthCollapsed,
    paddingHorizontal: spacing.xxxl,
    paddingTop: spacing.topMenu,
    backgroundColor: colors.menuBackground,
  },
  menuTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.sideMenuTitle,
    fontWeight: fontWeights.semibold,
    letterSpacing: 1.5,
    marginBottom: spacing.screenHorizontal,
  },
  optionList: {
    paddingBottom: spacing.colossal,
  },
  option: {
    height: sizes.menuItemHeight,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: spacing.md,
    borderLeftWidth: spacing.md,
    borderLeftColor: colors.transparent,
    paddingHorizontal: spacing.huge,
    marginBottom: spacing.xxl,
  },
  collapsedOption: {
    justifyContent: 'center',
    paddingHorizontal: spacing.none,
  },
  activeOption: {
    borderLeftColor: colors.heroAccent,
  },
  focusedOption: {
    backgroundColor: colors.menuFocused,
    borderLeftColor: colors.focusRing,
    borderRightColor: colors.focusRing,
    borderWidth: spacing.borderThick,
    borderColor: colors.focusRing,
  },
  collapsedFocusedOption: {
    backgroundColor: colors.menuFocused,
    borderWidth: spacing.borderThick,
    borderColor: colors.focusRing,
    borderRadius: spacing.xl,
    transform: [{scale: 1.08}],
  },
  icon: {
    width: spacing.screenPadding,
    height: spacing.screenPadding,
    tintColor: colors.textPrimary,
    marginRight: spacing.huge,
  },
  collapsedIcon: {
    marginRight: spacing.none,
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
