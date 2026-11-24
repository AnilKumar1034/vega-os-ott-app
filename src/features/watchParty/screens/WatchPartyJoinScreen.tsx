/**
 * Watch Party Join Screen
 * TV-optimized screen for entering a room code and joining a Watch Party.
 * LogiXstream Amazon Vega OS React Native Application
 */

import React, {useCallback, useEffect, useState} from 'react';
import {ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {Routes} from '../../../constants/routes';
import {useAuth} from '../../../context/authContext';
import {useProfile} from '../../../profiles/hooks/useProfile';
import {analyticsService} from '../../../analytics';
import {useWatchParty} from '../hooks/useWatchParty';
import {WatchPartyRoomHeader} from '../components/WatchPartyRoomHeader';
import {WatchPartyLoading} from '../components/WatchPartyLoading';
import {
  WATCH_PARTY_ROOM_CONFIG,
  WATCH_PARTY_TEST_IDS,
} from '../constants/watchParty.constants';
import {styles} from './WatchPartyJoinScreen.styles';

// TV keypad rows composed of allowed non-ambiguous characters
const KEYPAD_ROWS = [
  ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
  ['J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R'],
  ['S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
  ['2', '3', '4', '5', '6', '7', '8', '9'],
];

export const WatchPartyJoinScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const {user} = useAuth();
  const {activeProfile} = useProfile();
  const {joinRoom, isLoading, error, clearError} = useWatchParty();

  const [enteredCode, setEnteredCode] = useState<string>(
    route.params?.initialCode?.toUpperCase() || '',
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  const [focusedKey, setFocusedKey] = useState<string | null>(null);

  useEffect(() => {
    analyticsService
      .track('watch_party_opened' as any, {
        source: 'join_screen',
      })
      .catch(() => {});
  }, []);

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate(Routes.Home);
    }
  }, [navigation]);

  const handleKeyPress = useCallback((char: string) => {
    setValidationError(null);
    setEnteredCode((prev) => {
      if (prev.length >= WATCH_PARTY_ROOM_CONFIG.ROOM_CODE_LENGTH) {
        return prev;
      }
      return `${prev}${char}`;
    });
  }, []);

  const handleBackspace = useCallback(() => {
    setValidationError(null);
    setEnteredCode((prev) => prev.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => {
    setValidationError(null);
    setEnteredCode('');
    clearError();
  }, [clearError]);

  const handleJoin = useCallback(async () => {
    const trimmed = enteredCode.trim().toUpperCase();

    if (trimmed.length !== WATCH_PARTY_ROOM_CONFIG.ROOM_CODE_LENGTH) {
      setValidationError(
        `Please enter all ${WATCH_PARTY_ROOM_CONFIG.ROOM_CODE_LENGTH} characters of the room code.`,
      );
      return;
    }

    const userId = user?.uid || 'user_guest';
    const profileId = activeProfile?.id || 'profile_default';
    const displayName = activeProfile?.name || 'Guest';

    analyticsService
      .track('watch_party_join_started' as any, {
        userId,
        profileId,
      })
      .catch(() => {});

    try {
      const result = await joinRoom({
        roomCode: trimmed,
        userId,
        profileId,
        displayName,
      });

      analyticsService
        .track('watch_party_joined' as any, {
          roomId: result.room.id,
          contentId: result.room.contentId,
        })
        .catch(() => {});

      navigation.navigate(Routes.WatchPartyLobby, {
        roomId: result.room.id,
        room: result.room,
      });
    } catch (err: any) {
      analyticsService
        .track('watch_party_error' as any, {
          operation: 'join_room',
          code: err.code || 'SERVER_ERROR',
        })
        .catch(() => {});
    }
  }, [activeProfile?.id, activeProfile?.name, enteredCode, joinRoom, navigation, user?.uid]);

  if (isLoading) {
    return (
      <View style={styles.container} testID={WATCH_PARTY_TEST_IDS.joinScreen}>
        <WatchPartyRoomHeader
          title="Join Watch Party"
          subtitle="Connecting to room..."
          onBack={handleBack}
        />
        <WatchPartyLoading message="Connecting to Watch Party..." />
      </View>
    );
  }

  // Generate 6 visual slot displays
  const codeSlots = Array.from(
    {length: WATCH_PARTY_ROOM_CONFIG.ROOM_CODE_LENGTH},
    (_, idx) => enteredCode[idx] || '',
  );

  return (
    <View style={styles.container} testID={WATCH_PARTY_TEST_IDS.joinScreen}>
      <WatchPartyRoomHeader
        title="Join Watch Party"
        subtitle="Enter the 6-character room code from your host"
        onBack={handleBack}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <TVFocusGuideView style={styles.contentGuide} autoFocus>
          <View style={styles.mainCard}>
          <Text style={styles.title}>Enter Room Code</Text>
          <Text style={styles.subtitle}>
            Use your TV remote D-pad to enter letters and numbers
          </Text>

          {/* 6 Code Character Slots */}
          <View
            style={styles.codeSlotsRow}
            testID={WATCH_PARTY_TEST_IDS.roomCodeInput}>
            {codeSlots.map((char, index) => (
              <View
                key={index}
                style={[styles.codeSlot, Boolean(char) && styles.codeSlotFilled]}>
                <Text style={styles.codeSlotText}>{char}</Text>
              </View>
            ))}
          </View>

          {/* Keypad Grid */}
          <View style={styles.keypadContainer}>
            {KEYPAD_ROWS.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.keypadRow}>
                {row.map((char) => {
                  const isFocused = focusedKey === char;
                  return (
                    <TouchableOpacity
                      key={char}
                      style={[
                        styles.keypadKey,
                        isFocused && styles.keypadKeyFocused,
                      ]}
                      onFocus={() => setFocusedKey(char)}
                      onBlur={() => setFocusedKey(null)}
                      onPress={() => handleKeyPress(char)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`Letter ${char}`}
                      testID={WATCH_PARTY_TEST_IDS.keypadKey(char)}>
                      <Text style={styles.keypadKeyText}>{char}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}

            {/* Bottom Keypad Row with Backspace & Clear */}
            <View style={styles.keypadRow}>
              <TouchableOpacity
                style={[
                  styles.keypadKey,
                  styles.keypadActionKey,
                  focusedKey === 'backspace' && styles.keypadKeyFocused,
                ]}
                onFocus={() => setFocusedKey('backspace')}
                onBlur={() => setFocusedKey(null)}
                onPress={handleBackspace}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Backspace"
                testID={WATCH_PARTY_TEST_IDS.keypadBackspace}>
                <Text style={styles.keypadKeyText}>⌫</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.keypadKey,
                  styles.keypadActionKey,
                  focusedKey === 'clear' && styles.keypadKeyFocused,
                ]}
                onFocus={() => setFocusedKey('clear')}
                onBlur={() => setFocusedKey(null)}
                onPress={handleClear}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Clear"
                testID={WATCH_PARTY_TEST_IDS.keypadClear}>
                <Text style={styles.keypadKeyText}>CLR</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Validation or API Error Banner */}
          {validationError || error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>
                {validationError || error?.message}
              </Text>
            </View>
          ) : null}

          {/* Action Row */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[
                styles.joinButton,
                enteredCode.length !== WATCH_PARTY_ROOM_CONFIG.ROOM_CODE_LENGTH &&
                  styles.joinButtonDisabled,
                focusedKey === 'join' && styles.joinButtonFocused,
              ]}
              onFocus={() => setFocusedKey('join')}
              onBlur={() => setFocusedKey(null)}
              onPress={handleJoin}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Join Watch Party Room"
              testID={WATCH_PARTY_TEST_IDS.joinButton}>
              <Text style={styles.joinButtonText}>Join Watch Party</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.clearButton,
                focusedKey === 'clear_button' && styles.clearButtonFocused,
              ]}
              onFocus={() => setFocusedKey('clear_button')}
              onBlur={() => setFocusedKey(null)}
              onPress={handleClear}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Clear code"
              testID={WATCH_PARTY_TEST_IDS.clearCodeButton}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TVFocusGuideView>
    </ScrollView>
  </View>
  );
};
