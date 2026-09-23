import {AudioTrack} from '../types/audioTracks';

/**
 * Curated multi-audio tracks for popular VOD catalog movies and streaming content.
 */
const curatedAudioTracksMap: Record<string, AudioTrack[]> = {
  // Angel One - Official Shaka/HLS Multi-Audio Stream (5 spoken languages)
  'angel-one': [
    {
      id: 'angel-audio-en',
      language: 'en',
      label: 'English [Original]',
      audioCodec: 'AAC',
      channels: '5.1 Surround & Stereo',
      isDefault: true,
      sourceType: 'curated',
    },
    {
      id: 'angel-audio-de',
      language: 'de',
      label: 'German (Deutsch)',
      audioCodec: 'AAC',
      channels: 'Stereo 2.0',
      sourceType: 'curated',
    },
    {
      id: 'angel-audio-es',
      language: 'es',
      label: 'Spanish (Español)',
      audioCodec: 'AAC',
      channels: 'Stereo 2.0',
      sourceType: 'curated',
    },
    {
      id: 'angel-audio-fr',
      language: 'fr',
      label: 'French (Français)',
      audioCodec: 'AAC',
      channels: 'Stereo 2.0',
      sourceType: 'curated',
    },
    {
      id: 'angel-audio-it',
      language: 'it',
      label: 'Italian (Italiano)',
      audioCodec: 'AAC',
      channels: 'Stereo 2.0',
      sourceType: 'curated',
    },
  ],

  'angel-one-hls': [
    {
      id: 'angel-hls-audio-en',
      language: 'en',
      label: 'English [Original]',
      audioCodec: 'AAC',
      channels: '5.1 Surround & Stereo',
      isDefault: true,
      sourceType: 'curated',
    },
    {
      id: 'angel-hls-audio-de',
      language: 'de',
      label: 'German (Deutsch)',
      audioCodec: 'AAC',
      channels: 'Stereo 2.0',
      sourceType: 'curated',
    },
    {
      id: 'angel-hls-audio-es',
      language: 'es',
      label: 'Spanish (Español)',
      audioCodec: 'AAC',
      channels: 'Stereo 2.0',
      sourceType: 'curated',
    },
    {
      id: 'angel-hls-audio-fr',
      language: 'fr',
      label: 'French (Français)',
      audioCodec: 'AAC',
      channels: 'Stereo 2.0',
      sourceType: 'curated',
    },
    {
      id: 'angel-hls-audio-it',
      language: 'it',
      label: 'Italian (Italiano)',
      audioCodec: 'AAC',
      channels: 'Stereo 2.0',
      sourceType: 'curated',
    },
  ],

  'angel-one-dash': [
    {
      id: 'angel-dash-audio-en',
      language: 'en',
      label: 'English [Original]',
      audioCodec: 'AAC',
      channels: '5.1 Surround & Stereo',
      isDefault: true,
      sourceType: 'curated',
    },
    {
      id: 'angel-dash-audio-de',
      language: 'de',
      label: 'German (Deutsch)',
      audioCodec: 'AAC',
      channels: 'Stereo 2.0',
      sourceType: 'curated',
    },
    {
      id: 'angel-dash-audio-es',
      language: 'es',
      label: 'Spanish (Español)',
      audioCodec: 'AAC',
      channels: 'Stereo 2.0',
      sourceType: 'curated',
    },
    {
      id: 'angel-dash-audio-fr',
      language: 'fr',
      label: 'French (Français)',
      audioCodec: 'AAC',
      channels: 'Stereo 2.0',
      sourceType: 'curated',
    },
    {
      id: 'angel-dash-audio-it',
      language: 'it',
      label: 'Italian (Italiano)',
      audioCodec: 'AAC',
      channels: 'Stereo 2.0',
      sourceType: 'curated',
    },
  ],

  // Sintel / Sample Video (Blender Foundation)
  sintel: [
    {
      id: 'sintel-audio-en',
      language: 'en',
      label: 'English [Original]',
      audioCodec: 'AAC',
      channels: '5.1 Surround',
      isDefault: true,
      sourceType: 'curated',
    },
    {
      id: 'sintel-audio-de',
      language: 'de',
      label: 'German (Deutsch)',
      audioCodec: 'AAC',
      channels: 'Stereo 2.0',
      sourceType: 'curated',
    },
    {
      id: 'sintel-audio-es',
      language: 'es',
      label: 'Spanish (Español)',
      audioCodec: 'AAC',
      channels: 'Stereo 2.0',
      sourceType: 'curated',
    },
    {
      id: 'sintel-audio-fr',
      language: 'fr',
      label: 'French (Français)',
      audioCodec: 'AAC',
      channels: 'Stereo 2.0',
      sourceType: 'curated',
    },
  ],

  // Oceans / Nature Documentary (Disneynature)
  oceans: [
    {
      id: 'oceans-audio-en',
      language: 'en',
      label: 'English [Original]',
      audioCodec: 'E-AC-3',
      channels: 'Dolby Atmos 5.1',
      isDefault: true,
      sourceType: 'curated',
    },
    {
      id: 'oceans-audio-de',
      language: 'de',
      label: 'German (Deutsch)',
      audioCodec: 'AAC',
      channels: 'Stereo 2.0',
      sourceType: 'curated',
    },
    {
      id: 'oceans-audio-es',
      language: 'es',
      label: 'Spanish (Español)',
      audioCodec: 'AAC',
      channels: '5.1 Surround',
      sourceType: 'curated',
    },
    {
      id: 'oceans-audio-fr',
      language: 'fr',
      label: 'French (Français)',
      audioCodec: 'AAC',
      channels: 'Stereo 2.0',
      sourceType: 'curated',
    },
  ],

  // Big Buck Bunny
  bunny: [
    {
      id: 'bunny-audio-en',
      language: 'en',
      label: 'English [Original]',
      audioCodec: 'AAC',
      channels: '5.1 Surround',
      isDefault: true,
      sourceType: 'curated',
    },
    {
      id: 'bunny-audio-de',
      language: 'de',
      label: 'German (Deutsch)',
      audioCodec: 'AAC',
      channels: 'Stereo 2.0',
      sourceType: 'curated',
    },
    {
      id: 'bunny-audio-es',
      language: 'es',
      label: 'Spanish (Español)',
      audioCodec: 'AAC',
      channels: 'Stereo 2.0',
      sourceType: 'curated',
    },
  ],

  // Kalki 2898 AD
  kalki: [
    {
      id: 'kalki-audio-en',
      language: 'en',
      label: 'English [Original]',
      audioCodec: 'AAC',
      channels: '5.1 Surround & Stereo',
      isDefault: true,
      sourceType: 'curated',
    },
    {
      id: 'kalki-audio-de',
      language: 'de',
      label: 'German (Deutsch)',
      audioCodec: 'AAC',
      channels: 'Stereo 2.0',
      sourceType: 'curated',
    },
    {
      id: 'kalki-audio-es',
      language: 'es',
      label: 'Spanish (Español)',
      audioCodec: 'AAC',
      channels: 'Stereo 2.0',
      sourceType: 'curated',
    },
    {
      id: 'kalki-audio-fr',
      language: 'fr',
      label: 'French (Français)',
      audioCodec: 'AAC',
      channels: 'Stereo 2.0',
      sourceType: 'curated',
    },
    {
      id: 'kalki-audio-it',
      language: 'it',
      label: 'Italian (Italiano)',
      audioCodec: 'AAC',
      channels: 'Stereo 2.0',
      sourceType: 'curated',
    },
  ],

  // RRR / The Last Horizon
  horizon: [
    {
      id: 'horizon-audio-en',
      language: 'en',
      label: 'English [Original]',
      audioCodec: 'AAC',
      channels: '5.1 Surround & Stereo',
      isDefault: true,
      sourceType: 'curated',
    },
    {
      id: 'horizon-audio-de',
      language: 'de',
      label: 'German (Deutsch)',
      audioCodec: 'AAC',
      channels: 'Stereo 2.0',
      sourceType: 'curated',
    },
    {
      id: 'horizon-audio-es',
      language: 'es',
      label: 'Spanish (Español)',
      audioCodec: 'AAC',
      channels: 'Stereo 2.0',
      sourceType: 'curated',
    },
    {
      id: 'horizon-audio-fr',
      language: 'fr',
      label: 'French (Français)',
      audioCodec: 'AAC',
      channels: 'Stereo 2.0',
      sourceType: 'curated',
    },
    {
      id: 'horizon-audio-it',
      language: 'it',
      label: 'Italian (Italiano)',
      audioCodec: 'AAC',
      channels: 'Stereo 2.0',
      sourceType: 'curated',
    },
  ],

  // The Lion King
  'the-lion-king-hero': [
    {
      id: 'lion-king-audio-en',
      language: 'en',
      label: 'English [Original]',
      audioCodec: 'E-AC-3',
      channels: 'Dolby Atmos',
      isDefault: true,
      sourceType: 'curated',
    },
    {
      id: 'lion-king-audio-hi',
      language: 'hi',
      label: 'Hindi (हिंदी)',
      audioCodec: 'AAC',
      channels: '5.1 Surround',
      sourceType: 'curated',
    },
    {
      id: 'lion-king-audio-te',
      language: 'te',
      label: 'Telugu (తెలుగు)',
      audioCodec: 'AAC',
      channels: 'Stereo 2.0',
      sourceType: 'curated',
    },
    {
      id: 'lion-king-audio-ta',
      language: 'ta',
      label: 'Tamil (தமிழ்)',
      audioCodec: 'AAC',
      channels: 'Stereo 2.0',
      sourceType: 'curated',
    },
  ],

  // Interstellar
  interstellar: [
    {
      id: 'interstellar-audio-en',
      language: 'en',
      label: 'English [Original]',
      audioCodec: 'E-AC-3',
      channels: 'Dolby Atmos 5.1',
      isDefault: true,
      sourceType: 'curated',
    },
    {
      id: 'interstellar-audio-hi',
      language: 'hi',
      label: 'Hindi (हिंदी)',
      audioCodec: 'AAC',
      channels: '5.1 Surround',
      sourceType: 'curated',
    },
    {
      id: 'interstellar-audio-es',
      language: 'es',
      label: 'Spanish (Español)',
      audioCodec: 'AAC',
      channels: 'Stereo 2.0',
      sourceType: 'curated',
    },
    {
      id: 'interstellar-audio-fr',
      language: 'fr',
      label: 'French (Français)',
      audioCodec: 'AAC',
      channels: 'Stereo 2.0',
      sourceType: 'curated',
    },
  ],

  // Inception
  inception: [
    {
      id: 'inception-audio-en',
      language: 'en',
      label: 'English [Original]',
      audioCodec: 'E-AC-3',
      channels: 'Dolby Atmos 5.1',
      isDefault: true,
      sourceType: 'curated',
    },
    {
      id: 'inception-audio-hi',
      language: 'hi',
      label: 'Hindi (हिंदी)',
      audioCodec: 'AAC',
      channels: '5.1 Surround',
      sourceType: 'curated',
    },
    {
      id: 'inception-audio-te',
      language: 'te',
      label: 'Telugu (తెలుగు)',
      audioCodec: 'AAC',
      channels: 'Stereo 2.0',
      sourceType: 'curated',
    },
  ],

  // Salaar
  salaar: [
    {
      id: 'salaar-audio-te',
      language: 'te',
      label: 'Telugu [Original]',
      audioCodec: 'E-AC-3',
      channels: 'Dolby Atmos 5.1',
      isDefault: true,
      sourceType: 'curated',
    },
    {
      id: 'salaar-audio-hi',
      language: 'hi',
      label: 'Hindi (हिंदी)',
      audioCodec: 'AAC',
      channels: '5.1 Surround',
      sourceType: 'curated',
    },
    {
      id: 'salaar-audio-ta',
      language: 'ta',
      label: 'Tamil (தமிழ்)',
      audioCodec: 'AAC',
      channels: '5.1 Surround',
      sourceType: 'curated',
    },
    {
      id: 'salaar-audio-kn',
      language: 'kn',
      label: 'Kannada (ಕನ್ನಡ)',
      audioCodec: 'AAC',
      channels: 'Stereo 2.0',
      sourceType: 'curated',
    },
    {
      id: 'salaar-audio-ml',
      language: 'ml',
      label: 'Malayalam (മലയാളം)',
      audioCodec: 'AAC',
      channels: 'Stereo 2.0',
      sourceType: 'curated',
    },
  ],

  // Pushpa / Devara / Indian Blockbusters
  pushpa: [
    {
      id: 'pushpa-audio-te',
      language: 'te',
      label: 'Telugu [Original]',
      audioCodec: 'E-AC-3',
      channels: 'Dolby Atmos 5.1',
      isDefault: true,
      sourceType: 'curated',
    },
    {
      id: 'pushpa-audio-hi',
      language: 'hi',
      label: 'Hindi (हिंदी)',
      audioCodec: 'AAC',
      channels: '5.1 Surround',
      sourceType: 'curated',
    },
    {
      id: 'pushpa-audio-ta',
      language: 'ta',
      label: 'Tamil (தமிழ்)',
      audioCodec: 'AAC',
      channels: '5.1 Surround',
      sourceType: 'curated',
    },
    {
      id: 'pushpa-audio-kn',
      language: 'kn',
      label: 'Kannada (ಕನ್ನಡ)',
      audioCodec: 'AAC',
      channels: 'Stereo 2.0',
      sourceType: 'curated',
    },
    {
      id: 'pushpa-audio-ml',
      language: 'ml',
      label: 'Malayalam (മലയാളം)',
      audioCodec: 'AAC',
      channels: 'Stereo 2.0',
      sourceType: 'curated',
    },
  ],

  devara: [
    {
      id: 'devara-audio-te',
      language: 'te',
      label: 'Telugu [Original]',
      audioCodec: 'E-AC-3',
      channels: 'Dolby Atmos 5.1',
      isDefault: true,
      sourceType: 'curated',
    },
    {
      id: 'devara-audio-hi',
      language: 'hi',
      label: 'Hindi (हिंदी)',
      audioCodec: 'AAC',
      channels: '5.1 Surround',
      sourceType: 'curated',
    },
    {
      id: 'devara-audio-ta',
      language: 'ta',
      label: 'Tamil (தமிழ்)',
      audioCodec: 'AAC',
      channels: '5.1 Surround',
      sourceType: 'curated',
    },
    {
      id: 'devara-audio-kn',
      language: 'kn',
      label: 'Kannada (ಕನ್ನಡ)',
      audioCodec: 'AAC',
      channels: 'Stereo 2.0',
      sourceType: 'curated',
    },
  ],
};

