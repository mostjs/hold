'use strict';

import assert from 'assert';
import { periodic } from 'most';
import hold from '../src/hold';

describe('hold', () => {
    it('should return stream of same type', () => {
        class Stream {
            constructor() {
                this.source = {};
            }
        }

        const s = hold(new Stream());
        assert(s instanceof Stream);
    });

    it('should deliver most recent event to new observer', () => {
        const s = hold(periodic(10, 1).scan((z, x) => z+x, 0));
        //return s.take(1).observe(x => console.log(x));
        return s.take(1).flatMap(_ => s.take(3))
            .reduce((a, x) => a.concat(x), [])
            .then(a => assert.deepEqual([0,1,2], a));
    });
});
