const { expectThrow } = require('../../helpers/expectThrow');
const { EVMRevert } = require('../../helpers/EVMRevert');

require('chai')
  .should();

const SafeERC20Helper = artifacts.require('SafeERC20Helper');

contract('SafeERC20', function () {
  beforeEach(async function () {
    this.helper = await SafeERC20Helper.new();
  });

  it('should throw on failed transfer', async function () {
    await expectThrow(this.helper.doFailingTransfer(), EVMRevert);
  });

  it('should throw on failed transferFrom', async function () {
    await expectThrow(this.helper.doFailingTransferFrom(), EVMRevert);
  });

  it('should throw on failed approve', async function () {
    await expectThrow(this.helper.doFailingApprove(), EVMRevert);
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
