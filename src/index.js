/** @license MIT License (c) copyright 2015-2016 original author or authors */
/** @author Brian Cavalier */
'use strict'

import { MulticastSource } from '@most/multicast'

// hold :: Stream a -> Stream a
export default stream => new stream.constructor(new MulticastSource(new Hold(stream.source)))

class Hold {
  constructor (source) {
    this.source = source
    this.time = -Infinity
    this.value = void 0
  }

  run (sink, scheduler) {
    /* istanbul ignore else */
    if (sink._hold !== this) {
      sink._hold = this
      sink._holdAdd = sink.add
      sink.add = holdAdd

      sink._holdEvent = sink.event
      sink.event = holdEvent
    }

    return this.source.run(sink, scheduler)
  }
}

function holdAdd (sink) {
  const len = this._holdAdd(sink)
  /* istanbul ignore else */
  if (this._hold.time >= 0) {
    sink.event(this._hold.time, this._hold.value)
  }
  return len
}

function holdEvent (t, x) {
  /* istanbul ignore else */
  if (t >= this._hold.time) {
    this._hold.time = t
    this._hold.value = x
  }
  return this._holdEvent(t, x)
}
