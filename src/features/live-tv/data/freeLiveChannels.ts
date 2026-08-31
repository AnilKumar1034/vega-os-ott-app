import {VegaEPGChannel, VegaEPGProgram} from './epgMockData';
import {LiveChannel} from '../models/LiveChannel';
import {EPGProgram} from '../models/EPGProgram';
import {getCurrentEPGSlotTimeMs} from '../utils/epgTimeUtils';

export const liveChannels: LiveChannel[] = [
  // Matches the RN 0.72 Amazon Vega Video Sample DRM fixture. Keep this
  // separate from provider test URLs so W3C/EME regressions can be compared
  // directly with the official sample.
  {
    id: 'vega-sample-tears-widevine',
    number: 297,
    name: 'Vega Widevine DRM Test',
    category: 'Test',
    language: 'English',
    country: 'Test',
    streamType: 'dash',
    streamUrl:
      'https://storage.googleapis.com/wvmedia/cenc/h264/tears/tears.mpd',
    drm: {
      enabled: true,
      type: 'widevine',
      keySystem: 'com.widevine.alpha',
      licenseUrl: 'https://proxy.uat.widevine.com/proxy?provider=widevine_test',
    },
    isTestOnly: true,
  },
  // Diagnostic channels: intentionally clear DASH. They exercise the same
  // Shaka/MSE route as DRM content without creating MediaKeys.
  {
    id: 'dash-video-only',
    number: 299,
    name: 'DASH Video Only Test',
    category: 'Test',
    language: 'None',
    country: 'DASH-IF',
    streamType: 'dash',
    streamUrl:
      'https://storage.googleapis.com/shaka-demo-assets/angel-one/dash.mpd',
    isVideoOnly: true,
    isTestOnly: true,
  },
  {
    id: 'dash-single-avc',
    number: 298,
    name: 'DASH Single AVC Test',
    category: 'Test',
    language: 'None',
    country: 'DASH-IF',
    streamType: 'dash',
    streamUrl:
      'https://dash.akamaized.net/dash264/TestCasesIOP33/adapatationSetSwitching/5/manifest.mpd',
    isTestOnly: true,
  },
  {
    id: 'sintel-widevine-video-test',
    number: 300,
    name: 'Sintel Widevine Video Test',
    category: 'Entertainment',
    language: 'English',
    country: 'Test',

    streamType: 'dash',

    streamUrl:
      'https://storage.googleapis.com/shaka-demo-assets/sintel-widevine/dash.mpd',
    // The current Vega native MSE runtime rejects AAC SourceBuffers. Keep this
    // DRM validation stream video-only so Widevine can complete its video path.
    isVideoOnly: true,

    drm: {
      enabled: true,
      type: 'widevine',
      keySystem: 'com.widevine.alpha',
      licenseUrl: 'https://cwip-shaka-proxy.appspot.com/no_auth',
    },

    isTestOnly: true,
  },
  {
    id: 'bunny-live-drm',
    number: 300,
    name: 'Big Buck Bunny Live DRM',
    category: 'Entertainment',
    language: 'English',
    country: 'United States',
    // Keep the provider's supplied HLS test URL. Its DASH endpoint times out
    // on the Vega Virtual Device before the manifest response is delivered.
    streamType: 'hls',
    // streamUrl:'https://drm-test-cf.softvelum.com/live_ezdrm/bunny/playlist.m3u8',
    streamUrl:
      'https://cdn.bitmovin.com/content/assets/art-of-motion_drm/mpds/11331.mpd',
    drm: {
      enabled: true,
      type: 'widevine',
      keySystem: 'com.widevine.alpha',
      // licenseUrl: 'https://widevine-dash.ezdrm.com/widevine-php/widevine-foreignkey.php?pX=B03B45',
      licenseUrl: 'https://cwip-shaka-proxy.appspot.com/no_auth',
      // licenseUrl: 'https://test.playready.microsoft.com/service/rightsmanager.asmx?PlayRight=1&ContentKey=EAtsIJQPd5pFiRUrV9Layw=='
    },
    isTestOnly: true,
  },
  {
    id: 'sakshi-telugu',
    number: 301,
    name: 'Sakshi Telugu',
    category: 'News',
    language: 'Telugu',
    country: 'India',
    streamType: 'hls',
    streamUrl:
      'https://yuppmedtaorire.akamaized.net/v1/master/a0d007312bfd99c47f76b77ae26b1ccdaae76cb1/sakshi_nim_https/240122/sakshi/playlist.m3u8',

    logo: 'https://static.wikia.nocookie.net/logopedia/images/5/52/Sakshi.jpg/revision/latest?cb=20240313121811',

    isTestOnly: true,
  },

  {
    id: 'ntv-telugu',
    number: 302,
    name: 'NTV Telugu',
    category: 'News',
    language: 'Telugu',
    country: 'India',
    streamType: 'hls',
    streamUrl: 'https://mumbai-edge.smartplaytv.in/NTVTelugu/index.m3u8',

    logo: 'https://cdn.aptoide.com/imgs/7/c/9/7c9046b54b26978d7c9a5c6841be1a9b_fgraphic.png',

    isTestOnly: true,
  },

  {
    id: 'ndtv-india',
    number: 401,
    name: 'NDTV India',
    category: 'News',
    language: 'Hindi',
    country: 'India',
    streamType: 'hls',
    streamUrl:
      'https://ndtvindiaelemarchana.akamaized.net/hls/live/2003679/ndtvindia/master.m3u8',

    logo: 'https://images.indianexpress.com/2015/11/ndtv-759.jpg',

    isTestOnly: true,
  },

  {
    id: 'abp-news',
    number: 402,
    name: 'ABP News',
    category: 'News',
    language: 'Hindi',
    country: 'India',
    streamType: 'hls',
    streamUrl:
      'https://abplivetv.akamaized.net/hls/live/2043010/hindi/master.m3u8',

    logo: 'https://static.wikia.nocookie.net/logopedia/images/d/d0/ABPNews_2016.jpg/revision/latest/scale-to-width-down/250?cb=20170818145530',

    isTestOnly: true,
  },

  {
    id: 'dd-bharati',
    number: 403,
    name: 'DD Bharati',
    category: 'Culture',
    language: 'Hindi',
    country: 'India',
    streamType: 'hls',
    streamUrl:
      'https://d2lk5u59tns74c.cloudfront.net/out/v1/67cec794d8b14f9ba21f73924ac65797/index.m3u8',

    logo: 'https://www.google.com/s2/favicons?domain=prasarbharati.gov.in&sz=256',

    isTestOnly: true,
  },

  {
    id: 'dd-girnar',
    number: 404,
    name: 'DD Girnar',
    category: 'Regional',
    language: 'Gujarati',
    country: 'India',
    streamType: 'hls',
    streamUrl:
      'https://d2lk5u59tns74c.cloudfront.net/out/v1/558fdb9aebb54bb5bbbf0ced03686148/index.m3u8',

    logo: 'https://www.google.com/s2/favicons?domain=prasarbharati.gov.in&sz=256',

    isTestOnly: true,
  },

  {
    id: 'dw-english',
    number: 501,
    name: 'DW English',
    category: 'News',
    language: 'English',
    country: 'Germany',
    streamType: 'hls',
    streamUrl:
      'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8',

    logo: 'https://www.google.com/s2/favicons?domain=dw.com&sz=256',

    isTestOnly: true,
  },

  {
    id: 'cgtn-english',
    number: 502,
    name: 'CGTN English',
    category: 'News',
    language: 'English',
    country: 'China',
    streamType: 'hls',
    streamUrl: 'https://news.cgtn.com/resource/live/english/cgtn-news.m3u8',

    logo: 'https://www.google.com/s2/favicons?domain=cgtn.com&sz=256',

    isTestOnly: true,
  },

  {
    id: 'cgtn-documentary',
    number: 503,
    name: 'CGTN Documentary',
    category: 'Documentary',
    language: 'English',
    country: 'China',
    streamType: 'hls',
    streamUrl: 'https://news.cgtn.com/resource/live/document/cgtn-doc.m3u8',

    logo: 'https://www.google.com/s2/favicons?domain=cgtn.com&sz=256',

    isTestOnly: true,
  },

  {
    id: 'nhk-world',
    number: 504,
    name: 'NHK World Japan',
    category: 'News',
    language: 'English',
    country: 'Japan',
    streamType: 'hls',
    streamUrl:
      'https://nhkworld.webcdn.stream.ne.jp/www11/nhkworld-tv/global/2003458/live.m3u8',

    logo: 'https://www.google.com/s2/favicons?domain=nhk.or.jp&sz=256',

    isTestOnly: true,
    isPlayable: false,
  },

  {
    id: 'europe-by-satellite',
    number: 505,
    name: 'Europe by Satellite',
    category: 'News',
    language: 'English',
    country: 'European Union',
    streamType: 'hls',
    streamUrl:
      'https://euc-live.fl.freecaster.net/live/eucom/ebs-audio_int=96000-video=2600000.m3u8',

    logo: 'https://www.google.com/s2/favicons?domain=audiovisual.ec.europa.eu&sz=256',

    isTestOnly: true,
    isPlayable: false,
  },

  {
    id: 'europe-by-satellite-plus',
    number: 506,
    name: 'Europe by Satellite+',
    category: 'News',
    language: 'English',
    country: 'European Union',
    streamType: 'hls',
    streamUrl:
      'https://euc-live.fl.freecaster.net/live/eucom/ebsp-audio_int=96000-video=2600000.m3u8',

    logo: 'https://www.google.com/s2/favicons?domain=audiovisual.ec.europa.eu&sz=256',

    isTestOnly: true,
    isPlayable: false,
  },
];

