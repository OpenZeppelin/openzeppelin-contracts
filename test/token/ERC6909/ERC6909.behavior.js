const { ethers } = require('hardhat');
const { expect } = require('chai');

const { shouldSupportInterfaces } = require('../../utils/introspection/SupportsInterface.behavior');

function shouldBehaveLikeERC6909() {
  const firstTokenId = 1n;
  const secondTokenId = 2n;
  const randomTokenId = 125523n;

  const firstTokenAmount = 2000n;
  const secondTokenAmount = 3000n;

  beforeEach(async function () {
    [this.recipient, this.proxy, this.alice, this.bruce] = this.otherAccounts;
  });

  describe('like an ERC6909', function () {
    describe('balanceOf', function () {
      describe("when accounts don't own tokens", function () {
        it('return zero', async function () {
          expect(this.token.balanceOf(this.alice, firstTokenId)).to.eventually.be.equal(0);
          expect(this.token.balanceOf(this.bruce, secondTokenId)).to.eventually.be.equal(0);
          expect(this.token.balanceOf(this.alice, randomTokenId)).to.eventually.be.equal(0);
        });
      });

      describe('when accounts own some tokens', function () {
        beforeEach(async function () {
          await this.token.$_mint(this.alice, firstTokenId, firstTokenAmount);
          await this.token.$_mint(this.bruce, secondTokenId, secondTokenAmount);
        });

        it('returns amount owned by the given address', async function () {
          expect(this.token.balanceOf(this.alice, firstTokenId)).to.eventually.be.equal(firstTokenAmount);
          expect(this.token.balanceOf(this.bruce, secondTokenId)).to.eventually.be.equal(secondTokenAmount);
          expect(this.token.balanceOf(this.bruce, firstTokenId)).to.eventually.be.equal(0);
        });
      });
    });

    describe('setOperator', function () {
      beforeEach(async function () {
        this.tx = await this.token.connect(this.holder).setOperator(this.operator, true);
      });

      it('emits an an OperatorSet event', async function () {
        expect(this.tx).to.emit(this.token, 'OperatorSet').withArgs(this.holder, this.operator, true);
      });

      it('should be reflected in isOperator call', async function () {
        expect(this.token.isOperator(this.holder, this.operator)).to.eventually.be.true;
        // not operator for other account
        expect(this.token.isOperator(this.alice, this.operator)).to.eventually.be.false;
      });

      it('can unset the operator approval', async function () {
        await expect(this.token.connect(this.holder).setOperator(this.operator, false))
          .to.emit(this.token, 'OperatorSet')
          .withArgs(this.holder, this.operator, false);
      });
    });

    describe('approve', function () {
      beforeEach(async function () {
        this.tx = await this.token.connect(this.holder).approve(this.operator, firstTokenId, firstTokenAmount);
      });

      it('emits an Approval event', async function () {
        expect(this.tx)
          .to.emit(this.token, 'Approval')
          .withArgs(this.holder, this.operator, firstTokenId, firstTokenAmount);
      });

      it('is reflected in allowance', async function () {
        expect(this.token.allowance(this.holder, this.operator, firstTokenId)).to.eventually.be.equal(firstTokenAmount);
        // not operator for other account
        expect(this.token.allowance(this.alice, this.operator, firstTokenId)).to.eventually.be.equal(0);
      });

      it('can unset the approval', async function () {
        await expect(this.token.connect(this.holder).approve(this.operator, firstTokenId, 0))
          .to.emit(this.token, 'Approval')
          .withArgs(this.holder, this.operator, firstTokenId, 0);
        expect(this.token.allowance(this.holder, this.operator, firstTokenId)).to.eventually.be.equal(0);
      });
    });

    describe('transfer', function () {
      beforeEach(async function () {
        await this.token.$_mint(this.alice, firstTokenId, firstTokenAmount);
        await this.token.$_mint(this.bruce, secondTokenId, secondTokenAmount);
      });

      it('transfers to the zero address are allowed', async function () {
        await expect(
          this.token.connect(this.alice).transfer(ethers.constants.AddressZero, firstTokenId, firstTokenAmount),
        )
          .to.emit(this.token, 'Transfer')
          .withArgs(this.alice, ethers.constants.AddressZero, firstTokenId, firstTokenAmount);
      });
    });

    shouldSupportInterfaces(['ERC6909']);
  });
}

module.exports = {
  shouldBehaveLikeERC6909,
};
