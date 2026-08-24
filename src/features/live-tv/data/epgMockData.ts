import {Channel} from '../models/Channel';
import {EPGProgram} from '../models/EPGProgram';
import {LiveChannelDrmConfig} from '../models/LiveChannel';
import {getCurrentEPGSlotTimeMs} from '../utils/epgTimeUtils';

export const channels: Channel[] = [
  {
    id: 'sports',
    number: 101,
    name: 'Sports Central',
    logo: 'https://placehold.co/220x100/181818/FFFFFF.png?text=101%20Sports%20Central',
  },
  {
    id: 'movies',
    number: 102,
    name: 'Movie Max',
    logo: 'https://placehold.co/220x100/181818/FFFFFF.png?text=102%20Movie%20Max',
  },
  {
    id: 'news',
    number: 103,
    name: 'News 24',
    logo: 'https://placehold.co/220x100/181818/FFFFFF.png?text=103%20News%2024',
  },
  {
    id: 'kids',
    number: 104,
    name: 'Kids Planet',
    logo: 'https://placehold.co/220x100/181818/FFFFFF.png?text=104%20Kids%20Planet',
  },
  {
    id: 'entertainment',
    number: 105,
    name: 'Star Gold',
    logo: 'https://placehold.co/220x100/181818/FFFFFF.png?text=105%20Entertainment%20One',
  },
];

const scheduleStart = new Date(getCurrentEPGSlotTimeMs() - 120 * 60000);

export const EPG_START_TIME = scheduleStart.toISOString();
export const EPG_TIMELINE_SLOT_COUNT = 12;

type ProgramSeed = Omit<
  EPGProgram,
  'id' | 'channelId' | 'startTime' | 'endTime'
> & {
  duration: number;
};

const schedules: Record<string, ProgramSeed[]> = {
  sports: [
    {
      title: 'Morning Fitness',
      category: 'Sports',
      description: 'Training tips and highlights.',
      duration: 30,
    },
    {
      title: 'Premier League Review',
      category: 'Sports',
      description: 'Goals and analysis from the latest matches.',
      duration: 60,
    },
    {
      title: 'India vs Australia',
      category: 'Sports',
      description: 'Live Cricket',
      duration: 90,
    },
    {
      title: 'Match Highlights',
      category: 'Sports',
      description: 'The best moments from today.',
      duration: 30,
    },
    {
      title: 'Sports Desk',
      category: 'Sports',
      description: 'Breaking sports news.',
      duration: 60,
    },
    {
      title: 'Tennis Weekly',
      category: 'Sports',
      description: 'Tour updates and interviews.',
      duration: 30,
    },
    {
      title: 'Football Focus',
      category: 'Sports',
      description: 'Preview the big fixtures.',
      duration: 60,
    },
  ],
  movies: [
    {
      title: 'Cinema Stories',
      category: 'Movies',
      description: 'Behind the scenes in film.',
      duration: 30,
    },
    {
      title: 'The Last Horizon',
      category: 'Movies',
      description: 'An explorer races home before a solar storm.',
      duration: 90,
    },
    {
      title: 'Midnight Run',
      category: 'Movies',
      description: 'A thrilling city chase.',
      duration: 60,
    },
    {
      title: 'Movie News',
      category: 'Entertainment',
      description: 'Casting and release updates.',
      duration: 30,
    },
    {
      title: 'Coastal Dreams',
      category: 'Movies',
      description: 'A warm summer drama.',
      duration: 90,
    },
    {
      title: 'Short Film Showcase',
      category: 'Movies',
      description: 'New voices in cinema.',
      duration: 30,
    },
    {
      title: 'Action Tonight',
      category: 'Movies',
      description: 'A prime-time action feature.',
      duration: 60,
    },
  ],
  news: [
    {
      title: 'Early Headlines',
      category: 'News',
      description: 'The stories shaping the day.',
      duration: 30,
    },
    {
      title: 'World News Live',
      category: 'News',
      description: 'Live updates from around the world.',
      duration: 60,
    },
    {
      title: 'Business Report',
      category: 'News',
      description: 'Markets, companies, and the economy.',
      duration: 30,
    },
    {
      title: 'National Desk',
      category: 'News',
      description: 'News from across the country.',
      duration: 60,
    },
    {
      title: 'Technology Now',
      category: 'News',
      description: 'Digital culture and innovation.',
      duration: 30,
    },
    {
      title: 'Evening Headlines',
      category: 'News',
      description: 'The latest breaking stories.',
      duration: 60,
    },
    {
      title: 'Global Debate',
      category: 'News',
      description: 'In-depth analysis and perspective.',
      duration: 60,
    },
  ],
  kids: [
    {
      title: 'Happy Toons',
      category: 'Kids',
      description: 'Animated adventures for everyone.',
      duration: 30,
    },
    {
      title: 'Space Scouts',
      category: 'Kids',
      description: 'Young explorers discover a new planet.',
      duration: 60,
    },
    {
      title: 'Puzzle Time',
      category: 'Kids',
      description: 'Play along with fun puzzles.',
      duration: 30,
    },
    {
      title: 'The Tiny Detectives',
      category: 'Kids',
      description: 'A mystery at the school fair.',
      duration: 60,
    },
    {
      title: 'Kids Movie: Moon Camp',
      category: 'Kids',
      description: 'A family adventure under the stars.',
      duration: 90,
    },
    {
      title: 'Story Corner',
      category: 'Kids',
      description: 'Classic stories read aloud.',
      duration: 30,
    },
    {
      title: 'Wild Wonders',
      category: 'Kids',
      description: 'Amazing animals from every continent.',
      duration: 60,
    },
  ],
  entertainment: [
    {
      title: 'Morning Mix',
      category: 'Entertainment',
      description: 'Music, culture, and celebrity news.',
      duration: 30,
    },
    {
      title: 'The Daily Show',
      category: 'Entertainment',
      description: 'Comedy and conversations.',
      duration: 60,
    },
    {
      title: 'Kitchen Challenge',
      category: 'Entertainment',
      description: 'Three chefs, one surprise ingredient.',
      duration: 60,
    },
    {
      title: 'Star Interview',
      category: 'Entertainment',
      description: 'A candid conversation with a screen icon.',
      duration: 30,
    },
    {
      title: 'City Stories',
      category: 'Entertainment',
      description: 'Drama from the heart of the city.',
      duration: 60,
    },
    {
      title: 'Music Live',
      category: 'Entertainment',
      description: 'Performances from rising artists.',
      duration: 60,
    },
    {
      title: 'Late Night Laughs',
      category: 'Entertainment',
      description: 'Stand-up from around the world.',
      duration: 60,
    },
  ],
};

