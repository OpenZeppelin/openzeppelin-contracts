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

  it('should throw on failed increaseAllowance', async function () {
    await shouldFail.reverting(this.helper.doFailingIncreaseAllowance());
  });

  it('should throw on failed decreaseAllowance', async function () {
    await shouldFail.reverting(this.helper.doFailingDecreaseAllowance());
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

  it('should not throw on succeeding increaseAllowance', async function () {
    await this.helper.doSucceedingIncreaseAllowance();
  });

  it('should not throw on succeeding decreaseAllowance', async function () {
    await this.helper.doSucceedingDecreaseAllowance();
  });
});
