import {EPGProgram} from '../models/EPGProgram';

export const SLOT_MINUTES = 30;
export const SLOT_WIDTH = 150;

export const getCurrentEPGSlotTimeMs = (now = new Date()) => {
  const nowTime = now.getTime();
  if (!Number.isFinite(nowTime)) {
    return Date.now();
  }

  const slotDurationMs = SLOT_MINUTES * 60000;
  return Math.floor(nowTime / slotDurationMs) * slotDurationMs;
};

const getTimestamp = (value: string) => {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
};

export const getProgramDurationMinutes = (program: EPGProgram) => {
  const start = getTimestamp(program.startTime);
  const end = getTimestamp(program.endTime);

  if (start === null || end === null || end <= start) {
    return 0;
  }

  return (end - start) / 60000;
};

export const getProgramWidth = (program: EPGProgram) =>
  (getProgramDurationMinutes(program) / SLOT_MINUTES) * SLOT_WIDTH;

export const isProgramLive = (program: EPGProgram, now = new Date()) => {
  const start = getTimestamp(program.startTime);
  const end = getTimestamp(program.endTime);
  const nowTime = now.getTime();

  return (
    start !== null &&
    end !== null &&
    Number.isFinite(nowTime) &&
    nowTime >= start &&
    nowTime < end
  );
};

export const isProgramFuture = (program: EPGProgram, now = new Date()) => {
  const start = getTimestamp(program.startTime);
  const nowTime = now.getTime();

  return start !== null && Number.isFinite(nowTime) && start > nowTime;
};

export const formatEPGTime = (value: string) => {
  const timestamp = getTimestamp(value);
  if (timestamp === null) {
    return 'Time unavailable';
  }

  return new Date(timestamp).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const getTimelineSlots = (startTime: string, slotCount: number) => {
  const start = getTimestamp(startTime);
  if (start === null || slotCount <= 0) {
    return [];
  }

  return Array.from({length: slotCount}, (_, index) =>
    new Date(start + index * SLOT_MINUTES * 60000).toISOString(),
  );
};
