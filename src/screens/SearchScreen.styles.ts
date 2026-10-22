import {StyleSheet} from 'react-native';
import {colors} from '../theme/colors';
import {fontSizes, fontWeights} from '../theme/fonts';
import {borderRadius, sizes, spacing} from '../theme/sizes';

export const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: colors.screenBackground,
  },
  content: {
    flex: 1,
    paddingLeft: sizes.menuWidthCollapsed || 90,
    paddingBottom: spacing.contentBottom,
  },
  contentGuide: {
    flex: 1,
    paddingLeft: spacing.screenPadding,
    paddingRight: spacing.screenHorizontal,
  },
  contentList: {
    paddingBottom: spacing.section,
  },

  // Suggestions & Recent Searches Row
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    paddingRight: spacing.xl,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: fontSizes.label,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  clearHistoryButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: spacing.borderThin,
    borderColor: colors.cardBorder,
    backgroundColor: colors.cardBackgroundSubtle,
  },
  clearHistoryButtonFocused: {
    borderColor: colors.focusRing,
    backgroundColor: colors.heroAccent,
  },
  clearHistoryText: {
    color: colors.textSecondary,
    fontSize: fontSizes.rating,
    fontWeight: fontWeights.semibold,
  },
  clearHistoryTextFocused: {
    color: colors.textPrimary,
  },

  chipsScrollContainer: {
    paddingVertical: spacing.xs,
    paddingRight: spacing.xl,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.large,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.circle,
    backgroundColor: colors.inputBackground,
    borderWidth: spacing.borderThin,
    borderColor: colors.cardBorder,
    marginRight: spacing.sm,
  },
  chipFocused: {
    backgroundColor: colors.heroAccent,
    borderColor: colors.focusRing,
    borderWidth: spacing.borderMedium,
    transform: [{scale: 1.05}],
  },
  chipActive: {
    backgroundColor: colors.heroAccent,
    borderColor: colors.focusRing,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: fontSizes.small,
    fontWeight: fontWeights.medium,
  },
  chipTextFocused: {
    color: colors.textPrimary,
    fontWeight: fontWeights.bold,
  },
  chipTextActive: {
    color: colors.textPrimary,
    fontWeight: fontWeights.bold,
  },
  chipIcon: {
    marginRight: spacing.xs,
  },

  // Discovery Filters Bar
  filterBarContainer: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  filterSectionLabel: {
    color: colors.textSecondary,
    fontSize: fontSizes.portraitBadge,
    fontWeight: fontWeights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xxs,
  },
  filterPill: {
    paddingHorizontal: spacing.large,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.circle,
    backgroundColor: colors.cardBackgroundSubtle,
    borderWidth: spacing.borderThin,
    borderColor: colors.cardBorder,
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillFocused: {
    borderColor: colors.focusRing,
    borderWidth: spacing.borderMedium,
    backgroundColor: colors.inputFocusedBackground,
    transform: [{scale: 1.05}],
  },
  filterPillActive: {
    backgroundColor: colors.heroAccent,
    borderColor: colors.focusRing,
  },
  filterPillActiveFocused: {
    backgroundColor: colors.heroAccent,
    borderColor: colors.focusRing,
    borderWidth: spacing.borderHeavy,
    transform: [{scale: 1.08}],
  },
  filterPillText: {
    color: colors.textSecondary,
    fontSize: fontSizes.small,
    fontWeight: fontWeights.medium,
  },
  filterPillTextFocused: {
    color: colors.textPrimary,
    fontWeight: fontWeights.bold,
  },
  filterPillTextActive: {
    color: colors.textPrimary,
    fontWeight: fontWeights.bold,
  },

  resetFiltersPill: {
    paddingHorizontal: spacing.large,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.circle,
    backgroundColor: colors.errorBackground,
    borderWidth: spacing.borderThin,
    borderColor: colors.errorBorder,
    marginRight: spacing.sm,
  },
  resetFiltersPillFocused: {
    borderColor: colors.focusRing,
    borderWidth: spacing.borderMedium,
    transform: [{scale: 1.06}],
  },
  resetFiltersText: {
    color: colors.errorText,
    fontSize: fontSizes.small,
    fontWeight: fontWeights.bold,
  },
  resetFiltersTextFocused: {
    color: colors.white,
  },

  // Results Status Row
  resultsStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: spacing.xs,
    paddingRight: spacing.xl,
  },
  resultsCountText: {
    color: colors.textSecondary,
    fontSize: fontSizes.label,
    fontWeight: fontWeights.medium,
  },
  activeFilterSummaryText: {
    color: colors.focusedTint,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
  },

  // Loading State
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 220,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: fontSizes.body,
    marginTop: spacing.md,
    fontWeight: fontWeights.medium,
  },

  // Empty / No Results State
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.section,
    paddingHorizontal: spacing.extraHuge,
    minHeight: 250,
  },
  emptyIconContainer: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.circle,
    backgroundColor: colors.cardBackgroundSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: spacing.borderThin,
    borderColor: colors.cardBorder,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.pageTitle,
    fontWeight: fontWeights.bold,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: fontSizes.caption,
    textAlign: 'center',
    maxWidth: 480,
    lineHeight: 16,
    marginBottom: spacing.large,
  },
  emptyActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButton: {
    paddingHorizontal: spacing.xlarge,
    paddingVertical: spacing.large,
    borderRadius: borderRadius.md,
    backgroundColor: colors.inputBackground,
    borderWidth: spacing.borderThin,
    borderColor: colors.cardBorder,
    marginHorizontal: spacing.sm,
    minWidth: 110,
    alignItems: 'center',
  },
  actionButtonFocused: {
    backgroundColor: colors.heroAccent,
    borderColor: colors.focusRing,
    borderWidth: spacing.borderMedium,
    transform: [{scale: 1.06}],
  },
  actionButtonText: {
    color: colors.textSecondary,
    fontSize: fontSizes.button,
    fontWeight: fontWeights.semibold,
  },
  actionButtonTextFocused: {
    color: colors.textPrimary,
    fontWeight: fontWeights.bold,
  },

  // Error State
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.section,
    minHeight: 220,
  },
  errorTitle: {
    color: colors.errorText,
    fontSize: fontSizes.pageTitle,
    fontWeight: fontWeights.bold,
    marginBottom: spacing.xs,
  },
  errorSubtitle: {
    color: colors.textSecondary,
    fontSize: fontSizes.caption,
    textAlign: 'center',
    maxWidth: 440,
    marginBottom: spacing.large,
  },

  // Query Too Long Alert
  queryWarningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorBackground,
    borderWidth: spacing.borderThin,
    borderColor: colors.errorBorder,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
    marginRight: spacing.xl,
  },
  queryWarningText: {
    color: colors.errorText,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.medium,
  },
});
