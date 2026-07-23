import {StyleSheet} from 'react-native';
import {colors} from '../theme/colors';
import {fontSizes, fontWeights, lineHeights} from '../theme/fonts';
import {sizes, spacing} from '../theme/sizes';

export const styles = StyleSheet.create({
  background: {
    flex: 1,
    flexDirection: 'row',
  },
  backdropImage: {
    opacity: 0.85,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.detailOverlay,
  },
  contentContainer: {
    flex: 1,
    paddingBottom: spacing.section,
  },
  mainCardContainer: {
    paddingLeft: spacing.section,
  },
  headerRow: {
    marginBottom: spacing.colossal,
  },
  mainCardRow: {
    flexDirection: 'row',
    marginTop: spacing.xxxl,
    marginBottom: spacing.section,
  },
  posterImage: {
    width: sizes.posterWidth,
    height: sizes.posterHeight,
    borderRadius: spacing.xxxl,
    borderWidth: 2,
    borderColor: colors.borderLight,
  },
  detailsColumn: {
    flex: 1,
    marginLeft: spacing.extraHuge,
    justifyContent: 'center',
  },
  badgeRow: {
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
  ratingText: {
    color: colors.goldStar,
    fontSize: fontSizes.heroMeta,
    fontWeight: fontWeights.bold,
    marginRight: spacing.xxxl,
  },
  genreText: {
    color: colors.textPrimary,
    fontSize: fontSizes.heroMeta,
    opacity: 0.8,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSizes.movieDetailTitle,
    lineHeight: lineHeights.movieDetailTitle,
    fontWeight: fontWeights.bold,
    marginBottom: spacing.xxxl,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xlarge,
  },
  metaPill: {
    backgroundColor: colors.chipBackground,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.sm,
    borderRadius: spacing.sm,
    marginRight: spacing.xl,
  },
  metaPillText: {
    color: colors.textPrimary,
    fontSize: fontSizes.heroMeta,
    fontWeight: fontWeights.semibold,
  },
  description: {
    color: colors.textPrimary,
    fontSize: fontSizes.synopsis,
    lineHeight: 42,
    opacity: 0.9,
    marginBottom: spacing.huge,
    maxWidth: 900,
  },
  castRow: {
    marginBottom: spacing.xl,
  },
  castLabel: {
    color: colors.heroAccent,
    fontWeight: fontWeights.bold,
    fontSize: fontSizes.castLabel,
  },
  castText: {
    color: colors.textPrimary,
    fontSize: fontSizes.castLabel,
    opacity: 0.85,
  },
  actionsGuide: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.giant,
  },
  playButton: {
    minWidth: 200,
    alignItems: 'center',
    borderRadius: spacing.md,
    paddingHorizontal: spacing.colossal,
    paddingVertical: spacing.large,
    backgroundColor: colors.textPrimary,
    marginRight: spacing.xlarge,
  },
  playButtonText: {
    color: colors.actionPrimaryText,
    fontSize: fontSizes.heroAction,
    fontWeight: fontWeights.bold,
  },
  secondaryButton: {
    minWidth: 180,
    alignItems: 'center',
    borderRadius: spacing.md,
    paddingHorizontal: spacing.giant,
    paddingVertical: spacing.large,
    backgroundColor: colors.actionSecondary,
    marginRight: spacing.xlarge,
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontSize: fontSizes.heroAction,
    fontWeight: fontWeights.bold,
  },
  backButton: {
    minWidth: 160,
    alignItems: 'center',
    borderRadius: spacing.md,
    paddingHorizontal: spacing.huge,
    paddingVertical: spacing.large,
    backgroundColor: colors.synopsisBackground,
  },
  backButtonText: {
    color: colors.textPrimary,
    fontSize: fontSizes.heroAction,
    fontWeight: fontWeights.bold,
  },
  focusedAction: {
    borderWidth: 4,
    borderColor: colors.focusRing,
    transform: [{scale: 1.06}],
  },
  recommendationsSection: {
    marginTop: spacing.huge,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.rowTitle,
    fontWeight: fontWeights.bold,
    marginBottom: spacing.xxxl,
  },
  recList: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
});
