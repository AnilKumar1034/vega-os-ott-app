import {StyleSheet} from 'react-native';
import {colors} from '../theme/colors';
import {fontSizes, fontWeights} from '../theme/fonts';
import {borderRadius, sizes, spacing} from '../theme/sizes';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.shadowDark,
  },
  backdropPoster: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.shadowDark,
    zIndex: 0,
  },
  backdropImageStyle: {
    opacity: 0.5,
  },
  videoSurface: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.transparent,
    zIndex: 1,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.darkOverlay,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.huge,
    paddingVertical: spacing.huge,
    zIndex: 10,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.lg,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.chipBackground,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.xxxl,
    paddingVertical: spacing.lg,
    borderWidth: spacing.borderMedium,
    borderColor: colors.borderLight,
    marginRight: spacing.huge,
  },
  backButtonFocused: {
    backgroundColor: colors.heroAccent,
    borderColor: colors.focusRing,
    borderWidth: spacing.borderExtraUltra,
    transform: [{scale: 1.05}],
  },
  backButtonText: {
    color: colors.textPrimary,
    fontSize: fontSizes.heroAction,
    fontWeight: fontWeights.bold,
  },
  titleContainer: {
    flex: 1,
    marginLeft: spacing.lg,
  },
  movieTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.userName,
    fontWeight: fontWeights.bold,
    textShadowColor: colors.textShadow,
    textShadowOffset: {width: spacing.none, height: spacing.xxs},
    textShadowRadius: spacing.sm,
  },
  movieSub: {
    color: colors.textPrimary,
    opacity: 0.8,
    fontSize: fontSizes.caption,
    marginTop: spacing.xs,
  },
  qualityBadge: {
    backgroundColor: colors.heroAccent,
    paddingHorizontal: spacing.huge,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xs,
  },
  qualityBadgeText: {
    color: colors.textPrimary,
    fontWeight: fontWeights.bold,
    fontSize: fontSizes.small,
    letterSpacing: 1,
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.ratingBackground,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  errorCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xl,
    padding: spacing.colossal,
    alignItems: 'center',
    maxWidth: sizes.playerErrorMaxWidth,
    borderWidth: spacing.borderMedium,
    borderColor: colors.borderLight,
  },
  errorTitle: {
    color: colors.heroAccent,
    fontSize: fontSizes.commonHeaderStatus,
    fontWeight: fontWeights.bold,
    marginBottom: spacing.xl,
  },
  errorBody: {
    color: colors.textPrimary,
    fontSize: fontSizes.body,
    textAlign: 'center',
    marginBottom: spacing.huge,
    opacity: 0.9,
  },
  retryButton: {
    backgroundColor: colors.heroAccent,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.giant,
    paddingVertical: spacing.xl,
  },
  retryButtonText: {
    color: colors.textPrimary,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },
});
