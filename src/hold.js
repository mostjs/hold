/** @license MIT License (c) copyright 2015 original author or authors */
/** @author Brian Cavalier */
'use strict';

import MulticastSource from 'most/lib/source/MulticastSource';

// hold :: Stream a -> Stream a
export default stream => new stream.constructor(new MulticastSource(new Hold(stream.source)));

class Hold {
    constructor(source) {
        this.source = source;
        this.time = -Infinity;
        this.value = void 0;
    }

    run(sink, scheduler) {
        if (sink._hold !== this) {
            sink._hold = this;
            sink._holdAdd = sink.add;
            sink.add = holdAdd;

            sink._holdEvent = sink.event;
            sink.event = holdEvent;
        }

        return this.source.run(sink, scheduler);
    }
}

function holdAdd(sink) {
    const len = this._holdAdd(sink);
    if (this._hold.time >= 0) {
        sink.event(this._hold.time, this._hold.value);
    }
    return len;
}

function holdEvent(t, x) {
    if (t >= this._hold.time) {
        this._hold.time = t;
        this._hold.value = x;
    }
    return this._holdEvent(t, x);
}
