import { describe, it } from 'mocha'
import { eq } from '@briancavalier/assert'
import { at, chain, mergeArray, runEffects, take, tap } from '@most/core'
import { hold } from '../src/index'
import { newDefaultScheduler } from '@most/scheduler'

export const drain = s => runEffects(s, newDefaultScheduler())

export const collect = s => {
  const into = []
  return drain(tap(x => into.push(x), s)).then(() => into)
}

describe('hold', () => {
  it('should deliver most recent event to new observer', () => {
    const s = hold(mergeArray([at(0, 0), at(1, 1), at(2, 2)]))
    return collect(chain(_ => s, take(1, s)))
      .then(eq([0, 1, 2]))
  })
})
