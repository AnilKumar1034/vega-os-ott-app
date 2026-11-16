import React, {useCallback, useEffect, useRef, useState} from 'react';
import {BackHandler, Modal, ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {TVFocusGuideView, useTVEventHandler} from '@amazon-devices/react-native-kepler';
import {strings} from '../../constants/strings';
import {
  PlaybackSpeed,
} from '../../types/playerFeatures';
import {styles} from './PlaybackSpeedModal.styles';
import {isBackEvent, isKeyDown, isSelectEvent} from '../../utils/inputUtils';

export interface PlaybackSpeedModalProps {
  isOpen: boolean;
  currentSpeed: number;
  onSelectSpeed: (speed: PlaybackSpeed) => void;
  onClose: () => void;
}

const SPEED_OPTIONS: {label: string; value: PlaybackSpeed}[] = [
  {label: '0.5x', value: 0.5},
  {label: '0.75x', value: 0.75},
  {label: '1.0x (Normal)', value: 1.0},
  {label: '1.25x', value: 1.25},
  {label: '1.5x', value: 1.5},
  {label: '2.0x', value: 2.0},
];

export const PlaybackSpeedModal: React.FC<PlaybackSpeedModalProps> = ({
  isOpen,
  currentSpeed,
  onSelectSpeed,
  onClose,
}) => {
  const defaultOptionId = String(currentSpeed || 1.0);
  const [focusedId, setFocusedId] = useState<string | null>(defaultOptionId);
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
      const currentIndex = SPEED_OPTIONS.findIndex(
        (o) => String(o.value) === current,
      );
      if (currentIndex >= 0 && currentIndex < SPEED_OPTIONS.length - 1) {
        focusElement(String(SPEED_OPTIONS[currentIndex + 1].value));
      } else if (currentIndex === SPEED_OPTIONS.length - 1) {
        focusElement('close');
      }
    } else if (type === 'up') {
      const current = focusedIdRef.current;
      if (current === 'close') {
        focusElement(String(SPEED_OPTIONS[SPEED_OPTIONS.length - 1].value));
      } else {
        const currentIndex = SPEED_OPTIONS.findIndex(
          (o) => String(o.value) === current,
        );
        if (currentIndex > 0) {
          focusElement(String(SPEED_OPTIONS[currentIndex - 1].value));
        }
      }
    } else if (isSelectEvent(type)) {
      const current = focusedIdRef.current;
      if (current === 'close') {
        onClose();
      } else if (current) {
        const selected = SPEED_OPTIONS.find((o) => String(o.value) === current);
        if (selected) {
          onSelectSpeed(selected.value);
        }
      }
    }
  });

  useEffect(() => {
    if (isOpen) {
      const initialFocus = String(currentSpeed || 1.0);
      setFocusedId(initialFocus);
      focusedIdRef.current = initialFocus;
      const target = elementRefs.current[initialFocus];
      if (target && typeof target.requestTVFocus === 'function') {
        target.requestTVFocus();
      }
    }
  }, [currentSpeed, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const onBackPress = () => {
      onClose();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => {
      sub.remove();
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      transparent
      animationType="fade"
      visible={isOpen}
      onRequestClose={onClose}>
      <View style={styles.overlay} testID="playback-speed-modal">
        <TVFocusGuideView style={styles.modalCard} autoFocus>
          <View style={styles.header}>
            <View style={styles.iconBadge}>
              <Text style={styles.iconBadgeText}>
                {strings.playerControls.speedBadge || 'SPEED'}
              </Text>
            </View>
            <Text style={styles.title}>
              {strings.playerControls.speedModalTitle || 'Playback Speed'}
            </Text>
            <Text style={styles.subtitle}>
              Adjust playback rate for movie or episode
            </Text>
          </View>

          <ScrollView style={styles.speedListContainer}>
            {SPEED_OPTIONS.map((option) => {
              const isSelected = option.value === currentSpeed;
              const isItemFocused = focusedId === String(option.value);

              return (
                <TouchableOpacity
                  key={String(option.value)}
                  ref={(node) => {
                    elementRefs.current[String(option.value)] = node;
                  }}
                  style={[
                    styles.speedItem,
                    isSelected && styles.speedItemActive,
                    isItemFocused && styles.speedItemFocused,
                  ]}
                  onFocus={() => setFocusedId(String(option.value))}
                  onBlur={() => {
                    if (focusedId === String(option.value)) {
                      setFocusedId(null);
                    }
                  }}
                  onPress={() => onSelectSpeed(option.value)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={strings.accessibility.selectPlaybackSpeed(
                    option.label,
                    isSelected,
                  )}
                  testID={`speed-option-${option.value}`}>
                  <View style={styles.speedItemLeft}>
                    <Text
                      style={[
                        styles.speedItemLabel,
                        isItemFocused && styles.speedItemLabelFocused,
                      ]}>
                      {option.label}
                    </Text>
                  </View>
                  {isSelected && (
                    <Text
                      style={[
                        styles.checkMark,
                        isItemFocused && styles.checkMarkFocused,
                      ]}>
                      ✓
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            ref={(node) => {
              elementRefs.current.close = node;
            }}
            style={[
              styles.closeButton,
              focusedId === 'close' && styles.closeButtonFocused,
            ]}
            onFocus={() => setFocusedId('close')}
            onBlur={() => {
              if (focusedId === 'close') {
                setFocusedId(null);
              }
            }}
            onPress={onClose}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={strings.accessibility.closePlaybackSpeedModal}
            testID="speed-modal-close-button">
            <Text style={styles.closeButtonText}>
              {strings.videoQuality?.close || 'Close'}
            </Text>
          </TouchableOpacity>
        </TVFocusGuideView>
      </View>
    </Modal>
  );
};
