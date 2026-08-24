import {VegaEPGChannel, VegaEPGProgram} from '../data/epgMockData';
import {EPGProgram} from '../models/EPGProgram';

const LOGIXSTREAM_CHANNELS_URL =
  'https://jiotv.data.cdn.jio.com/apis/v3.0/getMobileChannelList/get/?os=android&devicetype=phone&usertype=tvYR7NSNn7rymo3F';
const LOGIXSTREAM_EPG_URL =
  'https://jiotv.data.cdn.jio.com/apis/v1.3/getepg/get?offset=0&channel_id=';
const LOGIXSTREAM_LOGO_BASE_URL =
  'https://jiotvimages.cdn.jio.com/dare_images/images/';
const LOGIXSTREAM_PROGRAMME_IMAGE_BASE_URL =
  'https://jiotv.catchup.cdn.jio.com/dare_images/shows/';
const MAX_CHANNELS = 1000;
const EPG_REQUEST_CONCURRENCY = 7;

interface LogixTVChannel {
  channel_id: number;
  channel_name: string;
  logoUrl?: string;
  stbChannelNumber?: number;
  channelCategoryId?: number;
  streamUrl?: string;
  stream_url?: string;
  playbackUrl?: string;
  playback_url?: string;
}

interface LogixTVProgramme {
  showname: string;
  description?: string;
  episode_desc?: string;
  showCategory?: string;
  showGenre?: string[];
  episodePoster?: string;
  episodeThumbnail?: string;
  startEpoch: number;
  endEpoch: number;
}

export interface RealEPGData {
  channels: VegaEPGChannel[];
  startTimeMs: number;
  endTimeMs: number;
}

export interface LogixTVEPGPage extends RealEPGData {
  hasMore: boolean;
}

let channelListPromise: Promise<LogixTVChannel[]> | null = null;

const providerCategoryIds: Record<string, number[]> = {
  News: [12],
  Entertainment: [5, 9, 13],
  Sports: [8],
  Movies: [6],
  Kids: [7],
  Culture: [9, 10, 15, 17],
  Regional: [5],
  Documentary: [10],
};

const fetchJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`LogixTV request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
};

const getSelectedChannels = (
  channels: LogixTVChannel[],
  requiresStreamUrl = false,
  category?: string,
) => {
  const categoryIds = category ? providerCategoryIds[category] : undefined;
  return channels
    .filter(
      (channel) =>
        Number.isFinite(channel.channel_id) &&
        Boolean(channel.channel_name) &&
        (!requiresStreamUrl || Boolean(getChannelStreamUrl(channel))) &&
        (!categoryIds || categoryIds.includes(channel.channelCategoryId || -1)),
    )
    .sort(
      (left, right) =>
        (left.stbChannelNumber || Number.MAX_SAFE_INTEGER) -
        (right.stbChannelNumber || Number.MAX_SAFE_INTEGER),
    )
    .slice(0, MAX_CHANNELS);
};

const fetchLogixTVChannels = () => {
  if (!channelListPromise) {
    channelListPromise = fetchJson<{result?: LogixTVChannel[]}>(
      LOGIXSTREAM_CHANNELS_URL,
    ).then((response) => response.result || []);
  }
  return channelListPromise;
};

const getChannelStreamUrl = (channel: LogixTVChannel) => {
  const streamUrl =
    channel.streamUrl ||
    channel.stream_url ||
    channel.playbackUrl ||
    channel.playback_url;

  return streamUrl?.trim() || undefined;
};

const fetchSchedules = async (selectedChannels: LogixTVChannel[]) => {
  const schedules: Array<{
    channel: LogixTVChannel;
    response: {epg?: LogixTVProgramme[]};
  }> = [];

  for (
    let startIndex = 0;
    startIndex < selectedChannels.length;
    startIndex += EPG_REQUEST_CONCURRENCY
  ) {
    const channelBatch = selectedChannels.slice(
      startIndex,
      startIndex + EPG_REQUEST_CONCURRENCY,
    );
    const results = await Promise.allSettled(
      channelBatch.map(async (channel) => ({
        channel,
        response: await fetchJson<{epg?: LogixTVProgramme[]}>(
          `${LOGIXSTREAM_EPG_URL}${channel.channel_id}`,
        ),
      })),
    );

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        schedules.push(result.value);
      }
    });
  }

  return schedules;
};

const toVegaProgram = (
  programme: LogixTVProgramme,
  channelId: string,
  index: number,
) => {
  if (
    !Number.isFinite(programme.startEpoch) ||
    !Number.isFinite(programme.endEpoch) ||
    programme.endEpoch <= programme.startEpoch
  ) {
    return null;
  }

  const sourceProgram: EPGProgram = {
    id: `LogixTV-${channelId}-${programme.startEpoch}-${index}`,
    channelId,
    title: programme.showname || 'Programme',
    description: programme.description || programme.episode_desc,
    category: programme.showGenre?.[0] || programme.showCategory,
    image: programme.episodePoster
      ? `${LOGIXSTREAM_PROGRAMME_IMAGE_BASE_URL}${programme.episodePoster}`
      : programme.episodeThumbnail
      ? `${LOGIXSTREAM_PROGRAMME_IMAGE_BASE_URL}${programme.episodeThumbnail}`
      : undefined,
    startTime: new Date(programme.startEpoch).toISOString(),
    endTime: new Date(programme.endEpoch).toISOString(),
  };

  return {
    programId: sourceProgram.id,
    title: sourceProgram.title,
    startTime: programme.startEpoch,
    endTime: programme.endEpoch,
    shortDescription: sourceProgram.description,
    extras: {sourceProgram},
  } as VegaEPGProgram;
};

export const fetchLogixTVEPGPage = async ({
  offset,
  limit,
  requiresStreamUrl = false,
  category,
}: {
  offset: number;
  limit: number;
  requiresStreamUrl?: boolean;
  category?: string;
}): Promise<LogixTVEPGPage> => {
  const availableChannels = getSelectedChannels(
    await fetchLogixTVChannels(),
    requiresStreamUrl,
    category,
  );
  const selectedChannels = availableChannels.slice(offset, offset + limit);
  if (!selectedChannels.length && offset === 0 && !requiresStreamUrl) {
    throw new Error('LogixTV returned no channels');
  }
  if (!selectedChannels.length) {
    const now = Date.now();
    return {
      channels: [],
      startTimeMs: now,
      endTimeMs: now,
      hasMore: false,
    };
  }

  const schedules = await fetchSchedules(selectedChannels);

  const channels = schedules
    .map(({channel, response}) => {
      const id = `LogixTV-${channel.channel_id}`;
      const programs = (response.epg || [])
        .map((programme, index) => toVegaProgram(programme, id, index))
        .filter((programme): programme is VegaEPGProgram => Boolean(programme));
      if (!programs.length) {
        return null;
      }
      return {
        id,
        displayName: `${channel.stbChannelNumber || ''} ${
          channel.channel_name
        }`.trim(),
        groupId: 'LogixTV',
        groupName: '',
        logoUrl: channel.logoUrl
          ? `${LOGIXSTREAM_LOGO_BASE_URL}${channel.logoUrl}`
          : '',
        programs: programs.map((program) => ({
          ...program,
          extras: {
            ...program.extras,
            streamUrl: getChannelStreamUrl(channel),
          },
        })),
      } as VegaEPGChannel;
    })
    .filter((channel): channel is VegaEPGChannel => Boolean(channel));

  if (!channels.length && offset === 0) {
    throw new Error('LogixTV returned no programme data');
  }

  const programs = channels.flatMap((channel) => channel.programs);
  return {
    channels,
    startTimeMs: programs.length
      ? Math.min(...programs.map((programme) => programme.startTime))
      : Date.now(),
    endTimeMs: programs.length
      ? Math.max(...programs.map((programme) => programme.endTime))
      : Date.now(),
    hasMore: offset + limit < availableChannels.length,
  };
};
