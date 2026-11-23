import {StyleSheet} from 'react-native';
import {colors} from '../../../theme/colors';
import {spacing} from '../../../theme/sizes';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1B232A', // Dark slate/navy matte matching reference screenshot
  },
  browseContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#0F1014',
  },
  browseContent: {
    flex: 1,
    paddingHorizontal: spacing.extraHuge,
    paddingLeft: spacing.headerLogoWidth,
    paddingTop: spacing.large,
    paddingBottom: spacing.large,
  },
  browseGrid: {
    paddingBottom: 40,
    paddingTop: spacing.xs,
  },
  browseGridRow: {
    justifyContent: 'flex-start',
    marginBottom: 20,
  },
  browseCardWrapper: {
    marginRight: 20,
  },
  playerTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  closeButtonFocused: {
    backgroundColor: colors.white,
    borderColor: colors.white,
    transform: [{scale: 1.08}],
    shadowColor: colors.white,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButtonIcon: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
    marginRight: 6,
  },
  closeButtonIconFocused: {
    color: colors.black,
  },
  closeButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  closeButtonTextFocused: {
    color: colors.black,
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  ambientBackdrop: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.12,
  },
  ambientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(27, 35, 42, 0.88)',
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
    marginBottom: spacing.extraHuge,
  },
  headerTitleArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBadge: {
    backgroundColor: '#FF0000',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginRight: spacing.huge,
  },
  headerBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  headerTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    marginLeft: spacing.huge,
  },
  categoryScroll: {
    maxHeight: 34,
    marginBottom: spacing.extraHuge,
  },
  categoryList: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryTab: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginRight: spacing.huge,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  categoryTabFocused: {
    borderColor: colors.white,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    transform: [{scale: 1.05}],
  },
  categoryTabActive: {
    backgroundColor: colors.white,
    borderColor: colors.white,
  },
  categoryTabText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 11,
    fontWeight: '600',
  },
  categoryTabTextActive: {
    color: colors.black,
    fontWeight: '800',
  },
  mainStage: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  previewContainer: {
    // width: 170,
    // height: 300, // 9:16 aspect ratio
    width: 280,
    height: 480,
    borderRadius: 24, // Distinctive white rounded frame matching reference image
    overflow: 'hidden',
    backgroundColor: '#0F141C',
    borderWidth: 3.5,
    borderColor: '#FFFFFF',
    shadowColor: colors.black,
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.85,
    shadowRadius: 20,
    elevation: 16,
    position: 'relative',
  },
  previewFocused: {
    borderColor: colors.white,
    shadowColor: colors.white,
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
  rightSidePanel: {
    marginLeft: 36,
    // maxWidth: 200,
    // justifyContent: 'center',
    justifyContent: 'flex-end',
  },
  metadataContainer: {
    justifyContent: 'center',
  },
  navigationControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  navButtonFocused: {
    borderColor: colors.white,
    backgroundColor: colors.white,
    transform: [{scale: 1.06}],
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
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 10,
    margin: 16,
  },
  bottomRail: {
    height: 116,
    marginTop: spacing.xs,
  },
  bottomRailTitle: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  railList: {
    paddingVertical: 2,
  },
});
