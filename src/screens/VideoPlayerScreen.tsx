/* global globalThis */
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  AppState,
  AppStateStatus,
  Dimensions,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {
  DEFAULT_MOCK_VIDEO_URL,
  getSeekbarTypeForContent,
  HomeContentItem,
} from '../data/home';
import {
  PlayerSeekBar,
  SeekbarType,
} from '../components/molecules/PlayerSeekBar';
import {Routes} from '../constants/routes';
import {strings} from '../constants/strings';
import {useAuth} from '../context/authContext';
import {useProfile} from '../profiles/hooks/useProfile';
import {findContentById} from '../utils/deeplink';
import {
  clearContinueWatchProgress,
  fetchContinueWatchForContent,
  saveContinueWatchProgress,
} from '../services/watchProgressService';
import {recordViewingHistory} from '../services/viewingHistoryService';
import {canProfileAccessContent} from '../utils/contentAccessPolicy';
import {styles} from './VideoPlayerScreen.styles';
import type {
  ShakaPlayer,
  ShakaPlayerSettings,
} from '../shakaplayer/ShakaPlayer';
import {LiveChannelDrmConfig} from '../features/live-tv/models/LiveChannel';
import {verifyWidevineSupport} from '../utils/widevineDiagnostics';
import {getSubtitleTracksForContent, SUBTITLE_OFF_ID} from '../data/subtitles';
import {
  findActiveSubtitleCue,
  getSavedSubtitlePreference,
  saveSubtitlePreference,
} from '../services/subtitleService';
import {SubtitleTrack} from '../types/subtitles';
import {SubtitleOverlay} from '../components/molecules/SubtitleOverlay';
import {SubtitlesModal} from '../components/molecules/SubtitlesModal';
import {getAudioTracksForContent} from '../data/audioTracks';
import {
  findMatchingAudioTrack,
  getSavedAudioPreference,
  saveAudioPreference,
} from '../services/audioTrackService';
import {AudioTrack} from '../types/audioTracks';
import {AudioTracksModal} from '../components/molecules/AudioTracksModal';
import {AUTO_QUALITY_ID, VideoQualityOption} from '../types/videoQuality';
import {
  getVideoQualitiesForContent,
  extractQualitiesFromShakaVariants,
} from '../data/videoQualities';
import {
  findMatchingQuality,
  getSavedQualityPreference,
  saveQualityPreference,
} from '../services/videoQualityService';
import {VideoQualityModal} from '../components/molecules/VideoQualityModal';
import {EpisodeItem} from '../types/episode';
import {getNextEpisodeForContent} from '../data/episodes';
import {
  DEFAULT_NEXT_EPISODE_COUNTDOWN_SECONDS,
  isAutoplayEnabled,
} from '../services/episodeService';
import {NextEpisodeModal} from '../components/molecules/NextEpisodeModal';

let KeplerVideoViewComponent: any = View;
let VideoPlayerClass: any = null;

try {
  const w3cMedia = require('@amazon-devices/react-native-w3cmedia');
  if (w3cMedia) {
    KeplerVideoViewComponent =
      w3cMedia.KeplerVideoView ||
      w3cMedia.KeplerVideoSurfaceView ||
      w3cMedia.Video ||
      View;
    VideoPlayerClass = w3cMedia.VideoPlayer || w3cMedia.Video || null;
  }
} catch (e) {
  KeplerVideoViewComponent = View;
  VideoPlayerClass = null;
}

