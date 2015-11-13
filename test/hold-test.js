'use strict';

import assert from 'assert';
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
});
