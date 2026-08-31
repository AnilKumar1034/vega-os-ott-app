import React from 'react';
import {Text, View} from 'react-native';
import {styles} from './SubtitleOverlay.styles';

export interface SubtitleOverlayProps {
  currentCueText: string | null;
  isControlsVisible?: boolean;
}

export const SubtitleOverlay: React.FC<SubtitleOverlayProps> = ({
  currentCueText,
  isControlsVisible = false,
}) => {
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
      <View style={styles.textCapsule}>
        <Text
          style={styles.subtitleText}
          testID="player-subtitle-text"
          numberOfLines={3}>
          {currentCueText}
        </Text>
      </View>
    </View>
  );
};
