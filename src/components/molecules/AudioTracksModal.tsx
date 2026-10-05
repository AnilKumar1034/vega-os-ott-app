import React, {useRef, useState} from 'react';
import {Modal, ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {TVFocusGuideView, useTVEventHandler} from '@amazon-devices/react-native-kepler';
import {strings} from '../../constants/strings';
import {AudioTrack} from '../../types/audioTracks';
import {styles} from './AudioTracksModal.styles';
import {isBackEvent, isKeyDown, isSelectEvent} from '../../utils/inputUtils';

export interface AudioTracksModalProps {
  isOpen: boolean;
  tracks: AudioTrack[];
  selectedTrackId: string;
  onSelectTrack: (trackId: string) => void;
  onClose: () => void;
}

export const AudioTracksModal: React.FC<AudioTracksModalProps> = ({
  isOpen,
  tracks,
  selectedTrackId,
  onSelectTrack,
  onClose,
}) => {
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const focusedIdRef = useRef<string | null>(focusedId);
  focusedIdRef.current = focusedId;

  useTVEventHandler((evt) => {
    if (!isOpen) {
      return;
    }
    if (!evt) {
      return;
    }
    if (!isKeyDown(evt.eventKeyAction)) {
      return;
    }
    const type = evt.eventType?.toLowerCase();

    if (isBackEvent(type)) {
      onClose();
      return;
    }

    if (isSelectEvent(type)) {
      const current = focusedIdRef.current;
      if (current === 'close') {
        onClose();
      } else if (current) {
        onSelectTrack(current);
      }
    }
  });

  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay} testID="audio-tracks-modal-overlay">
        <TVFocusGuideView
          style={styles.modalCard}
          autoFocus
          testID="audio-tracks-modal">
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconBadge}>
              <Text style={styles.iconBadgeText}>
                {strings.audioTracks.audioBadge}
              </Text>
            </View>
            <Text style={styles.title}>
              {strings.audioTracks.selectAudioTrack}
            </Text>
            <Text style={styles.subtitle}>
              {strings.audioTracks.selectAudioTrackDesc}
            </Text>
          </View>

          {/* Audio Options List */}
          <ScrollView
            style={styles.trackListContainer}
            contentContainerStyle={styles.trackListContent}
            showsVerticalScrollIndicator={false}>
            {tracks.map((option, index) => {
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
                  hasTVPreferredFocus={
                    (!focusedId && isSelected) || (!focusedId && index === 0)
                  }
                  onFocus={() => setFocusedId(option.id)}
                  onBlur={() => setFocusedId(null)}
                  onPress={() => {
                    onSelectTrack(option.id);
                  }}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={strings.accessibility.selectAudioTrack(
                    option.label,
                    isSelected,
                  )}
                  testID={`audio-track-${option.id}`}>
                  <View style={styles.trackInfoRow}>
                    <Text
                      style={[
                        styles.trackLabel,
                        isSelected && styles.trackLabelSelected,
                      ]}>
                      {option.label}
                    </Text>

                    {option.channels && (
                      <View style={styles.formatBadge}>
                        <Text style={styles.formatBadgeText}>
                          {option.channels}
                        </Text>
                      </View>
                    )}

                    {isSelected && (
                      <View style={styles.selectedBadge}>
                        <Text style={styles.selectedBadgeText}>
                          {strings.audioTracks.activeTrack}
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
            accessibilityLabel={strings.accessibility.closeAudioTracksModal}
            testID="audio-tracks-modal-close">
            <Text style={styles.closeButtonText}>
              {strings.audioTracks.close}
            </Text>
          </TouchableOpacity>
        </TVFocusGuideView>
      </View>
    </Modal>
  );
};
