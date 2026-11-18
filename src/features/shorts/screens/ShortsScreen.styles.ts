import {StyleSheet} from 'react-native';
import {colors} from '../../../theme/colors';
import {spacing} from '../../../theme/sizes';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.screenBackground,
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  contentGuide: {
    flex: 1,
    paddingHorizontal: spacing.extraHuge,
    paddingTop: spacing.large,
    paddingBottom: spacing.large,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.huge,
  },
  headerTitleArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBadge: {
    backgroundColor: colors.heroAccent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginRight: spacing.huge,
  },
  headerBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  headerTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    marginLeft: spacing.huge,
  },
  categoryScroll: {
    maxHeight: 36,
    marginBottom: spacing.huge,
  },
  categoryList: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginRight: spacing.huge,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  categoryTabFocused: {
    borderColor: colors.focusedTint,
    backgroundColor: 'rgba(56, 189, 248, 0.25)',
    transform: [{scale: 1.05}],
  },
  categoryTabActive: {
    backgroundColor: colors.activeTint,
    borderColor: colors.activeTint,
  },
  categoryTabText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  categoryTabTextActive: {
    color: colors.white,
    fontWeight: '800',
  },
  mainStage: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: spacing.huge,
  },
  previewContainer: {
    width: 170,
    height: 300, // 9:16 aspect ratio
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.cardBackground,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: colors.black,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.7,
    shadowRadius: 12,
    elevation: 10,
    position: 'relative',
  },
  previewFocused: {
    borderColor: colors.focusedTint,
    shadowColor: colors.focusedTint,
  },
  previewImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'space-between',
    padding: spacing.huge,
  },
  previewTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewDurationBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  previewDurationText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  previewCenterPlayHint: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIconText: {
    color: colors.white,
    fontSize: 16,
    marginLeft: 3,
  },
  playNotice: {
    color: colors.textSecondary,
    fontSize: 9,
    marginTop: 6,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  metadataContainer: {
    flex: 1,
    marginLeft: spacing.extraHuge,
    justifyContent: 'space-between',
  },
  navigationControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: spacing.huge,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  navButtonFocused: {
    borderColor: colors.focusedTint,
    backgroundColor: colors.focusedTint,
    transform: [{scale: 1.05}],
  },
  navButtonText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  navButtonTextFocused: {
    color: colors.black,
  },
  remoteHintText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontStyle: 'italic',
  },
  bottomRail: {
    height: 120,
    marginTop: spacing.xs,
  },
  bottomRailTitle: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  railList: {
    paddingVertical: spacing.xs,
  },
});
