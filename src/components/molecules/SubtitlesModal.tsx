import React, {useState} from 'react';
import {Modal, ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {strings} from '../../constants/strings';
import {SUBTITLE_OFF_ID} from '../../data/subtitles';
import {SubtitleTrack} from '../../types/subtitles';
import {styles} from './SubtitlesModal.styles';

export interface SubtitlesModalProps {
  isOpen: boolean;
  tracks: SubtitleTrack[];
  selectedTrackId: string;
  onSelectTrack: (trackId: string) => void;
  onClose: () => void;
}

export const SubtitlesModal: React.FC<SubtitlesModalProps> = ({
  isOpen,
  tracks,
  selectedTrackId,
  onSelectTrack,
  onClose,
}) => {
  const [focusedId, setFocusedId] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  const allOptions: Array<{id: string; label: string; kind?: string}> = [
    {id: SUBTITLE_OFF_ID, label: strings.subtitles.off},
    ...tracks.map((t) => ({
      id: t.id,
      label: t.label,
      kind: t.kind,
    })),
  ];

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay} testID="subtitles-modal-overlay">
        <TVFocusGuideView
          style={styles.modalCard}
          autoFocus
          testID="subtitles-modal">
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconBadge}>
              <Text style={styles.iconBadgeText}>
                {strings.subtitles.ccBadge}
              </Text>
            </View>
            <Text style={styles.title}>{strings.subtitles.selectLanguage}</Text>
            <Text style={styles.subtitle}>
              {strings.subtitles.selectLanguageDesc}
            </Text>
          </View>

          {/* Subtitle Options List */}
          <ScrollView
            style={styles.trackListContainer}
            contentContainerStyle={styles.trackListContent}
            showsVerticalScrollIndicator={false}>
            {allOptions.map((option, index) => {
              const isSelected = option.id === selectedTrackId;
              const isFocused = focusedId === option.id;

              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.trackButton,
                    isSelected && styles.trackButtonSelected,
                    isFocused && styles.trackButtonFocused,
                  ]}
                  hasTVPreferredFocus={index === 0 && !focusedId}
                  onFocus={() => setFocusedId(option.id)}
                  onBlur={() => setFocusedId(null)}
                  onPress={() => {
                    onSelectTrack(option.id);
                  }}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={strings.accessibility.selectSubtitleTrack(
                    option.label,
                    isSelected,
                  )}
                  testID={`subtitle-track-${option.id}`}>
                  <View style={styles.trackInfoRow}>
                    <Text
                      style={[
                        styles.trackLabel,
                        isSelected && styles.trackLabelSelected,
                      ]}>
                      {option.label}
                    </Text>
                    {isSelected && (
                      <View style={styles.selectedBadge}>
                        <Text style={styles.selectedBadgeText}>
                          {strings.subtitles.activeTrack}
                        </Text>
                      </View>
                    )}
                  </View>

                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Close / Done Button */}
          <TouchableOpacity
            style={[
              styles.closeButton,
              focusedId === 'close' && styles.closeButtonFocused,
            ]}
            onFocus={() => setFocusedId('close')}
            onBlur={() => setFocusedId(null)}
            onPress={onClose}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={strings.accessibility.closeSubtitlesModal}
            testID="subtitles-modal-close">
            <Text style={styles.closeButtonText}>
              {strings.subtitles.close}
            </Text>
          </TouchableOpacity>
        </TVFocusGuideView>
      </View>
    </Modal>
  );
};
