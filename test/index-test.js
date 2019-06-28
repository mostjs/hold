import { describe, it } from 'mocha'
import { eq, assert } from '@briancavalier/assert'
import {
  at,
  mergeArray,
  merge,
  join,
  map,
  periodic,
  runEffects,
  scan,
  take,
  tap,
  propagateEventTask
} from '@most/core'
import { newDefaultScheduler, delay, asap } from '@most/scheduler'
import { hold } from '../src/index'

const collect = (stream, scheduler) => {
  const eventValues = []
  const collectStream = tap(x => eventValues.push(x), stream)
  return runEffects(collectStream, scheduler)
    .then(() => eventValues)
}

const scheduler = newDefaultScheduler()

const verifyHold = f => {
  const s = hold(mergeArray([at(0, 0), at(10, 1), at(20, 2)]))

  const p0 = collect(take(1, s), scheduler)
    .then(events => eq([0], events))

  const p1 = f(s, scheduler)

  return Promise.all([p0, p1])
}

const createCollectSink = out => ({
  event: (time, value) => out.push(value),
  error: e => {
    throw e
  },
  end: () => {}
})

const delayPromise = time => new Promise(resolve => setTimeout(resolve, time))

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

  describe('late observers', () => {
    class Source {
      run (sink, scheduler) {
        if (!this.sent) {
          // this imitates any hot source which emits the first value and then hangs so that it doesn't resend the value on rerun
          this.sent = true
          return asap(propagateEventTask('foo', sink), scheduler)
        }
        return {
          dispose () {}
        }
      }
    }

    const test = (source, expected) => {
      const events = []
      const sink = createCollectSink(events)
      const s1 = source.run(sink, scheduler)
      return delayPromise(10).then(() => {
        const s2 = source.run(sink, scheduler)
        return delayPromise(10).then(() => {
          s1.dispose()
          s2.dispose()
          return eq(events, expected)
        })
      })
    }

    it('should emit a single event without hold for two observers', () => {
      return test(new Source(), ['foo'])
    })

    it('should emit two events with hold for two observers', () => {
      return test(hold(new Source()), ['foo', 'foo'])
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
