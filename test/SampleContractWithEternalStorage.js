'use strict';

import expectThrow from './helpers/expectThrow';
let EternalStorage = artifacts.require('../contracts/data/EternalStorage.sol');
let SampleContract = artifacts.require('../contracts/examples/SampleContractWithEternalStorage.sol');

contract('SampleContractWithEternalStorage', function (accounts) {
  let sample;
  let storage;

  beforeEach(async function () {
    storage = await EternalStorage.new();
    sample = await SampleContract.new(storage.address);
  });

  it('should start with a count of 0', async function () {
    let value = await sample.getValue();

    assert.equal(value.toNumber(), 0);
  });
  
  it('should fail to write to eternalStorage', async function () {
    await expectThrow(sample.incrementValue());
  })

  it('should set value to 1', async function () {
    await storage.transferOwnership(sample.address);
    await sample.incrementValue();
    let value = await sample.getValue();
    assert.equal(value.toNumber(), 1);
  });

});
