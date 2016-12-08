import {Stream, Source, Sink, Scheduler, Disposable} from "most";

export function hold<A>(stream: Stream<A>): Stream<A>;