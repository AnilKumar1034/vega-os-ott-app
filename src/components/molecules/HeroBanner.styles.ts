import {StyleSheet} from 'react-native';
import {colors} from '../../theme/colors';
import {fontSizes, fontWeights, lineHeights} from '../../theme/fonts';
import {spacing} from '../../theme/sizes';

export const styles = StyleSheet.create({
  container: {
    width: '100%',
    flex: 1,
    minHeight: 510,
    overflow: 'hidden',
    borderRadius: spacing.none,
    justifyContent: 'flex-end',
    marginTop: spacing.huge,
  },
  backgroundImage: {
    opacity: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.heroOverlay,
  },
  content: {
    width: '58%',
    paddingHorizontal: spacing.topMenu,
    paddingVertical: spacing.heroContentPadding,
    backgroundColor: colors.heroContentOverlay,
  },
  eyebrow: {
    color: colors.textPrimary,
    fontSize: fontSizes.heroEyebrow,
    fontWeight: fontWeights.bold,
    letterSpacing: 4,
    marginBottom: spacing.large,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSizes.heroTitle,
    lineHeight: lineHeights.heroTitle,
    fontWeight: fontWeights.bold,
  },
  description: {
    color: colors.textPrimary,
    fontSize: fontSizes.heroDescription,
    lineHeight: lineHeights.heroDescription,
    marginTop: spacing.huge,
  },
  metaRow: {
    marginTop: spacing.contentBottom,
  },
  metaRowContent: {
    alignItems: 'center',
  },
  metaText: {
    color: colors.textPrimary,
    fontSize: fontSizes.heroMeta,
    fontWeight: fontWeights.semibold,
  },
  metaDot: {
    color: colors.heroAccent,
    fontSize: fontSizes.heroMeta,
    marginHorizontal: spacing.xxxl,
  },
  actions: {
    flexDirection: 'row',
    marginTop: spacing.colossal,
  },
  playButton: {
    minWidth: 176,
    alignItems: 'center',
    borderRadius: spacing.sm,
    paddingHorizontal: spacing.huge,
    paddingVertical: spacing.xxxl,
    backgroundColor: colors.textPrimary,
  },
  listButton: {
    minWidth: 190,
    alignItems: 'center',
    borderRadius: spacing.sm,
    marginLeft: spacing.xxxl,
    paddingHorizontal: spacing.huge,
    paddingVertical: spacing.xxxl,
    backgroundColor: colors.actionSecondary,
  },
  focusedAction: {
    borderWidth: 4,
    borderColor: colors.focusRing,
    transform: [{scale: 1.05}],
  },
  playButtonText: {
    color: colors.actionPrimaryText,
    fontSize: fontSizes.heroAction,
    fontWeight: fontWeights.bold,
  },
  listButtonText: {
    color: colors.textPrimary,
    fontSize: fontSizes.heroAction,
    fontWeight: fontWeights.bold,
  },
});
