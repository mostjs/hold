import { MulticastSource } from '@most/core'
import { asap, cancelTask } from '@most/scheduler'

export const hold = stream =>
  new Hold(stream)

export class Hold extends MulticastSource {
  constructor (source) {
    super(source)
    this.hasValue = false
    this.value = undefined
    this.pendingSinks = []
    this.task = undefined
  }

  run (sink, scheduler) {
    if (this.hasValue && this.sinks.length > 0) {
      this._scheduleFlush(sink, scheduler)
    }

    return super.run(sink, scheduler)
  }

  dispose () {
    this._cancelTask()
    return super.dispose()
  }

  event (time, value) {
    this.hasValue = true
    this.value = value
    const pendingSinks = this._flushPending(time)
    super.event(time, value)
    this.sinks = this.sinks.concat(pendingSinks)
  }

  _flushPending (time) {
    const pendingSinks = this.pendingSinks
    this.pendingSinks = []
    for (let i = 0; i < pendingSinks.length; ++i) {
      tryEvent(time, this.value, pendingSinks[i])
    }
    return pendingSinks
  }

  _scheduleFlush (sink, scheduler) {
    this.pendingSinks.push(sink)
    if (!this.task) {
      cancelTask(this.task)
      this.task = asap(new HoldTask(this), scheduler)
    }
  }

  _cancelTask () {
    if (this.task) {
      cancelTask(this.task)
      this.task = undefined
    }
  }

  end (time) {
    this._flushPending(time)
    super.end(time)
  }

  error (time, err) {
    this._flushPending(time)
    super.error(time, err)
  }
}

class HoldTask {
  constructor (hold) {
    this.hold = hold
  }

  run (t) {
    this.hold._flushPending(t)
  }

  error (t, e) {
    this.hold.error(t, e)
  }

  dispose () {}
}

function tryEvent (t, x, sink) {
  try {
    sink.event(t, x)
  } catch (e) {
    sink.error(t, e)
  }
}
