import { describe, it } from 'mocha'
import { eq, assert } from '@briancavalier/assert'
import { newDefaultScheduler, delay, asap } from '@most/scheduler'
import { hold } from '../src'
// eslint-disable-next-line no-unused-vars
import { Scheduler, Sink, Stream, Time } from '@most/types'
import {
  at,
  combineArray,
  mergeArray,
  merge,
  join,
  map,
  periodic,
  runEffects,
  scan,
  switchLatest,
  take,
  tap,
  propagateEventTask
} from '@most/core'

const collect = <A>(stream: Stream<A>, scheduler: Scheduler): Promise<ReadonlyArray<A>> => {
  const eventValues: A[] = []
  const collectStream = tap(x => eventValues.push(x), stream)
  return runEffects(collectStream, scheduler)
    .then(() => eventValues)
}

const verifyHold = <A>(f: (stream: Stream<number>, scheduler: Scheduler) => Promise<A>): Promise<[ReadonlyArray<number>, A]> => {
  const scheduler = newDefaultScheduler()
  const s = hold(mergeArray([at(0, 0), at(10, 1), at(20, 2)]))

  const p0 = collect(take(1, s), scheduler)
    .then(events => eq([0], events))

  const p1 = f(s, scheduler)

  return Promise.all([p0, p1])
}

const createCollectSink = <A>(out: A[]): Sink<A> => ({
  event: (_time: Time, value: A) => out.push(value),
  error: (_time: Time, e: Error) => {
    throw e
  },
  end: () => {}
})

const delayPromise = (time: number): Promise<void> => new Promise(resolve => setTimeout(resolve, time))

describe('hold', () => {
  it('should deliver most recent event to new observer', () => {
    return verifyHold((stream, scheduler) => {
      return new Promise((resolve, reject) => {
        delay(5, {
          run () {
            resolve(collect(stream, scheduler))
          },
          error (_t, e) {
            reject(e)
          },
          dispose () {}
        }, scheduler)
      }).then(events => eq([0, 1, 2], events))
    })
  })

  describe('late observers ', () => {
    class Source {
      private sent = false;
      run (sink: Sink<string>, scheduler: Scheduler) {
        if (!this.sent) {
          this.sent = true
          return asap(propagateEventTask('foo', sink), scheduler)
        }
        return {
          dispose () {}
        }
      }
    }

    const test = <A>(source: Stream<A>, expected: A[]): Promise<ReadonlyArray<A>> => {
      const scheduler = newDefaultScheduler()
      const events: A[] = []
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

    it('shall pass', () => {
      const hos: Stream<Stream<string>[]> = scan(
        (acc: Stream<string>[], _s: void) =>
          acc.concat([hold(new Source())]),
        [],
        take(2, periodic(3))
      )
      const flat: Stream<string> = switchLatest(
        map(arr => combineArray(
          (...a: string[]) => a.join(' '),
          arr
        ), hos)
      )

      const scheduler = newDefaultScheduler()
      return collect(flat, scheduler).then(
        events => eq(['foo', 'foo foo'], events)
      )
    })
  })

  it(`should not propagate held event during the same tick as run`, () => {
    return verifyHold((stream, scheduler) => {
      return new Promise((resolve, reject) => {
        delay(5, {
          run () {
            let called = false
            runEffects(tap(_ => { called = true }, stream), scheduler)
            resolve(assert(!called))
          },
          error (_t, e) {
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
