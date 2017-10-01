// @flow
import { describe, it } from 'mocha'
import { eq, assert } from '@briancavalier/assert'
import { at, mergeArray, runEffects, take, tap } from '@most/core'
import { newDefaultScheduler, delay } from '@most/scheduler'
import { hold } from '../src/index'

const collect = (stream, scheduler) => {
  const into = []
  const collectStream = tap(x => into.push(x), stream)
  return runEffects(collectStream, scheduler)
    .then(() => into)
}

const verifyHold = f => {
  const scheduler = newDefaultScheduler()
  const s = hold(mergeArray([at(0, 0), at(10, 1), at(20, 2)]))

  const p0 = collect(take(1, s), scheduler)
    .then(events => eq([0], events))

  const p1 = f(s, scheduler)

  return Promise.all([p0, p1])
}

describe('hold', () => {
  it('should deliver most recent event to new observer', () => {
    return verifyHold((stream, scheduler) => {
      return new Promise((resolve, reject) => {
        delay(5, {
          run (t) {
            resolve(collect(stream, scheduler))
          },
          error (t, e) {
            reject(e)
          },
          dispose () {}
        }, scheduler)
      }).then(events => eq([0, 1, 2], events))
    })
  })

  it(`should not propagate held event during the same tick as run`, () => {
    return verifyHold((stream, scheduler) => {
      return new Promise((resolve, reject) => {
        delay(5, {
          run (t) {
            let called = false
            runEffects(tap(_ => { called = true }, stream), scheduler)
            resolve(assert(!called))
          },
          error (t, e) {
            reject(e)
          },
          dispose () {}
        }, scheduler)
      })
    })
  })
})
