const shouldFail = require('../../helpers/shouldFail');
const { ZERO_ADDRESS } = require('../../helpers/constants');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

const { shouldBehaveLikePublicRole } = require('../../access/roles/PublicRole.behavior');

const ERC20Mock = artifacts.require('ERC20Mock');
const TokenRecoverMock = artifacts.require('TokenRecoverMock');

contract('TokenRecover', function ([operator, otherOperator, receiver, ...otherAccounts]) {
  beforeEach(async function () {
    this.tokenRecover = await TokenRecoverMock.new({ from: operator });
  });

  describe('operator role', function () {
    beforeEach(async function () {
      this.contract = this.tokenRecover;
      await this.contract.addOperator(otherOperator, { from: operator });
    });

    shouldBehaveLikePublicRole(operator, otherOperator, otherAccounts, 'operator');
  });

  describe('recover ERC20', function () {
    const amount = 100;

    beforeEach(async function () {
      this.anotherERC20 = await ERC20Mock.new(this.tokenRecover.address, amount, { from: operator });
    });

    describe('when operator is calling', function () {
      it('should transfer tokens to receiver', async function () {
        (await this.anotherERC20.balanceOf(this.tokenRecover.address)).should.be.bignumber.equal(amount);
        (await this.anotherERC20.balanceOf(receiver)).should.be.bignumber.equal(0);

        await this.tokenRecover.recoverERC20(this.anotherERC20.address, receiver, amount, { from: operator });

        (await this.anotherERC20.balanceOf(this.tokenRecover.address)).should.be.bignumber.equal(0);
        (await this.anotherERC20.balanceOf(receiver)).should.be.bignumber.equal(amount);
      });
    });

    describe('when token address is zero', function () {
      it('reverts', async function () {
        await shouldFail.reverting(
          this.tokenRecover.recoverERC20(ZERO_ADDRESS, receiver, 0, { from: operator })
        );
      });
    });

    describe('when other accounts are calling', function () {
      it('reverts', async function () {
        await shouldFail.reverting(
          this.tokenRecover.recoverERC20(this.anotherERC20.address, receiver, amount, { from: otherAccounts[0] })
        );
      });
    });
  });
});
