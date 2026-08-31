/* global globalThis */
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  Dimensions,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {DEFAULT_MOCK_VIDEO_URL, HomeContentItem} from '../data/home';
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

let KeplerVideoViewComponent: any = View;
let KeplerVideoSurfaceViewComponent: any = View;
let VideoPlayerClass: any = null;

try {
  const w3cMedia = require('@amazon-devices/react-native-w3cmedia');
  if (w3cMedia) {
    KeplerVideoViewComponent =
      w3cMedia.KeplerVideoView ||
      w3cMedia.KeplerVideoSurfaceView ||
      w3cMedia.Video ||
      View;
    KeplerVideoSurfaceViewComponent =
      w3cMedia.KeplerVideoSurfaceView || w3cMedia.KeplerVideoView || View;
    VideoPlayerClass = w3cMedia.VideoPlayer || w3cMedia.Video || null;
  }
} catch (e) {
  KeplerVideoViewComponent = View;
  KeplerVideoSurfaceViewComponent = View;
  VideoPlayerClass = null;
}

export const VideoPlayerScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {user, loading} = useAuth();
  const {activeProfile} = useProfile();
  const isLive = Boolean(route.params?.isLive);
  const streamType = route.params?.streamType as 'hls' | 'dash' | undefined;
  const isVideoOnly = Boolean(route.params?.isVideoOnly);
  const drm = route.params?.drm as LiveChannelDrmConfig | undefined;
  const isDrmContent = Boolean(drm?.enabled);
  // DASH requires MSE/Shaka even when it is clear content. Keeping this path
  // available lets us verify the MSE pipeline independently from Widevine.
  const useShakaPlayer = streamType === 'dash' || isDrmContent;

  const screenDimensions = Dimensions.get('window');
  const screenWidth = screenDimensions.width || 1920;
  const screenHeight = screenDimensions.height || 1080;
  const shakaSurfaceWidth = Math.min(screenWidth, 1920);
  const shakaSurfaceHeight = Math.min(screenHeight, 1080);

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

  const videoUrl =
    route.params?.videoUrl || movie.videoUrl || DEFAULT_MOCK_VIDEO_URL;
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
  const [isPlaybackControlFocused, setIsPlaybackControlFocused] =
    useState(false);
  const [isPlaybackPaused, setIsPlaybackPaused] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isPlayerInitialized, setIsPlayerInitialized] = useState(false);
  const [resumeTime, setResumeTime] = useState<number>(0);
  const lastSavedTimeRef = useRef<number>(0);
  const progressTimerRef = useRef<any>(null);
  const pendingSeekRef = useRef<number | null>(null);
  const metadataReadyRef = useRef(false);
  const shouldApplySeekRef = useRef(false);

  const hideControlsTimerRef = useRef<any>(null);

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
      const source = {
        secure: isDrmContent ? 'true' : 'false',
        uri: videoUrl,
        type: streamType === 'hls' ? 'HLS' : 'DASH',
        container: 'MP4',
        vcodec: 'avc1',
        ...(isVideoOnly ? {} : {acodec: 'mp4a'}),
        ...(isVideoOnly ? {video_only: 'true'} : {}),
        ...(isDrmContent && drm
          ? {
              drm_scheme: drm.keySystem,
              drm_license_uri: drm.licenseUrl,
            }
          : {}),
      };

      await shakaPlayer.load(source, true);
    } catch (error: any) {
      drmPlaybackStartedRef.current = false;
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
    streamType,
    useShakaPlayer,
    videoUrl,
  ]);

  const handleDrmSurfaceCreated = useCallback(
    (
      surface:
        | string
        | {surfaceHandle?: string; nativeEvent?: {surfaceHandle?: string}},
    ) => {
      const surfaceHandle =
        typeof surface === 'string'
          ? surface
          : surface?.surfaceHandle || surface?.nativeEvent?.surfaceHandle;
      if (!surfaceHandle) {
        setVideoError(strings.errors.videoPlaybackUnavailable);
        return;
      }

      player?.setSurfaceHandle?.(surfaceHandle);
      // Shaka begins loading immediately after media initialization, matching
      // the Vega sample lifecycle.  At this point the adaptive source may
      // already be loading; the surface callback only attaches the native
      // target and starts presentation.
      Promise.resolve(player?.play?.()).catch((error) => {
        console.log('Adaptive playback start error:', error);
        setVideoError(
          error?.message || strings.errors.videoPlaybackUnavailable,
        );
      });
    },
    [player],
  );

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

    const onLoadedMetadata = () => {
      metadataReadyRef.current = true;
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
    };

    if (player?.addEventListener) {
      player.addEventListener('loadstart', onLoadStart);
      player.addEventListener('error', onError);
      player.addEventListener('loadedmetadata', onLoadedMetadata);
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
      if (sourceTimerRef.current) {
        clearTimeout(sourceTimerRef.current);
        sourceTimerRef.current = null;
      }
      if (player?.removeEventListener) {
        player.removeEventListener('loadstart', onLoadStart);
        player.removeEventListener('error', onError);
        player.removeEventListener('loadedmetadata', onLoadedMetadata);
        player.removeEventListener('captioningchange', onCaptioningChange);
      }
      if (player?.textTracks?.removeEventListener) {
        player.textTracks.removeEventListener('change', onCaptioningChange);
      }

      const shakaPlayer = shakaPlayerRef.current;
      shakaPlayerRef.current = null;
      (globalThis as any).gmedia = null;

      // Stop Shaka's live-manifest update timer before the W3C media element
      // is deinitialized. Otherwise Shaka continues to fetch the manifest
      // against a detached MSE surface after the player screen closes.
      void (async () => {
        try {
          await shakaPlayer?.destroy();
        } catch (error) {
          console.log('Shaka cleanup error:', error);
        } finally {
          try {
            player.pause?.();
            player.deinitializeSync?.(1000);
          } catch (error) {
            console.log('Player cleanup error:', error);
          }
        }
      })();
    };
  }, [
    hasExplicitSeek,
    useShakaPlayer,
    isLive,
    player,
    startDrmPlayback,
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

  const persistProgress = useCallback(async () => {
    const targetProfileId = playbackProfileIdRef.current || activeProfile?.id;
    if (isLive || !player || !movie?.id || !user || !targetProfileId) {
      return;
    }

    const currentTime = Number(player.currentTime || 0);
    const duration = Number(player.duration || 0);
    if (!currentTime || currentTime <= 0 || !Number.isFinite(currentTime)) {
      return;
    }

    if (Math.abs(currentTime - lastSavedTimeRef.current) < 5) {
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
  }, [activeProfile?.id, isLive, movie, player, user]);

  useEffect(() => {
    if (isLive || !player) {
      return;
    }

    const onPause = () => {
      void persistProgress();
    };

    const onPlaying = () => {
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
    };

    const onEnded = async () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
      const targetProfileId = playbackProfileIdRef.current || activeProfile?.id;
      if (targetProfileId) {
        try {
          await clearContinueWatchProgress(targetProfileId, movieId);
        } catch (error) {
          console.log('Clear continue watch error:', error);
        }
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

      if (player.removeEventListener) {
        player.removeEventListener('pause', onPause);
        player.removeEventListener('playing', onPlaying);
        player.removeEventListener('ended', onEnded);
      }

      void persistProgress();
    };
  }, [activeProfile?.id, isLive, movieId, persistProgress, player]);

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
        {isPlayerInitialized &&
          (useShakaPlayer ? (
            <View style={styles.shakaSurfaceContainer}>
              <KeplerVideoSurfaceViewComponent
                style={[
                  styles.shakaVideoSurface,
                  {width: shakaSurfaceWidth, height: shakaSurfaceHeight},
                ]}
                onSurfaceViewCreated={handleDrmSurfaceCreated}
                testID="w3c-drm-video-surface"
              />
            </View>
          ) : (
            <KeplerVideoViewComponent
              videoPlayer={player}
              showControls={true}
              showCaptions={true}
              testID="w3c-video-surface"
            />
          ))}
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

            <View style={styles.qualityBadge} pointerEvents="none">
              <Text style={styles.qualityBadgeText}>{strings.header.uhd}</Text>
            </View>
          </TVFocusGuideView>

          {useShakaPlayer && (
            <View style={styles.bottomControls}>
              <TouchableOpacity
                style={[
                  styles.playbackControl,
                  isPlaybackControlFocused && styles.playbackControlFocused,
                ]}
                onFocus={() => {
                  resetHideTimer();
                  setIsPlaybackControlFocused(true);
                }}
                onBlur={() => setIsPlaybackControlFocused(false)}
                onPress={togglePlayback}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={
                  isPlaybackPaused
                    ? strings.actions.play
                    : strings.actions.pause
                }
                testID="shaka-playback-control">
                <Text style={styles.playbackControlText}>
                  {isPlaybackPaused
                    ? `▶ ${strings.actions.play}`
                    : `Ⅱ ${strings.actions.pause}`}
                </Text>
              </TouchableOpacity>
            </View>
          )}
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
    </TVFocusGuideView>
  );
};
