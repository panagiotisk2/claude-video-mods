/** Paid calls the person unlocked with /approve-credits: how many, until when (ms since the epoch). */
export type Allowance = { calls: number; until: number }

declare module 'claude-code' {
  interface PluginState {
    'credit-guard': { allowance: Allowance }
  }
}
