import React, {useMemo} from 'react';
import {Text, View} from 'react-native';
import {styles} from './SubtitleOverlay.styles';
import {getSubtitleStyleForAppearance} from '../../services/subtitleService';
import {SubtitleAppearanceSettings} from '../../types/playerFeatures';

export interface SubtitleOverlayProps {
  currentCueText: string | null;
  isControlsVisible?: boolean;
  appearance?: SubtitleAppearanceSettings;
}

export const SubtitleOverlay: React.FC<SubtitleOverlayProps> = ({
  currentCueText,
  isControlsVisible = false,
  appearance,
}) => {
  const dynamicStyles = useMemo(() => {
    return getSubtitleStyleForAppearance(appearance);
  }, [appearance]);

  if (!currentCueText || !currentCueText.trim()) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        isControlsVisible && styles.containerWithControls,
      ]}
      pointerEvents="none"
      testID="player-subtitles-overlay">
      <View
        style={[
          styles.textCapsule,
          dynamicStyles.backgroundColor
            ? {
                backgroundColor: dynamicStyles.backgroundColor,
                borderColor: dynamicStyles.borderColor,
              }
            : null,
        ]}>
        <Text
          style={[
            styles.subtitleText,
            dynamicStyles.fontSize
              ? {
                  fontSize: dynamicStyles.fontSize,
                  lineHeight: dynamicStyles.lineHeight,
                  color: dynamicStyles.textColor,
                }
              : null,
          ]}
          testID="player-subtitle-text"
          numberOfLines={3}>
          {currentCueText}
        </Text>
      </View>
    </View>
  );
};