/**
 * Creates dynamic multi-audio tracks for Live TV broadcast channels.
 */
function createDynamicLiveAudioTracks(
  contentId?: string,
  contentTitle?: string,
): AudioTrack[] {
  const normTitle = (contentTitle || '').toLowerCase();
  const normId = (contentId || '').toLowerCase();

  let primaryLanguage = 'en';
  let primaryLabel = 'English [Broadcast]';

  if (
    normId.includes('sakshi') ||
    normId.includes('ntv') ||
    normTitle.includes('telugu') ||
    normTitle.includes('sakshi') ||
    normTitle.includes('ntv')
  ) {
    primaryLanguage = 'te';
    primaryLabel = 'Telugu [Broadcast]';
  } else if (
    normId.includes('abp') ||
    normId.includes('ndtv-india') ||
    normId.includes('bharati') ||
    normTitle.includes('hindi') ||
    normTitle.includes('abp')
  ) {
    primaryLanguage = 'hi';
    primaryLabel = 'Hindi [Broadcast]';
  } else if (normId.includes('girnar') || normTitle.includes('gujarati')) {
    primaryLanguage = 'gu';
    primaryLabel = 'Gujarati [Broadcast]';
  } else if (normId.includes('dw') || normTitle.includes('dw')) {
    primaryLanguage = 'de';
    primaryLabel = 'German [Broadcast]';
  } else if (normId.includes('cgtn') || normTitle.includes('cgtn')) {
    primaryLanguage = 'zh';
    primaryLabel = 'Chinese [Broadcast]';
  }

  return [
    {
      id: `live-audio-${primaryLanguage}`,
      language: primaryLanguage,
      label: primaryLabel,
      audioCodec: 'AAC',
      channels: 'HD Stereo 2.0',
      isDefault: true,
      sourceType: 'curated',
    },
    {
      id: 'live-audio-en-commentary',
      language: 'en',
      label: 'English [Clean Audio / Commentary]',
      audioCodec: 'AAC',
      channels: 'Stereo 2.0',
      sourceType: 'curated',
    },
    {
      id: 'live-audio-ambient',
      language: 'mul',
      label: 'Studio & Stadium Ambient [5.1 Surround]',
      audioCodec: 'E-AC-3',
      channels: '5.1 Surround',
      sourceType: 'curated',
    },
  ];
}

