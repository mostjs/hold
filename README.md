# @most hold()

Deliver the most recently seen event to each new observer the instant it begins observing.  A held stream is always multicast.

**Note**: `@most/hold` >= 3.0.0 is compatible with [`@most/core`](http://mostcore.readthedocs.io/en/latest/).  Use `@most/hold` 2.x for compatibility with [`most`](https://github.com/cujojs/most/releases) 1.x.

## Install

`npm install --save @most/hold`

## Usage

```js
import { click } from '@most/dom-event'
import { map } from '@most/core'
import { hold } from '@most/hold'

const clickCoords = map(e => ({ x: e.clientX, y: clientY }), click(document))

// start holding on first subscription
const heldCoords = hold(clickCoords)
```

## API

### hold :: Stream a &rarr; Stream a

Given an input stream:

```
stream:    -a---b---c---d->
```

observers which begin observing at different times will see:

```
observer1: -a---b---c---d->
observer2:    a-b---c---d->
observer3:           c--d->
```
