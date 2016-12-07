import {Stream} from "most";

function hold<A>(stream: Stream<A>): Stream<A>;

export = hold;