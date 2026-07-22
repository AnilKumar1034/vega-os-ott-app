import {StyleSheet} from 'react-native';
import {colors} from '../../theme/colors';
import {fontSizes, fontWeights, lineHeights} from '../../theme/fonts';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 560,
    overflow: 'hidden',
    borderRadius: 0,
    justifyContent: 'flex-end',
    marginTop: 24,
  },
  backgroundImage: {
    opacity: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.heroOverlay,
  },
  content: {
    width: '58%',
    paddingHorizontal: 72,
    paddingVertical: 64,
    backgroundColor: colors.heroContentOverlay,
  },
  eyebrow: {
    color: colors.textPrimary,
    fontSize: fontSizes.heroEyebrow,
    fontWeight: fontWeights.bold,
    letterSpacing: 4,
    marginBottom: 18,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSizes.heroTitle,
    lineHeight: lineHeights.heroTitle,
    fontWeight: fontWeights.bold,
  },
  description: {
    color: colors.textPrimary,
    fontSize: fontSizes.heroDescription,
    lineHeight: lineHeights.heroDescription,
    marginTop: 24,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 38,
  },
  metaText: {
    color: colors.textPrimary,
    fontSize: fontSizes.heroMeta,
    fontWeight: fontWeights.semibold,
  },
  metaDot: {
    color: colors.heroAccent,
    fontSize: fontSizes.heroMeta,
    marginHorizontal: 16,
  },
});
