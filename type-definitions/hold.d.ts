import { Stream } from "@most/types";

export function hold<A>(stream: Stream<A>): Stream<A>;
