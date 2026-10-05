import React, {useCallback, useEffect, useRef, useState} from 'react';
import {BackHandler, Modal, ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {TVFocusGuideView, useTVEventHandler} from '@amazon-devices/react-native-kepler';
import {strings} from '../../constants/strings';
import {VideoQualityOption} from '../../types/videoQuality';
import {styles} from './VideoQualityModal.styles';
import {isBackEvent, isKeyDown, isSelectEvent} from '../../utils/inputUtils';

export interface VideoQualityModalProps {
  isOpen: boolean;
  qualities: VideoQualityOption[];
  selectedQualityId: string;
  onSelectQuality: (qualityId: string) => void;
  onClose: () => void;
}

export const VideoQualityModal: React.FC<VideoQualityModalProps> = ({
  isOpen,
  qualities,
  selectedQualityId,
  onSelectQuality,
  onClose,
}) => {
  const defaultQualityId = selectedQualityId || qualities[0]?.id || 'close';
  const [focusedId, setFocusedId] = useState<string | null>(defaultQualityId);
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
      const currentIndex = qualities.findIndex((q) => q.id === current);
      if (currentIndex >= 0 && currentIndex < qualities.length - 1) {
        focusElement(qualities[currentIndex + 1].id);
      } else if (currentIndex === qualities.length - 1) {
        focusElement('close');
      }
      return;
    }

    if (type === 'up') {
      const current = focusedIdRef.current;
      if (current === 'close') {
        if (qualities.length > 0) {
          focusElement(qualities[qualities.length - 1].id);
        }
      } else {
        const currentIndex = qualities.findIndex((q) => q.id === current);
        if (currentIndex > 0) {
          focusElement(qualities[currentIndex - 1].id);
        }
      }
      return;
    }

    if (isSelectEvent(type)) {
      const current = focusedIdRef.current;
      if (current === 'close') {
        onClose();
      } else if (current) {
        onSelectQuality(current);
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
      const initial = selectedQualityId || qualities[0]?.id || 'close';
      setFocusedId(initial);
      const timer = setTimeout(() => {
        focusElement(initial);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, selectedQualityId, qualities, focusElement]);

  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay} testID="video-quality-modal-overlay">
        <TVFocusGuideView
          style={styles.modalCard}
          autoFocus
          testID="video-quality-modal">
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconBadge}>
              <Text style={styles.iconBadgeText}>
                {strings.videoQuality.qualityBadge}
              </Text>
            </View>
            <Text style={styles.title}>
              {strings.videoQuality.selectQuality}
            </Text>
            <Text style={styles.subtitle}>
              {strings.videoQuality.selectQualityDesc}
            </Text>
          </View>

          {/* Video Quality Options List */}
          <ScrollView
            style={styles.qualityListContainer}
            contentContainerStyle={styles.qualityListContent}
            showsVerticalScrollIndicator={false}>
            {qualities.map((option, index) => {
              const isSelected = option.id === selectedQualityId;
              const isFocused = focusedId === option.id;

              return (
                <TouchableOpacity
                  ref={(el) => {
                    elementRefs.current[option.id] = el;
                  }}
                  key={option.id}
                  style={[
                    styles.qualityButton,
                    isSelected && styles.qualityButtonSelected,
                    isFocused && styles.qualityButtonFocused,
                  ]}
                  hasTVPreferredFocus={focusedId === option.id}
                  onFocus={() => setFocusedId(option.id)}
                  onBlur={() => {}}
                  onPress={() => onSelectQuality(option.id)}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={strings.accessibility.selectQuality(
                    option.label,
                    isSelected,
                  )}
                  testID={`quality-option-${option.id}`}>
                  <View style={styles.qualityInfoRow}>
                    <Text
                      style={[
                        styles.qualityLabel,
                        isSelected && styles.qualityLabelSelected,
                      ]}>
                      {option.label}
                    </Text>

                    {option.resolution && (
                      <View style={styles.resolutionBadge}>
                        <Text style={styles.resolutionBadgeText}>
                          {option.resolution}
                        </Text>
                      </View>
                    )}

                    {option.bitrate && (
                      <View style={styles.bitrateBadge}>
                        <Text style={styles.bitrateBadgeText}>
                          {option.bitrate}
                        </Text>
                      </View>
                    )}

                    {isSelected && (
                      <View style={styles.selectedBadge}>
                        <Text style={styles.selectedBadgeText}>
                          {strings.videoQuality.activeQuality}
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
            accessibilityLabel={strings.accessibility.closeQualityModal}
            testID="video-quality-modal-close">
            <Text style={styles.closeButtonText}>
              {strings.videoQuality.close}
            </Text>
          </TouchableOpacity>
        </TVFocusGuideView>
      </View>
    </Modal>
  );
};
