import {HTMLMediaElement} from '@amazon-devices/react-native-w3cmedia';
import {PlayerInterface} from './PlayerInterface';

/**
 * Shared base required by Amazon's Vega Shaka adapter.  The adapter provides
 * the adaptive/DRM implementation; this class intentionally only keeps the
 * media element and supplies the non-Shaka subtitle fallback.
 */
export class PlayerBase implements PlayerInterface {
  protected mediaElement: HTMLMediaElement | null;

  constructor(mediaElement: HTMLMediaElement | null) {
    this.mediaElement = mediaElement;
  }

  load(_content: unknown, _autoplay: boolean): void {}

  play(): void {
    this.mediaElement?.play();
  }

  pause(): void {
    this.mediaElement?.pause();
  }

  seekBack(): void {}

  seekFront(): void {}

  unload(): void {}

  loadOOBSubtitles(content: any): void {
    const subtitles = content?.subtitles;
    if (!this.mediaElement || !Array.isArray(subtitles)) {
      return;
    }

    subtitles.forEach((subtitle) => {
      this.mediaElement?.addTextTrack(
        subtitle.kind || 'subtitles',
        subtitle.label || '',
        subtitle.language || '',
      );
    });
  }

  shakaError(error: unknown): void {
    console.error('Vega Shaka player error:', error);
  }
}
