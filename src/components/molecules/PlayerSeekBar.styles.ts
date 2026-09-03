import {StyleSheet, ViewStyle} from 'react-native';
import {SEEKBAR_COLORS} from '../../constants/seekbarColors';
import { colors } from '../../theme/colors';

const TICK_SIZE = 8;
const THUMB_SIZE = 36;
const SEEKBAR_HEIGHT = 8;

export const circleStyle = (diameter: number): ViewStyle => ({
  width: diameter,
  height: diameter,
  borderRadius: diameter / 2,
});

export const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.seekBarBackground,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: SEEKBAR_COLORS.SHADOW_BLACK,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  topControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 12,
  },
  leftControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playPauseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.chipBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.controlFocusedBackground
  },
  playPauseButtonFocused: {
    backgroundColor: SEEKBAR_COLORS.PRIMARY_BLUE,
    borderColor: SEEKBAR_COLORS.WHITE,
    transform: [{scale: 1.1}],
  },
  playPauseIconText: {
    color: SEEKBAR_COLORS.WHITE,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  timeText: {
    color: SEEKBAR_COLORS.WHITE,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginLeft: 14,
  },
  centerExtraControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeSelectorLabel: {
    color: SEEKBAR_COLORS.MEDIUM_GREY,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginRight: 4,
  },
  typePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: colors.buttonSecondaryBackground,
    borderWidth: 1.5,
    borderColor: colors.controlBackground,
  },
  typePillActive: {
    backgroundColor: colors.seekBarTypePil,
    borderColor: SEEKBAR_COLORS.PRIMARY_BLUE,
  },
  typePillFocused: {
    backgroundColor: SEEKBAR_COLORS.PRIMARY_BLUE,
    borderColor: SEEKBAR_COLORS.WHITE,
    transform: [{scale: 1.05}],
  },
  typePillText: {
    color: SEEKBAR_COLORS.WHITE,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  typePillTextActive: {
    color: SEEKBAR_COLORS.WHITE,
  },
  actionButton: {
    backgroundColor: colors.seekBarActionButton,
    borderColor: SEEKBAR_COLORS.PRIMARY_BLUE,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  actionButtonFocused: {
    backgroundColor: SEEKBAR_COLORS.PRIMARY_BLUE,
    borderColor: SEEKBAR_COLORS.WHITE,
    transform: [{scale: 1.05}],
  },
  actionButtonText: {
    color: SEEKBAR_COLORS.WHITE,
    fontSize: 13,
    fontWeight: '700',
  },
  limitsBadge: {
    backgroundColor: colors.seekBarLimitsBadge,
    borderColor: SEEKBAR_COLORS.YELLOW,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  limitsBadgeText: {
    color: SEEKBAR_COLORS.YELLOW,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  seekbarWrapper: {
    width: '100%',
    paddingVertical: 8,
    minHeight: 50,
    justifyContent: 'center',
  },
  focusedThumb: {
    borderRadius: 20,
    height: THUMB_SIZE,
    width: THUMB_SIZE,
    backgroundColor: SEEKBAR_COLORS.PRIMARY_BLUE,
  },
  unfocusedThumb: {
    borderRadius: 20,
    height: THUMB_SIZE,
    width: 10,
    backgroundColor: SEEKBAR_COLORS.PRIMARY_BLUE,
  },
  markersBar: {
    height: SEEKBAR_HEIGHT,
  },
  seekbarTrackTimeshiftPart: {
    backgroundColor: 'transparent',
  },
  savedDelayArrow: {
    width: 18,
    height: 18,
    left: '-50%',
    top: (SEEKBAR_HEIGHT + THUMB_SIZE) / 2 - 4,
  },
  tickStyle: {
    position: 'relative',
    top: (SEEKBAR_HEIGHT - TICK_SIZE) / 2,
    left: '-50%',
    backgroundColor: SEEKBAR_COLORS.WHITE,
  },
  belowMarker: {
    height: 36,
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  belowMarkerText: {
    color: SEEKBAR_COLORS.WHITE,
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 18,
    backgroundColor: colors.seekBarBelowMarkerText,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  limitMarker: {
    height: 28,
    width: 5,
    borderRadius: 3,
    backgroundColor: SEEKBAR_COLORS.WHITE,
    position: 'relative',
    top: -10,
    left: '-50%',
  },
});
