import {StyleSheet} from 'react-native';
import {colors} from '../../theme/colors';
import {fontSizes, fontWeights} from '../../theme/fonts';
import {borderRadius, sizes, spacing} from '../../theme/sizes';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.screenBackground,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.extraHuge,
    paddingVertical: spacing.colossal,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.section,
  },
  logo: {
    width: sizes.selectionLogoWidth,
    height: sizes.selectionLogoHeight,
    marginBottom: spacing.xxxl,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSizes.pageTitle,
    fontWeight: fontWeights.extraBold,
    letterSpacing: 0.5,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSizes.button,
    fontWeight: fontWeights.medium,
    textAlign: 'center',
  },
  profilesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: sizes.profileGridMaxWidth,
    marginBottom: spacing.section,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.cardPadding,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: fontSizes.button,
    marginTop: spacing.xxxl,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.colossal,
    backgroundColor: colors.errorBackground,
    borderRadius: borderRadius.xxl,
    borderWidth: spacing.borderThin,
    borderColor: colors.errorBorder,
    maxWidth: sizes.errorContainerMaxWidth,
  },
  errorText: {
    color: colors.errorText,
    fontSize: fontSizes.body,
    textAlign: 'center',
    marginBottom: spacing.xlarge,
  },
  retryButton: {
    paddingHorizontal: spacing.giant,
    paddingVertical: spacing.xl,
    backgroundColor: colors.heroAccent,
    borderRadius: borderRadius.lg,
    borderWidth: spacing.borderThick,
    borderColor: colors.transparent,
  },
  retryButtonFocused: {
    borderColor: colors.textPrimary,
    transform: [{scale: 1.05}],
  },
  retryButtonText: {
    color: colors.textPrimary,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.boldWeight,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.huge,
  },
  footer: {
    position: 'absolute',
    bottom: spacing.giant,
    alignItems: 'center',
  },
  footerText: {
    color: colors.footerTextMuted,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.medium,
  },
});
