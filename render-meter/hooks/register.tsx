import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Render } from '../types'

// Render scripts report here, in the project Claude Code is open in (helpers/render_progress.py).
const FILE = '.render-progress.json'
const STALE_MS = 15_000 // no update for this long: the render stopped or crashed
const DONE_SHOWN_MS = 20_000 // keep the finished bar up a little

const render = atom({ plugin: 'render-meter', key: 'render' } as const, null)

function bar(fraction: number, width = 24): string {
  const full = Math.round(Math.min(1, Math.max(0, fraction)) * width)
  return '█'.repeat(full) + '░'.repeat(width - full)
}

function clock(seconds: number): string {
  const s = Math.max(0, Math.round(seconds))
  return s >= 60 ? `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s` : `${s}s`
}

function isOver(r: Render, now: number): boolean {
  const age = now - r.updatedAt
  return r.done >= r.total ? age > DONE_SHOWN_MS : age > STALE_MS
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    let seen = 0
    $.clock.every(1000, async () => {
      const raw = await $.fs.read(FILE).catch(() => undefined)
      const shown = await read($, render)
      if (shown && isOver(shown, await $.clock.now())) await update($, render, () => null)
      if (typeof raw !== 'string') return
      try {
        const r = JSON.parse(raw) as Render
        if (r.updatedAt !== seen && !isOver(r, await $.clock.now())) {
          seen = r.updatedAt
          await update($, render, () => r)
        }
      } catch {
        // a half-written file: the next tick reads it whole
      }
    })
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const r = await read($, render)
    if (!r || e.props.hasSurvey) return next(e)
    const isDone = r.done >= r.total

    const { Box, Text } = $.ui.resolve(e)
    const fraction = r.total > 0 ? r.done / r.total : 0
    const elapsed = (r.updatedAt - r.startedAt) / 1000
    const left = fraction > 0.02 && !isDone ? elapsed / fraction - elapsed : undefined

    return (
      <Box>
        <Text color={isDone ? 'green' : 'yellow'}>{isDone ? 'Rendered' : 'Rendering'} </Text>
        <Text bold>{r.label} </Text>
        <Text color={isDone ? 'green' : 'cyan'}>{bar(fraction)}</Text>
        <Text> {Math.round(fraction * 100)}%</Text>
        <Text dimColor>
          {isDone ? `  in ${clock(elapsed)}` : left !== undefined ? `  about ${clock(left)} left` : '  starting'}
        </Text>
      </Box>
    )
  })
}
