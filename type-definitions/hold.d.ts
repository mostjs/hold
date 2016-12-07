import {Stream} from "most";

export function hold<A>(stream: Stream<A>): Stream<A>;
