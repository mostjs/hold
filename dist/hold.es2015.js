import { MulticastSource } from '@most/multicast';

// hold :: Stream a -> Stream a
function index (stream) { return new stream.constructor(new MulticastSource(new Hold(stream.source))); }

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

export default index;
//# sourceMappingURL=hold.es2015.js.map