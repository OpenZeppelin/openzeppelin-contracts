const { expectThrow } = require('../helpers/expectThrow');

const Ownable = artifacts.require('Ownable');
const HasNoContracts = artifacts.require('HasNoContracts');

contract('HasNoContracts', function (accounts) {
  let hasNoContracts = null;
  let ownable = null;

  beforeEach(async () => {
    // Create contract and token
    hasNoContracts = await HasNoContracts.new();
    ownable = await Ownable.new();

    // Force ownership into contract
    await ownable.transferOwnership(hasNoContracts.address);
    const owner = await ownable.owner();
    assert.equal(owner, hasNoContracts.address);
  });

  it('should allow owner to reclaim contracts', async function () {
    await hasNoContracts.reclaimContract(ownable.address);
    const owner = await ownable.owner();
    assert.equal(owner, accounts[0]);
  });

  it('should allow only owner to reclaim contracts', async function () {
    await expectThrow(
      hasNoContracts.reclaimContract(ownable.address, { from: accounts[1] }),
    );
  });
});
