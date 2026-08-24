import {Channel} from './Channel';

export interface LiveChannelDrmConfig {
  enabled: true;
  type: 'widevine';
  keySystem: 'com.widevine.alpha';
  licenseUrl: string;
}

export interface LiveChannel extends Channel {
  category: string;
  language: string;
  country: string;
  streamType: 'hls' | 'dash';
  isTestOnly: boolean;
  isPlayable?: boolean;
  isVideoOnly?: boolean;
  image?: string;
  drm?: LiveChannelDrmConfig;
}
