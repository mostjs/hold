// @flow
import type { Stream, Sink, ScheduledTask, Time, Scheduler, Disposable } from '@most/types'
import { MulticastSource } from '@most/core'
import { asap, cancelTask } from '@most/scheduler'

export const hold = <A> (stream: Stream<A>): Stream<A> =>
  new Hold(stream)

type HeldValue<A> = { value: A }

class Hold<A> extends MulticastSource<A> {
  pendingSinks: Sink<A>[]
  held: ?HeldValue<A>
  task: ?ScheduledTask

  constructor (source: Stream<A>) {
    super(source)
    this.pendingSinks = []
    this.held = undefined
    this.task = undefined
  }

  run (sink: Sink<A>, scheduler: Scheduler): Disposable {
    if (this._shouldScheduleFlush()) {
      this._scheduleFlush(sink, scheduler)
    }

    return super.run(sink, scheduler)
  }

  _hasValue (): boolean {
    return this.held !== undefined
  }

  _hasSinks (): boolean {
    return this.sinks.length > 0
  }

  _shouldScheduleFlush (): boolean {
    return this._hasValue() && this._hasSinks()
  }

  dispose (): void {
    this._cancelTask()
    return super.dispose()
  }

  event (time: Time, value: A): void {
    const pendingSinks = this._flushPending(time)
    this.sinks = this.sinks.concat(pendingSinks)
    this.held = { value }
    super.event(time, value)
  }

  _flushPending (time: Time): Sink<A>[] {
    const pendingSinks = this.pendingSinks
    this.pendingSinks = []

    if (this.held) {
      for (let i = 0; i < pendingSinks.length; ++i) {
        tryEvent(time, this.held.value, pendingSinks[i])
      }
    }

    return pendingSinks
  }

  _scheduleFlush (sink: Sink<A>, scheduler: Scheduler): void {
    this.pendingSinks.push(sink)
    if (this.task) {
      cancelTask(this.task)
      this.task = asap(new HoldTask(this), scheduler)
    }
  }

  _cancelTask (): void {
    if (this.task) {
      cancelTask(this.task)
      this.task = undefined
    }
  }

  end (time: Time): void {
    this._flushPending(time)
    super.end(time)
  }

  error (time: Time, err: Error): void {
    this._flushPending(time)
    super.error(time, err)
  }
}

class HoldTask<A> {
  hold: Hold<A>

  constructor (hold: Hold<A>) {
    this.hold = hold
  }

  run (t: Time): void {
    this.hold._flushPending(t)
  }

  error (t: Time, e: Error): void {
    this.hold.error(t, e)
  }

  dispose (): void {}
}

function tryEvent <A> (t: Time, x: A, sink: Sink<A>): void {
  try {
    sink.event(t, x)
  } catch (e) {
    sink.error(t, e)
  }
}
