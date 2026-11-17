import {StyleSheet} from 'react-native';
import {fontWeights} from '../../theme/fonts';

export const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 48,
    bottom: 96,
    zIndex: 25,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(14, 18, 28, 0.88)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 17,
    height: 34,
    paddingHorizontal: 14,
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonFocused: {
    backgroundColor: '#FFFFFF',
    borderColor: '#00ADE1',
    transform: [{scale: 1.04}],
    shadowColor: '#00ADE1',
    shadowOpacity: 0.7,
    shadowRadius: 10,
  },
  icon: {
    fontSize: 10.5,
    marginRight: 6,
    color: '#FFFFFF',
  },
  iconFocused: {
    color: '#000000',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.4,
  },
  textFocused: {
    color: '#000000',
  },
});
