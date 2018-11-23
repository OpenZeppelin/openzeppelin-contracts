const shouldFail = require('../shouldFail');
const RequireWithReason = artifacts.require('Reverter');

const should = require('chai').should();

describe.only('shouldFail', function() {
    beforeEach(async function () {
        this.reverter = await Reverter.new();
    });
    // describe('withMessage');
    // describe('reverting');
    // describe('throwing');
    describe('outOfGas', function() {

    });
})

