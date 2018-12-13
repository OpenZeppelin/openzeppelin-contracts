const shouldFail = require('../../helpers/shouldFail');

require('../../helpers/setup');

const SafeERC20Helper = artifacts.require('SafeERC20Helper');

contract('SafeERC20', function () {
  beforeEach(async function () {
    this.helper = await SafeERC20Helper.new();
  });

  describe('with token that returns false on all calls', function () {
    it('reverts on transfer', async function () {
      await shouldFail.reverting(this.helper.doFailingTransfer());
    });

    it('reverts on transferFrom', async function () {
      await shouldFail.reverting(this.helper.doFailingTransferFrom());
    });

    it('reverts on approve', async function () {
      await shouldFail.reverting(this.helper.doFailingApprove());
    });

    it('reverts on increaseAllowance', async function () {
      await shouldFail.reverting(this.helper.doFailingIncreaseAllowance());
    });

    it('reverts on decreaseAllowance', async function () {
      await shouldFail.reverting(this.helper.doFailingDecreaseAllowance());
    });
  });

  describe('with token that returns true on all calls', function () {
    it('doesn\'t revert on transfer', async function () {
      await this.helper.doSucceedingTransfer();
    });

    it('doesn\'t revert on transferFrom', async function () {
      await this.helper.doSucceedingTransferFrom();
    });

    describe('approvals', function () {
      context('with zero allowance', function () {
        beforeEach(async function () {
          await this.helper.setAllowance(0);
        });

        it('doesn\'t revert when approving a non-zero allowance', async function () {
          await this.helper.doSucceedingApprove(100);
        });

        it('doesn\'t revert when approving a zero allowance', async function () {
          await this.helper.doSucceedingApprove(0);
        });

        it('doesn\'t revert when increasing the allowance', async function () {
          await this.helper.doSucceedingIncreaseAllowance(10);
        });

        it('reverts when decreasing the allowance', async function () {
          await shouldFail.reverting(this.helper.doSucceedingDecreaseAllowance(10));
        });
      });

      context('with non-zero allowance', function () {
        beforeEach(async function () {
          await this.helper.setAllowance(100);
        });

        it('reverts when approving a non-zero allowance', async function () {
          await shouldFail.reverting(this.helper.doSucceedingApprove(20));
        });

        it('doesn\'t revert when approving a zero allowance', async function () {
          await this.helper.doSucceedingApprove(0);
        });

        it('doesn\'t revert when increasing the allowance', async function () {
          await this.helper.doSucceedingIncreaseAllowance(10);
        });

        it('doesn\'t revert when decreasing the allowance to a positive value', async function () {
          await this.helper.doSucceedingDecreaseAllowance(50);
        });

        it('reverts when decreasing the allowance to a negative value', async function () {
          await shouldFail.reverting(this.helper.doSucceedingDecreaseAllowance(200));
        });
      });
    });
  });
});
