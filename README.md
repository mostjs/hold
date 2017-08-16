# @most hold()

Deliver the most recently seen event to each new observer the instant it begins observing.  A held stream is always multicast.

## Install

`npm install --save @most/hold`

## Usage

```js
import { fromEvent } from 'most'
import { hold } from '@most/hold'

// start holding on first subscription
const clickStream = fromEvent('click', document)
  .map(e => ({ x: e.clientX, y: clientY }))
  .thru(hold)

// hold the latest event even before the first subscription
clickStream.drain();
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
