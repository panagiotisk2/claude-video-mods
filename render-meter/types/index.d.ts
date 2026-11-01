/** What a render script writes to .render-progress.json (tools/render_progress.py). */
export type Render = { label: string; done: number; total: number; startedAt: number; updatedAt: number }

declare module 'claude-code' {
  interface PluginState {
    'render-meter': { render: Render | null }
  }
}
