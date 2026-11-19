import {useCallback, useEffect, useRef, useState} from 'react';
import {AppState, AppStateStatus} from 'react-native';
import {
  ShortsItem,
  ShortsPlaybackState,
} from '../types/shorts.types';
import {
  checkShortPlaybackEligibility,
  createVideoPlayerInstance,
  releasePlayerResourcesSync,
} from '../services/shortsPlaybackService';
import {analyticsService} from '../../../analytics';
import {useProfile} from '../../../profiles/hooks/useProfile';
import {useAuth} from '../../../context/authContext';

export interface UseShortsPlaybackOptions {
  short: ShortsItem | null;
  isActive?: boolean;
  autoPlay?: boolean;
  onCompleted?: (short: ShortsItem) => void;
  onError?: (short: ShortsItem, error: string) => void;
}

export interface UseShortsPlaybackReturn {
  player: any;
  playbackState: ShortsPlaybackState;
  currentTime: number;
  duration: number;
  errorMessage: string | null;
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  replay: () => void;
  retry: () => void;
}

export const useShortsPlayback = (
  options: UseShortsPlaybackOptions,
): UseShortsPlaybackReturn => {
  const {
    short,
    isActive = true,
    autoPlay = true,
    onCompleted,
    onError,
  } = options;

  const {activeProfile} = useProfile();
  const {userProfile} = useAuth();

  const [playbackState, setPlaybackState] = useState<ShortsPlaybackState>('idle');
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(short?.durationSeconds || 0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // References to keep callbacks and listeners free of stale state
  const playerRef = useRef<any>(null);
  const shortRef = useRef<ShortsItem | null>(short);
  shortRef.current = short;
  const isActiveRef = useRef<boolean>(isActive);
  isActiveRef.current = isActive;
  const playbackStateRef = useRef<ShortsPlaybackState>(playbackState);
  playbackStateRef.current = playbackState;
  const isUserPausedRef = useRef<boolean>(false);
  const hasTrackedStartRef = useRef<boolean>(false);
  const sequenceIdRef = useRef<number>(0);
  const sourceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const wasPlayingBeforeBackgroundRef = useRef<boolean>(false);
  const onCompletedRef = useRef(onCompleted);
  onCompletedRef.current = onCompleted;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  // Initialize single VideoPlayer instance across the hook lifecycle
  if (playerRef.current === null) {
    playerRef.current = createVideoPlayerInstance();
  }
  const player = playerRef.current;

  // Helper to load and initialize a Short
  const loadShort = useCallback(
    (targetShort: ShortsItem | null, shouldAutoPlay: boolean = true) => {
      // Clear any pending source or delay timers
      if (sourceTimerRef.current) {
        clearTimeout(sourceTimerRef.current);
        sourceTimerRef.current = null;
      }

      const seq = ++sequenceIdRef.current;
      hasTrackedStartRef.current = false;
      isUserPausedRef.current = !shouldAutoPlay;

      if (!targetShort) {
        releasePlayerResourcesSync(player);
        setPlaybackState('idle');
        setErrorMessage(null);
        setCurrentTime(0);
        return;
      }

      // Check profile & entitlement access
      const eligibility = checkShortPlaybackEligibility(
        targetShort,
        activeProfile,
        userProfile,
      );
      if (!eligibility.allowed) {
        releasePlayerResourcesSync(player);
        const err =
          eligibility.errorReason || 'Playback restricted for this profile';
        setPlaybackState('error');
        setErrorMessage(err);
        analyticsService
          .trackShortsPlaybackError({
            short_id: targetShort.id,
            error_message: err,
            error_code: 'RESTRICTED_ACCESS',
            title: targetShort.title,
            category: targetShort.category,
          })
          .catch(() => {});
        onErrorRef.current?.(targetShort, err);
        return;
      }

      // Release previous media session before starting the new Short
      releasePlayerResourcesSync(player);

      setPlaybackState('loading');
      setErrorMessage(null);
      setCurrentTime(0);
      setDuration(targetShort.durationSeconds || 0);

      if (!player) {
        // Player class unavailable in this runtime environment (e.g. non-Vega host)
        setPlaybackState('idle');
        return;
      }

      // Initialize the W3C Media player session
      Promise.resolve(player.initialize?.())
        .then(() => {
          if (!isMountedRef.current || seq !== sequenceIdRef.current) {
            return;
          }

          // Delay assigning src slightly to allow KeplerVideoView surface attachment
          sourceTimerRef.current = setTimeout(() => {
            if (!isMountedRef.current || seq !== sequenceIdRef.current) {
              return;
            }

            try {
              player.src = targetShort.videoUrl;
              if (shouldAutoPlay && isActiveRef.current && !isUserPausedRef.current) {
                Promise.resolve(player.play?.()).catch((playErr: any) => {
                  console.log('[ShortsPlayback] Initial play notice:', playErr);
                });
              }
            } catch (err: any) {
              if (seq !== sequenceIdRef.current) return;
              const msg = err?.message || 'Failed to load video stream';
              setPlaybackState('error');
              setErrorMessage(msg);
              analyticsService
                .trackShortsPlaybackError({
                  short_id: targetShort.id,
                  error_message: msg,
                  title: targetShort.title,
                  category: targetShort.category,
                })
                .catch(() => {});
              onErrorRef.current?.(targetShort, msg);
            }
          }, 300);
        })
        .catch((initErr: any) => {
          if (!isMountedRef.current || seq !== sequenceIdRef.current) return;
          const msg = initErr?.message || 'Player initialization failed';
          setPlaybackState('error');
          setErrorMessage(msg);
          analyticsService
            .trackShortsPlaybackError({
              short_id: targetShort.id,
              error_message: msg,
              title: targetShort.title,
              category: targetShort.category,
            })
            .catch(() => {});
          onErrorRef.current?.(targetShort, msg);
        });
    },
    [activeProfile, player, userProfile],
  );

  // Attach player event listeners
  useEffect(() => {
    if (!player) return;

    const onLoadStart = () => {
      setPlaybackState('loading');
    };

    const onLoadedMetadata = () => {
      if (player.duration && !isNaN(player.duration)) {
        setDuration(player.duration);
      }
    };

    const onCanPlay = () => {
      if (
        isActiveRef.current &&
        !isUserPausedRef.current &&
        playbackStateRef.current !== 'completed' &&
        playbackStateRef.current !== 'error'
      ) {
        Promise.resolve(player.play?.()).catch(() => {});
      }
    };

    const onPlaying = () => {
      setPlaybackState('playing');
      const current = shortRef.current;
      if (current && !hasTrackedStartRef.current) {
        hasTrackedStartRef.current = true;
        analyticsService
          .trackShortsStarted({
            short_id: current.id,
            title: current.title,
            category: current.category || 'all',
            duration_seconds: current.durationSeconds || player.duration || 0,
          })
          .catch(() => {});
      }
    };

    const onWaiting = () => {
      if (
        playbackStateRef.current !== 'error' &&
        playbackStateRef.current !== 'completed'
      ) {
        setPlaybackState('buffering');
      }
    };

    const onPause = () => {
      if (
        playbackStateRef.current !== 'completed' &&
        playbackStateRef.current !== 'error' &&
        playbackStateRef.current !== 'idle'
      ) {
        setPlaybackState('paused');
        const current = shortRef.current;
        if (current) {
          analyticsService
            .trackShortsPaused({
              short_id: current.id,
              position_seconds: player.currentTime || 0,
            })
            .catch(() => {});
        }
      }
    };

    const onEnded = () => {
      setPlaybackState('completed');
      const current = shortRef.current;
      if (current) {
        analyticsService
          .trackShortsCompleted({
            short_id: current.id,
            duration_seconds:
              current.durationSeconds || player.duration || 0,
          })
          .catch(() => {});
        onCompletedRef.current?.(current);
      }
    };

    const onError = (evt: any) => {
      const playerError = player?.error;
      const msg =
        playerError?.message ||
        evt?.message ||
        'Unable to play video at this time';
      setPlaybackState('error');
      setErrorMessage(msg);
      const current = shortRef.current;
      if (current) {
        analyticsService
          .trackShortsPlaybackError({
            short_id: current.id,
            error_message: msg,
            error_code: String(playerError?.code || 'MEDIA_ERR'),
            title: current.title,
            category: current.category,
          })
          .catch(() => {});
        onErrorRef.current?.(current, msg);
      }
    };

    const onTimeUpdate = () => {
      if (typeof player.currentTime === 'number') {
        setCurrentTime(player.currentTime);
      }
    };

    if (player.addEventListener) {
      player.addEventListener('loadstart', onLoadStart);
      player.addEventListener('loadedmetadata', onLoadedMetadata);
      player.addEventListener('canplay', onCanPlay);
      player.addEventListener('playing', onPlaying);
      player.addEventListener('waiting', onWaiting);
      player.addEventListener('pause', onPause);
      player.addEventListener('ended', onEnded);
      player.addEventListener('error', onError);
      player.addEventListener('timeupdate', onTimeUpdate);
    }

    return () => {
      if (player.removeEventListener) {
        player.removeEventListener('loadstart', onLoadStart);
        player.removeEventListener('loadedmetadata', onLoadedMetadata);
        player.removeEventListener('canplay', onCanPlay);
        player.removeEventListener('playing', onPlaying);
        player.removeEventListener('waiting', onWaiting);
        player.removeEventListener('pause', onPause);
        player.removeEventListener('ended', onEnded);
        player.removeEventListener('error', onError);
        player.removeEventListener('timeupdate', onTimeUpdate);
      }
    };
  }, [player]);

  // Load new short on short or isActive changes
  useEffect(() => {
    isMountedRef.current = true;
    if (isActive && short) {
      loadShort(short, autoPlay);
    } else if (!isActive && player) {
      player.pause?.();
      setPlaybackState('paused');
    }

    return () => {
      if (sourceTimerRef.current) {
        clearTimeout(sourceTimerRef.current);
        sourceTimerRef.current = null;
      }
    };
  }, [short, isActive, autoPlay, loadShort, player]);

  // Handle AppState (background / foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (nextState === 'background') {
          if (playbackStateRef.current === 'playing') {
            wasPlayingBeforeBackgroundRef.current = true;
          }
          if (player) {
            player.pause?.();
            releasePlayerResourcesSync(player);
          }
          setPlaybackState('paused');
        } else if (nextState === 'active') {
          if (
            wasPlayingBeforeBackgroundRef.current &&
            isActiveRef.current &&
            shortRef.current
          ) {
            wasPlayingBeforeBackgroundRef.current = false;
            loadShort(shortRef.current, true);
          }
        }
      },
    );

    return () => {
      subscription?.remove();
    };
  }, [loadShort, player]);

  // Complete cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (sourceTimerRef.current) {
        clearTimeout(sourceTimerRef.current);
        sourceTimerRef.current = null;
      }
      releasePlayerResourcesSync(playerRef.current);
    };
  }, []);

  // Controls API
  const play = useCallback(() => {
    isUserPausedRef.current = false;
    if (player) {
      Promise.resolve(player.play?.()).catch(() => {});
    }
  }, [player]);

  const pause = useCallback(() => {
    isUserPausedRef.current = true;
    if (player) {
      Promise.resolve(player.pause?.()).catch(() => {});
    }
  }, [player]);

  const togglePlayPause = useCallback(() => {
    if (playbackState === 'playing') {
      pause();
    } else if (playbackState === 'completed') {
      replay();
    } else {
      play();
    }
  }, [playbackState, pause, play]); // eslint-disable-line react-hooks/exhaustive-deps

  const replay = useCallback(() => {
    isUserPausedRef.current = false;
    hasTrackedStartRef.current = false;
    if (player) {
      try {
        if (typeof player.currentTime !== 'undefined') {
          player.currentTime = 0;
        }
        Promise.resolve(player.play?.()).catch(() => {});
        setPlaybackState('playing');
        const current = shortRef.current;
        if (current) {
          analyticsService
            .trackShortsStarted({
              short_id: current.id,
              title: current.title,
              category: current.category || 'all',
              duration_seconds: current.durationSeconds || player.duration || 0,
            })
            .catch(() => {});
        }
      } catch (e) {
        console.log('[ShortsPlayback] Replay error:', e);
      }
    }
  }, [player]);

  const retry = useCallback(() => {
    if (shortRef.current) {
      loadShort(shortRef.current, true);
    }
  }, [loadShort]);

  return {
    player,
    playbackState,
    currentTime,
    duration,
    errorMessage,
    play,
    pause,
    togglePlayPause,
    replay,
    retry,
  };
};
