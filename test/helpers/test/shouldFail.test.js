const shouldFail = require('../shouldFail');
const Reverter = artifacts.require('Reverter');

const should = require('chai').should();

describe('shouldFail', function() {
    beforeEach(async function () {
        this.reverter = await Reverter.new();
    });

    describe('withMessage', function() {
        it('Excepts VM revert message to include revert reason', function() {
            shouldFail.withMessage(this.reverter.requiresTrue(false), 'Passed argument must be true')
        })
    })
})