const toFreeLiveProgram = (channel: LiveChannel, index: number): EPGProgram => {
  const slotStart = getCurrentEPGSlotTimeMs();
  const startTime = slotStart + (index - 1) * 30 * 60000;
  const endTime = startTime + 30 * 60000;

  return {
    id: `${channel.id}-live-${index}`,
    channelId: channel.id,
    title: index === 1 ? `${channel.name} Live` : 'Live Broadcast',
    description: `${channel.category} • ${channel.language}`,
    category: channel.category,
    image: getFreeLiveChannelLogo(channel),
    startTime: new Date(startTime).toISOString(),
    endTime: new Date(endTime).toISOString(),
  };
};

const getFreeLiveChannelLogo = (channel: LiveChannel) => {
  if (channel.logo) {
    return channel.logo;
  }

  const label = encodeURIComponent(`${channel.number} ${channel.name}`);
  return `https://placehold.co/220x100/13141E/FFFFFF.png?text=${label}`;
};

export const getFreeLiveEPGData = (category?: string) => {
  const playableChannels = liveChannels.filter(
    (channel) =>
      channel.isPlayable !== false &&
      (!category || channel.category === category),
  );
  const programs = playableChannels.flatMap((channel) =>
    [0, 1, 2].map((index) => toFreeLiveProgram(channel, index)),
  );
  const channels: VegaEPGChannel[] = playableChannels.map((channel) => ({
    id: channel.id,
    displayName: `${channel.number} ${channel.name}`,
    groupId: 'free-live',
    groupName: 'Free Live',
    logoUrl: getFreeLiveChannelLogo(channel),
    programs: programs
      .filter((program) => program.channelId === channel.id)
      .map((program) => ({
        programId: program.id,
        title: program.title,
        startTime: new Date(program.startTime).getTime(),
        endTime: new Date(program.endTime).getTime(),
        shortDescription: program.description,
        extras: {
          sourceProgram: program,
          streamUrl: channel.streamUrl,
          streamType: channel.streamType,
          isVideoOnly: channel.isVideoOnly,
          drm: channel.drm,
        },
      })) as VegaEPGProgram[],
  }));

  const startTimeMs = getCurrentEPGSlotTimeMs() - 30 * 60000;
  return {channels, startTimeMs, endTimeMs: startTimeMs + 90 * 60000};
};
