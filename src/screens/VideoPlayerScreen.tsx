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
import {strings} from '../constants/strings';
import {useAuth} from '../context/authContext';
import {findContentById} from '../utils/deeplink';
import {
  clearContinueWatchProgress,
  fetchContinueWatchForContent,
  saveContinueWatchProgress,
} from '../services/watchProgressService';
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

export const VideoPlayerScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {user, loading} = useAuth();

  const screenDimensions = Dimensions.get('window');
  const screenWidth = screenDimensions.width || 1920;
  const screenHeight = screenDimensions.height || 1080;

  const deeplinkMovie = findContentById(route.params?.movieId);
  const movie: HomeContentItem = route.params?.movie || deeplinkMovie || {
    id: 'sample-video',
    title: strings.nav.videoSampleTitle,
    genre: strings.nav.videoSampleGenre,
    rating: strings.nav.videoSampleRating,
    image: require('../assets/background.png'),
  };

  const videoUrl =
    route.params?.videoUrl || movie.videoUrl || DEFAULT_MOCK_VIDEO_URL;

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
            videoUrl: route.params?.videoUrl || movie.videoUrl,
          },
        },
      });
    }
  }, [loading, movie.id, movie.videoUrl, navigation, route.params, user]);

  const playerRef = useRef<any>(null);
  if (playerRef.current === null && VideoPlayerClass) {
    try {
      playerRef.current = new VideoPlayerClass();
    } catch (e) {
      playerRef.current = null;
    }
  }
  const player = playerRef.current;
  const movieId = movie.id;

  const backButtonRef = useRef<any>(null);
  const [backButtonNode, setBackButtonNode] = useState<any>(null);
  const [isBackFocused, setIsBackFocused] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [resumeTime, setResumeTime] = useState<number>(0);
  const lastSavedTimeRef = useRef<number>(0);
  const progressTimerRef = useRef<any>(null);
  const pendingSeekRef = useRef<number | null>(null);
  const metadataReadyRef = useRef(false);

  const hideControlsTimerRef = useRef<any>(null);

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    hideControlsTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 8000);
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
    let active = true;

    const loadResumeTime = async () => {
      if (!user) {
        if (active) {
          setResumeTime(0);
        }
        return;
      }

      try {
        const progressRecord = await fetchContinueWatchForContent(movieId);
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
  }, [movieId, user]);

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
      if (pendingSeekRef.current !== null) {
        try {
          player.currentTime = pendingSeekRef.current;
        } catch (error) {
          console.log('Resume seek error:', error);
        }
        pendingSeekRef.current = null;
      }
    };

    if (player?.addEventListener) {
      player.addEventListener('loadstart', onLoadStart);
      player.addEventListener('error', onError);
      player.addEventListener('loadedmetadata', onLoadedMetadata);
    }

    const init = async () => {
      try {
        await Promise.resolve(player.initialize?.());
        if (disposed) {
          return;
        }
        player.autoplay = true;
        player.src = videoUrl;
        if (resumeTime > 0) {
          pendingSeekRef.current = resumeTime;
          if (metadataReadyRef.current) {
            try {
              player.currentTime = resumeTime;
            } catch (error) {
              console.log('Resume seek error:', error);
            }
            pendingSeekRef.current = null;
          }
        }
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
        player.removeEventListener('error', onError);
        player.removeEventListener('loadedmetadata', onLoadedMetadata);
      }

      try {
        player.pause?.();
        player.deinitializeSync?.(1000);
      } catch (e) {
        console.log('Player cleanup error:', e);
      }
    };
  }, [movieId, player, videoUrl]);

  useEffect(() => {
    if (!player || resumeTime <= 0) {
      return;
    }

    pendingSeekRef.current = resumeTime;
    if (metadataReadyRef.current) {
      try {
        player.currentTime = resumeTime;
      } catch (error) {
        console.log('Resume seek error:', error);
      }
      pendingSeekRef.current = null;
    }
  }, [player, resumeTime]);

  const persistProgress = useCallback(async () => {
    if (!player || !movie?.id || !user) {
      return;
    }

    const currentTime = Number(player.currentTime || 0);
    const duration = Number(player.duration || 0);
    if (!currentTime || currentTime <= 0) {
      return;
    }

    if (Math.abs(currentTime - lastSavedTimeRef.current) < 5) {
      return;
    }

    lastSavedTimeRef.current = currentTime;
    try {
      await saveContinueWatchProgress(movie, currentTime, duration);
    } catch (error) {
      console.log('Save continue watch error:', error);
    }
  }, [movie, player, user]);

  useEffect(() => {
    if (!player) {
      return;
    }

    const onPause = () => {
      void persistProgress();
    };

    const onPlaying = () => {
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
      try {
        await clearContinueWatchProgress(movieId);
      } catch (error) {
        console.log('Clear continue watch error:', error);
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
  }, [movieId, persistProgress, player]);

  const handleBackFocus = () => {
    resetHideTimer();
    setIsBackFocused(true);
  };

  const backdropSource =
    movie.image && typeof movie.image === 'object' && 'uri' in movie.image
      ? movie.image
      : require('../assets/background.png');

  return (
    <TVFocusGuideView
      style={styles.container}
      autoFocus
      destinations={backButtonNode ? [backButtonNode] : []}
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
        showControls={true}
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
            <Text style={styles.errorTitle}>{strings.errors.playbackError}</Text>
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
              accessibilityLabel={strings.accessibility.retryVideoPlayback}
              testID="video-retry-button">
              <Text style={styles.retryButtonText}>{strings.actions.retry}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Header Overlay at zIndex: 10 */}
      {showControls && (
        <TVFocusGuideView
          style={styles.overlayContainer}
          autoFocus
          destinations={backButtonNode ? [backButtonNode] : []}>
          <View style={styles.topHeader} pointerEvents="box-none">
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
                await persistProgress();
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

            <View style={styles.qualityBadge} pointerEvents="none">
              <Text style={styles.qualityBadgeText}>{strings.header.uhd}</Text>
            </View>
          </View>
        </TVFocusGuideView>
      )}
    </TVFocusGuideView>
  );
};
