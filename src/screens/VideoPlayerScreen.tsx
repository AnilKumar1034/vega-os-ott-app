import React, {useCallback, useEffect, useRef, useState} from 'react';
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
import {styles} from './VideoPlayerScreen.styles';

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

const formatTime = (secs: number): string => {
  if (isNaN(secs) || secs < 0) {
    return '00:00';
  }
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);

  const mStr = String(m).padStart(2, '0');
  const sStr = String(s).padStart(2, '0');

  if (h > 0) {
    const hStr = String(h).padStart(2, '0');
    return `${hStr}:${mStr}:${sStr}`;
  }
  return `${mStr}:${sStr}`;
};

export const VideoPlayerScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const screenDimensions = Dimensions.get('window');
  const screenWidth = screenDimensions.width || 1920;
  const screenHeight = screenDimensions.height || 1080;

  const movie: HomeContentItem = route.params?.movie || {
    id: 'sample-video',
    title: 'LogiXstream Feature Movie',
    genre: 'Action • Sci-Fi',
    rating: '⭐ 8.5 / 10',
    image: require('../assets/background.png'),
  };

  const videoUrl =
    route.params?.videoUrl || movie.videoUrl || DEFAULT_MOCK_VIDEO_URL;

  const playerRef = useRef<any>(null);
  if (playerRef.current === null && VideoPlayerClass) {
    try {
      playerRef.current = new VideoPlayerClass();
    } catch (e) {
      playerRef.current = null;
    }
  }
  const player = playerRef.current;

  const [isPaused, setIsPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(120);
  const [focusedControl, setFocusedControl] = useState<
    'back' | 'rewind' | 'play' | 'forward' | null
  >('play');
  const [showControls, setShowControls] = useState(true);
  const [videoError, setVideoError] = useState<string | null>(null);

  const hideControlsTimerRef = useRef<any>(null);

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    hideControlsTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 6000);
  }, []);

  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
    };
  }, [resetHideTimer]);

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

    const onLoadedMetadata = () => {
      if (!disposed) {
        if (player.duration && player.duration > 0) {
          setDuration(player.duration);
        }
      }
    };

    const onCanPlay = () => {
      if (!disposed) {
        Promise.resolve(player.play?.()).catch(() => {});
      }
    };

    const onPlaying = () => {
      if (!disposed) {
        setIsPaused(false);
      }
    };

    const onPause = () => {
      if (!disposed) {
        setIsPaused(true);
      }
    };

    const onError = (evt: any) => {
      if (!disposed) {
        console.log('Player error event:', evt);
        const playerErr = player.error;
        setVideoError(playerErr?.message || 'Unable to play video stream.');
      }
    };

    if (player?.addEventListener) {
      player.addEventListener('loadstart', onLoadStart);
      player.addEventListener('loadedmetadata', onLoadedMetadata);
      player.addEventListener('canplay', onCanPlay);
      player.addEventListener('playing', onPlaying);
      player.addEventListener('pause', onPause);
      player.addEventListener('error', onError);
    }

    const init = async () => {
      try {
        await Promise.resolve(player.initialize?.());
        if (disposed) {
          return;
        }
        player.autoplay = true;
        player.src = videoUrl;
        Promise.resolve(player.play?.()).catch(() => {});
      } catch (err: any) {
        if (!disposed) {
          console.log('Init error:', err);
        }
      }
    };

    init();

    return () => {
      disposed = true;
      if (player?.removeEventListener) {
        player.removeEventListener('loadstart', onLoadStart);
        player.removeEventListener('loadedmetadata', onLoadedMetadata);
        player.removeEventListener('canplay', onCanPlay);
        player.removeEventListener('playing', onPlaying);
        player.removeEventListener('pause', onPause);
        player.removeEventListener('error', onError);
      }

      try {
        player.pause?.();
        player.deinitializeSync?.(1000);
      } catch (e) {
        console.log('Player cleanup error:', e);
      }
    };
  }, [player, videoUrl]);

  const togglePlayPause = () => {
    resetHideTimer();
    if (player) {
      if (isPaused) {
        Promise.resolve(player.play?.()).catch(() => {});
        setIsPaused(false);
      } else {
        try {
          player.pause?.();
        } catch (e) {
          console.log('Pause error:', e);
        }
        setIsPaused(true);
      }
    } else {
      setIsPaused(!isPaused);
    }
  };

  const seekRelative = (seconds: number) => {
    resetHideTimer();
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    if (player) {
      try {
        player.currentTime = newTime;
      } catch (e) {
        console.log('Seek error:', e);
      }
    }
    setCurrentTime(newTime);
  };

  const handleControlFocus = (
    control: 'back' | 'rewind' | 'play' | 'forward',
  ) => {
    resetHideTimer();
    setFocusedControl(control);
  };

  const progressPercent =
    duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  const backdropSource =
    movie.image && typeof movie.image === 'object' && 'uri' in movie.image
      ? movie.image
      : require('../assets/background.png');

  return (
    <View
      style={styles.container}
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

      {/* Kepler Video View Surface Layer at zIndex: 1 */}
      <KeplerVideoViewComponent
        videoPlayer={player}
        onSurfaceViewCreated={(surfaceHandle: string) => {
          if (player && player.setSurfaceHandle) {
            try {
              player.setSurfaceHandle(surfaceHandle);
              Promise.resolve(player.play?.()).catch(() => {});
            } catch (e) {
              console.log('Set surface error:', e);
            }
          }
        }}
        onSurfaceViewDestroyed={(surfaceHandle: string) => {
          if (player && player.clearSurfaceHandle) {
            try {
              player.clearSurfaceHandle(surfaceHandle);
            } catch (e) {
              console.log('Clear surface error:', e);
            }
          }
        }}
        style={StyleSheet.flatten([
          styles.videoSurface,
          {width: screenWidth, height: screenHeight},
        ])}
        testID="w3c-video-surface"
      />

      {videoError && (
        <View style={styles.errorOverlay} testID="video-error-state">
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Playback Error</Text>
            <Text style={styles.errorBody}>{videoError}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setVideoError(null);
                if (player) {
                  player.src = videoUrl;
                  Promise.resolve(player.play?.()).catch(() => {});
                }
              }}
              accessibilityRole="button"
              accessibilityLabel="Retry video playback"
              testID="video-retry-button">
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* On-Screen OTT Controls Overlay at zIndex: 10 */}
      {showControls && (
        <TVFocusGuideView style={styles.overlayContainer} autoFocus>
          <View style={styles.topHeader}>
            <TouchableOpacity
              style={[
                styles.backButton,
                focusedControl === 'back' && styles.backButtonFocused,
              ]}
              onFocus={() => handleControlFocus('back')}
              onPress={() => navigation.navigate(Routes.Home)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Back to Home"
              testID="player-back-button">
              <Text style={styles.backButtonText}>‹ Back</Text>
            </TouchableOpacity>

            <View style={styles.titleContainer}>
              <Text style={styles.movieTitle} numberOfLines={1}>
                {movie.title}
              </Text>
              {movie.genre && (
                <Text style={styles.movieSub} numberOfLines={1}>
                  {movie.genre} {movie.rating ? `• ${movie.rating}` : ''}
                </Text>
              )}
            </View>

            <View style={styles.qualityBadge}>
              <Text style={styles.qualityBadgeText}>4K UHD • DOLBY 5.1</Text>
            </View>
          </View>

          {isPaused && (
            <View style={styles.centerOverlay}>
              <Text style={styles.statusText}>❚❚ PAUSED</Text>
            </View>
          )}

          <View style={styles.bottomControls}>
            <View style={styles.progressContainer}>
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    {width: `${progressPercent}%`},
                  ]}
                />
              </View>
              <View style={styles.timeRow}>
                <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
              </View>
            </View>

            <View style={styles.controlsRow}>
              <TouchableOpacity
                style={[
                  styles.controlBtn,
                  focusedControl === 'rewind' && styles.controlBtnFocused,
                ]}
                onFocus={() => handleControlFocus('rewind')}
                onPress={() => seekRelative(-10)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Rewind 10 seconds"
                testID="player-rewind-button">
                <Text style={styles.controlBtnText}>↺ -10s</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.controlBtn,
                  styles.playPauseBtn,
                  focusedControl === 'play' && styles.playPauseBtnFocused,
                ]}
                onFocus={() => handleControlFocus('play')}
                onPress={togglePlayPause}
                hasTVPreferredFocus
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={isPaused ? 'Play' : 'Pause'}
                testID="player-play-pause-button">
                <Text style={styles.controlBtnText}>
                  {isPaused ? '▶ Play' : '❚❚ Pause'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.controlBtn,
                  focusedControl === 'forward' && styles.controlBtnFocused,
                ]}
                onFocus={() => handleControlFocus('forward')}
                onPress={() => seekRelative(10)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Fast forward 10 seconds"
                testID="player-forward-button">
                <Text style={styles.controlBtnText}>↻ +10s</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TVFocusGuideView>
      )}
    </View>
  );
};
