import {StyleSheet} from 'react-native';
import {colors} from '../../theme/colors';
import {fontSizes, fontWeights, lineHeights} from '../../theme/fonts';
import {sizes, spacing} from '../../theme/sizes';

export const styles = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: sizes.heroMinHeight,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    marginTop: spacing.huge,
    borderRadius: spacing.xxxl,
    backgroundColor: colors.cardBackground,
  },
  backgroundImage: {
    borderRadius: spacing.xxxl,
    opacity: 0.9,
    // resizeMode: 'contain'
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.heroOverlay,
    borderRadius: spacing.xxxl,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.darkOverlay,
    borderRadius: spacing.xxxl,
  },
  content: {
    width: '62%',
    paddingHorizontal: spacing.heroContentPadding,
    paddingVertical: spacing.extraHuge,
    zIndex: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  badge: {
    backgroundColor: colors.heroAccent,
    color: colors.textPrimary,
    fontSize: fontSizes.cardBadge,
    fontWeight: fontWeights.bold,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: spacing.xs,
    letterSpacing: 1.5,
    marginRight: spacing.xxl,
    overflow: 'hidden',
  },
  eyebrow: {
    color: colors.textPrimary,
    fontSize: fontSizes.heroEyebrow,
    fontWeight: fontWeights.bold,
    letterSpacing: 3,
    opacity: 0.9,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSizes.heroTitle,
    lineHeight: lineHeights.heroTitle,
    fontWeight: fontWeights.bold,
    textShadowColor: colors.textShadow,
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 8,
  },
  description: {
    color: colors.textPrimary,
    fontSize: fontSizes.heroDescription,
    lineHeight: lineHeights.heroDescription,
    marginTop: spacing.large,
    opacity: 0.92,
  },
  metaRow: {
    marginTop: spacing.giant,
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
    marginHorizontal: spacing.xxl,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.colossal,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButton: {
    minWidth: 176,
    alignItems: 'center',
    borderRadius: spacing.md,
    paddingHorizontal: spacing.giant,
    paddingVertical: spacing.xxxl,
    backgroundColor: colors.textPrimary,
  },
  listButton: {
    minWidth: 190,
    alignItems: 'center',
    borderRadius: spacing.md,
    marginLeft: spacing.xxxl,
    paddingHorizontal: spacing.giant,
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
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.huge,
  },
  navArrowButton: {
    width: spacing.extraHuge,
    height: spacing.extraHuge,
    borderRadius: spacing.huge,
    backgroundColor: colors.controlBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: spacing.sm,
  },
  focusedNavArrow: {
    backgroundColor: colors.heroAccent,
    borderWidth: 3,
    borderColor: colors.focusRing,
    transform: [{scale: 1.15}],
  },
  navArrowText: {
    color: colors.textPrimary,
    fontSize: fontSizes.navArrow,
    fontWeight: fontWeights.bold,
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.xl,
  },
  paginationDot: {
    width: spacing.xxl,
    height: spacing.xxl,
    borderRadius: 7,
    backgroundColor: colors.controlFocusedBackground,
    marginHorizontal: spacing.sm,
  },
  activeDot: {
    width: spacing.colossal,
    borderRadius: spacing.md,
    backgroundColor: colors.heroAccent,
  },
  focusedDot: {
    borderWidth: 2,
    borderColor: colors.focusRing,
    transform: [{scale: 1.3}],
    backgroundColor: colors.textPrimary,
  },
});
