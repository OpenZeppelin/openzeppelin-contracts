const shouldFail = require('../../helpers/shouldFail');

require('chai')
  .should();

const SafeERC20Helper = artifacts.require('SafeERC20Helper');

contract('SafeERC20', function () {
  beforeEach(async function () {
    this.helper = await SafeERC20Helper.new();
  });

  it('should throw on failed transfer', async function () {
    await shouldFail.reverting(this.helper.doFailingTransfer());
  });

  it('should throw on failed transferFrom', async function () {
    await shouldFail.reverting(this.helper.doFailingTransferFrom());
  });

  it('should throw on failed approve', async function () {
    await shouldFail.reverting(this.helper.doFailingApprove());
  });

  it('should not throw on succeeding transfer', async function () {
    await this.helper.doSucceedingTransfer();
  });

  it('should not throw on succeeding transferFrom', async function () {
    await this.helper.doSucceedingTransferFrom();
  });

  it('should not throw on succeeding approve', async function () {
    await this.helper.doSucceedingApprove();
  });
});
