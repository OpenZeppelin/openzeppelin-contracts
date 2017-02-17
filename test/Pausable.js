'use strict';

var PausableMock = artifacts.require('helpers/PausableMock.sol');

contract('Pausable', function(accounts) {

  it('can perform normal process in non-emergency', async function() {
    let Pausable = await PausableMock.new();
    let count0 = await Pausable.count();
    assert.equal(count0, 0);

    await Pausable.normalProcess();
    let count1 = await Pausable.count();
    assert.equal(count1, 1);
  });

  it('can not perform normal process in emergency', async function() {
    let Pausable = await PausableMock.new();
    await Pausable.emergencyStop();
    let count0 = await Pausable.count();
    assert.equal(count0, 0);

    await Pausable.normalProcess();
    let count1 = await Pausable.count();
    assert.equal(count1, 0);
  });


  it('can not take drastic measure in non-emergency', async function() {
    let Pausable = await PausableMock.new();
    await Pausable.drasticMeasure();
    let drasticMeasureTaken = await Pausable.drasticMeasureTaken();

    assert.isFalse(drasticMeasureTaken);
  });

  it('can take a drastic measure in an emergency', async function() {
    let Pausable = await PausableMock.new();
    await Pausable.emergencyStop();
    await Pausable.drasticMeasure();
    let drasticMeasureTaken = await Pausable.drasticMeasureTaken();

    assert.isTrue(drasticMeasureTaken);
  });

  it('should resume allowing normal process after emergency is over', async function() {
    let Pausable = await PausableMock.new();
    await Pausable.emergencyStop();
    await Pausable.release();
    await Pausable.normalProcess();
    let count0 = await Pausable.count();

    assert.equal(count0, 1);
  });

});
