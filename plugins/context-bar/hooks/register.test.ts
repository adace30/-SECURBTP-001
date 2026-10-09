import { expect, test } from 'claude-code/testing'

import { line, tokensOf } from './register'

test('barre verte, cumul et coût en euros', () => {
  const text = line({ tokens: 50_000, window: 200_000, percent: 25 }, 1_234_567, { usd: 2 }, 0.86)
  expect(text).toBe(
    `Contexte ${'🟩'.repeat(5)}${'⬜'.repeat(15)} 25% · 50.0k / 200.0k · cumul 1.23M tokens · 1,72 €`,
  )
})

test('avant la première réponse, sans coût', () => {
  expect(line({ window: 1_000_000 }, 0, undefined, 0.86)).toBe(
    `Contexte ${'⬜'.repeat(20)} 0% · 0 / 1.00M · cumul 0 tokens`,
  )
})

test('le cumul compte entrée, cache et sortie', () => {
  expect(
    tokensOf({ input_tokens: 10, cache_read_input_tokens: 1000, cache_creation_input_tokens: 100, output_tokens: 5 }),
  ).toBe(1115)
})
