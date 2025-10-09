const { ethers } = require('hardhat');
const { expect } = require('chai');

const { shouldSupportInterfaces } = require('../../utils/introspection/SupportsInterface.behavior');

function shouldBehaveLikeERC6909() {
  const firstTokenId = 1n;
  const secondTokenId = 2n;
  const randomTokenId = 125523n;

  const firstTokenSupply = 2000n;
  const secondTokenSupply = 3000n;
  const amount = 100n;

  describe('like an ERC6909', function () {
    describe('balanceOf', function () {
      describe("when accounts don't own tokens", function () {
        it('return zero', async function () {
          await expect(this.token.balanceOf(this.holder, firstTokenId)).to.eventually.be.equal(0n);
          await expect(this.token.balanceOf(this.holder, secondTokenId)).to.eventually.be.equal(0n);
          await expect(this.token.balanceOf(this.other, randomTokenId)).to.eventually.be.equal(0n);
        });
      });

      describe('when accounts own some tokens', function () {
        beforeEach(async function () {
          await this.token.$_mint(this.holder, firstTokenId, firstTokenSupply);
          await this.token.$_mint(this.holder, secondTokenId, secondTokenSupply);
        });

        it('returns amount owned by the given address', async function () {
          await expect(this.token.balanceOf(this.holder, firstTokenId)).to.eventually.be.equal(firstTokenSupply);
          await expect(this.token.balanceOf(this.holder, secondTokenId)).to.eventually.be.equal(secondTokenSupply);
          await expect(this.token.balanceOf(this.other, firstTokenId)).to.eventually.be.equal(0n);
        });
      });
    });

    describe('setOperator', function () {
      it('emits an OperatorSet event and updated the value', async function () {
        await expect(this.token.connect(this.holder).setOperator(this.operator, true))
          .to.emit(this.token, 'OperatorSet')
          .withArgs(this.holder, this.operator, true);

        // operator for holder
        await expect(this.token.isOperator(this.holder, this.operator)).to.eventually.be.true;

        // not operator for other account
        await expect(this.token.isOperator(this.other, this.operator)).to.eventually.be.false;
      });

      it('can unset the operator approval', async function () {
        await this.token.connect(this.holder).setOperator(this.operator, true);

        // before
        await expect(this.token.isOperator(this.holder, this.operator)).to.eventually.be.true;

        // unset
        await expect(this.token.connect(this.holder).setOperator(this.operator, false))
          .to.emit(this.token, 'OperatorSet')
          .withArgs(this.holder, this.operator, false);

        // after
        await expect(this.token.isOperator(this.holder, this.operator)).to.eventually.be.false;
      });

      it('cannot set address(0) as an operator', async function () {
        await expect(this.token.connect(this.holder).setOperator(ethers.ZeroAddress, true))
          .to.be.revertedWithCustomError(this.token, 'ERC6909InvalidSpender')
          .withArgs(ethers.ZeroAddress);
      });
    });

    describe('approve', function () {
      it('emits an Approval event and updates allowance', async function () {
        await expect(this.token.connect(this.holder).approve(this.operator, firstTokenId, firstTokenSupply))
          .to.emit(this.token, 'Approval')
          .withArgs(this.holder, this.operator, firstTokenId, firstTokenSupply);

        // approved
        await expect(this.token.allowance(this.holder, this.operator, firstTokenId)).to.eventually.be.equal(
          firstTokenSupply,
        );
        // other account is not approved
        await expect(this.token.allowance(this.other, this.operator, firstTokenId)).to.eventually.be.equal(0n);
      });

      it('can unset the approval', async function () {
        await expect(this.token.connect(this.holder).approve(this.operator, firstTokenId, 0n))
          .to.emit(this.token, 'Approval')
          .withArgs(this.holder, this.operator, firstTokenId, 0n);
        await expect(this.token.allowance(this.holder, this.operator, firstTokenId)).to.eventually.be.equal(0n);
      });

      it('cannot give allowance to address(0)', async function () {
        await expect(this.token.connect(this.holder).approve(ethers.ZeroAddress, firstTokenId, firstTokenSupply))
          .to.be.revertedWithCustomError(this.token, 'ERC6909InvalidSpender')
          .withArgs(ethers.ZeroAddress);
      });
    });

    describe('transfer', function () {
      beforeEach(async function () {
        await this.token.$_mint(this.holder, firstTokenId, firstTokenSupply);
        await this.token.$_mint(this.holder, secondTokenId, secondTokenSupply);
      });

      it('transfers to the zero address are blocked', async function () {
        await expect(this.token.connect(this.holder).transfer(ethers.ZeroAddress, firstTokenId, firstTokenSupply))
          .to.be.revertedWithCustomError(this.token, 'ERC6909InvalidReceiver')
          .withArgs(ethers.ZeroAddress);
      });

      it('reverts when insufficient balance', async function () {
        await expect(this.token.connect(this.holder).transfer(this.recipient, firstTokenId, firstTokenSupply + 1n))
          .to.be.revertedWithCustomError(this.token, 'ERC6909InsufficientBalance')
          .withArgs(this.holder, firstTokenSupply, firstTokenSupply + 1n, firstTokenId);
      });

      it('emits event and transfers tokens', async function () {
        await expect(this.token.connect(this.holder).transfer(this.recipient, firstTokenId, amount))
          .to.emit(this.token, 'Transfer')
          .withArgs(this.holder, this.holder, this.recipient, firstTokenId, amount);

        await expect(this.token.balanceOf(this.holder, firstTokenId)).to.eventually.equal(firstTokenSupply - amount);
        await expect(this.token.balanceOf(this.recipient, firstTokenId)).to.eventually.equal(amount);
      });
    });

    describe('transferFrom', function () {
      beforeEach(async function () {
        await this.token.$_mint(this.holder, firstTokenId, firstTokenSupply);
        await this.token.$_mint(this.holder, secondTokenId, secondTokenSupply);
      });

      it('transfer from self', async function () {
        await expect(this.token.connect(this.holder).transferFrom(this.holder, this.recipient, firstTokenId, amount))
          .to.emit(this.token, 'Transfer')
          .withArgs(this.holder, this.holder, this.recipient, firstTokenId, amount);

        await expect(this.token.balanceOf(this.holder, firstTokenId)).to.eventually.equal(firstTokenSupply - amount);
        await expect(this.token.balanceOf(this.recipient, firstTokenId)).to.eventually.equal(amount);
      });

      describe('with approval', async function () {
        beforeEach(async function () {
          await this.token.connect(this.holder).approve(this.operator, firstTokenId, amount);
        });

        it('reverts when insufficient allowance', async function () {
          await expect(
            this.token.connect(this.operator).transferFrom(this.holder, this.recipient, firstTokenId, amount + 1n),
          )
            .to.be.revertedWithCustomError(this.token, 'ERC6909InsufficientAllowance')
            .withArgs(this.operator, amount, amount + 1n, firstTokenId);
        });

        it('should emit transfer event and update approval (without an Approval event)', async function () {
          await expect(
            this.token.connect(this.operator).transferFrom(this.holder, this.recipient, firstTokenId, amount - 1n),
          )
            .to.emit(this.token, 'Transfer')
            .withArgs(this.operator, this.holder, this.recipient, firstTokenId, amount - 1n)
            .to.not.emit(this.token, 'Approval');

          await expect(this.token.allowance(this.holder, this.operator, firstTokenId)).to.eventually.equal(1n);
        });

        it("shouldn't reduce allowance when infinite", async function () {
          await this.token.connect(this.holder).approve(this.operator, firstTokenId, ethers.MaxUint256);

          await this.token.connect(this.operator).transferFrom(this.holder, this.recipient, firstTokenId, amount);

          await expect(this.token.allowance(this.holder, this.operator, firstTokenId)).to.eventually.equal(
            ethers.MaxUint256,
          );
        });
      });
    });

    describe('with operator approval', function () {
      beforeEach(async function () {
        await this.token.connect(this.holder).setOperator(this.operator, true);
        await this.token.$_mint(this.holder, firstTokenId, firstTokenSupply);
      });

      it('operator can transfer', async function () {
        await expect(this.token.connect(this.operator).transferFrom(this.holder, this.recipient, firstTokenId, amount))
          .to.emit(this.token, 'Transfer')
          .withArgs(this.operator, this.holder, this.recipient, firstTokenId, amount);

        await expect(this.token.balanceOf(this.holder, firstTokenId)).to.eventually.equal(firstTokenSupply - amount);
        await expect(this.token.balanceOf(this.recipient, firstTokenId)).to.eventually.equal(amount);
      });

      it('operator transfer does not reduce allowance', async function () {
        // Also give allowance
        await this.token.connect(this.holder).approve(this.operator, firstTokenId, firstTokenSupply);

        await expect(this.token.connect(this.operator).transferFrom(this.holder, this.recipient, firstTokenId, amount))
          .to.emit(this.token, 'Transfer')
          .withArgs(this.operator, this.holder, this.recipient, firstTokenId, amount);

        await expect(this.token.allowance(this.holder, this.operator, firstTokenId)).to.eventually.equal(
          firstTokenSupply,
        );
      });
    });

    shouldSupportInterfaces(['ERC6909']);
  });
}

module.exports = {
  shouldBehaveLikeERC6909,
};