/**
 * Creates default fallback multi-audio tracks for generic or custom titles.
 */
function createGenericAudioTracks(contentTitle: string): AudioTrack[] {
  return [
    {
      id: 'generic-audio-en',
      language: 'en',
      label: `${contentTitle} (English) [Original]`,
      audioCodec: 'AAC',
      channels: '5.1 Surround',
      isDefault: true,
      sourceType: 'curated',
    },
    {
      id: 'generic-audio-de',
      language: 'de',
      label: 'German (Deutsch)',
      audioCodec: 'AAC',
      channels: 'Stereo 2.0',
      sourceType: 'curated',
    },
    {
      id: 'generic-audio-es',
      language: 'es',
      label: 'Spanish (Español)',
      audioCodec: 'AAC',
      channels: 'Stereo 2.0',
      sourceType: 'curated',
    },
    {
      id: 'generic-audio-fr',
      language: 'fr',
      label: 'French (Français)',
      audioCodec: 'AAC',
      channels: 'Stereo 2.0',
      sourceType: 'curated',
    },
    {
      id: 'generic-audio-it',
      language: 'it',
      label: 'Italian (Italiano)',
      audioCodec: 'AAC',
      channels: 'Stereo 2.0',
      sourceType: 'curated',
    },
  ];
}

/**
 * Resolves all available audio tracks for a given piece of content.
 */
