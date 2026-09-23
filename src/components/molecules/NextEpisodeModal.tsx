import React, {useMemo, useRef, useState} from 'react';
import {
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {strings} from '../../constants/strings';
import {EpisodeItem} from '../../types/episode';
import {formatSeasonEpisodeLabel} from '../../services/episodeService';
import {styles} from './NextEpisodeModal.styles';

export interface NextEpisodeModalProps {
  isOpen: boolean;
  nextEpisode: EpisodeItem | null;
  nextEpisodes?: EpisodeItem[];
  allEpisodes?: EpisodeItem[];
  currentEpisodeId?: string;
  countdownSeconds: number;
  autoplayEnabled?: boolean;
  onPlayNow: (targetEpisode?: EpisodeItem) => void;
  onCancel: () => void;
  onSelectEpisode?: (episode: EpisodeItem) => void;
}

export const NextEpisodeModal: React.FC<NextEpisodeModalProps> = ({
  isOpen,
  nextEpisode,
  nextEpisodes,
  allEpisodes,
  currentEpisodeId,
  countdownSeconds,
  autoplayEnabled = true,
  onPlayNow,
  onCancel,
  onSelectEpisode,
}) => {
  const [focusedAction, setFocusedAction] = useState<'play' | 'cancel' | null>(
    'play',
  );
  const [focusedEpisodeId, setFocusedEpisodeId] = useState<string | null>(null);
  const [focusedTab, setFocusedTab] = useState<'upcoming' | 'all' | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'all'>('upcoming');

  const playButtonRef = useRef<any>(null);
  const [playButtonNode, setPlayButtonNode] = useState<any>(null);
  const firstCardRef = useRef<any>(null);
  const [firstCardNode, setFirstCardNode] = useState<any>(null);
  const episodesScrollRef = useRef<ScrollView>(null);

  const upcomingEpisodesList = useMemo<EpisodeItem[]>(() => {
    if (nextEpisodes && nextEpisodes.length > 0) {
      return nextEpisodes;
    }
    if (nextEpisode) {
      return [nextEpisode];
    }
    return [];
  }, [nextEpisode, nextEpisodes]);

  const fullEpisodesList = useMemo<EpisodeItem[]>(() => {
    if (allEpisodes && allEpisodes.length > 0) {
      return allEpisodes;
    }
    return upcomingEpisodesList;
  }, [allEpisodes, upcomingEpisodesList]);

  const displayedEpisodes =
    activeTab === 'all' && fullEpisodesList.length > 0
      ? fullEpisodesList
      : upcomingEpisodesList;

  if (!isOpen || !nextEpisode) {
    return null;
  }

  const seasonEpisodeFormatted = formatSeasonEpisodeLabel(
    nextEpisode.seasonNumber,
    nextEpisode.episodeNumber,
  );

  const handleEpisodeSelect = (episode: EpisodeItem) => {
    if (onSelectEpisode) {
      onSelectEpisode(episode);
    } else {
      onPlayNow(episode);
    }
  };

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
          <TVFocusGuideView
            style={styles.actionRowGuide}
            autoFocus
            destinations={firstCardNode ? [firstCardNode] : []}>
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  focusedAction === 'cancel' && styles.cancelButtonFocused,
                ]}
                onFocus={() => {
                  setFocusedAction('cancel');
                  setFocusedEpisodeId(null);
                  setFocusedTab(null);
                }}
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
                ref={(node) => {
                  playButtonRef.current = node;
                  if (node && !playButtonNode) {
                    setPlayButtonNode(node);
                  }
                }}
                style={[
                  styles.playButton,
                  focusedAction === 'play' && styles.playButtonFocused,
                ]}
                onFocus={() => {
                  setFocusedAction('play');
                  setFocusedEpisodeId(null);
                  setFocusedTab(null);
                }}
                onPress={() => onPlayNow(nextEpisode)}
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

          {/* Next Episodes List View Section */}
          <TVFocusGuideView
            style={styles.episodesSection}
            autoFocus
            destinations={playButtonNode ? [playButtonNode] : []}
            testID="next-episodes-section">
            <View style={styles.episodesHeaderRow}>
              <View style={styles.episodesHeaderLeft}>
                <Text
                  style={styles.episodesSectionTitle}
                  testID="next-episodes-section-title">
                  {strings.nextEpisode?.nextEpisodesListTitle ||
                    'Next Episodes'}
                </Text>
                <View style={styles.episodesCountBadge}>
                  <Text style={styles.episodesCountText}>
                    {activeTab === 'all'
                      ? strings.nextEpisode?.allEpisodesCount(
                          fullEpisodesList.length,
                        ) || `${fullEpisodesList.length} Episodes`
                      : strings.nextEpisode?.episodesCount(
                          upcomingEpisodesList.length,
                        ) || `${upcomingEpisodesList.length} Next Episodes`}
                  </Text>
                </View>
              </View>

              {/* Tabs if both upcoming and all are available and there's a difference */}
              {fullEpisodesList.length > upcomingEpisodesList.length && (
                <TVFocusGuideView style={styles.tabsContainer} autoFocus>
                  <TouchableOpacity
                    style={[
                      styles.tabButton,
                      activeTab === 'upcoming' && styles.tabButtonActive,
                      focusedTab === 'upcoming' && styles.tabButtonFocused,
                    ]}
                    onFocus={() => {
                      setFocusedTab('upcoming');
                      setFocusedAction(null);
                      setFocusedEpisodeId(null);
                    }}
                    onBlur={() => {
                      if (focusedTab === 'upcoming') {
                        setFocusedTab(null);
                      }
                    }}
                    onPress={() => setActiveTab('upcoming')}
                    activeOpacity={1}
                    accessibilityRole="tab"
                    accessibilityState={{selected: activeTab === 'upcoming'}}
                    testID="next-episodes-tab-upcoming">
                    <Text
                      style={[
                        styles.tabButtonText,
                        activeTab === 'upcoming' && styles.tabButtonTextActive,
                      ]}>
                      {strings.nextEpisode?.upcomingEpisodes || 'Upcoming'} (
                      {upcomingEpisodesList.length})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.tabButton,
                      activeTab === 'all' && styles.tabButtonActive,
                      focusedTab === 'all' && styles.tabButtonFocused,
                    ]}
                    onFocus={() => {
                      setFocusedTab('all');
                      setFocusedAction(null);
                      setFocusedEpisodeId(null);
                    }}
                    onBlur={() => {
                      if (focusedTab === 'all') {
                        setFocusedTab(null);
                      }
                    }}
                    onPress={() => setActiveTab('all')}
                    activeOpacity={1}
                    accessibilityRole="tab"
                    accessibilityState={{selected: activeTab === 'all'}}
                    testID="next-episodes-tab-all">
                    <Text
                      style={[
                        styles.tabButtonText,
                        activeTab === 'all' && styles.tabButtonTextActive,
                      ]}>
                      {strings.nextEpisode?.allEpisodes || 'All Episodes'} (
                      {fullEpisodesList.length})
                    </Text>
                  </TouchableOpacity>
                </TVFocusGuideView>
              )}
            </View>

            {/* Scrollable list of Next Episodes */}
            <TVFocusGuideView
              style={styles.episodesListGuide}
              autoFocus
              destinations={playButtonNode ? [playButtonNode] : []}>
              <ScrollView
                ref={episodesScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.episodesListContainer}
                contentContainerStyle={styles.episodesListContent}
                testID="next-episodes-list-view">
                {displayedEpisodes.length > 0 ? (
                  displayedEpisodes.map((episode, index) => {
                    const isCardFocused = focusedEpisodeId === episode.id;
                    const isImmediateNext = episode.id === nextEpisode.id;
                    const isCurrentPlaying = episode.id === currentEpisodeId;
                    const cardEpBadge = `EP ${episode.episodeNumber}`;
                    const cardTitle = `Ep. ${episode.episodeNumber}: ${episode.title}`;

                    return (
                      <TouchableOpacity
                        key={episode.id || `ep-${index}`}
                        ref={(node) => {
                          if (index === 0) {
                            firstCardRef.current = node;
                            if (node && !firstCardNode) {
                              setFirstCardNode(node);
                            }
                          }
                        }}
                        style={[
                          styles.episodeCard,
                          isImmediateNext && styles.episodeCardActiveUpNext,
                          isCardFocused && styles.episodeCardFocused,
                        ]}
                        onFocus={() => {
                          setFocusedEpisodeId(episode.id);
                          setFocusedAction(null);
                          setFocusedTab(null);
                          episodesScrollRef.current?.scrollTo({
                            x: Math.max(0, index * 248 - 100),
                            animated: true,
                          });
                        }}
                        onBlur={() => {
                          if (focusedEpisodeId === episode.id) {
                            setFocusedEpisodeId(null);
                          }
                        }}
                        onPress={() => handleEpisodeSelect(episode)}
                        activeOpacity={1}
                        accessibilityRole="button"
                        accessibilityLabel={
                          strings.accessibility?.selectEpisodeCard(
                            episode.title,
                            episode.episodeNumber,
                          ) ||
                          `Play Episode ${episode.episodeNumber}: ${episode.title}`
                        }
                        testID={`next-episode-card-${episode.id}`}>
                        {/* Thumbnail & Badges */}
                        <View style={styles.episodeCardThumbnailContainer}>
                          {episode.image ? (
                            <Image
                              source={episode.image}
                              style={styles.episodeCardThumbnail}
                              resizeMode="cover"
                              testID={`next-episode-card-thumbnail-${episode.id}`}
                            />
                          ) : (
                            <View style={styles.episodeCardPlaceholder}>
                              <Text style={styles.episodeCardPlaceholderText}>
                                {cardEpBadge}
                              </Text>
                            </View>
                          )}

                          {/* Season:Episode pill */}
                          <View style={styles.episodeCardBadgeTopLeft}>
                            <Text style={styles.episodeCardBadgeTopLeftText}>
                              {cardEpBadge}
                            </Text>
                          </View>

                          {/* Status Badge: Watched / UP NEXT */}
                          {isCurrentPlaying ? (
                            <View style={styles.episodeCardBadgeWatched}>
                              <Text style={styles.episodeCardBadgeWatchedText}>
                                {strings.nextEpisode?.watchedEpisode ||
                                  'Watched'}
                              </Text>
                            </View>
                          ) : isImmediateNext ? (
                            <View style={styles.episodeCardBadgeTopRight}>
                              <Text style={styles.episodeCardBadgeTopRightText}>
                                {autoplayEnabled
                                  ? `${
                                      strings.nextEpisode?.upNextCardBadge ||
                                      'UP NEXT'
                                    } (${countdownSeconds}s)`
                                  : strings.nextEpisode?.upNextCardBadge ||
                                    'UP NEXT'}
                              </Text>
                            </View>
                          ) : null}

                          {/* Duration pill */}
                          {episode.durationFormatted && (
                            <View style={styles.episodeCardDurationBadge}>
                              <Text style={styles.episodeCardDurationText}>
                                {episode.durationFormatted}
                              </Text>
                            </View>
                          )}

                          {/* Focused Play Overlay */}
                          {isCardFocused && (
                            <View style={styles.episodeCardPlayOverlay}>
                              <Text style={styles.episodeCardPlayIcon}>▶</Text>
                            </View>
                          )}

                          {/* Progress Bar if watched */}
                          {typeof episode.progress === 'number' &&
                            episode.progress > 0 && (
                              <View style={styles.episodeCardProgressBar}>
                                <View
                                  style={[
                                    styles.episodeCardProgressBarFill,
                                    {
                                      width: `${Math.min(
                                        100,
                                        Math.max(0, episode.progress * 100),
                                      )}%`,
                                    },
                                  ]}
                                />
                              </View>
                            )}
                        </View>

                        {/* Info details */}
                        <View style={styles.episodeCardInfo}>
                          <Text
                            style={[
                              styles.episodeCardTitle,
                              isCardFocused && styles.episodeCardTitleFocused,
                            ]}
                            numberOfLines={1}
                            testID={`next-episode-card-title-${episode.id}`}>
                            {cardTitle}
                          </Text>

                          <View style={styles.episodeCardMetaRow}>
                            {episode.rating && (
                              <Text style={styles.episodeCardRating}>
                                {episode.rating}
                              </Text>
                            )}
                            {episode.maturityRating && (
                              <View style={styles.episodeCardMaturityPill}>
                                <Text style={styles.episodeCardMaturityText}>
                                  {episode.maturityRating}
                                </Text>
                              </View>
                            )}
                          </View>

                          {isCardFocused && (
                            <Text style={styles.episodeCardFocusedActionHint}>
                              ▶{' '}
                              {strings.nextEpisode?.selectEpisodeHint ||
                                'Press OK to Play'}
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <Text style={styles.emptyEpisodesText}>
                    {strings.nextEpisode?.finalEpisodeOfSeason ||
                      'No further episodes available in this season.'}
                  </Text>
                )}
              </ScrollView>
            </TVFocusGuideView>
          </TVFocusGuideView>
        </TVFocusGuideView>
      </View>
    </Modal>
  );
};
