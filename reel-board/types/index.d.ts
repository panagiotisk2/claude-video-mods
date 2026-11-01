/** One Reel folder under content/: its post date, name, which steps are done and the next one. */
export type Reel = { date: string; name: string; done: string[]; next: string | null; isCarousel: boolean }

declare module 'claude-code' {
  interface PluginState {
    'reel-board': { reels: Shaped<Reel[]>; checkedAt: number }
  }
}
