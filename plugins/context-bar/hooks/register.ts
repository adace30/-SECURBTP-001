import type { ModelUsage, Register, SessionContextUsage, SessionCost } from 'claude-code'

const CELLS = 20
const TOTAL = { plugin: 'context-bar', key: 'total' } as const

const formatTokens = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`

const formatEur = (eur: number) => `${eur.toFixed(2).replace('.', ',')} €`

// Tokens a model call processed: what it read (cached or not) and what it wrote.
export const tokensOf = (usage: ModelUsage) =>
  usage.input_tokens + usage.cache_read_input_tokens + usage.cache_creation_input_tokens + usage.output_tokens

export const line = (context: SessionContextUsage, total: number, cost: SessionCost | undefined, eurPerUsd: number) => {
  const tokens = context.tokens ?? 0
  const percent = context.percent ?? (context.window > 0 ? Math.round((tokens / context.window) * 100) : 0)
  const filled = Math.min(CELLS, Math.round((percent / 100) * CELLS))
  const bar = '🟩'.repeat(filled) + '⬜'.repeat(CELLS - filled)
  const eur = cost === undefined ? '' : ` · ${formatEur(cost.usd * eurPerUsd)}`

  return `Contexte ${bar} ${percent}% · ${formatTokens(tokens)} / ${formatTokens(context.window)} · cumul ${formatTokens(total)} tokens${eur}`
}

export const register: Register = (on, options) => {
  const eurPerUsd = typeof options.eurPerUsd === 'number' ? options.eurPerUsd : 0.86

  on('session.start', async ($, e, next) => {
    const result = await next(e)
    const [{ context, cost }, { value: total = 0 }] = await Promise.all([$.session.usage(), $.state.get(TOTAL)])
    $.ui.status(line(context, total, cost, eurPerUsd))

    return result
  })

  on('turn.complete', async ($, e, next) => {
    const result = await next(e)

    if (e.usage !== undefined) {
      const { value: total = 0 } = await $.state.get(TOTAL)
      await $.state.set(TOTAL, total + tokensOf(e.usage))
    }

    return result
  })

  on('session.measure', async ($, e, next) => {
    const { value: total = 0 } = await $.state.get(TOTAL)
    $.ui.status(line(e.context, total, e.cost, eurPerUsd))

    return next(e)
  })
}
