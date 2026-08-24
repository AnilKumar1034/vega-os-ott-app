export interface PlayerInterface {
  load(content: unknown, autoplay: boolean): void;
  play(): void;
  pause(): void;
  seekBack(): void;
  seekFront(): void;
  unload(): void;
}
