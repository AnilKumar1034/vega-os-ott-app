import React, {useCallback, useEffect, useRef, useState} from 'react';
import {BackHandler, Modal, ScrollView, Text, TouchableOpacity, View} from 'react-native';
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
  const defaultTrackId = selectedTrackId || tracks[0]?.id || 'close';
  const [focusedId, setFocusedId] = useState<string | null>(defaultTrackId);
  const focusedIdRef = useRef<string | null>(focusedId);
  focusedIdRef.current = focusedId;
  const elementRefs = useRef<Record<string, any>>({});

  const focusElement = useCallback((id: string) => {
    setFocusedId(id);
    const target = elementRefs.current[id];
    if (target && typeof target.requestTVFocus === 'function') {
      target.requestTVFocus();
    }
  }, []);

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

    if (type === 'down') {
      const current = focusedIdRef.current;
      const currentIndex = tracks.findIndex((t) => t.id === current);
      if (currentIndex >= 0 && currentIndex < tracks.length - 1) {
        focusElement(tracks[currentIndex + 1].id);
      } else if (currentIndex === tracks.length - 1) {
        focusElement('close');
      }
      return;
    }

    if (type === 'up') {
      const current = focusedIdRef.current;
      if (current === 'close') {
        if (tracks.length > 0) {
          focusElement(tracks[tracks.length - 1].id);
        }
      } else {
        const currentIndex = tracks.findIndex((t) => t.id === current);
        if (currentIndex > 0) {
          focusElement(tracks[currentIndex - 1].id);
        }
      }
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

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        onClose();
        return true;
      },
    );
    return () => {
      subscription.remove();
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      const initial = selectedTrackId || tracks[0]?.id || 'close';
      setFocusedId(initial);
      const timer = setTimeout(() => {
        focusElement(initial);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, selectedTrackId, tracks, focusElement]);

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
                  ref={(el) => {
                    elementRefs.current[option.id] = el;
                  }}
                  key={option.id}
                  style={[
                    styles.trackButton,
                    isSelected && styles.trackButtonSelected,
                    isFocused && styles.trackButtonFocused,
                  ]}
                  hasTVPreferredFocus={focusedId === option.id}
                  onFocus={() => setFocusedId(option.id)}
                  onBlur={() => {}}
                  onPress={() => onSelectTrack(option.id)}
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
            ref={(el) => {
              elementRefs.current['close'] = el;
            }}
            style={[
              styles.closeButton,
              focusedId === 'close' && styles.closeButtonFocused,
            ]}
            onFocus={() => setFocusedId('close')}
            onBlur={() => {}}
            onPress={onClose}
            hasTVPreferredFocus={focusedId === 'close'}
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
