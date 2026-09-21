import React, {useState} from 'react';
import {Image, Modal, Text, TouchableOpacity, View} from 'react-native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {strings} from '../../constants/strings';
import {EpisodeItem} from '../../types/episode';
import {formatSeasonEpisodeLabel} from '../../services/episodeService';
import {styles} from './NextEpisodeModal.styles';

export interface NextEpisodeModalProps {
  isOpen: boolean;
  nextEpisode: EpisodeItem | null;
  countdownSeconds: number;
  autoplayEnabled?: boolean;
  onPlayNow: () => void;
  onCancel: () => void;
}

export const NextEpisodeModal: React.FC<NextEpisodeModalProps> = ({
  isOpen,
  nextEpisode,
  countdownSeconds,
  autoplayEnabled = true,
  onPlayNow,
  onCancel,
}) => {
  const [focusedAction, setFocusedAction] = useState<'play' | 'cancel' | null>(
    'play',
  );

  if (!isOpen || !nextEpisode) {
    return null;
  }

  const seasonEpisodeFormatted = formatSeasonEpisodeLabel(
    nextEpisode.seasonNumber,
    nextEpisode.episodeNumber,
  );

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onCancel}>
      <View style={styles.overlay} testID="next-episode-overlay">
        <TVFocusGuideView
          style={styles.modalCard}
          autoFocus
          testID="next-episode-modal">
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {strings.nextEpisode?.nextEpisodeBadge || 'NEXT EPISODE'}
              </Text>
            </View>
            {nextEpisode.seriesTitle && (
              <Text style={styles.seriesTitle} numberOfLines={1}>
                {nextEpisode.seriesTitle}
              </Text>
            )}
            <Text style={styles.seasonEpisodeText}>
              {seasonEpisodeFormatted}
            </Text>
          </View>

          {/* Episode Title */}
          <Text
            style={styles.title}
            numberOfLines={1}
            testID="next-episode-title">
            {nextEpisode.title}
          </Text>

          {/* Content Row: Thumbnail + Details */}
          <View style={styles.contentRow}>
            {nextEpisode.image ? (
              <Image
                source={nextEpisode.image}
                style={styles.thumbnail}
                resizeMode="cover"
                testID="next-episode-thumbnail"
              />
            ) : (
              <View
                style={styles.thumbnailPlaceholder}
                testID="next-episode-thumbnail-placeholder">
                <Text style={styles.thumbnailPlaceholderText}>
                  {seasonEpisodeFormatted}
                </Text>
              </View>
            )}

            <View style={styles.detailsColumn}>
              {nextEpisode.description && (
                <Text
                  style={styles.description}
                  numberOfLines={3}
                  testID="next-episode-description">
                  {nextEpisode.description}
                </Text>
              )}

              {/* Metadata Pills */}
              <View style={styles.metaRow}>
                {nextEpisode.durationFormatted && (
                  <View style={styles.metaPill}>
                    <Text style={styles.metaPillText}>
                      {nextEpisode.durationFormatted}
                    </Text>
                  </View>
                )}
                {nextEpisode.rating && (
                  <View style={styles.metaPill}>
                    <Text style={styles.metaPillText}>
                      {nextEpisode.rating}
                    </Text>
                  </View>
                )}
                {nextEpisode.maturityRating && (
                  <View style={styles.metaPill}>
                    <Text style={styles.metaPillText}>
                      {nextEpisode.maturityRating}
                    </Text>
                  </View>
                )}
                {nextEpisode.genre && (
                  <View style={styles.metaPill}>
                    <Text style={styles.metaPillText}>{nextEpisode.genre}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Countdown / Autoplay Banner */}
          <View
            style={[
              styles.countdownSection,
              !autoplayEnabled && styles.disabledAutoplaySection,
            ]}
            testID="next-episode-countdown">
            {autoplayEnabled ? (
              <>
                <View style={styles.countdownIconBadge}>
                  <Text style={styles.countdownNumber}>{countdownSeconds}</Text>
                </View>
                <View style={styles.countdownTextContainer}>
                  <Text style={styles.countdownText}>
                    {strings.nextEpisode?.playingInSeconds(countdownSeconds) ||
                      `Playing next episode in ${countdownSeconds}s`}
                  </Text>
                  <Text style={styles.countdownSubtext}>
                    {strings.nextEpisode?.playingNext ||
                      'Playing next episode...'}
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.countdownTextContainer}>
                <Text style={styles.disabledAutoplayText}>
                  {strings.nextEpisode?.autoplayDisabled ||
                    'Autoplay is turned off in settings'}
                </Text>
              </View>
            )}
          </View>

          {/* Actions: Play Now / Cancel */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[
                styles.cancelButton,
                focusedAction === 'cancel' && styles.cancelButtonFocused,
              ]}
              onFocus={() => setFocusedAction('cancel')}
              onPress={onCancel}
              activeOpacity={1}
              accessibilityRole="button"
              accessibilityLabel={
                strings.accessibility?.nextEpisodeCancelButton || 'Cancel'
              }
              testID="next-episode-cancel-btn">
              <Text style={styles.cancelButtonText}>
                {strings.nextEpisode?.cancel || 'Cancel'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.playButton,
                focusedAction === 'play' && styles.playButtonFocused,
              ]}
              onFocus={() => setFocusedAction('play')}
              onPress={onPlayNow}
              hasTVPreferredFocus
              activeOpacity={1}
              accessibilityRole="button"
              accessibilityLabel={
                strings.accessibility?.nextEpisodePlayButton(
                  nextEpisode.title,
                ) || `Play next episode: ${nextEpisode.title}`
              }
              testID="next-episode-play-now-btn">
              <Text style={styles.playButtonText}>
                ▶ {strings.nextEpisode?.playNow || 'Play Now'}
              </Text>
            </TouchableOpacity>
          </View>
        </TVFocusGuideView>
      </View>
    </Modal>
  );
};
