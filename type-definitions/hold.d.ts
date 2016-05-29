import {Stream} from "most";

export default function hold<A>(stream: Stream<A>): Stream<A>;
