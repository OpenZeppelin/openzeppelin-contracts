const { makeInterfaceId } = require('../makeInterfaceId');

const OwnableInterfaceId = artifacts.require('OwnableInterfaceId');

require('chai')
  .should();

describe('makeInterfaceId', function () {
  it('calculates the EIP165 interface id from function signatures', async function () {
    const calculator = await OwnableInterfaceId.new();
    const ownableId = await calculator.getInterfaceId();

    makeInterfaceId([
      'owner()',
      'isOwner()',
      'renounceOwnership()',
      'transferOwnership(address)',
    ]).should.equal(ownableId);
  });
});
