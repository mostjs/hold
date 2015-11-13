/** @license MIT License (c) copyright 2015 original author or authors */
/** @author Brian Cavalier */
'use strict';

import MulticastSource from 'most/lib/source/MulticastSource';

// hold :: Stream a -> Stream a
export default stream => new stream.constructor(new Hold(stream.source));

class Hold extends MulticastSource {
	constructor(source) {
		super(source);
		this.time = -Infinity;
		this.value = void 0;
		this.held = false;
	}

	add(sink) {
		super.add(sink);
		if(this.held) {
			sink.event(this.time, this.value);
		}
		return len;
	}

	event(t, x) {
		if(t >= this.time) {
			this.time = t;
			this.value = x;
			this.held = true;
		}
		super.event(t, x);
	}
}
