(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@most/multicast')) :
  typeof define === 'function' && define.amd ? define(['exports', '@most/multicast'], factory) :
  factory((global.mostHold = {}),global._most_multicast);
}(this, function (exports,_most_multicast) { 'use strict';

  // hold :: Stream a -> Stream a
  var hold = function (stream) { return new stream.constructor(new _most_multicast.MulticastSource(new Hold(stream.source))); }

  var Hold = function Hold (source) {
    this.source = source
    this.time = -Infinity
    this.value = void 0
  };

  Hold.prototype.run = function run (sink, scheduler) {
    /* istanbul ignore else */
    if (sink._hold !== this) {
      sink._hold = this
      sink._holdAdd = sink.add
      sink.add = holdAdd

      sink._holdEvent = sink.event
      sink.event = holdEvent
    }

    return this.source.run(sink, scheduler)
  };

  function holdAdd (sink) {
    var len = this._holdAdd(sink)
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

  exports.hold = hold;
  exports.Hold = Hold;

}));
//# sourceMappingURL=hold.js.map