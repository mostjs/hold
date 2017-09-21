/** @license MIT License (c) copyright 2015-2017 original author or authors */

import { MulticastSource, propagateEndTask, propagateErrorTask, propagateEventTask, propagateTask } from '@most/core'
import { disposeBoth, disposeNone, disposeOnce } from '@most/disposable'

import { asap } from '@most/scheduler'

// hold :: Stream a -> Stream a
export const hold = stream => new Hold(stream)

class Hold extends MulticastSource {
  constructor (source) {
    super(source)
    this.time = -Infinity
    this.value = void 0
  }

  run (sink, scheduler) {
    const [n, disposable] = this.addSink(sink, scheduler)

    if (n === 1) {
      this.disposable = this.source.run(this, scheduler)
    }

    return disposeBoth(disposeOnce(new HoldDisposable(this, sink)), disposable)
  }

  addSink (sink, scheduler) {
    const holdSink = new HoldSink(sink, this)

    const hasValue = this.time >= 0

    if (!hasValue) holdSink.heldValueEmitted = true

    const disposable = hasValue
      ? disposeBoth(asap(propagateTask(runHeldEvent, this.value, holdSink), scheduler), holdSink)
      : holdSink

    const length = super.add(holdSink)

    return [length, disposable]
  }

  event (time, value) {
    /* istanbul ignore else */
    if (time >= this.time) {
      this.time = time
      this.value = value
    }

    return super.event(time, value)
  }
}

function runHeldEvent (time, value, holdSink) {
  holdSink.heldValueEmitted = true
  holdSink.event(time, value)
}

class HoldDisposable {
  constructor (source, sink) {
    this.source = source
    this.sink = sink
  }

  dispose () {
    if (this.source.remove(this.sink) === 0) {
      this.source.dispose()
    }
  }
}

class HoldSink {
  constructor (sink, hold) {
    this.sink = sink
    this.hold = hold
    this.heldValueEmitted = false
    this.disposable = disposeNone()
  }

  event (time, value) {
    const task = propagateEventTask(value, this.sink)

    this.emitHeldValue(time, task)
  }

  error (time, error) {
    const task = propagateErrorTask(error, this.sink)

    this.emitHeldValue(time, task)
  }

  end (time) {
    const task = propagateEndTask(this.sink)

    this.emitHeldValue(time, task)
  }

  dispose () {
    this.disposable.dispose()
  }

  emitHeldValue (time, task) {
    const { hold, sink } = this

    const hasValue = hold.time >= 0

    const shouldEmitSynchronously = hasValue || this.holdValueEmitted

    if (shouldEmitSynchronously) {
      return task.run(time)
    }

    if (!this.heldValueEmitted) {
      sink.event(hold.time, hold.value)
      this.holdValueEmitted = true
    }

    this.disposable = asap(task, sink)
  }
}
