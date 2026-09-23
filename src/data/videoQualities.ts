import {AUTO_QUALITY_ID, VideoQualityOption} from '../types/videoQuality';

export const STANDARD_VIDEO_QUALITIES: VideoQualityOption[] = [
  {
    id: AUTO_QUALITY_ID,
    label: 'Auto (Recommended)',
    shortLabel: 'Auto',
    badge: 'AUTO',
    isDefault: true,
    sourceType: 'curated',
  },
  {
    id: 'quality-2160p',
    label: '4K Ultra HD (2160p)',
    shortLabel: '4K UHD',
    resolution: '3840x2160',
    height: 2160,
    bitrate: '15.0 Mbps',
    bitrateBps: 15000000,
    badge: '4K UHD',
    sourceType: 'curated',
  },
  {
    id: 'quality-1080p',
    label: '1080p Full HD',
    shortLabel: '1080p FHD',
    resolution: '1920x1080',
    height: 1080,
    bitrate: '5.0 Mbps',
    bitrateBps: 5000000,
    badge: '1080p',
    sourceType: 'curated',
  },
  {
    id: 'quality-720p',
    label: '720p HD',
    shortLabel: '720p HD',
    resolution: '1280x720',
    height: 720,
    bitrate: '2.5 Mbps',
    bitrateBps: 2500000,
    badge: '720p',
    sourceType: 'curated',
  },
  {
    id: 'quality-480p',
    label: '480p SD',
    shortLabel: '480p SD',
    resolution: '854x480',
    height: 480,
    bitrate: '1.2 Mbps',
    bitrateBps: 1200000,
    badge: '480p',
    sourceType: 'curated',
  },
  {
    id: 'quality-360p',
    label: '360p Data Saver',
    shortLabel: '360p Low',
    resolution: '640x360',
    height: 360,
    bitrate: '600 Kbps',
    bitrateBps: 600000,
    badge: '360p',
    sourceType: 'curated',
  },
];

/**
 * Returns available video qualities for the given content.
 * Live streams, 4K titles, and standard streams all receive tailored options.
 */
export function getVideoQualitiesForContent(
  _contentId?: string,
  _contentTitle?: string,
  _videoUrl?: string,
  isLive?: boolean,
  has4KSupport: boolean = true,
): VideoQualityOption[] {
  if (isLive) {
    return [
      {
        id: AUTO_QUALITY_ID,
        label: 'Auto (Live Adaptive)',
        shortLabel: 'Auto',
        badge: 'LIVE ABR',
        isDefault: true,
        sourceType: 'curated',
      },
      {
        id: 'quality-1080p',
        label: '1080p Full HD (60fps)',
        shortLabel: '1080p',
        resolution: '1920x1080',
        height: 1080,
        bitrate: '6.0 Mbps',
        bitrateBps: 6000000,
        badge: '1080p',
        sourceType: 'curated',
      },
      {
        id: 'quality-720p',
        label: '720p HD (60fps)',
        shortLabel: '720p',
        resolution: '1280x720',
        height: 720,
        bitrate: '3.0 Mbps',
        bitrateBps: 3000000,
        badge: '720p',
        sourceType: 'curated',
      },
      {
        id: 'quality-480p',
        label: '480p SD',
        shortLabel: '480p',
        resolution: '854x480',
        height: 480,
        bitrate: '1.2 Mbps',
        bitrateBps: 1200000,
        badge: '480p',
        sourceType: 'curated',
      },
    ];
  }

  if (!has4KSupport) {
    return STANDARD_VIDEO_QUALITIES.filter((q) => q.id !== 'quality-2160p');
  }

  return STANDARD_VIDEO_QUALITIES;
}

/**
 * Extracts quality options from Shaka variant tracks if present.
 */
export function extractQualitiesFromShakaVariants(
  variants: any[],
): VideoQualityOption[] {
  if (!Array.isArray(variants) || variants.length === 0) {
    return STANDARD_VIDEO_QUALITIES;
  }

  const heightMap = new Map<number, any>();
  for (const track of variants) {
    const h = Number(track.height || 0);
    if (h > 0) {
      const existing = heightMap.get(h);
      // Prefer AVC (H.264) codec over HEVC for maximum Vega OS MSE compatibility
      const isAvc = Boolean(
        track.videoCodec?.includes('avc') ||
          track.codecs?.includes('avc') ||
          track.mimeType?.includes('avc'),
      );
      const existingIsAvc = Boolean(
        existing?.videoCodec?.includes('avc') ||
          existing?.codecs?.includes('avc') ||
          existing?.mimeType?.includes('avc'),
      );

      if (!existing) {
        heightMap.set(h, track);
      } else if (isAvc && !existingIsAvc) {
        heightMap.set(h, track);
      } else if (
        isAvc === existingIsAvc &&
        (track.bandwidth || 0) > (existing.bandwidth || 0)
      ) {
        heightMap.set(h, track);
      }
    }
  }

  if (heightMap.size === 0) {
    return STANDARD_VIDEO_QUALITIES;
  }

  const sortedHeights = Array.from(heightMap.keys()).sort((a, b) => b - a);
  const options: VideoQualityOption[] = [
    {
      id: AUTO_QUALITY_ID,
      label: 'Auto (Recommended)',
      shortLabel: 'Auto',
      badge: 'AUTO',
      isDefault: true,
      sourceType: 'shaka',
    },
  ];

  for (const h of sortedHeights) {
    const track = heightMap.get(h);
    const bandwidthText = track.bandwidth
      ? track.bandwidth >= 1000000
        ? (track.bandwidth / 1000000).toFixed(1) + ' Mbps'
        : Math.round(track.bandwidth / 1000) + ' Kbps'
      : undefined;

    let label = `${h}p`;
    let shortLabel = `${h}p`;
    let badge = `${h}p`;

    if (h >= 2160) {
      label = `4K Ultra HD (${h}p)`;
      shortLabel = '4K UHD';
      badge = '4K UHD';
    } else if (h >= 1080) {
      label = '1080p Full HD';
      shortLabel = '1080p FHD';
      badge = '1080p';
    } else if (h >= 720) {
      label = '720p HD';
      shortLabel = '720p HD';
      badge = '720p';
    } else if (h >= 480) {
      label = `${h}p SD`;
      shortLabel = `${h}p SD`;
      badge = `${h}p`;
    } else {
      label = `${h}p Low`;
      shortLabel = `${h}p`;
      badge = `${h}p`;
    }

    options.push({
      id: `quality-${h}p`,
      label,
      shortLabel,
      resolution: track.width ? `${track.width}x${h}` : undefined,
      height: h,
      bitrate: bandwidthText,
      bitrateBps: track.bandwidth,
      badge,
      sourceType: 'shaka',
      rawTrack: track,
    });
  }

  return options;
}
