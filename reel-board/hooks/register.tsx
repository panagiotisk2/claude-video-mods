import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Reel } from '../types'

// one folder per Reel, named YYYY-MM-DD-<name>, in the project Claude Code is open in
const CONTENT = 'content'
const PANE = 'reel-board'
const STEPS = ['script', 'voice', 'avatar', 'edit', 'approved', 'caption', 'link'] as const
const CAROUSEL_STEPS = ['script', 'slides', 'approved', 'caption', 'link'] as const
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const reels = atom({ plugin: 'reel-board', key: 'reels' } as const, [], { shape: 'reels-1' })
const checkedAt = atom({ plugin: 'reel-board', key: 'checkedAt' } as const, 0)

type Files = { names: string[]; notes: string }

async function look($: any, dir: string): Promise<Files> {
  const names: string[] = []
  for (const sub of ['', '/edit', '/voice', '/avatar', '/slides']) {
    const list = await $.fs.list(dir + sub).catch(() => [])
    for (const entry of list) names.push(`${sub.slice(1)}/${entry.name}`.replace(/^\//, ''))
  }
  const notes = await $.fs.read(`${dir}/NOTES.md`).catch(() => '')
  return { names, notes: typeof notes === 'string' ? notes : '' }
}

function stepsOf({ names, notes }: Files): { done: string[]; isCarousel: boolean } {
  const has = (re: RegExp) => names.some(n => re.test(n))
  const isCarousel = has(/^slides\//) && !has(/\.mp4$/)
  const done: string[] = []
  if (has(/^(script|dialogue|lyrics|post_copy)\.txt$/)) done.push('script')
  if (has(/^(voice|edit)\/(voice|dialogue)[^/]*\.(wav|mp3)$/) || has(/^voice\/.+\.(wav|mp3)$/)) done.push('voice')
  if (has(/^avatar\/.+\.mp4$/) || has(/^edit\/avatar[^/]*\.mp4$/) || /avatar[^\n]*heygen (video )?[0-9a-f]{32}/i.test(notes)) done.push('avatar')
  if (has(/^(edit\/)?reel[^/]*\.mp4$/)) done.push('edit')
  if (isCarousel && has(/^slides\/.+\.png$/)) done.push('slides')
  if (/reel[^\n]{0,60}approved|approved[^\n]{0,60}reel|user approved|approved the reel/i.test(notes)) done.push('approved')
  if (has(/^caption\.txt$/)) done.push('caption')
  if (/short link[^\n]{0,80}created|aimaverick\.link\/[\w-]+ created/i.test(notes)) done.push('link')
  return { done, isCarousel }
}

async function scan($: any): Promise<Reel[]> {
  const out: Reel[] = []
  const list = await $.fs.list(CONTENT).catch(() => [])
  for (const entry of list) {
    const m = /^(\d{4})-(\d{2})-(\d{2})-(.+)$/.exec(entry.name)
    if (entry.kind !== 'dir' || !m) continue
    const files = await look($, `${CONTENT}/${entry.name}`)
    const found = stepsOf(files)
    const steps: readonly string[] = found.isCarousel ? CAROUSEL_STEPS : STEPS
    // a later step done means the earlier ones are behind it (a Reel without an avatar still has its voice and edit)
    const furthest = Math.max(-1, ...found.done.map(d => steps.indexOf(d)))
    const done = steps.filter((st, i) => i <= furthest || found.done.includes(st))
    out.push({
      date: `${m[1]}-${m[2]}-${m[3]}`,
      name: m[4].replace(/-/g, ' '),
      done,
      next: steps.find(st => !done.includes(st)) ?? null,
      isCarousel: found.isCarousel,
    })
  }
  return out.sort((a, b) => a.date.localeCompare(b.date))
}

async function refresh($: any) {
  await update($, reels, () => [] as Reel[])
  const found = await scan($)
  await update($, reels, () => found)
  const now: number = await $.clock.now()
  await update($, checkedAt, () => now)
}

function day(date: string): string {
  const [, mm, dd] = date.split('-')
  return `${dd} ${MONTHS[Number(mm) - 1]}`
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'reels', description: 'Show every Reel in the project and the step it is on' })
    return next(e)
  })

  on('command.run', { command: 'reels' }, async $ => {
    await refresh($)
    await $.ui.open({ id: PANE, title: 'Reel Board' })
    return { text: 'Reel Board opened.' }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const list = await read($, reels)
    const today = new Date(await $.clock.now()).toISOString().slice(0, 10)
    const upcoming = list.filter(r => r.date >= today)
    const ready = upcoming.filter(r => r.next === null).length

    return (
      <Box flexDirection="column">
        <Box>
          <Text bold>{upcoming.length} Reels coming up  </Text>
          <Text color="green">{ready} ready  </Text>
          <Button key="refresh" label="Refresh" onPress={() => refresh($)} />
        </Box>
        <Text> </Text>
        {upcoming.map(r => {
          const steps: readonly string[] = r.isCarousel ? CAROUSEL_STEPS : STEPS
          return (
            <Box key={r.date + r.name} flexDirection="column">
              <Box>
                <Text dimColor>{day(r.date)}  </Text>
                <Text bold={r.next !== null} color={r.next === null ? 'green' : undefined}>{r.name}</Text>
              </Box>
              <Box>
                <Text>        </Text>
                {steps.map(st => (
                  <Text key={st} color={r.done.includes(st) ? 'green' : undefined} dimColor={!r.done.includes(st)}>
                    {r.done.includes(st) ? '● ' : '○ '}
                  </Text>
                ))}
                <Text color={r.next === null ? 'green' : 'yellow'}>{r.next === null ? 'ready to post' : `next: ${r.next}`}</Text>
              </Box>
            </Box>
          )
        })}
      </Box>
    )
  })
}