export const VideoPlayerScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {user, userProfile, loading} = useAuth();
  const {activeProfile} = useProfile();
  const isLive = Boolean(route.params?.isLive);

  const screenDimensions = Dimensions.get('window');
  const screenWidth = screenDimensions.width || 1920;
  const screenHeight = screenDimensions.height || 1080;

  const deeplinkMovie = findContentById(route.params?.movieId);
  const movie = useMemo<HomeContentItem>(
    () =>
      route.params?.movie ||
      deeplinkMovie || {
        id: 'sample-video',
        title: strings.nav.videoSampleTitle,
        genre: strings.nav.videoSampleGenre,
        rating: strings.nav.videoSampleRating,
        image: require('../assets/background.png'),
      },
    [deeplinkMovie, route.params?.movie],
  );

  const resolvedNextEpisode = useMemo<EpisodeItem | null>(() => {
    if (isLive) {
      return null;
    }
    if (route.params?.nextEpisode) {
      return route.params.nextEpisode;
    }
    const currentEpisodeId = route.params?.episode?.id || movie.id;
    return getNextEpisodeForContent(
      {
        ...movie,
        episodes: route.params?.episodes || (movie as any).episodes,
        nextEpisode: route.params?.nextEpisode || (movie as any).nextEpisode,
      },
      currentEpisodeId,
    );
  }, [
    isLive,
    movie,
    route.params?.episode?.id,
    route.params?.episodes,
    route.params?.nextEpisode,
  ]);

  const autoplayEnabled = useMemo(() => {
    return isAutoplayEnabled(userProfile, activeProfile);
  }, [activeProfile, userProfile]);

  const videoUrl =
    route.params?.videoUrl || movie.videoUrl || DEFAULT_MOCK_VIDEO_URL;
  const streamType =
    (route.params?.streamType as 'hls' | 'dash' | undefined) ||
    (videoUrl?.includes('.mpd')
      ? 'dash'
      : videoUrl?.includes('.m3u8')
      ? 'hls'
      : undefined);
  const isVideoOnly = Boolean(route.params?.isVideoOnly);
  const drm = route.params?.drm as LiveChannelDrmConfig | undefined;
  const isDrmContent = Boolean(drm?.enabled);
  const useShakaPlayer =
    streamType === 'dash' ||
    streamType === 'hls' ||
    isDrmContent ||
    Boolean(videoUrl?.includes('angel-one')) ||
    Boolean(videoUrl?.includes('storage.googleapis.com/shaka-demo-assets'));
  const deeplinkSeek = Number(route.params?.seek);
  const hasExplicitSeek =
    Number.isFinite(deeplinkSeek) && deeplinkSeek >= 0 ? deeplinkSeek : null;
  const hasResolvedMovie =
    Boolean(route.params?.movie) || Boolean(deeplinkMovie);

  useEffect(() => {
    if (!route.params?.movieId || hasResolvedMovie) {
      return;
    }

    navigation.replace(Routes.Home);
  }, [hasResolvedMovie, navigation, route.params?.movieId]);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      navigation.replace(Routes.Login, {
        redirectTo: {
          routeName: Routes.VideoPlayer,
          params: {
            movieId: route.params?.movieId || movie.id,
            movie: route.params?.movie,
            videoUrl: route.params?.videoUrl || movie.videoUrl,
            seek: route.params?.seek,
            isLive: route.params?.isLive,
            streamType: route.params?.streamType,
            isVideoOnly: route.params?.isVideoOnly,
            drm: route.params?.drm,
          },
        },
      });
    }
  }, [loading, movie.id, movie.videoUrl, navigation, route.params, user]);

  const playerRef = useRef<any>(null);
  const sourceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  if (playerRef.current === null && VideoPlayerClass) {
    try {
      playerRef.current = new VideoPlayerClass();
    } catch (e) {
      playerRef.current = null;
    }
  }
  const player = playerRef.current;
  const movieId = movie.id;
  const shakaPlayerRef = useRef<ShakaPlayer | null>(null);
  const drmPlaybackStartedRef = useRef(false);
  const surfaceReadyRef = useRef(false);
  const shakaLoadedRef = useRef(false);
  // A D-pad Select that opens the player can be delivered once more as the
  // initial TV focus settles. Keep it from activating the Back button.
  const playerOpenedAtRef = useRef(Date.now());

  const playbackProfileIdRef = useRef<string | null>(activeProfile?.id || null);
  const historyRecordedForSessionRef = useRef(false);
  useEffect(() => {
    if (!playbackProfileIdRef.current && activeProfile?.id) {
      playbackProfileIdRef.current = activeProfile.id;
    }
  }, [activeProfile?.id]);

  const backButtonRef = useRef<any>(null);
  const [backButtonNode, setBackButtonNode] = useState<any>(null);
  const [isBackFocused, setIsBackFocused] = useState(false);
  const [isPlaybackPaused, setIsPlaybackPaused] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isPlayerInitialized, setIsPlayerInitialized] = useState(false);
  const [resumeTime, setResumeTime] = useState<number>(0);
  const lastSavedTimeRef = useRef<number>(0);
  const progressTimerRef = useRef<any>(null);
  const timeSyncTimerRef = useRef<any>(null);
  const pendingSeekRef = useRef<number | null>(null);
  const metadataReadyRef = useRef(false);
  const shouldApplySeekRef = useRef(false);

  const hideControlsTimerRef = useRef<any>(null);

  const [playbackTime, setPlaybackTime] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [activeSeekbarType, setActiveSeekbarType] = useState<SeekbarType>(
    () => {
      return route.params?.seekbarType || getSeekbarTypeForContent(movie);
    },
  );

  useEffect(() => {
    const determinedType =
      route.params?.seekbarType || getSeekbarTypeForContent(movie);
    setActiveSeekbarType(determinedType);
  }, [movie, route.params?.seekbarType]);

  // --- Next Episode Feature Setup ---
  const [isNextEpisodeModalOpen, setIsNextEpisodeModalOpen] = useState(false);
  const [nextEpisodeCountdown, setNextEpisodeCountdown] = useState(
    DEFAULT_NEXT_EPISODE_COUNTDOWN_SECONDS,
  );
  const countdownTimerRef = useRef<any>(null);
  const hasTriggeredEpisodeEndRef = useRef(false);

  // --- Subtitles Feature Setup ---
  const availableSubtitleTracks = useMemo<SubtitleTrack[]>(
    () =>
      getSubtitleTracksForContent(
        movie.id,
        movie.title,
        videoUrl,
        isLive,
        movie.genre,
        movie.description,
      ),
    [movie.id, movie.title, videoUrl, isLive, movie.genre, movie.description],
  );

  const [selectedSubtitleTrackId, setSelectedSubtitleTrackId] =
    useState<string>(() => {
      const defaultTrack = availableSubtitleTracks.find((t) => t.isDefault);
      return defaultTrack ? defaultTrack.id : SUBTITLE_OFF_ID;
    });
  const [isSubtitlesModalOpen, setIsSubtitlesModalOpen] = useState(false);
  const [isCCFocused, setIsCCFocused] = useState(false);
  const [activeSubtitleCueText, setActiveSubtitleCueText] = useState<
    string | null
  >(null);
  const subtitleSyncTimerRef = useRef<any>(null);

  // Load saved subtitle preference for active profile
  useEffect(() => {
    let active = true;
    const loadSubtitlePref = async () => {
      const targetProfileId = playbackProfileIdRef.current || activeProfile?.id;
      const savedPref = await getSavedSubtitlePreference(targetProfileId);
      if (active && savedPref) {
        const exists =
          savedPref === SUBTITLE_OFF_ID ||
          availableSubtitleTracks.some((t) => t.id === savedPref);
        if (exists) {
          setSelectedSubtitleTrackId(savedPref);
        }
      }
    };
    loadSubtitlePref();
    return () => {
      active = false;
    };
  }, [activeProfile?.id, availableSubtitleTracks]);

  // Ensure player's native textTracks are populated and trigger addtrack after KeplerVideoView mounts
  useEffect(() => {
    if (!player || !isPlayerInitialized) {
      return;
    }

    const syncTracksToPlayer = () => {
      try {
        if (player.addTextTrack && player.textTracks) {
          availableSubtitleTracks.forEach((track) => {
            if (track.id !== SUBTITLE_OFF_ID) {
              const trackListLen = player.textTracks.length || 0;
              let foundTrack: any = null;
              for (let i = 0; i < trackListLen; i++) {
                const t = player.textTracks[i];
                if (
                  t &&
                  (t.language === track.language ||
                    t.label === track.label ||
                    t.id === track.id)
                ) {
                  foundTrack = t;
                  break;
                }
              }
              if (!foundTrack) {
                foundTrack = player.addTextTrack(
                  'subtitles',
                  track.label,
                  track.language,
                );
              }
              if (foundTrack) {
                foundTrack.mode =
                  track.id === selectedSubtitleTrackId ? 'showing' : 'hidden';
                player.textTracks.emitEvent?.('addtrack', foundTrack);
              }
            }
          });
        }
      } catch (e) {
        console.log('Error syncing text tracks to player:', e);
      }
    };

    syncTracksToPlayer();
    const t1 = setTimeout(syncTracksToPlayer, 300);
    const t2 = setTimeout(syncTracksToPlayer, 1000);
    const t3 = setTimeout(syncTracksToPlayer, 2000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [
    availableSubtitleTracks,
    isPlayerInitialized,
    player,
    selectedSubtitleTrackId,
  ]);

  const activeSubtitleTrack = useMemo(() => {
    if (selectedSubtitleTrackId === SUBTITLE_OFF_ID) {
      return null;
    }
    return (
      availableSubtitleTracks.find((t) => t.id === selectedSubtitleTrackId) ||
      null
    );
  }, [availableSubtitleTracks, selectedSubtitleTrackId]);

  // --- Audio Tracks Feature Setup ---
  const availableAudioTracks = useMemo<AudioTrack[]>(
    () =>
      getAudioTracksForContent(
        movie.id,
        movie.title,
        videoUrl,
        isLive,
        movie.genre,
        movie.description,
      ),
    [movie.id, movie.title, videoUrl, isLive, movie.genre, movie.description],
  );

  const [selectedAudioTrackId, setSelectedAudioTrackId] = useState<string>(
    () => {
      const defaultTrack = availableAudioTracks.find((t) => t.isDefault);
      return defaultTrack
        ? defaultTrack.id
        : availableAudioTracks[0]?.id || 'audio-default';
    },
  );
  const [isAudioTracksModalOpen, setIsAudioTracksModalOpen] = useState(false);
  const [isAudioFocused, setIsAudioFocused] = useState(false);

  // Load saved audio preference for active profile
  useEffect(() => {
    let active = true;
    const loadAudioPref = async () => {
      const targetProfileId = playbackProfileIdRef.current || activeProfile?.id;
      const savedPref = await getSavedAudioPreference(targetProfileId);
      if (active && savedPref) {
        const matching = findMatchingAudioTrack(
          availableAudioTracks,
          savedPref,
        );
        if (matching) {
          setSelectedAudioTrackId(matching.id);
        }
      }
    };
    loadAudioPref();
    return () => {
      active = false;
    };
  }, [activeProfile?.id, availableAudioTracks]);

  const activeAudioTrack = useMemo(() => {
    return (
      availableAudioTracks.find((t) => t.id === selectedAudioTrackId) ||
      availableAudioTracks[0] ||
      null
    );
  }, [availableAudioTracks, selectedAudioTrackId]);

  const selectedAudioLanguageRef = useRef<string | null>(null);
  useEffect(() => {
    selectedAudioLanguageRef.current = activeAudioTrack?.language || null;
  }, [activeAudioTrack?.language]);

  // --- Video Quality Feature Setup ---
  const [dynamicQualityOptions, setDynamicQualityOptions] = useState<
    VideoQualityOption[] | null
  >(null);
  const availableVideoQualities = useMemo<VideoQualityOption[]>(() => {
    if (dynamicQualityOptions && dynamicQualityOptions.length > 0) {
      return dynamicQualityOptions;
    }
    return getVideoQualitiesForContent(movie.id, movie.title, videoUrl, isLive);
  }, [dynamicQualityOptions, isLive, movie.id, movie.title, videoUrl]);

  const [selectedQualityId, setSelectedQualityId] =
    useState<string>(AUTO_QUALITY_ID);
  const [activeRendition, setActiveRendition] = useState<{
    width?: number;
    height?: number;
    bitrate?: string;
    badge?: string;
  } | null>(null);
  const [isVideoQualityModalOpen, setIsVideoQualityModalOpen] = useState(false);
  const [isQualityFocused, setIsQualityFocused] = useState(false);

  // Load saved quality preference for active profile
  useEffect(() => {
    let active = true;
    const loadQualityPref = async () => {
      const targetProfileId = playbackProfileIdRef.current || activeProfile?.id;
      const savedPref = await getSavedQualityPreference(targetProfileId);
      if (active && savedPref) {
        const matching = findMatchingQuality(
          availableVideoQualities,
          savedPref,
        );
        if (matching) {
          setSelectedQualityId(matching.id);
        }
      }
    };
    loadQualityPref();
    return () => {
      active = false;
    };
  }, [activeProfile?.id, availableVideoQualities]);

  const activeVideoQuality = useMemo(() => {
    return (
      availableVideoQualities.find((q) => q.id === selectedQualityId) ||
      availableVideoQualities[0] ||
      null
    );
  }, [availableVideoQualities, selectedQualityId]);

  const updateActiveSubtitle = useCallback(() => {
    if (!player || !activeSubtitleTrack || !activeSubtitleTrack.cues) {
      setActiveSubtitleCueText(null);
      return;
    }
    const currentSec = Number(player.currentTime || 0);
    const cue = findActiveSubtitleCue(activeSubtitleTrack.cues, currentSec);
    setActiveSubtitleCueText(cue ? cue.text : null);
  }, [activeSubtitleTrack, player]);

  // Synchronize current subtitle cue with player time
  useEffect(() => {
    if (!activeSubtitleTrack || !player) {
      setActiveSubtitleCueText(null);
      if (subtitleSyncTimerRef.current) {
        clearInterval(subtitleSyncTimerRef.current);
        subtitleSyncTimerRef.current = null;
      }
      return;
    }

    const onTimeUpdate = () => {
      updateActiveSubtitle();
    };

    if (player.addEventListener) {
      player.addEventListener('timeupdate', onTimeUpdate);
    }

    subtitleSyncTimerRef.current = setInterval(() => {
      updateActiveSubtitle();
    }, 250);

    return () => {
      if (subtitleSyncTimerRef.current) {
        clearInterval(subtitleSyncTimerRef.current);
        subtitleSyncTimerRef.current = null;
      }
      if (player.removeEventListener) {
        player.removeEventListener('timeupdate', onTimeUpdate);
      }
    };
  }, [activeSubtitleTrack, player, updateActiveSubtitle]);

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    hideControlsTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 8000);
  }, []);

  const handleSelectSubtitleTrack = useCallback(
    async (trackId: string) => {
      setSelectedSubtitleTrackId(trackId);
      const targetProfileId = playbackProfileIdRef.current || activeProfile?.id;
      await saveSubtitlePreference(targetProfileId, trackId);

      if (player?.textTracks && player.textTracks.length > 0) {
        try {
          if (trackId === SUBTITLE_OFF_ID) {
            player.captioning = false;
            for (let i = 0; i < player.textTracks.length; i++) {
              if (player.textTracks[i]) {
                player.textTracks[i].mode = 'hidden';
              }
            }
          } else {
            player.captioning = true;
            const targetTrack = availableSubtitleTracks.find(
              (t) => t.id === trackId,
            );
            for (let i = 0; i < player.textTracks.length; i++) {
              const current = player.textTracks[i];
              if (
                current &&
                (current.language === targetTrack?.language ||
                  current.label === targetTrack?.label ||
                  current.id === targetTrack?.id)
              ) {
                current.mode = 'showing';
              } else if (current) {
                current.mode = 'hidden';
              }
            }
          }
        } catch (e) {
          console.log('Error syncing player text track mode:', e);
        }
      }

      if (shakaPlayerRef.current?.player) {
        try {
          if (trackId === SUBTITLE_OFF_ID) {
            await shakaPlayerRef.current.player.setTextTrackVisibility?.(false);
          } else {
            await shakaPlayerRef.current.player.setTextTrackVisibility?.(true);
          }
        } catch (e) {
          console.log('Shaka text track sync error:', e);
        }
      }

      setIsSubtitlesModalOpen(false);
      resetHideTimer();
    },
    [activeProfile?.id, availableSubtitleTracks, player, resetHideTimer],
  );

  const handleSelectAudioTrack = useCallback(
    async (trackId: string) => {
      setSelectedAudioTrackId(trackId);
      const targetProfileId = playbackProfileIdRef.current || activeProfile?.id;
      await saveAudioPreference(targetProfileId, trackId);

      const targetTrack = availableAudioTracks.find((t) => t.id === trackId);
      if (!targetTrack) {
        setIsAudioTracksModalOpen(false);
        resetHideTimer();
        return;
      }

      // 1. Sync with native W3C media element audioTracks if matching track exists
      if (player?.audioTracks && player.audioTracks.length > 0) {
        try {
          let hasMatchingNativeTrack = false;
          for (let i = 0; i < player.audioTracks.length; i++) {
            const current = player.audioTracks[i];
            if (
              current &&
              (current.language?.toLowerCase() ===
                targetTrack.language.toLowerCase() ||
                current.label?.toLowerCase() ===
                  targetTrack.label.toLowerCase() ||
                current.id === targetTrack.id)
            ) {
              hasMatchingNativeTrack = true;
              break;
            }
          }

          if (hasMatchingNativeTrack) {
            for (let i = 0; i < player.audioTracks.length; i++) {
              const current = player.audioTracks[i];
              if (current) {
                const matches =
                  current.language?.toLowerCase() ===
                    targetTrack.language.toLowerCase() ||
                  current.label?.toLowerCase() ===
                    targetTrack.label.toLowerCase() ||
                  current.id === targetTrack.id;
                current.enabled = matches;
              }
            }
            player.audioTracks.emitEvent?.('change');
          }
        } catch (e) {
          console.log('Notice syncing player audio track:', e);
        }
      }

      // 2. Sync if player has selectAudioLanguage method
      if (typeof player?.selectAudioLanguage === 'function') {
        try {
          player.selectAudioLanguage(targetTrack.language);
        } catch (e) {
          console.log('Notice calling player.selectAudioLanguage:', e);
        }
      }

      // 3. Sync with Shaka player instance if active
      if (shakaPlayerRef.current) {
        try {
          const shakaInst = shakaPlayerRef.current;
          const targetLang = targetTrack.language.toLowerCase();
          console.log('Shaka selecting audio track language:', targetLang);

          shakaInst.selectAudioLanguage?.(targetTrack.language);
          if (shakaInst.player?.selectAudioLanguage) {
            shakaInst.player.selectAudioLanguage(targetTrack.language);
          }

          // If variant tracks are available, select matching variant and clear audio buffer
          const rawPlayer = shakaInst.player;
          if (rawPlayer && typeof rawPlayer.getVariantTracks === 'function') {
            const variants = rawPlayer.getVariantTracks();
            if (Array.isArray(variants)) {
              const match = variants.find(
                (v: any) =>
                  v.language?.toLowerCase() === targetLang ||
                  v.language?.toLowerCase().startsWith(targetLang) ||
                  targetLang.startsWith(v.language?.toLowerCase() || ''),
              );
              if (match && typeof rawPlayer.selectVariantTrack === 'function') {
                console.log('Shaka activating variant track:', match);
                rawPlayer.selectVariantTrack(match, false);
              }
            }
          }
        } catch (e) {
          console.log('Notice Shaka audio track selection:', e);
        }
      }

      setIsAudioTracksModalOpen(false);
      resetHideTimer();
    },
    [activeProfile?.id, availableAudioTracks, player, resetHideTimer],
  );

  const handleSelectQuality = useCallback(
    async (qualityId: string) => {
      setSelectedQualityId(qualityId);
      const targetProfileId = playbackProfileIdRef.current || activeProfile?.id;
      await saveQualityPreference(targetProfileId, qualityId);

      const targetQuality = availableVideoQualities.find(
        (q) => q.id === qualityId,
      );
      if (!targetQuality) {
        setIsVideoQualityModalOpen(false);
        resetHideTimer();
        return;
      }

      // 1. Shaka Player ABR & Variant selection
      if (shakaPlayerRef.current?.player) {
        try {
          const rawPlayer = shakaPlayerRef.current.player;
          if (qualityId === AUTO_QUALITY_ID) {
            console.log('Shaka configuring ABR: enabled');
            rawPlayer.configure?.({
              abr: {
                enabled: true,
                restrictions: {
                  minHeight: 0,
                  maxHeight: Math.min(screenHeight, 1080),
                  maxWidth: Math.min(screenWidth, 1920),
                },
              },
            });
          } else {
            console.log('Shaka configuring manual quality:', targetQuality);
            rawPlayer.configure?.({
              abr: {
                enabled: false,
                restrictions: {
                  minHeight: targetQuality.height || 0,
                  maxHeight: targetQuality.height || 1080,
                },
              },
            });

            if (typeof rawPlayer.getVariantTracks === 'function') {
              const variants = rawPlayer.getVariantTracks();
              if (Array.isArray(variants) && variants.length > 0) {
                const targetH = targetQuality.height;
                const activeAudioLang =
                  selectedAudioLanguageRef.current?.toLowerCase();
                const currentVariant = variants.find((v: any) => v.active);

                // Prefer AVC (H.264) variants for Kepler / Vega OS MSE compatibility
                const isAvcTrack = (v: any) =>
                  !v.videoCodec ||
                  v.videoCodec.includes('avc') ||
                  !v.videoCodec.includes('hev');

                const match =
                  variants.find(
                    (v: any) =>
                      v.height === targetH &&
                      currentVariant?.audioId != null &&
                      v.audioId === currentVariant.audioId &&
                      isAvcTrack(v),
                  ) ||
                  variants.find(
                    (v: any) =>
                      v.height === targetH &&
                      (!activeAudioLang ||
                        v.language?.toLowerCase() === activeAudioLang) &&
                      isAvcTrack(v),
                  ) ||
                  variants.find(
                    (v: any) => v.height === targetH && isAvcTrack(v),
                  ) ||
                  (targetQuality.rawTrack &&
                    variants.find(
                      (v: any) =>
                        v.id === targetQuality.rawTrack.id && isAvcTrack(v),
                    )) ||
                  variants.find((v: any) => v.height === targetH) ||
                  variants.find(
                    (v: any) =>
                      v.height && targetH && Math.abs(v.height - targetH) <= 60,
                  );

                if (
                  match &&
                  typeof rawPlayer.selectVariantTrack === 'function'
                ) {
                  console.log('Shaka selecting variant track seamlessly:', match);
                  // clearBuffer=false ensures Kepler video decoder does not stall
                  rawPlayer.selectVariantTrack(match, false);
                  const mbps = match.bandwidth
                    ? match.bandwidth >= 1000000
                      ? `${(match.bandwidth / 1000000).toFixed(1)} Mbps`
                      : `${Math.round(match.bandwidth / 1000)} Kbps`
                    : targetQuality.bitrate;
                  setActiveRendition({
                    width: match.width,
                    height: match.height,
                    bitrate: mbps,
                    badge: `${match.height}p`,
                  });
                  console.log(
                    `[QualitySwitch] Active rendition switched to: ${match.height}p (${match.width}x${match.height} @ ${mbps}, ${match.videoCodec})`,
                  );
                }
              }
            }
          }

          // Ensure native media element continues playback smoothly
          if (player && typeof player.play === 'function' && !isPlaybackPaused) {
            try {
              const playPromise = player.play();
              if (playPromise && typeof playPromise.catch === 'function') {
                playPromise.catch(() => {});
              }
            } catch {
              // Ignore benign play rejection
            }
          }
        } catch (e) {
          console.log('Notice Shaka video quality selection:', e);
        }
      }

      // 2. Native W3C player videoTracks sync ONLY when Shaka is NOT active
      if (!useShakaPlayer && player?.videoTracks && player.videoTracks.length > 0) {
        try {
          if (qualityId !== AUTO_QUALITY_ID) {
            for (let i = 0; i < player.videoTracks.length; i++) {
              const current = player.videoTracks[i];
              if (current) {
                const matches =
                  current.id === qualityId ||
                  (targetQuality.height &&
                    current.label?.includes(String(targetQuality.height)));
                current.selected = matches;
              }
            }
            player.videoTracks.emitEvent?.('change');
          }
        } catch (e) {
          console.log('Notice syncing player video track:', e);
        }
      }

      setIsVideoQualityModalOpen(false);
      resetHideTimer();
    },
    [
      activeProfile?.id,
      availableVideoQualities,
      player,
      resetHideTimer,
      screenHeight,
      screenWidth,
    ],
  );

  const startAdaptivePlayback = useCallback(() => {
    if (!player) {
      return;
    }
    Promise.resolve(player?.play?.()).catch((error) => {
      console.log('Adaptive playback start error:', error);
      setVideoError(error?.message || strings.errors.videoPlaybackUnavailable);
    });
  }, [player]);

  const startDrmPlayback = useCallback(async () => {
    if (!useShakaPlayer || !player || drmPlaybackStartedRef.current) {
      return;
    }

    drmPlaybackStartedRef.current = true;
    try {
      if (isDrmContent && drm?.keySystem === 'com.widevine.alpha') {
        const hasWidevineSupport = await verifyWidevineSupport();
        if (!hasWidevineSupport) {
          throw new Error(
            'Widevine DRM is unavailable on this Vega device configuration.',
          );
        }
      }

      (globalThis as any).gmedia = player;

      const playerSettings: ShakaPlayerSettings = {
        secure: isDrmContent,
        abrEnabled: true,
        // The public Sintel Widevine asset advertises a 4K rendition. The
        // Vega MSE source-buffer path on this device rejects that rendition,
        // so keep Shaka on the broadly supported FHD H.264 profiles.
        abrMaxWidth: Math.min(screenWidth, 1920),
        abrMaxHeight: Math.min(screenHeight, 1080),
      };
      // Shaka installs several browser/media polyfills at module load time.
      // Keep that work off the app bootstrap path: this screen is registered by
      // the root navigator even when the user never opens adaptive playback.
      const {
        ShakaPlayer: ShakaPlayerImplementation,
      } = require('../shakaplayer/ShakaPlayer');
      const shakaPlayer = new ShakaPlayerImplementation(
        player,
        playerSettings,
      ) as ShakaPlayer;
      shakaPlayerRef.current = shakaPlayer;
      const initialAudioLang = selectedAudioLanguageRef.current;
      const source = {
        secure: isDrmContent ? 'true' : 'false',
        uri: videoUrl,
        type: streamType === 'hls' ? 'HLS' : 'DASH',
        container: 'MP4',
        vcodec: 'avc1',
        ...(isVideoOnly ? {} : {acodec: 'mp4a'}),
        ...(isVideoOnly ? {video_only: 'true'} : {}),
        ...(initialAudioLang ? {preferredAudioLanguage: initialAudioLang} : {}),
        ...(isDrmContent && drm
          ? {
              drm_scheme: drm.keySystem,
              drm_license_uri: drm.licenseUrl,
            }
          : {}),
      };

      await shakaPlayer.load(source, true);
      shakaLoadedRef.current = true;

      // Sync any text tracks discovered by Shaka into player.textTracks so default player controls display them
      try {
        const rawPlayer = shakaPlayer.player;
        if (rawPlayer && typeof rawPlayer.getTextTracks === 'function') {
          const shakaTracks = rawPlayer.getTextTracks();
          if (
            Array.isArray(shakaTracks) &&
            player.addTextTrack &&
            player.textTracks
          ) {
            shakaTracks.forEach((st: any) => {
              const lang = st.language || 'en';
              const label = st.label || st.language || 'Subtitle';
              const trackListLen = player.textTracks.length || 0;
              let exists = false;
              for (let i = 0; i < trackListLen; i++) {
                const t = player.textTracks[i];
                if (t && (t.language === lang || t.label === label)) {
                  exists = true;
                  break;
                }
              }
              if (!exists) {
                const newTrack = player.addTextTrack('subtitles', label, lang);
                if (newTrack) {
                  newTrack.mode = 'hidden';
                  player.textTracks.emitEvent?.('addtrack', newTrack);
                }
              }
            });
          }
        }
      } catch (err) {
        console.log('Shaka text track sync notice:', err);
      }

      // Sync any variant tracks discovered by Shaka for dynamic video quality selection
      try {
        const rawPlayer = shakaPlayer.player;
        if (rawPlayer && typeof rawPlayer.getVariantTracks === 'function') {
          const variants = rawPlayer.getVariantTracks();
          if (Array.isArray(variants) && variants.length > 0) {
            const extracted = extractQualitiesFromShakaVariants(variants);
            if (extracted.length > 1) {
              setDynamicQualityOptions(extracted);
            }
            const active = variants.find((t: any) => t.active);
            if (active && active.height) {
              const mbps = active.bandwidth
                ? active.bandwidth >= 1000000
                  ? `${(active.bandwidth / 1000000).toFixed(1)} Mbps`
                  : `${Math.round(active.bandwidth / 1000)} Kbps`
                : undefined;
              setActiveRendition({
                width: active.width,
                height: active.height,
                bitrate: mbps,
                badge: `${active.height}p`,
              });
              console.log(
                `[QualityInit] Initial active stream rendition: ${active.width}x${active.height} (${mbps})`,
              );
            }
          }

          const onVariantTrackChange = (event: any) => {
            const newTrack = event?.newTrack;
            if (newTrack && newTrack.height) {
              const mbps = newTrack.bandwidth
                ? newTrack.bandwidth >= 1000000
                  ? `${(newTrack.bandwidth / 1000000).toFixed(1)} Mbps`
                  : `${Math.round(newTrack.bandwidth / 1000)} Kbps`
                : undefined;
              setActiveRendition({
                width: newTrack.width,
                height: newTrack.height,
                bitrate: mbps,
                badge: `${newTrack.height}p`,
              });
              console.log(
                `[QualityVerified] Active decoder stream switched to: ${newTrack.width}x${newTrack.height} (${mbps}, ${newTrack.codecs || newTrack.videoCodec})`,
              );
            }
          };

          rawPlayer.addEventListener?.('variantchanged', onVariantTrackChange);
          rawPlayer.addEventListener?.('adaptation', onVariantTrackChange);
        }
      } catch (err) {
        console.log('Shaka variant tracks sync notice:', err);
      }

      if (initialAudioLang) {
        try {
          shakaPlayer.selectAudioLanguage?.(initialAudioLang);
        } catch (err) {
          console.log('Shaka initial audio track selection notice:', err);
        }
      }

      const isSurfaceReady =
        surfaceReadyRef.current || Boolean(player?.surfaceHandle);
      if (isSurfaceReady) {
        startAdaptivePlayback();
      } else {
        setTimeout(() => {
          if (shakaLoadedRef.current) {
            startAdaptivePlayback();
          }
        }, 500);
      }
    } catch (error: any) {
      drmPlaybackStartedRef.current = false;
      shakaLoadedRef.current = false;
      console.log('DRM playback initialization error:', error);
      setVideoError(error?.message || strings.errors.videoPlaybackUnavailable);
      throw error;
    }
  }, [
    drm,
    isDrmContent,
    isVideoOnly,
    player,
    screenHeight,
    screenWidth,
    startAdaptivePlayback,
    streamType,
    useShakaPlayer,
    videoUrl,
  ]);
  const currentSurfaceHandleRef = useRef<string | null>(null);

  const releaseMediaResourcesSync = useCallback(() => {
    try {
      if (player) {
        player.pause?.();
        const surface = currentSurfaceHandleRef.current;
        if (surface) {
          player.clearSurfaceHandle?.(surface);
          currentSurfaceHandleRef.current = null;
        } else if (player.clearSurfaceHandle) {
          player.clearSurfaceHandle?.('');
        }
        player.deinitializeSync?.(1000);
      }
    } catch (err) {
      console.log('Synchronous media resource release notice:', err);
    }
  }, [player]);

  // Intercept player.setSurfaceHandle and clearSurfaceHandle to track surface and integrate Shaka
  useEffect(() => {
    if (!player) {
      return;
    }
    const originalSetSurfaceHandle = player.setSurfaceHandle?.bind(player);
    const originalClearSurfaceHandle = player.clearSurfaceHandle?.bind(player);

    player.setSurfaceHandle = (surfaceHandle: string) => {
      currentSurfaceHandleRef.current = surfaceHandle;
      originalSetSurfaceHandle?.(surfaceHandle);
      if (surfaceHandle && useShakaPlayer) {
        surfaceReadyRef.current = true;
        if (shakaLoadedRef.current) {
          startAdaptivePlayback();
        }
      }
    };

    player.clearSurfaceHandle = (surfaceHandle: string) => {
      currentSurfaceHandleRef.current = null;
      surfaceReadyRef.current = false;
      originalClearSurfaceHandle?.(surfaceHandle);
    };

    return () => {
      if (originalSetSurfaceHandle) {
        player.setSurfaceHandle = originalSetSurfaceHandle;
      }
      if (originalClearSurfaceHandle) {
        player.clearSurfaceHandle = originalClearSurfaceHandle;
      }
    };
  }, [player, startAdaptivePlayback, useShakaPlayer]);

  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
    };
  }, [resetHideTimer]);

  useEffect(() => {
    if (isLive) {
      setResumeTime(0);
      return;
    }

    let active = true;

    const loadResumeTime = async () => {
      const targetProfileId = playbackProfileIdRef.current || activeProfile?.id;
      if (!user || !targetProfileId) {
        if (active) {
          setResumeTime(0);
        }
        return;
      }

      try {
        const progressRecord = await fetchContinueWatchForContent(
          targetProfileId,
          movieId,
        );
        if (active) {
          setResumeTime(progressRecord?.currentTime || 0);
        }
      } catch (error) {
        console.log('Resume progress load error:', error);
        if (active) {
          setResumeTime(0);
        }
      }
    };

    loadResumeTime();

    return () => {
      active = false;
    };
  }, [activeProfile?.id, isLive, movieId, user]);

  useEffect(() => {
    if (!player) {
      return;
    }

    let disposed = false;

    const onLoadStart = () => {
      if (!disposed) {
        setVideoError(null);
      }
    };

    const onError = (evt: any) => {
      if (!disposed) {
        console.log('Player error event:', evt);
        const playerErr = player.error;
        setVideoError(
          playerErr?.message || strings.errors.videoPlaybackUnavailable,
        );
      }
    };

    const onPlayerTimeUpdate = () => {
      if (!disposed && player) {
        if (
          player.currentTime !== undefined &&
          Number.isFinite(player.currentTime)
        ) {
          setPlaybackTime(player.currentTime);
        }
        if (
          player.duration !== undefined &&
          Number.isFinite(player.duration) &&
          player.duration > 0
        ) {
          setPlaybackDuration(player.duration);
        }
      }
    };

    const onLoadedMetadata = () => {
      metadataReadyRef.current = true;
      if (
        player?.duration !== undefined &&
        Number.isFinite(player.duration) &&
        player.duration > 0
      ) {
        setPlaybackDuration(player.duration);
      }
      const requestedSeek = pendingSeekRef.current;
      if (requestedSeek !== null) {
        try {
          // Progress can outlive a manifest update.  Do not ask the native
          // player to seek past the end of the currently loaded VOD asset,
          // because that is reported as a stream playback error on Vega.
          const duration = Number(player.duration);
          const seekTime =
            Number.isFinite(duration) && duration > 0
              ? Math.min(requestedSeek, Math.max(0, duration - 1))
              : requestedSeek;

          if (Number.isFinite(seekTime) && seekTime > 0) {
            player.currentTime = seekTime;
          }
        } catch (error) {
          console.log('Resume seek error:', error);
        }
        pendingSeekRef.current = null;
        shouldApplySeekRef.current = false;
      }
    };

    const onCaptioningChange = () => {
      if (!player) {
        return;
      }
      if (player.captioning === false) {
        setSelectedSubtitleTrackId(SUBTITLE_OFF_ID);
        if (shakaPlayerRef.current?.player) {
          try {
            shakaPlayerRef.current.player.setTextTrackVisibility?.(false);
          } catch (e) {
            console.log('Shaka caption visibility sync error:', e);
          }
        }
        return;
      }
      let matchedTrackId: string | null = null;
      if (player.textTracks && player.textTracks.length > 0) {
        for (let i = 0; i < player.textTracks.length; i++) {
          const track = player.textTracks[i];
          if (track && track.mode === 'showing') {
            const found = availableSubtitleTracks.find(
              (t) =>
                t.language === track.language ||
                t.label === track.label ||
                t.id === track.id,
            );
            if (found) {
              matchedTrackId = found.id;
              break;
            }
          }
        }
      }
      if (matchedTrackId) {
        setSelectedSubtitleTrackId(matchedTrackId);
      } else {
        setIsSubtitlesModalOpen(true);
      }
      if (shakaPlayerRef.current?.player) {
        try {
          shakaPlayerRef.current.player.setTextTrackVisibility?.(true);
        } catch (e) {
          console.log('Shaka caption visibility sync error:', e);
        }
      }
    };

    if (player?.addEventListener) {
      player.addEventListener('loadstart', onLoadStart);
      player.addEventListener('error', onError);
      player.addEventListener('loadedmetadata', onLoadedMetadata);
      player.addEventListener('timeupdate', onPlayerTimeUpdate);
      player.addEventListener('captioningchange', onCaptioningChange);
    }

    if (player?.textTracks?.addEventListener) {
      player.textTracks.addEventListener('change', onCaptioningChange);
    }

    const init = async () => {
      try {
        if (!isLive && !canProfileAccessContent(activeProfile, movie)) {
          setVideoError(strings.parentalControls.contentRestrictedMessage);
          return;
        }

        await Promise.resolve(player.initialize?.());
        if (disposed) {
          return;
        }

        // Register available subtitle tracks on player instance
        try {
          if (player.addTextTrack && player.textTracks) {
            availableSubtitleTracks.forEach((track) => {
              if (track.id !== SUBTITLE_OFF_ID) {
                const trackListLen = player.textTracks.length || 0;
                let exists = false;
                let existingTrack: any = null;
                for (let i = 0; i < trackListLen; i++) {
                  const t = player.textTracks[i];
                  if (
                    t &&
                    (t.language === track.language || t.label === track.label)
                  ) {
                    exists = true;
                    existingTrack = t;
                    break;
                  }
                }
                if (!exists) {
                  const newTrack = player.addTextTrack(
                    'subtitles',
                    track.label,
                    track.language,
                  );
                  if (newTrack) {
                    newTrack.mode =
                      track.id === selectedSubtitleTrackId
                        ? 'showing'
                        : 'hidden';
                    player.textTracks.emitEvent?.('addtrack', newTrack);
                  }
                } else if (existingTrack) {
                  existingTrack.mode =
                    track.id === selectedSubtitleTrackId ? 'showing' : 'hidden';
                  player.textTracks.emitEvent?.('addtrack', existingTrack);
                }
              }
            });
          }
        } catch (e) {
          console.log('Error registering text tracks on player:', e);
        }

        if (useShakaPlayer) {
          if (!disposed) {
            // Follow the official Vega adaptive-player lifecycle: start the
            // Shaka load after media initialization, then attach the native
            // surface and call play from its creation callback.  This keeps
            // MSE source-buffer creation independent of surface timing.
            setIsPlayerInitialized(true);
            startDrmPlayback().catch((error) => {
              if (!disposed) {
                console.log('Adaptive playback initialization error:', error);
              }
            });
          }
          return;
        }
        // Mount the native video view only after initialization. KeplerVideoView
        // then creates and attaches its surface, and provides the native TV
        // transport controls.
        setIsPlayerInitialized(true);
        // Wait for KeplerVideoView to create its native surface before setting
        // an HLS source. This matches the project's player test flow.
        sourceTimerRef.current = setTimeout(() => {
          if (disposed) {
            return;
          }

          // A player instance can be reused after a retry, so metadata from a
          // previous source must not make a new resume seek run too early.
          metadataReadyRef.current = false;
          player.src = videoUrl;
          const initialSeek =
            !isLive && hasExplicitSeek !== null ? hasExplicitSeek : null;
          if (initialSeek !== null) {
            shouldApplySeekRef.current = true;
            pendingSeekRef.current = initialSeek;
          }
          Promise.resolve(player.play?.()).catch((error) => {
            if (!disposed) {
              console.log('Initial playback error:', error);
              setVideoError(
                error?.message || strings.errors.videoPlaybackUnavailable,
              );
            }
          });
        }, 1000);
      } catch (err: any) {
        if (!disposed) {
          console.log('Init error:', err);
          setVideoError(
            err?.message || strings.errors.videoPlaybackUnavailable,
          );
        }
      }
    };

    init();

    return () => {
      disposed = true;
      setIsPlayerInitialized(false);
      drmPlaybackStartedRef.current = false;
      shakaLoadedRef.current = false;
      surfaceReadyRef.current = false;
      if (sourceTimerRef.current) {
        clearTimeout(sourceTimerRef.current);
        sourceTimerRef.current = null;
      }
      if (player?.removeEventListener) {
        player.removeEventListener('loadstart', onLoadStart);
        player.removeEventListener('error', onError);
        player.removeEventListener('loadedmetadata', onLoadedMetadata);
        player.removeEventListener('timeupdate', onPlayerTimeUpdate);
        player.removeEventListener('captioningchange', onCaptioningChange);
      }
      if (player?.textTracks?.removeEventListener) {
        player.textTracks.removeEventListener('change', onCaptioningChange);
      }

      // Release native media resources synchronously and immediately to prevent
      // Kepler / Vega OS ReclaimMediaResource crash.
      releaseMediaResourcesSync();

      const shakaPlayer = shakaPlayerRef.current;
      shakaPlayerRef.current = null;
      (globalThis as any).gmedia = null;

      // Stop Shaka's live-manifest update timer after releasing native resources.
      void (async () => {
        try {
          await shakaPlayer?.destroy();
        } catch (error) {
          console.log('Shaka cleanup error:', error);
        }
      })();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    hasExplicitSeek,
    isLive,
    player,
    releaseMediaResourcesSync,
    startDrmPlayback,
    useShakaPlayer,
    videoUrl,
  ]);

  useEffect(() => {
    if (isLive || !player || resumeTime <= 0) {
      return;
    }

    pendingSeekRef.current = resumeTime;
    shouldApplySeekRef.current = true;
    if (metadataReadyRef.current) {
      try {
        const duration = Number(player.duration);
        const seekTime =
          Number.isFinite(duration) && duration > 0
            ? Math.min(resumeTime, Math.max(0, duration - 1))
            : resumeTime;
        if (Number.isFinite(seekTime) && seekTime > 0) {
          player.currentTime = seekTime;
        }
      } catch (error) {
        console.log('Resume seek error:', error);
      }
      pendingSeekRef.current = null;
      shouldApplySeekRef.current = false;
    }
  }, [isLive, player, resumeTime]);

  const persistProgress = useCallback(
    async (force = false) => {
      const targetProfileId = playbackProfileIdRef.current || activeProfile?.id;
      if (isLive || !player || !movie?.id || !user || !targetProfileId) {
        return;
      }

      const currentTime = Number(player.currentTime || 0);
      const duration = Number(player.duration || 0);
      if (!currentTime || currentTime <= 0 || !Number.isFinite(currentTime)) {
        return;
      }

      if (!force && Math.abs(currentTime - lastSavedTimeRef.current) < 5) {
        return;
      }

      lastSavedTimeRef.current = currentTime;
      try {
        await saveContinueWatchProgress(
          targetProfileId,
          movie,
          currentTime,
          duration,
        );
      } catch (error: any) {
        console.log('Save continue watch error:', error);
      }
    },
    [activeProfile?.id, isLive, movie, player, user],
  );

  const handlePlayNextEpisode = useCallback(
    (targetEpisode?: EpisodeItem) => {
      const ep = targetEpisode || resolvedNextEpisode;
      if (!ep) {
        return;
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      setIsNextEpisodeModalOpen(false);

      navigation.replace(Routes.VideoPlayer, {
        movieId: ep.id,
        movie: {
          id: ep.id,
          title: ep.title,
          description: ep.description,
          image: ep.image || movie.image,
          videoUrl: ep.videoUrl,
          genre: ep.genre || movie.genre,
          rating: ep.rating || movie.rating,
          maturityRating: ep.maturityRating || movie.maturityRating,
          cast: ep.cast || movie.cast,
          director: ep.director || movie.director,
          seekbarType: ep.seekbarType || movie.seekbarType,
          seriesId: ep.seriesId,
          seriesTitle: ep.seriesTitle || movie.title,
          seasonNumber: ep.seasonNumber,
          episodeNumber: ep.episodeNumber,
        },
        videoUrl: ep.videoUrl,
        seek: 0,
        isLive: false,
      });
    },
    [movie, navigation, resolvedNextEpisode],
  );

  const handlePlayNextEpisodeRef = useRef(handlePlayNextEpisode);
  handlePlayNextEpisodeRef.current = handlePlayNextEpisode;

  const handleCancelNextEpisode = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setIsNextEpisodeModalOpen(false);
  }, []);

  const triggerNextEpisodeCountdown = useCallback(() => {
    if (isLive || !resolvedNextEpisode) {
      return;
    }

    setIsPlaybackPaused(true);
    try {
      player?.pause?.();
    } catch (_err) {
      // Ignore pause errors if player is already stopped
    }

    const isAuto = isAutoplayEnabled(userProfile, activeProfile);
    setNextEpisodeCountdown(DEFAULT_NEXT_EPISODE_COUNTDOWN_SECONDS);
    setIsNextEpisodeModalOpen(true);

    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    if (isAuto) {
      let secondsRemaining = DEFAULT_NEXT_EPISODE_COUNTDOWN_SECONDS;
      countdownTimerRef.current = setInterval(() => {
        secondsRemaining -= 1;
        setNextEpisodeCountdown(secondsRemaining);
        if (secondsRemaining <= 0) {
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }
          handlePlayNextEpisodeRef.current();
        }
      }, 1000);
    }
  }, [activeProfile, isLive, player, resolvedNextEpisode, userProfile]);

  const triggerNextEpisodeCountdownRef = useRef(triggerNextEpisodeCountdown);
  triggerNextEpisodeCountdownRef.current = triggerNextEpisodeCountdown;

  const resolvedNextEpisodeRef = useRef(resolvedNextEpisode);
  resolvedNextEpisodeRef.current = resolvedNextEpisode;

  // Cleanup countdown timer on component unmount
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };
  }, []);

  const handleUserSeek = useCallback(
    (targetSeconds: number) => {
      resetHideTimer();
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      setIsNextEpisodeModalOpen(false);
      hasTriggeredEpisodeEndRef.current = false;

      if (
        isLive ||
        !player ||
        !Number.isFinite(targetSeconds) ||
        targetSeconds < 0
      ) {
        return;
      }
      try {
        const duration = Number(player.duration);
        const clampedSeek =
          Number.isFinite(duration) && duration > 0
            ? Math.min(targetSeconds, Math.max(0, duration - 1))
            : targetSeconds;

        player.currentTime = clampedSeek;
        setPlaybackTime(clampedSeek);
        void persistProgress();
      } catch (err) {
        console.log('Player seek error:', err);
      }
    },
    [isLive, persistProgress, player, resetHideTimer],
  );

  useEffect(() => {
    if (isLive || !player) {
      return;
    }

    const onPause = () => {
      setIsPlaybackPaused(true);
      if (timeSyncTimerRef.current) {
        clearInterval(timeSyncTimerRef.current);
        timeSyncTimerRef.current = null;
      }
      void persistProgress();
    };

    const onPlaying = () => {
      setIsPlaybackPaused(false);
      const targetProfileId = playbackProfileIdRef.current || activeProfile?.id;
      if (
        !isLive &&
        targetProfileId &&
        !historyRecordedForSessionRef.current &&
        movie?.id
      ) {
        historyRecordedForSessionRef.current = true;
        recordViewingHistory(targetProfileId, movie).catch((err) => {
          console.log('Record viewing history error:', err);
        });
      }

      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
      progressTimerRef.current = setInterval(() => {
        void persistProgress();
      }, 8000);

      if (timeSyncTimerRef.current) {
        clearInterval(timeSyncTimerRef.current);
      }
      timeSyncTimerRef.current = setInterval(() => {
        if (
          player &&
          player.currentTime !== undefined &&
          Number.isFinite(player.currentTime)
        ) {
          setPlaybackTime(player.currentTime);
          if (
            !isLive &&
            player.duration &&
            player.duration > 0 &&
            player.currentTime >= player.duration - 0.5 &&
            !hasTriggeredEpisodeEndRef.current
          ) {
            hasTriggeredEpisodeEndRef.current = true;
            void onEnded();
          }
        }
      }, 500);
    };

    const onEnded = () => {
      hasTriggeredEpisodeEndRef.current = true;
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
      if (timeSyncTimerRef.current) {
        clearInterval(timeSyncTimerRef.current);
        timeSyncTimerRef.current = null;
      }
      const targetProfileId = playbackProfileIdRef.current || activeProfile?.id;
      if (targetProfileId) {
        clearContinueWatchProgress(targetProfileId, movieId).catch((error) => {
          console.log('Clear continue watch error:', error);
        });
      }

      // Next Episode Flow: Episode ends -> Next episode -> Countdown -> Auto-play
      if (!isLive && resolvedNextEpisodeRef.current) {
        triggerNextEpisodeCountdownRef.current();
      }
    };

    if (player.addEventListener) {
      player.addEventListener('pause', onPause);
      player.addEventListener('playing', onPlaying);
      player.addEventListener('ended', onEnded);
    }

    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }

      if (timeSyncTimerRef.current) {
        clearInterval(timeSyncTimerRef.current);
        timeSyncTimerRef.current = null;
      }

      if (player.removeEventListener) {
        player.removeEventListener('pause', onPause);
        player.removeEventListener('playing', onPlaying);
        player.removeEventListener('ended', onEnded);
      }

      void persistProgress();
    };
  }, [activeProfile?.id, isLive, movie, movieId, persistProgress, player]);

  // Vega OS lifecycle: Synchronously release media resources when the application
  // transitions to background or inactive state, preventing ReclaimMediaResource terminations.
  useEffect(() => {
    let wasPausedBeforeBackground = false;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log('VideoPlayerScreen AppState changed to:', nextAppState);
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
        }
        wasPausedBeforeBackground = isPlaybackPaused;
        void persistProgress(true);
        setIsPlaybackPaused(true);
        releaseMediaResourcesSync();
      } else if (nextAppState === 'active') {
        if (player) {
          void (async () => {
            try {
              await Promise.resolve(player.initialize?.());
              if (!isLive) {
                const resumeSec = lastSavedTimeRef.current || playbackTime;
                if (resumeSec > 0 && player.currentTime !== undefined) {
                  player.currentTime = resumeSec;
                }
              }
              if (!wasPausedBeforeBackground) {
                await Promise.resolve(player.play?.());
                setIsPlaybackPaused(false);
              }
            } catch (err) {
              console.log('Resume after background notice:', err);
            }
          })();
        }
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    return () => {
      if (subscription?.remove) {
        subscription.remove();
      } else if ((AppState as any).removeEventListener) {
        (AppState as any).removeEventListener('change', handleAppStateChange);
      }
    };
  }, [
    isLive,
    isPlaybackPaused,
    persistProgress,
    playbackTime,
    player,
    releaseMediaResourcesSync,
  ]);

  const handleBackFocus = () => {
    resetHideTimer();
    setIsBackFocused(true);
  };

  const togglePlayback = useCallback(async () => {
    resetHideTimer();
    try {
      if (isPlaybackPaused) {
        await Promise.resolve(player?.play?.());
        setIsPlaybackPaused(false);
      } else {
        player?.pause?.();
        setIsPlaybackPaused(true);
      }
    } catch (error: any) {
      console.log('Playback control error:', error);
      setVideoError(error?.message || strings.errors.videoPlaybackUnavailable);
    }
  }, [isPlaybackPaused, player, resetHideTimer]);

  const backdropSource =
    movie.image && typeof movie.image === 'object' && 'uri' in movie.image
      ? movie.image
      : require('../assets/background.png');

  return (
    <TVFocusGuideView
      style={styles.container}
      autoFocus
      testID="video-player-screen"
      onStartShouldSetResponderCapture={() => {
        resetHideTimer();
        return false;
      }}>
      {/* Backdrop Poster Image at zIndex: 0 */}
      <ImageBackground
        source={backdropSource}
        style={styles.backdropPoster}
        imageStyle={styles.backdropImageStyle}
      />

      {/* KeplerVideoView owns the native surface and TV transport controls. */}
      <View
        style={StyleSheet.flatten([
          styles.videoSurface,
          {width: screenWidth, height: screenHeight},
        ])}>
        {isPlayerInitialized && (
          <KeplerVideoViewComponent
            videoPlayer={player}
            showControls={true}
            showCaptions={true}
            scalingmode="fit"
            testID="w3c-video-surface"
          />
        )}
      </View>

      {/* Active Subtitle Cue Overlay at zIndex: 8 */}
      <SubtitleOverlay
        currentCueText={activeSubtitleCueText}
        isControlsVisible={showControls}
      />

      {videoError && (
        <View style={styles.errorOverlay} testID="video-error-state">
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>
              {strings.errors.playbackError}
            </Text>
            <Text style={styles.errorBody}>{videoError}</Text>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setVideoError(null);
                if (useShakaPlayer) {
                  navigation.replace(Routes.VideoPlayer, route.params);
                  return;
                }
                if (player) {
                  player.src = videoUrl;
                  Promise.resolve(player.play?.()).catch(() => {});
                }
              }}
              accessibilityRole="button"
              accessibilityLabel={strings.accessibility.retryVideoPlayback}
              testID="video-retry-button">
              <Text style={styles.retryButtonText}>
                {strings.actions.retry}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Header Overlay at zIndex: 10 */}
      {showControls && (
        <View style={styles.overlayContainer} pointerEvents="box-none">
          <TVFocusGuideView
            style={styles.topHeader}
            pointerEvents="box-none"
            destinations={backButtonNode ? [backButtonNode] : []}>
            <TouchableOpacity
              ref={(node) => {
                backButtonRef.current = node;
                if (node && !backButtonNode) {
                  setBackButtonNode(node);
                }
              }}
              style={[
                styles.backButton,
                isBackFocused && styles.backButtonFocused,
              ]}
              hasTVPreferredFocus
              onFocus={handleBackFocus}
              onBlur={() => setIsBackFocused(false)}
              onPress={async () => {
                if (isLive && Date.now() - playerOpenedAtRef.current < 750) {
                  return;
                }
                await persistProgress();
                if (isLive && navigation.canGoBack?.()) {
                  navigation.goBack();
                  return;
                }
                navigation.navigate(Routes.Home);
              }}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={strings.accessibility.backToHome}
              testID="player-back-button">
              <Text style={styles.backButtonText}>
                {strings.actions.backChevron} {strings.actions.back}
              </Text>
            </TouchableOpacity>

            <View style={styles.titleContainer} pointerEvents="none">
              <Text style={styles.movieTitle} numberOfLines={1}>
                {movie.title}
              </Text>
              {movie.genre && (
                <Text style={styles.movieSub} numberOfLines={1}>
                  {movie.genre} {movie.rating ? `• ${movie.rating}` : ''}
                </Text>
              )}
            </View>

            {/* Top Subtitles Status Badge - Shows selected language or On / Off */}
            <TouchableOpacity
              style={[
                styles.topSubtitlesBadge,
                selectedSubtitleTrackId !== SUBTITLE_OFF_ID &&
                  styles.topSubtitlesBadgeActive,
                isCCFocused && styles.topSubtitlesBadgeFocused,
              ]}
              onFocus={() => {
                resetHideTimer();
                setIsCCFocused(true);
              }}
              onBlur={() => setIsCCFocused(false)}
              onPress={() => {
                resetHideTimer();
                setIsSubtitlesModalOpen(true);
              }}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={strings.accessibility.subtitlesButton(
                selectedSubtitleTrackId === SUBTITLE_OFF_ID
                  ? strings.subtitles.off
                  : activeSubtitleTrack?.label || strings.subtitles.english,
              )}
              testID="player-subtitles-button">
              <Text style={styles.ccBadgeText}>
                {strings.subtitles.ccBadge}
              </Text>
              <Text style={styles.ccLabelText}>
                {selectedSubtitleTrackId === SUBTITLE_OFF_ID
                  ? `Subtitles: ${strings.subtitles.off}`
                  : `Subtitles: ${
                      activeSubtitleTrack?.label || strings.subtitles.english
                    }`}
              </Text>
            </TouchableOpacity>

            {/* Top Audio Status Badge - Shows selected audio track / language */}
            <TouchableOpacity
              style={[
                styles.topAudioBadge,
                styles.topAudioBadgeActive,
                isAudioFocused && styles.topAudioBadgeFocused,
              ]}
              onFocus={() => {
                resetHideTimer();
                setIsAudioFocused(true);
              }}
              onBlur={() => setIsAudioFocused(false)}
              onPress={() => {
                resetHideTimer();
                setIsAudioTracksModalOpen(true);
              }}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={strings.accessibility.audioTracksButton(
                activeAudioTrack?.label || strings.audioTracks.original,
              )}
              testID="player-audio-button">
              <Text style={styles.audioBadgeText}>
                {strings.audioTracks.audioBadge}
              </Text>
              <Text style={styles.audioLabelText}>
                {`Audio: ${
                  activeAudioTrack?.label || strings.audioTracks.original
                }`}
              </Text>
            </TouchableOpacity>

            {/* Top Video Quality Status Badge - Shows selected quality e.g. Auto or 1080p */}
            <TouchableOpacity
              style={[
                styles.topQualityBadge,
                styles.topQualityBadgeActive,
                isQualityFocused && styles.topQualityBadgeFocused,
              ]}
              onFocus={() => {
                resetHideTimer();
                setIsQualityFocused(true);
              }}
              onBlur={() => setIsQualityFocused(false)}
              onPress={() => {
                resetHideTimer();
                setIsVideoQualityModalOpen(true);
              }}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={strings.accessibility.qualityButton(
                activeVideoQuality?.label ||
                  strings.videoQuality?.autoRecommended ||
                  'Auto',
              )}
              testID="player-quality-button">
              <Text style={styles.qualityBadgeTag}>
                {activeVideoQuality?.badge ||
                  strings.videoQuality?.qualityBadge ||
                  'QUALITY'}
              </Text>
              <Text style={styles.qualityLabelText}>
                {`Quality: ${
                  activeVideoQuality?.shortLabel ||
                  strings.videoQuality?.auto ||
                  'Auto'
                }`}
              </Text>
              {activeRendition?.height && (
                <Text
                  style={styles.qualityRenditionText}
                  testID="player-quality-live-rendition">
                  {`[${activeRendition.height}p${
                    activeRendition.bitrate
                      ? ` • ${activeRendition.bitrate}`
                      : ''
                  }]`}
                </Text>
              )}
            </TouchableOpacity>

            <View
              style={styles.seekbarBadge}
              pointerEvents="none"
              testID="player-seekbar-type-badge">
              <Text style={styles.seekbarBadgeText}>
                {isLive
                  ? 'LIVE STREAM'
                  : activeSeekbarType === 'markers'
                  ? 'SEEKBAR: MARKERS'
                  : activeSeekbarType === 'break-markers'
                  ? 'SEEKBAR: BREAK MARKERS & SEGMENTS'
                  : activeSeekbarType === 'limits'
                  ? 'SEEKBAR: SEEKING LIMITS'
                  : activeSeekbarType === 'long-press'
                  ? 'SEEKBAR: LONG PRESS'
                  : activeSeekbarType === 'fast-forward-rewind'
                  ? 'SEEKBAR: FAST FORWARD / REWIND'
                  : 'SEEKBAR: THUMBNAIL IMAGES'}
              </Text>
            </View>
          </TVFocusGuideView>

          {/* Bottom Controls Bar with PlayerSeekBar */}
          <PlayerSeekBar
            type={activeSeekbarType}
            currentTime={playbackTime}
            duration={playbackDuration}
            isPaused={isPlaybackPaused}
            isLive={isLive}
            enableThumbnails={!isLive}
            videoUrl={videoUrl}
            movie={movie}
            player={shakaPlayerRef.current?.player}
            onSeek={handleUserSeek}
            onTogglePlayPause={togglePlayback}
            onFastForwardPress={() => {
              resetHideTimer();
            }}
            onRewindPress={() => {
              resetHideTimer();
            }}
            onSkipIntroPress={() => {
              resetHideTimer();
            }}
            onStartFromBeginningPress={() => {
              resetHideTimer();
            }}
            onNextEpisodePress={
              resolvedNextEpisode
                ? () => {
                    resetHideTimer();
                    triggerNextEpisodeCountdown();
                  }
                : undefined
            }
            hasNextEpisode={Boolean(resolvedNextEpisode)}
            onTypeChange={(newType) => {
              setActiveSeekbarType(newType);
              resetHideTimer();
            }}
            onInteraction={resetHideTimer}
          />
        </View>
      )}

      {/* Subtitles Selection Modal */}
      <SubtitlesModal
        isOpen={isSubtitlesModalOpen}
        tracks={availableSubtitleTracks}
        selectedTrackId={selectedSubtitleTrackId}
        onSelectTrack={handleSelectSubtitleTrack}
        onClose={() => {
          setIsSubtitlesModalOpen(false);
          resetHideTimer();
        }}
      />

      {/* Audio Tracks Selection Modal */}
      <AudioTracksModal
        isOpen={isAudioTracksModalOpen}
        tracks={availableAudioTracks}
        selectedTrackId={selectedAudioTrackId}
        onSelectTrack={handleSelectAudioTrack}
        onClose={() => {
          setIsAudioTracksModalOpen(false);
          resetHideTimer();
        }}
      />

      {/* Video Quality Selection Modal */}
      <VideoQualityModal
        isOpen={isVideoQualityModalOpen}
        qualities={availableVideoQualities}
        selectedQualityId={selectedQualityId}
        onSelectQuality={handleSelectQuality}
        onClose={() => {
          setIsVideoQualityModalOpen(false);
          resetHideTimer();
        }}
      />

      {/* Next Episode Modal with Countdown & Auto-play */}
      <NextEpisodeModal
        isOpen={isNextEpisodeModalOpen}
        nextEpisode={resolvedNextEpisode}
        countdownSeconds={nextEpisodeCountdown}
        autoplayEnabled={autoplayEnabled}
        onPlayNow={() => handlePlayNextEpisode()}
        onCancel={handleCancelNextEpisode}
      />
    </TVFocusGuideView>
  );
};
