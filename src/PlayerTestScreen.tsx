import React, {useEffect, useRef, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';

let KeplerVideoViewComponent: any = View;
let VideoPlayerClass: any = null;

try {
  const w3cMedia = require('@amazon-devices/react-native-w3cmedia');
  if (w3cMedia) {
    KeplerVideoViewComponent =
      w3cMedia.KeplerVideoView || w3cMedia.KeplerVideoSurfaceView || View;
    VideoPlayerClass = w3cMedia.VideoPlayer || null;
  }
} catch (e) {
  KeplerVideoViewComponent = View;
  VideoPlayerClass = null;
}

const VIDEO_URL = 'https://vjs.zencdn.net/v/oceans.mp4';

const SURFACE_WAIT_TIME = 1000;

const PlayerTestScreen = () => {
  const playerRef = useRef<any>(null);

  if (playerRef.current === null && VideoPlayerClass) {
    try {
      playerRef.current = new VideoPlayerClass();
    } catch (e) {
      playerRef.current = null;
    }
  }

  const player = playerRef.current;

  const [status, setStatus] = useState('Preparing player...');

  useEffect(() => {
    if (!player) {
      setStatus('Player module unavailable in this environment');
      return;
    }

    let disposed = false;
    let loadTimer: ReturnType<typeof setTimeout> | null = null;

    const updateStatus = (value: string) => {
      if (!disposed) {
        setStatus(value);
      }
    };

    const onLoadStart = () => {
      console.log('[PlayerTestScreen] loadstart');
      updateStatus('Loading video...');
    };

    const onLoadedMetadata = () => {
      console.log('[PlayerTestScreen] loadedmetadata');
      if (player.duration) {
        console.log('[PlayerTestScreen] duration:', player.duration);
      }

      updateStatus('Metadata loaded');
    };

    const onCanPlay = async () => {
      console.log('[PlayerTestScreen] canplay');

      if (disposed) {
        return;
      }

      updateStatus('Starting playback...');

      try {
        await Promise.resolve(player.play?.());
      } catch (error) {
        console.error('[PlayerTestScreen] play failed:', error);
        updateStatus('Unable to start playback');
      }
    };

    const onPlaying = () => {
      console.log('[PlayerTestScreen] playing');
      updateStatus('Playing');
    };

    const onWaiting = () => {
      console.log('[PlayerTestScreen] waiting');
      updateStatus('Buffering...');
    };

    const onPause = () => {
      console.log('[PlayerTestScreen] pause');
    };

    const onEnded = () => {
      console.log('[PlayerTestScreen] ended');
      updateStatus('Playback ended');
    };

    const onError = (event: any) => {
      console.error('[PlayerTestScreen] error event', event);
      const playerError = player?.error;

      updateStatus(
        `Error ${playerError?.code ?? 'unknown'}: ${
          playerError?.message || 'Unable to load video'
        }`,
      );
    };

    const addListeners = () => {
      if (player.addEventListener) {
        player.addEventListener('loadstart', onLoadStart);
        player.addEventListener('loadedmetadata', onLoadedMetadata);
        player.addEventListener('canplay', onCanPlay);
        player.addEventListener('playing', onPlaying);
        player.addEventListener('waiting', onWaiting);
        player.addEventListener('pause', onPause);
        player.addEventListener('ended', onEnded);
        player.addEventListener('error', onError);
      }
    };

    const removeListeners = () => {
      if (player.removeEventListener) {
        player.removeEventListener('loadstart', onLoadStart);
        player.removeEventListener('loadedmetadata', onLoadedMetadata);
        player.removeEventListener('canplay', onCanPlay);
        player.removeEventListener('playing', onPlaying);
        player.removeEventListener('waiting', onWaiting);
        player.removeEventListener('pause', onPause);
        player.removeEventListener('ended', onEnded);
        player.removeEventListener('error', onError);
      }
    };

    const initializePlayer = async () => {
      try {
        addListeners();

        console.log('[PlayerTestScreen] initializing player');
        updateStatus('Initializing player...');

        await Promise.resolve(player.initialize?.());

        if (disposed) {
          return;
        }

        console.log('[PlayerTestScreen] player initialized');

        player.autoplay = true;
        if (player.defaultSeekIntervalInSec !== undefined) {
          player.defaultSeekIntervalInSec = 10;
        }

        updateStatus('Waiting for video surface...');

        loadTimer = setTimeout(() => {
          if (disposed) {
            return;
          }

          console.log('[PlayerTestScreen] setting source:', VIDEO_URL);
          updateStatus('Loading video...');

          player.src = VIDEO_URL;
          Promise.resolve(player.play?.()).catch((err) => {
            console.log('[PlayerTestScreen] initial play error:', err);
          });
        }, SURFACE_WAIT_TIME);
      } catch (error) {
        console.error('[PlayerTestScreen] initialization failed:', error);
        updateStatus('Player initialization failed');
      }
    };

    initializePlayer();

    return () => {
      disposed = true;

      if (loadTimer !== null) {
        clearTimeout(loadTimer);
      }

      removeListeners();

      try {
        player.pause?.();
      } catch (error) {
        console.warn('[PlayerTestScreen] cleanup pause failed:', error);
      }

      try {
        player.deinitializeSync?.(1500);
      } catch (error) {
        console.warn('[PlayerTestScreen] deinitialize failed:', error);
      }

      playerRef.current = null;
    };
  }, [player]);

  return (
    <View style={styles.container}>
      <KeplerVideoViewComponent
        videoPlayer={player}
        style={styles.video}
        testID="kepler-video-view"
      />

      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>{status}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  video: {
    flex: 1,
    width: '100%',
    height: '100%',
  },

  statusContainer: {
    position: 'absolute',
    left: 40,
    right: 40,
    bottom: 40,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 6,
  },

  statusText: {
    color: '#fff',
    fontSize: 20,
    textAlign: 'center',
  },
});

export default PlayerTestScreen;
