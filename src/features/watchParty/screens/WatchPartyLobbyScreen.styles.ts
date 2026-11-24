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
  },
  leftColumn: {
    flex: 1.1,
    gap: 16,
  },
  rightColumn: {
    flex: 1.3,
    gap: 16,
  },
  waitingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  waitingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F59E0B',
  },
  waitingText: {
    color: '#FDE68A',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  leaveButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.5)',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaveButtonFocused: {
    borderColor: colors.focusRing,
    backgroundColor: '#EF4444',
    transform: [{scale: 1.05}],
  },
  leaveButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
  refreshButton: {
    backgroundColor: colors.cardBackgroundSubtle,
    borderWidth: 2,
    borderColor: colors.cardBorderSubtle,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButtonFocused: {
    borderColor: colors.focusRing,
    backgroundColor: colors.cardHoverBackground,
    transform: [{scale: 1.05}],
  },
  refreshButtonText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
});
