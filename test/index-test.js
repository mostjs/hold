import { assert, eq } from '@briancavalier/assert'
import { at, chain, mergeArray, periodic, runEffects, scan, take, tap } from '@most/core'
import { describe, it } from 'mocha'

import { hold } from '../src/index'
import { newDefaultScheduler } from '@most/scheduler'

export const drain = s => runEffects(s, newDefaultScheduler())

export const collect = s => {
  const into = []
  return drain(tap(x => into.push(x), s)).then(() => into)
}

describe('hold', () => {
  it('should deliver most recent event to new observer', () => {
    const s = hold(mergeArray([at(0, 0), at(10, 1), at(20, 2)]))
    return collect(chain(_ => s, take(1, s)))
      .then(eq([0, 1, 2]))
  })

  it(`does not emit on the same tick as run`, () => {
    const stream = hold(scan(x => x + 1, 0, periodic(5)))
    const scheduler = newDefaultScheduler()
    const drain = s => runEffects(s, scheduler)

    return drain(take(1, stream)).then(() => {
      let called = false

      stream.run(
        {
          event () {
            called = true
          },
          error () {},
          end () {}
        },
        scheduler
      )

      assert(!called)

      return Promise.resolve().then(() => assert(called))
    })
  })
})
