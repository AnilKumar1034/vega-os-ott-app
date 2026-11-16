import {StyleSheet} from 'react-native';
import {fontSizes, fontWeights} from '../../theme/fonts';
import {borderRadius, spacing} from '../../theme/sizes';

export const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 48,
    bottom: 104,
    zIndex: 25,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 20, 20, 0.88)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },
  buttonFocused: {
    backgroundColor: '#FFFFFF',
    borderColor: '#00A8E1',
    transform: [{scale: 1.05}],
  },
  icon: {
    fontSize: 16,
    marginRight: spacing.sm,
    color: '#FFFFFF',
  },
  iconFocused: {
    color: '#000000',
  },
  text: {
    color: '#FFFFFF',
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.5,
  },
  textFocused: {
    color: '#000000',
  },
});
