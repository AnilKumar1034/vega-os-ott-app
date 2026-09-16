import React, {useState} from 'react';
import {Modal, ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {strings} from '../../constants/strings';
import {VideoQualityOption} from '../../types/videoQuality';
import {styles} from './VideoQualityModal.styles';

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
  const [focusedId, setFocusedId] = useState<string | null>(null);

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
                {strings.videoQuality?.qualityBadge || 'QUALITY'}
              </Text>
            </View>
            <Text style={styles.title}>
              {strings.videoQuality?.selectQuality || 'Select Video Quality'}
            </Text>
            <Text style={styles.subtitle}>
              {strings.videoQuality?.selectQualityDesc ||
                'Choose your preferred video streaming resolution and data usage.'}
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
                  key={option.id}
                  style={[
                    styles.qualityButton,
                    isSelected && styles.qualityButtonSelected,
                    isFocused && styles.qualityButtonFocused,
                  ]}
                  hasTVPreferredFocus={
                    (!focusedId && isSelected) || (!focusedId && index === 0)
                  }
                  onFocus={() => setFocusedId(option.id)}
                  onBlur={() => setFocusedId(null)}
                  onPress={() => {
                    onSelectQuality(option.id);
                  }}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={
                    strings.accessibility?.selectQuality?.(
                      option.label,
                      isSelected,
                    ) || `${option.label} video quality`
                  }
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
                          {strings.videoQuality?.activeQuality || 'Active'}
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
            accessibilityLabel={
              strings.accessibility?.closeQualityModal ||
              'Close video quality selection modal'
            }
            testID="video-quality-modal-close">
            <Text style={styles.closeButtonText}>
              {strings.videoQuality?.close || 'Close'}
            </Text>
          </TouchableOpacity>
        </TVFocusGuideView>
      </View>
    </Modal>
  );
};
