/**
 * Watch Party Create Screen
 * TV-optimized screen for creating a new virtual viewing room.
 * LogiXstream Amazon Vega OS React Native Application
 */

import React, {useCallback, useEffect, useState} from 'react';
import {ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {Routes} from '../../../constants/routes';
import {useAuth} from '../../../context/authContext';
import {useProfile} from '../../../profiles/hooks/useProfile';
import {homeContentRows} from '../../../data/home';
import {findContentById} from '../../../utils/deeplink';
import {canProfileAccessContent} from '../../../utils/contentAccessPolicy';
import {analyticsService} from '../../../analytics';
import {useWatchParty} from '../hooks/useWatchParty';
import {WatchPartyRoomHeader} from '../components/WatchPartyRoomHeader';
import {WatchPartyContentInfo} from '../components/WatchPartyContentInfo';
import {WatchPartyLoading} from '../components/WatchPartyLoading';
import {WatchPartyErrorState} from '../components/WatchPartyErrorState';
import {
  DEFAULT_WATCH_PARTY_FALLBACK_THUMBNAIL,
  WATCH_PARTY_ROOM_CONFIG,
  WATCH_PARTY_TEST_IDS,
} from '../constants/watchParty.constants';
import {WatchPartyContentType} from '../types/watchParty.types';
import {styles} from './WatchPartyCreateScreen.styles';

const PARTICIPANT_OPTIONS = [3, 5, 8, 10];

export const WatchPartyCreateScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const {user} = useAuth();
  const {activeProfile} = useProfile();
  const {createRoom, isLoading, error, clearError} = useWatchParty();

  // Content resolution
  const passedMovie = route.params?.movie;
  const passedContentId = route.params?.contentId || passedMovie?.id;
  const resolvedContent =
    passedMovie ||
    findContentById(passedContentId) ||
    homeContentRows[0].items[0];

  const contentType: WatchPartyContentType =
    route.params?.contentType ||
    (resolvedContent?.contentType === 'series' || resolvedContent?.contentType === 'episode'
      ? 'episode'
      : 'movie');

  const [maxParticipants, setMaxParticipants] = useState<number>(
    WATCH_PARTY_ROOM_CONFIG.DEFAULT_MAX_PARTICIPANTS,
  );
  const [isPrivate, setIsPrivate] = useState<boolean>(true);
  const [focusedControl, setFocusedControl] = useState<string | null>('create');

  // Check content access for active profile
  const isRestricted =
    activeProfile && resolvedContent
      ? !canProfileAccessContent(activeProfile, resolvedContent)
      : false;

  useEffect(() => {
    analyticsService
      .track('watch_party_opened' as any, {
        source: 'create_screen',
        contentId: resolvedContent?.id,
      })
      .catch(() => {});
  }, [resolvedContent?.id]);

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate(Routes.Home);
    }
  }, [navigation]);

  const handleCreate = useCallback(async () => {
    if (!resolvedContent?.id) {
      return;
    }

    if (isRestricted) {
      analyticsService
        .track('watch_party_error' as any, {
          operation: 'create_room',
          code: 'PROFILE_RESTRICTED',
        })
        .catch(() => {});
      return;
    }

    const hostId = user?.uid || 'user_guest';
    const hostProfileId = activeProfile?.id || 'profile_default';

    analyticsService
      .track('watch_party_create_started' as any, {
        contentId: resolvedContent.id,
        contentType,
        maxParticipants,
        isPrivate,
      })
      .catch(() => {});

    try {
      const result = await createRoom({
        contentId: resolvedContent.id,
        contentType,
        contentTitle: resolvedContent.title,
        contentThumbnail:
          typeof resolvedContent.image === 'string'
            ? resolvedContent.image
            : DEFAULT_WATCH_PARTY_FALLBACK_THUMBNAIL,
        hostId,
        hostProfileId,
        maxParticipants,
        isPrivate,
      });

      analyticsService
        .track('watch_party_created' as any, {
          roomId: result.room.id,
          contentId: resolvedContent.id,
          maxParticipants,
        })
        .catch(() => {});

      navigation.navigate(Routes.WatchPartyLobby, {
        roomId: result.room.id,
        room: result.room,
      });
    } catch (err: any) {
      analyticsService
        .track('watch_party_error' as any, {
          operation: 'create_room',
          code: err.code || 'SERVER_ERROR',
        })
        .catch(() => {});
    }
  }, [
    activeProfile?.id,
    contentType,
    createRoom,
    isPrivate,
    isRestricted,
    maxParticipants,
    navigation,
    resolvedContent,
    user?.uid,
  ]);

  if (isLoading) {
    return (
      <View style={styles.container} testID={WATCH_PARTY_TEST_IDS.createScreen}>
        <WatchPartyRoomHeader
          title="Create Watch Party"
          subtitle="Preparing viewing room..."
          onBack={handleBack}
        />
        <WatchPartyLoading message="Creating Watch Party room..." />
      </View>
    );
  }

  return (
    <View style={styles.container} testID={WATCH_PARTY_TEST_IDS.createScreen}>
      <WatchPartyRoomHeader
        title="Create Watch Party"
        subtitle="Host a synchronized viewing room with friends"
        onBack={handleBack}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <TVFocusGuideView style={styles.contentGuide} autoFocus>
          {isRestricted ? (
            <WatchPartyErrorState
              title="Content Restricted"
              message="This movie or episode is restricted under the current profile's parental controls."
              onBack={handleBack}
            />
          ) : (
            <View style={styles.mainRow}>
            {/* Left Column: Content Information */}
            <View style={styles.leftColumn}>
              <Text style={styles.sectionTitle}>SELECTED CONTENT</Text>
              <WatchPartyContentInfo
                title={resolvedContent?.title || 'Unknown Title'}
                contentType={contentType}
                thumbnailUrl={
                  typeof resolvedContent?.image === 'string'
                    ? resolvedContent.image
                    : undefined
                }
                description={resolvedContent?.description}
                badge={resolvedContent?.badge}
                metadata={
                  resolvedContent?.meta || [
                    resolvedContent?.rating || 'PG-13',
                    resolvedContent?.genre || 'Drama',
                  ]
                }
              />

              {/* Host Profile Info */}
              <View style={styles.hostInfoCard}>
                <View style={styles.hostAvatar}>
                  <Text style={styles.hostAvatarText}>
                    {(activeProfile?.name || 'H').slice(0, 1).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.hostDetails}>
                  <Text style={styles.hostName}>
                    {activeProfile?.name || 'Current Profile'} (Host)
                  </Text>
                  <Text style={styles.hostRole}>
                    Room host controls the party
                  </Text>
                </View>
              </View>
            </View>

            {/* Right Column: Room Options & Create Action */}
            <View style={styles.rightColumn}>
              <Text style={styles.sectionTitle}>ROOM SETTINGS</Text>

              <View style={styles.optionsCard}>
                {/* Max Participants Option */}
                <View style={styles.optionGroup}>
                  <Text style={styles.optionLabel}>Max Participants</Text>
                  <Text style={styles.optionSublabel}>
                    Limit how many people can join your room
                  </Text>
                  <View
                    style={styles.pillsRow}
                    testID={WATCH_PARTY_TEST_IDS.maxParticipantsSelector}>
                    {PARTICIPANT_OPTIONS.map((count) => {
                      const isSelected = maxParticipants === count;
                      const isFocused =
                        focusedControl === `participant_${count}`;
                      return (
                        <TouchableOpacity
                          key={count}
                          style={[
                            styles.pillButton,
                            isSelected && styles.pillButtonSelected,
                            isFocused && styles.pillButtonFocused,
                          ]}
                          onFocus={() =>
                            setFocusedControl(`participant_${count}`)
                          }
                          onBlur={() => setFocusedControl(null)}
                          onPress={() => setMaxParticipants(count)}
                          activeOpacity={0.8}
                          accessibilityRole="button"
                          accessibilityLabel={`${count} participants`}>
                          <Text
                            style={[
                              styles.pillButtonText,
                              isSelected && styles.pillButtonTextSelected,
                            ]}>
                            {count}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Privacy Option */}
                <View style={styles.optionGroup}>
                  <Text style={styles.optionLabel}>Room Privacy</Text>
                  <View
                    style={styles.pillsRow}
                    testID={WATCH_PARTY_TEST_IDS.privacyToggle}>
                    <TouchableOpacity
                      style={[
                        styles.pillButton,
                        isPrivate && styles.pillButtonSelected,
                        focusedControl === 'privacy_private' &&
                          styles.pillButtonFocused,
                      ]}
                      onFocus={() => setFocusedControl('privacy_private')}
                      onBlur={() => setFocusedControl(null)}
                      onPress={() => setIsPrivate(true)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel="Private room">
                      <Text
                        style={[
                          styles.pillButtonText,
                          isPrivate && styles.pillButtonTextSelected,
                        ]}>
                        Private (Code Only)
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.pillButton,
                        !isPrivate && styles.pillButtonSelected,
                        focusedControl === 'privacy_public' &&
                          styles.pillButtonFocused,
                      ]}
                      onFocus={() => setFocusedControl('privacy_public')}
                      onBlur={() => setFocusedControl(null)}
                      onPress={() => setIsPrivate(false)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel="Public room">
                      <Text
                        style={[
                          styles.pillButtonText,
                          !isPrivate && styles.pillButtonTextSelected,
                        ]}>
                        Open
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Error Banner */}
                {error ? (
                  <View style={styles.errorBanner}>
                    <Text style={styles.errorBannerText}>{error.message}</Text>
                  </View>
                ) : null}

                {/* Create Room Action */}
                <TouchableOpacity
                  style={[
                    styles.createButton,
                    focusedControl === 'create' && styles.createButtonFocused,
                  ]}
                  onFocus={() => {
                    clearError();
                    setFocusedControl('create');
                  }}
                  onBlur={() => setFocusedControl(null)}
                  onPress={handleCreate}
                  hasTVPreferredFocus
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Create Watch Party Room"
                  testID={WATCH_PARTY_TEST_IDS.createButton}>
                  <Text style={styles.createButtonText}>
                    Create Watch Party
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        </TVFocusGuideView>
      </ScrollView>
    </View>
  );
};
