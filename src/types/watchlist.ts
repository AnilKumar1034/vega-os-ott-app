export interface WatchlistItem {
  contentId: string;
  title: string;
  image?: string;
  type?: string;
  genre?: string;
  addedAt: string;
}

export interface AddToWatchlistInput {
  contentId: string;
  title: string;
  image?: string;
  type?: string;
  genre?: string;
}
