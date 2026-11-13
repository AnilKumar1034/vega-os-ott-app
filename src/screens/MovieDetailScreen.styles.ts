import {StyleSheet} from 'react-native';
import {colors} from '../theme/colors';
import {fontSizes, fontWeights, lineHeights} from '../theme/fonts';
import {borderRadius, sizes, spacing} from '../theme/sizes';

export const styles = StyleSheet.create({
  background: {
    flex: 1,
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
    paddingLeft: sizes.menuWidthCollapsed,
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
    borderWidth: spacing.borderThick,
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
    lineHeight: lineHeights.tileLabel,
    opacity: 0.9,
    marginBottom: spacing.huge,
    maxWidth: sizes.movieDetailDescriptionMaxWidth,
  },
  progressSection: {
    marginBottom: spacing.huge,
    maxWidth: sizes.movieDetailDescriptionMaxWidth,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  progressLabel: {
    color: colors.heroAccent,
    fontSize: fontSizes.heroMeta,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  progressValueLabel: {
    color: colors.textPrimary,
    fontSize: fontSizes.heroMeta,
    fontWeight: fontWeights.semibold,
    opacity: 0.9,
  },
  progressTrack: {
    height: sizes.movieDetailProgressTrackHeight,
    borderRadius: borderRadius.circle,
    backgroundColor: colors.progressTrack,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.heroAccent,
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
    flexWrap: 'wrap',
  },
  playButton: {
    minWidth: sizes.movieDetailPlayMinWidth,
    alignItems: 'center',
    borderRadius: spacing.md,
    paddingHorizontal: spacing.colossal,
    paddingVertical: spacing.large,
    backgroundColor: colors.white,
    marginRight: spacing.xlarge,
  },
  playButtonText: {
    color: colors.actionPrimaryText,
    fontSize: fontSizes.heroAction,
    fontWeight: fontWeights.bold,
  },
  secondaryButton: {
    minWidth: sizes.movieDetailSecondaryMinWidth,
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
  addFavouriteButton: {
    backgroundColor: colors.gold,
  },
  removeFavouriteButton: {
    backgroundColor: colors.goldDeep,
  },
  removeWatchlistButton: {
    backgroundColor: colors.blueDeep,
  },
  addFavouriteText: {
    color: colors.actionPrimaryTextOnLight,
  },
  removeFavouriteText: {
    color: colors.white,
  },
  removeWatchlistText: {
    color: colors.white,
  },
  backButton: {
    minWidth: sizes.movieDetailBackMinWidth,
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
  inlineToast: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
    maxWidth: sizes.detailToastMaxWidth,
    paddingHorizontal: spacing.large,
    paddingVertical: spacing.sm,
    borderRadius: spacing.sm,
    backgroundColor: colors.ratingBackground,
    borderWidth: spacing.borderThin,
    borderColor: colors.borderLight,
  },
  inlineToastText: {
    color: colors.textPrimary,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
  },
  focusedAction: {
    borderWidth: spacing.borderThin,
    borderColor: colors.focusRing,
    // transform: [{scale: 1.06}],
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

  // Trailer button
  trailerButton: {
    minWidth: sizes.movieDetailSecondaryMinWidth,
    alignItems: 'center',
    borderRadius: spacing.md,
    paddingHorizontal: spacing.giant,
    paddingVertical: spacing.large,
    backgroundColor: colors.controlBackground,
    marginRight: spacing.xlarge,
  },
  trailerButtonText: {
    color: colors.textPrimary,
    fontSize: fontSizes.heroAction,
    fontWeight: fontWeights.bold,
  },

  // Entitlement action button & badges
  subscribeButton: {
    minWidth: sizes.movieDetailPlayMinWidth,
    alignItems: 'center',
    borderRadius: spacing.md,
    paddingHorizontal: spacing.colossal,
    paddingVertical: spacing.large,
    backgroundColor: colors.heroAccent,
    marginRight: spacing.xlarge,
  },
  subscribeButtonText: {
    color: colors.white,
    fontSize: fontSizes.heroAction,
    fontWeight: fontWeights.bold,
  },
  entitlementBadge: {
    backgroundColor: colors.goldDeep,
    borderRadius: spacing.xs,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    marginRight: spacing.xxl,
  },
  entitlementBadgeText: {
    color: colors.white,
    fontSize: fontSizes.cardBadge,
    fontWeight: fontWeights.bold,
    letterSpacing: 1.2,
  },

  // Season Tabs
  seasonsSection: {
    marginTop: spacing.huge,
    marginBottom: spacing.section,
  },
  seasonTabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.large,
  },
  seasonTab: {
    paddingHorizontal: spacing.section,
    paddingVertical: spacing.large,
    borderRadius: spacing.sm,
    backgroundColor: colors.subPillBackground,
    marginRight: spacing.xlarge,
    borderWidth: spacing.borderThin,
    borderColor: colors.cardBorderLight,
  },
  seasonTabFocused: {
    borderColor: colors.focusRing,
    backgroundColor: colors.controlFocusedBackground,
  },
  seasonTabSelected: {
    backgroundColor: colors.heroAccent,
    borderColor: colors.heroAccent,
  },
  seasonTabText: {
    color: colors.textSecondary,
    fontSize: fontSizes.heroAction,
    fontWeight: fontWeights.semibold,
  },
  seasonTabTextFocused: {
    color: colors.white,
  },
  seasonTabTextSelected: {
    color: colors.white,
    fontWeight: fontWeights.bold,
  },

  // Episode Cards
  episodesSection: {
    marginTop: spacing.xlarge,
    marginBottom: spacing.section,
  },
  episodesList: {
    paddingVertical: spacing.large,
  },
  episodeCard: {
    width: 280,
    backgroundColor: colors.cardBackground,
    borderRadius: spacing.md,
    marginRight: spacing.section,
    overflow: 'hidden',
    borderWidth: spacing.borderThin,
    borderColor: colors.cardBorder,
  },
  episodeCardFocused: {
    borderColor: colors.focusRing,
    borderWidth: spacing.borderThick,
  },
  episodeThumbnailWrapper: {
    width: '100%',
    height: 140,
    backgroundColor: colors.dialogBackground,
    position: 'relative',
  },
  episodeThumbnail: {
    width: '100%',
    height: '100%',
  },
  episodeDurationBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.ratingBackground,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: spacing.xs,
  },
  episodeDurationText: {
    color: colors.white,
    fontSize: fontSizes.cardBadge,
    fontWeight: fontWeights.bold,
  },
  episodeDetails: {
    padding: spacing.large,
  },
  episodeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  episodeBadge: {
    color: colors.heroAccent,
    fontSize: fontSizes.cardBadge,
    fontWeight: fontWeights.bold,
    letterSpacing: 1,
  },
  episodeRating: {
    color: colors.goldStar,
    fontSize: fontSizes.portraitBadge,
    fontWeight: fontWeights.bold,
  },
  episodeTitle: {
    color: colors.white,
    fontSize: fontSizes.cardTitle,
    fontWeight: fontWeights.bold,
    marginBottom: spacing.sm,
  },
  episodeDescription: {
    color: colors.textSecondary,
    fontSize: fontSizes.bodySmall,
    lineHeight: 14,
    marginBottom: spacing.sm,
  },
  episodeProgressContainer: {
    height: 3,
    backgroundColor: colors.progressTrack,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  episodeProgressBar: {
    height: '100%',
    backgroundColor: colors.heroAccent,
  },
  episodeWatchedPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.kidsGreen,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: spacing.xs,
    marginTop: spacing.xs,
  },
  episodeWatchedText: {
    color: colors.white,
    fontSize: fontSizes.cardBadge,
    fontWeight: fontWeights.bold,
  },
  emptyEpisodesContainer: {
    paddingVertical: spacing.section,
    alignItems: 'center',
  },
  emptyEpisodesText: {
    color: colors.textSecondary,
    fontSize: fontSizes.body,
  },

  // Cast & Crew Cards
  castSection: {
    marginTop: spacing.section,
    marginBottom: spacing.section,
  },
  castList: {
    paddingVertical: spacing.large,
  },
  castCard: {
    width: 130,
    alignItems: 'center',
    padding: spacing.large,
    backgroundColor: colors.cardBackgroundMuted,
    borderRadius: spacing.md,
    marginRight: spacing.large,
    borderWidth: spacing.borderThin,
    borderColor: colors.cardBorderLight,
  },
  castCardFocused: {
    borderColor: colors.focusRing,
    borderWidth: spacing.borderThick,
    backgroundColor: colors.controlFocusedBackground,
  },
  castAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.subPillBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderWidth: spacing.borderThin,
    borderColor: colors.borderLight,
  },
  castInitials: {
    color: colors.white,
    fontSize: fontSizes.subheading,
    fontWeight: fontWeights.bold,
  },
  castName: {
    color: colors.white,
    fontSize: fontSizes.bodySmall,
    fontWeight: fontWeights.semibold,
    textAlign: 'center',
    marginBottom: spacing.xxs,
  },
  castRole: {
    color: colors.textSecondary,
    fontSize: fontSizes.cardBadge,
    textAlign: 'center',
  },

  // Loading & Error States
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.colossal,
  },
  loadingText: {
    color: colors.textPrimary,
    fontSize: fontSizes.subheading,
    marginTop: spacing.section,
    fontWeight: fontWeights.semibold,
  },
  errorCard: {
    maxWidth: 480,
    alignItems: 'center',
    backgroundColor: colors.dialogBackground,
    borderRadius: spacing.large,
    padding: spacing.section,
    borderWidth: spacing.borderThin,
    borderColor: colors.errorBorder,
  },
  errorBadge: {
    backgroundColor: colors.errorBackground,
    paddingHorizontal: spacing.large,
    paddingVertical: spacing.xs,
    borderRadius: spacing.xs,
    marginBottom: spacing.large,
  },
  errorBadgeText: {
    color: colors.errorText,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
    letterSpacing: 1.2,
  },
  errorTitle: {
    color: colors.white,
    fontSize: fontSizes.pageTitle,
    fontWeight: fontWeights.bold,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  errorMessage: {
    color: colors.textSecondary,
    fontSize: fontSizes.body,
    textAlign: 'center',
    marginBottom: spacing.section,
    lineHeight: 18,
  },
  errorButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryButton: {
    paddingHorizontal: spacing.section,
    paddingVertical: spacing.large,
    borderRadius: spacing.sm,
    backgroundColor: colors.heroAccent,
    marginRight: spacing.large,
  },
  retryButtonFocused: {
    borderColor: colors.focusRing,
    borderWidth: spacing.borderThin,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: fontSizes.button,
    fontWeight: fontWeights.bold,
  },
  homeButton: {
    paddingHorizontal: spacing.section,
    paddingVertical: spacing.large,
    borderRadius: spacing.sm,
    backgroundColor: colors.actionSecondary,
  },
  homeButtonFocused: {
    borderColor: colors.focusRing,
    borderWidth: spacing.borderThin,
  },
  homeButtonText: {
    color: colors.white,
    fontSize: fontSizes.button,
    fontWeight: fontWeights.bold,
  },
});