export const epgPrograms: EPGProgram[] = channels.flatMap((channel) => {
  let cursor = new Date(EPG_START_TIME).getTime();

  return (schedules[channel.id] || []).map((seed, index) => {
    const startTime = new Date(cursor).toISOString();
    cursor += seed.duration * 60000;

    return {
      id: `${channel.id}-${index + 1}`,
      channelId: channel.id,
      title: seed.title,
      description: seed.description,
      category: seed.category,
      startTime,
      endTime: new Date(cursor).toISOString(),
    };
  });
});

export const EPG_END_TIME = epgPrograms.reduce((latestTime, program) => {
  const programEndTime = new Date(program.endTime).getTime();
  return Number.isFinite(programEndTime)
    ? Math.max(latestTime, programEndTime)
    : latestTime;
}, new Date(EPG_START_TIME).getTime());

export interface VegaEPGProgram {
  programId: string;
  title: string;
  startTime: number;
  endTime: number;
  shortDescription?: string;
  extras: {
    sourceProgram: EPGProgram;
    streamUrl?: string;
    streamType?: 'hls' | 'dash';
    drm?: LiveChannelDrmConfig;
  };
}

export interface VegaEPGChannel {
  id: string;
  displayName: string;
  groupId: string;
  groupName: string;
  logoUrl: string;
  programs: VegaEPGProgram[];
}

export const vegaEPGChannelData: VegaEPGChannel[] = channels.map((channel) => ({
  id: channel.id,
  displayName: `${channel.number} ${channel.name}`,
  groupId: 'live-tv',
  groupName: 'Live TV',
  logoUrl: channel.logo || '',
  programs: epgPrograms.reduce<VegaEPGProgram[]>((programs, program) => {
    if (program.channelId !== channel.id) {
      return programs;
    }

    const startTime = new Date(program.startTime).getTime();
    const endTime = new Date(program.endTime).getTime();
    if (
      !Number.isFinite(startTime) ||
      !Number.isFinite(endTime) ||
      endTime <= startTime
    ) {
      return programs;
    }

    programs.push({
      programId: program.id,
      title: program.title,
      startTime,
      endTime,
      shortDescription: program.description,
      extras: {sourceProgram: program},
    });
    return programs;
  }, []),
}));
