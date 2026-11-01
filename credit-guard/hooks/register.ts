import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

// Paid tools by name. Connector ids differ per person, so the service is told from the tool's own name.
const HIGGSFIELD =
  /^(generate_(video|image|audio|3d)(_batch)?|motion_control|ads_studio_generate|ai_influencer_generate|execute_preset|upscale_(image|video)|outpaint_image|reframe|voice_change|dubbing|remove_background|scene_builder_3d_generate_\w+)$/
const HEYGEN =
  /^(create_video_(from_avatar|from_image|from_cinematic_avatar|from_studio|agent|batch|translation(_batch)?)|create_lipsync(_batch)?|image_to_video|text_to_video|reference_to_video|generate_from_template|create_photo_avatar|create_image_generation|create_ai_clipping)$/

function serviceOf(server: string, action: string): string | undefined {
  if (HIGGSFIELD.test(action) && !HEYGEN.test(action)) return /heygen/i.test(server) ? 'HeyGen' : 'Higgsfield'
  if (HEYGEN.test(action)) return 'HeyGen'
  return undefined
}

const WINDOW_MS = 5 * 60_000

// A tool.check "ask" was approved silently in the desktop app (1 Nov), so the guard denies instead and the person unlocks
// the next paid call with /approve-credits.
const allowance = atom({ plugin: 'credit-guard', key: 'allowance' } as const, { calls: 0, until: 0 })

// Higgsfield's tools take their settings as `params`, an object or a JSON string
function paramsOf(args: Record<string, unknown>): Record<string, unknown> {
  let p = args.params
  if (typeof p === 'string') {
    try {
      p = JSON.parse(p)
    } catch {
      p = undefined
    }
  }
  return (typeof p === 'object' && p !== null ? p : args) as Record<string, unknown>
}

function describe(service: string, action: string, input: unknown): string {
  const args = (input ?? {}) as Record<string, unknown>
  const params = paramsOf(args)
  const model = params.model ?? params.model_id ?? params.modelId ?? args.avatar_id ?? args.look_id
  const parts = [`${service}: ${action.replace(/_/g, ' ')}`]
  if (typeof model === 'string') parts.push(`${model}`)
  if (params.duration !== undefined) parts.push(`${params.duration} s`)
  if (typeof params.resolution === 'string') parts.push(params.resolution)
  if (Array.isArray(params.jobs)) parts.push(`${params.jobs.length} jobs`)
  return parts.join(', ')
}

function isQuote(input: unknown): boolean {
  const args = (input ?? {}) as Record<string, unknown>
  const params = paramsOf(args)
  return params.get_cost === true || args.get_cost === true
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'approve-credits', description: 'Let Claude run the next paid Higgsfield or HeyGen job (within 5 minutes)' })
    return next(e)
  })

  on('command.run', { command: 'approve-credits' }, async $ => {
    const until = (await $.clock.now()) + WINDOW_MS
    await update($, allowance, a => ({ calls: a.calls + 1, until }))
    $.ui.status('Credit Guard: 1 paid job approved')
    return { text: 'Credit Guard: the next paid Higgsfield or HeyGen job may run (for 5 minutes). Tell Claude to go ahead.' }
  })

  on('tool.call', async ($, e, next) => {
    const match = /^mcp__(.+?)__(.+)$/.exec(e.tool)
    const service = match ? serviceOf(match[1], match[2]) : undefined
    // a tool call carries its arguments as its own fields (e.params, e.duration, ...)
    if (!match || !service || isQuote(e)) return next(e)

    const what = describe(service, match[2], e)
    const a = await read($, allowance)
    if (a.calls > 0 && a.until > (await $.clock.now())) {
      await update($, allowance, x => ({ ...x, calls: x.calls - 1 }))
      $.ui.status(undefined)
      return next(e)
    }
    $.ui.toast(`Credit Guard stopped a paid job. ${what}`)
    $.ui.status(`Credit Guard: waiting for /approve-credits (${what})`)
    return {
      deny: `Credit Guard stopped this: it spends ${service} credits (${what}). Nothing ran. Ask the user; they approve it by typing /approve-credits, then try again.`,
    }
  })
}
