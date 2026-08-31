import {StyleSheet} from 'react-native';
import {colors} from '../theme/colors';
import {fontSizes, fontWeights} from '../theme/fonts';
import {sizes, spacing} from '../theme/sizes';

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
  headerSection: {
    marginVertical: spacing.huge,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.lg,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSizes.moviesTitle,
    fontWeight: fontWeights.bold,
  },
  countBadge: {
    color: colors.heroAccent,
    fontSize: fontSizes.subheading,
    fontWeight: fontWeights.semibold,
  },
  subtitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.subheading,
    opacity: 0.8,
    marginTop: spacing.md,
  },
  gridContent: {
    paddingBottom: spacing.section,
  },
  cardItemWrapper: {
    marginRight: spacing.xlarge,
    marginBottom: spacing.huge,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.section,
    paddingHorizontal: spacing.huge,
  },
  stateTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.rowTitle,
    fontWeight: fontWeights.bold,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  stateSubtitle: {
    color: colors.textSecondary,
    fontSize: fontSizes.subheading,
    textAlign: 'center',
    maxWidth: 600,
    lineHeight: 28,
    marginBottom: spacing.xxl,
  },
  actionButton: {
    backgroundColor: colors.heroAccent,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
    borderRadius: spacing.md,
    minWidth: 180,
    alignItems: 'center',
  },
  actionButtonFocused: {
    backgroundColor: colors.focusRing,
    transform: [{scale: 1.05}],
  },
  actionButtonText: {
    color: colors.black,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing.md,
    flexWrap: 'wrap',
  },
  secondaryActionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: spacing.borderThin,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
    borderRadius: spacing.md,
    minWidth: 180,
    alignItems: 'center',
  },
  secondaryActionButtonText: {
    color: colors.textPrimary,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },
});
