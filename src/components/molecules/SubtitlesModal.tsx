import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {BackHandler, Modal, ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {TVFocusGuideView, useTVEventHandler} from '@amazon-devices/react-native-kepler';
import {strings} from '../../constants/strings';
import {SUBTITLE_OFF_ID} from '../../data/subtitles';
import {SubtitleTrack} from '../../types/subtitles';
import {styles} from './SubtitlesModal.styles';
import {isBackEvent, isKeyDown, isSelectEvent} from '../../utils/inputUtils';

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
  const allOptions = useMemo<Array<{id: string; label: string; kind?: string}>>(() => [
    {id: SUBTITLE_OFF_ID, label: strings.subtitles.off},
    ...tracks.map((t) => ({
      id: t.id,
      label: t.label,
      kind: t.kind,
    })),
  ], [tracks]);

  const defaultTrackId = selectedTrackId || SUBTITLE_OFF_ID;
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
      const currentIndex = allOptions.findIndex((o) => o.id === current);
      if (currentIndex >= 0 && currentIndex < allOptions.length - 1) {
        focusElement(allOptions[currentIndex + 1].id);
      } else if (currentIndex === allOptions.length - 1) {
        focusElement('close');
      }
      return;
    }

    if (type === 'up') {
      const current = focusedIdRef.current;
      if (current === 'close') {
        if (allOptions.length > 0) {
          focusElement(allOptions[allOptions.length - 1].id);
        }
      } else {
        const currentIndex = allOptions.findIndex((o) => o.id === current);
        if (currentIndex > 0) {
          focusElement(allOptions[currentIndex - 1].id);
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
      const initial = selectedTrackId || SUBTITLE_OFF_ID;
      setFocusedId(initial);
      const timer = setTimeout(() => {
        focusElement(initial);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, selectedTrackId, focusElement]);

  if (!isOpen) {
    return null;
  }

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
            {allOptions.map((option) => {
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
