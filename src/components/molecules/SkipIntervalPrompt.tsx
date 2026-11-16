import React, {useCallback, useState} from 'react';
import {Text, TouchableOpacity} from 'react-native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {strings} from '../../constants/strings';
import {styles} from './SkipIntervalPrompt.styles';

export interface SkipIntervalPromptProps {
  isVisible: boolean;
  type: 'intro' | 'recap';
  targetPosition: number;
  onSkip: (targetPosition: number) => void;
  onInteraction?: () => void;
}

export const SkipIntervalPrompt: React.FC<SkipIntervalPromptProps> = ({
  isVisible,
  type,
  targetPosition,
  onSkip,
  onInteraction,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handlePress = useCallback(() => {
    onInteraction?.();
    onSkip(targetPosition);
  }, [onInteraction, onSkip, targetPosition]);

  if (!isVisible) {
    return null;
  }

  const label =
    type === 'recap'
      ? strings.playerControls.skipRecap || 'Skip Recap'
      : strings.playerControls.skipIntro || 'Skip Intro';

  const accessibilityLabel =
    type === 'recap'
      ? strings.accessibility.skipRecapButton || 'Skip recap'
      : strings.accessibility.skipIntroButton || 'Skip intro';

  const testId = type === 'recap' ? 'skip-recap-prompt' : 'skip-intro-prompt';

  return (
    <TVFocusGuideView style={styles.container} autoFocus>
      <TouchableOpacity
        style={[styles.button, isFocused && styles.buttonFocused]}
        onFocus={() => {
          onInteraction?.();
          setIsFocused(true);
        }}
        onBlur={() => setIsFocused(false)}
        onPress={handlePress}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        testID="player-skip-interval-prompt">
        <Text style={[styles.icon, isFocused && styles.iconFocused]}>⏭</Text>
        <Text
          style={[styles.text, isFocused && styles.textFocused]}
          testID={testId}>
          {label}
        </Text>
      </TouchableOpacity>
    </TVFocusGuideView>
  );
};
