import { Stream, Sink, ScheduledTask, Time, Scheduler, Disposable } from '@most/types' // eslint-disable-line no-unused-vars
import { MulticastSource } from '@most/core'
import { asap, cancelTask } from '@most/scheduler'

export const hold = <A>(stream: Stream<A>): Stream<A> =>
  new Hold(stream)

type HeldValue<A> = { value: A }

class Hold<A> extends MulticastSource<A> implements Stream<A>, Disposable, Sink<A> {
  private pendingSinks: Sink<A>[] = []
  private held?: HeldValue<A> = undefined
  private task?: ScheduledTask = undefined

  run (sink: Sink<A>, scheduler: Scheduler): Disposable {
    if (this._shouldScheduleFlush()) {
      this._scheduleFlush(sink, scheduler)
    }

    // This also adds the new sink to the internal sinks array.
    // At this point, the sink is in both this.sinks and this.pendingSinks,
    // and later, flushPending will remove it from this.pendingSinks.
    return super.run(sink, scheduler)
  }

  dispose (): void {
    this._cancelTask()
    return super.dispose()
  }

  event (time: Time, value: A): void {
    this.flushPending(time)
    this.held = { value }
    super.event(time, value)
  }

  end (time: Time): void {
    this.flushPending(time)
    super.end(time)
  }

  error (time: Time, err: Error): void {
    this.flushPending(time)
    super.error(time, err)
  }

  flushPending (time: Time): void {
    if (this.pendingSinks.length > 0 && this.held) {
      const pendingSinks = this.pendingSinks
      this.pendingSinks = []

      for (let i = 0; i < pendingSinks.length; ++i) {
        tryEvent(time, this.held.value, pendingSinks[i])
      }
    }
  }

  private _hasValue (): boolean {
    return this.held !== undefined
  }

  private _hasSinks (): boolean {
    return this.sinks.length > 0
  }

  private _shouldScheduleFlush (): boolean {
    return this._hasValue() && this._hasSinks()
  }

  private _scheduleFlush (sink: Sink<A>, scheduler: Scheduler): void {
    this.pendingSinks.push(sink)
    if (this.task) {
      cancelTask(this.task)
    }
    this.task = asap(new HoldTask(this), scheduler)
  }

  private _cancelTask (): void {
    if (this.task) {
      cancelTask(this.task)
      this.task = undefined
    }
  }
}

class HoldTask<A> {
  hold: Hold<A>

  constructor (hold: Hold<A>) {
    this.hold = hold
  }

  run (t: Time): void {
    this.hold.flushPending(t)
  }

  error (t: Time, e: Error): void {
    this.hold.error(t, e)
  }

  dispose (): void {
  }
}

function tryEvent<A> (t: Time, x: A, sink: Sink<A>): void {
  try {
    sink.event(t, x)
  } catch (e) {
    sink.error(t, e)
  }
}
