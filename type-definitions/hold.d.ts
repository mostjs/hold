import {Stream, Source, Sink, Scheduler, Disposable} from "most";

export default function hold<A>(stream: Stream<A>): Stream<A>;

export class Hold<T> implements Source<T> {
  protected source: Source<T>;
  protected time: number;
  protected value: T;

  constructor(sources: Source<T>);
  run(sink: Sink<T>, scheduler: Scheduler): Disposable<T>;
}