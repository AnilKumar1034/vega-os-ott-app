import {StyleSheet} from 'react-native';
import {colors} from '../../../theme/colors';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.screenBackground,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 48,
  },
  contentGuide: {
    paddingHorizontal: 48,
    paddingVertical: 16,
  },
  mainRow: {
    flexDirection: 'row',
    gap: 36,
    marginTop: 12,
  },
  leftColumn: {
    flex: 1.1,
    gap: 16,
  },
  rightColumn: {
    flex: 1,
    gap: 20,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  optionsCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 16,
  },
  optionGroup: {
    gap: 10,
  },
  optionLabel: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  optionSublabel: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pillButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.cardBackgroundSubtle,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  pillButtonSelected: {
    backgroundColor: 'rgba(229, 9, 20, 0.2)',
    borderColor: colors.heroAccent,
  },
  pillButtonFocused: {
    borderColor: colors.focusRing,
    transform: [{scale: 1.05}],
  },
  pillButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  pillButtonTextSelected: {
    color: colors.white,
    fontWeight: '800',
  },
  hostInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    gap: 14,
  },
  hostAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.heroAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostAvatarText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '900',
  },
  hostDetails: {
    flex: 1,
  },
  hostName: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  hostRole: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  createButton: {
    backgroundColor: colors.heroAccent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    marginTop: 10,
  },
  createButtonFocused: {
    borderColor: colors.focusRing,
    transform: [{scale: 1.03}],
  },
  createButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  errorBanner: {
    backgroundColor: colors.errorBackground,
    borderWidth: 1,
    borderColor: colors.errorBorder,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  errorBannerText: {
    color: colors.errorText,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