export function getAudioTracksForContent(
  contentId?: string,
  contentTitle?: string,
  videoUrl?: string,
  isLive?: boolean,
  _genre?: string,
  _description?: string,
): AudioTrack[] {
  const normId = (contentId || '').toLowerCase().trim();
  const normTitle = (contentTitle || '').toLowerCase().trim();
  const normUrl = (videoUrl || '').toLowerCase().trim();

  // 1. Live stream detection
  if (
    isLive ||
    normId.startsWith('live-') ||
    normId.includes('live') ||
    normTitle.includes('live') ||
    normUrl.includes('live') ||
    normUrl.includes('master.m3u8') ||
    normUrl.includes('playlist.m3u8') ||
    normUrl.includes('index.m3u8')
  ) {
    return createDynamicLiveAudioTracks(contentId, contentTitle);
  }

  // 2. Direct catalog key match
  if (normId && curatedAudioTracksMap[normId]) {
    return curatedAudioTracksMap[normId];
  }

  // 3. Partial key match across catalog map
  for (const key of Object.keys(curatedAudioTracksMap)) {
    if (
      (normId && (normId.includes(key) || key.includes(normId))) ||
      (normTitle && (normTitle.includes(key) || key.includes(normTitle)))
    ) {
      return curatedAudioTracksMap[key];
    }
  }

  // 4. Match against videoUrl if present
  if (normUrl) {
    for (const key of Object.keys(curatedAudioTracksMap)) {
      if (normUrl.includes(key)) {
        return curatedAudioTracksMap[key];
      }
    }
  }

  // 5. Generic multi-audio fallback
  return createGenericAudioTracks(contentTitle || 'Now Playing');
}
