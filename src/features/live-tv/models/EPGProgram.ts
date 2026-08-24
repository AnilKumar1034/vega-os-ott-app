export interface EPGProgram {
  id: string;
  channelId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  category?: string;
  image?: string;
  logo?: string;
}
