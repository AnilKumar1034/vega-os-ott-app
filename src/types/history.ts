export interface ViewingHistoryItem {
  contentId: string;
  title: string;
  image?: string;
  type?: string;
  genre?: string;
  lastWatchedAt: string;
  watchCount: number;
}

export interface RecordHistoryInput {
  contentId: string;
  title: string;
  image?: string;
  type?: string;
  genre?: string;
}
