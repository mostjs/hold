import { describe, it } from 'mocha'
import { eq, assert } from '@briancavalier/assert'
import { at, mergeArray, merge, join, map, periodic, runEffects, scan, take, tap, propagateEventTask } from '@most/core'
import { newDefaultScheduler, delay, asap } from '@most/scheduler'
import { hold } from '../src'
// eslint-disable-next-line no-unused-vars
import { Scheduler, Sink, Stream } from '@most/types'

const collect = <A>(stream: Stream<A>, scheduler: Scheduler) => {
  const eventValues: A[] = []
  const collectStream = tap(x => eventValues.push(x), stream)
  return runEffects(collectStream, scheduler)
    .then(() => eventValues)
}

const verifyHold = (f: (stream: Stream<number>, scheduler: Scheduler) => Promise<unknown>) => {
  const scheduler = newDefaultScheduler()
  const s = hold(mergeArray([at(0, 0), at(10, 1), at(20, 2)]))

  const p0 = collect(take(1, s), scheduler)
    .then(events => eq([0], events))

  const p1 = f(s, scheduler)

  return Promise.all([p0, p1])
}

const delayPromise = (time: number): Promise<void> => new Promise(resolve => setTimeout(resolve, time))

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

  it('should deliver most recent event from hot source to late observers ', () => {
    const scheduler = newDefaultScheduler()
    class HotProducer {
      run (sink: Sink<string>, scheduler: Scheduler) {
        return asap(propagateEventTask('foo', sink), scheduler)
      }
    }
    const source = hold(new HotProducer())
    const events: string[] = []
    const collectSink: Sink<string> = {
      event: (time, value) => events.push(value),
      error: e => {
        throw e
      },
      end: () => {}
    }
    const s1 = source.run(collectSink, scheduler)

    return delayPromise(10).then(() => {
      const s2 = source.run(collectSink, scheduler)
      return delayPromise(10).then(() => {
        s1.dispose()
        s2.dispose()
        return eq(events, ['foo', 'foo'])
      })
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

  it('should produce expected events', () => {
    const scheduler = newDefaultScheduler()

    let testHold = hold(scan(x => x + 1, 0, periodic(2)))

    // s1 should see 0 - 4
    const s1 = map(x => `s1${x}`, take(5, testHold))
    // s2 should see 2 - 6
    const s2 = map(x => `s2${x}`, join(at(2, take(5, testHold))))

    return collect(merge(s1, s2), scheduler)
      .then(events => eq(['s10', 's11', 's12', 's22', 's13', 's23', 's14', 's24', 's25', 's26'], events))
  })
})
