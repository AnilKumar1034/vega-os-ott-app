import {StyleSheet} from 'react-native';
import {colors} from '../../theme/colors';
import {fontSizes, fontWeights} from '../../theme/fonts';
import {borderRadius, spacing} from '../../theme/sizes';

export const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.huge,
    right: spacing.huge,
    bottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 8,
    pointerEvents: 'none',
  },
  containerWithControls: {
    bottom: 72,
  },
  textCapsule: {
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    maxWidth: '80%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitleText: {
    color: colors.textPrimary,
    fontSize: fontSizes.userName ? fontSizes.userName - 4 : 10,
    fontWeight: fontWeights.bold,
    textAlign: 'center',
    lineHeight: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 2,
    letterSpacing: 0.3,
  },
});
