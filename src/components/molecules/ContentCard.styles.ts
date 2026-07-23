import {StyleSheet} from 'react-native';
import {colors} from '../../theme/colors';
import {fontSizes, fontWeights} from '../../theme/fonts';
import {sizes, spacing} from '../../theme/sizes';

export const styles = StyleSheet.create({
  container: {
    width: sizes.cardWidthHorizontal,
    height: sizes.cardHeightHorizontal,
    marginRight: spacing.huge,
    borderRadius: spacing.xl,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: colors.cardBackground,
  },
  portraitContainer: {
    width: sizes.cardWidthPortrait,
    height: sizes.cardHeightPortrait,
    marginRight: spacing.huge,
    borderRadius: spacing.xl,
  },
  gridContainer: {
    width: sizes.cardWidthGrid,
    height: sizes.cardHeightGrid,
    marginRight: spacing.xlarge,
    marginBottom: spacing.huge,
    borderRadius: spacing.xl,
  },
  focused: {
    borderWidth: 4,
    borderColor: colors.focusRing,
    transform: [{scale: 1.08}],
    zIndex: 2,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  imageShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.cardOverlay,
  },
  infoBox: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSizes.cardTitle,
    fontWeight: fontWeights.semibold,
    marginBottom: spacing.xs,
  },
  genreText: {
    color: colors.textSecondary,
    fontSize: fontSizes.genre,
    marginBottom: spacing.xs,
  },
  badge: {
    position: 'absolute',
    top: spacing.xl,
    left: spacing.xl,
    overflow: 'hidden',
    color: colors.textPrimary,
    fontSize: fontSizes.cardBadge,
    fontWeight: fontWeights.bold,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: spacing.xs,
    backgroundColor: colors.heroAccent,
  },
  portraitBadge: {
    top: spacing.lg,
    left: spacing.lg,
    fontSize: fontSizes.portraitBadge,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  ratingBadge: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    color: colors.starRating,
    fontSize: fontSizes.rating,
    fontWeight: fontWeights.bold,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: spacing.xs,
    backgroundColor: colors.ratingBackground,
    overflow: 'hidden',
  },
  progressTrack: {
    height: 5,
    marginTop: spacing.sm,
    borderRadius: 3,
    backgroundColor: colors.progressTrack,
    overflow: 'hidden',
  },
  progressValue: {
    height: '100%',
    backgroundColor: colors.heroAccent,
  },
});
