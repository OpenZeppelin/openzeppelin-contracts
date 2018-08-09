const { expectThrow } = require('../helpers/expectThrow');

const Ownable = artifacts.require('Ownable');
const HasNoContracts = artifacts.require('HasNoContracts');

contract('HasNoContracts', function ([_, owner, anyone]) {
  let hasNoContracts = null;
  let ownable = null;

  beforeEach(async () => {
    // Create contract and token
    hasNoContracts = await HasNoContracts.new({ from: owner });
    ownable = await Ownable.new({ from: owner });

    // Force ownership into contract
    await ownable.transferOwnership(hasNoContracts.address, { from: owner });
  });

  it('should allow owner to reclaim contracts', async function () {
    await hasNoContracts.reclaimContract(ownable.address, { from: owner });
    (await ownable.owner()).should.eq(owner);
  });

  it('should allow only owner to reclaim contracts', async function () {
    await expectThrow(
      hasNoContracts.reclaimContract(ownable.address, { from: anyone })
    );
  });
});
