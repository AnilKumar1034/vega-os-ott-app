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
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.5)',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 8,
  },
  errorBannerText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
});
