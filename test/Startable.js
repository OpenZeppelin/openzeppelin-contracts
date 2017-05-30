'use strict';

const assertJump = require('./helpers/assertJump');
const StartableMock = artifacts.require('helpers/StartableMock.sol');

contract('Startable', function(accounts) {

    it('can perform normal process in non-pause', async function() {
        let Startable = await StartableMock.new();
        let count0 = await Startable.count();
        assert.equal(count0, 0);

        await Startable.start();

        await Startable.normalProcess();
        let count1 = await Startable.count();
        assert.equal(count1, 1);
    });

    it('can not perform normal process in pause', async function() {
        let Startable = await StartableMock.new();
        let count0 = await Startable.count();
        assert.equal(count0, 0);

        try {
            await Startable.normalProcess();
        } catch(error) {
            assertJump(error);
        }
        let count1 = await Startable.count();
        assert.equal(count1, 0);
    });


    it('can not take drastic measure in non-pause', async function() {
        let Startable = await StartableMock.new();
        await Startable.start();
        try {
            await Startable.drasticMeasure();
        } catch(error) {
            assertJump(error);
        }

        const drasticMeasureTaken = await Startable.drasticMeasureTaken();
        assert.isFalse(drasticMeasureTaken);
    });

    it('can take a drastic measure in a pause', async function() {
        let Startable = await StartableMock.new();
         await Startable.drasticMeasure();
        let drasticMeasureTaken = await Startable.drasticMeasureTaken();

        assert.isTrue(drasticMeasureTaken);
    });

    it('should resume allowing normal process after pause is over', async function() {
        let Startable = await StartableMock.new();
        await Startable.start();
        await Startable.normalProcess();
        let count0 = await Startable.count();
        assert.equal(count0, 1);
    });

});
