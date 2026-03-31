const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { shouldSupportInterfaces } = require('../../../utils/introspection/SupportsInterface.behavior');

async function fixture() {
  const [holder, operator, other] = await ethers.getSigners();
  const asset = await ethers.deployContract('$ERC20Mock');
  const token = await ethers.deployContract('$ERC7540Operator', ['', '', asset]);
  return { token, asset, holder, operator, other };
}

describe('ERC7540Operator', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('asset', function () {
    it('returns the underlying asset address', async function () {
      await expect(this.token.asset()).to.eventually.equal(this.asset);
    });
  });

  describe('totalAssets', function () {
    it('returns 0 when vault holds no assets', async function () {
      await expect(this.token.totalAssets()).to.eventually.equal(0n);
    });

    it('returns the asset balance held by the vault', async function () {
      const amount = 1000n;
      await this.asset.$_mint(this.token, amount);
      await expect(this.token.totalAssets()).to.eventually.equal(amount);
    });
  });

  describe('isOperator', function () {
    it('returns false by default', async function () {
      await expect(this.token.isOperator(this.holder, this.operator)).to.eventually.be.false;
    });
  });

  describe('setOperator', function () {
    it('sets operator and emits OperatorSet event', async function () {
      await expect(this.token.connect(this.holder).setOperator(this.operator, true))
        .to.emit(this.token, 'OperatorSet')
        .withArgs(this.holder, this.operator, true);
      await expect(this.token.isOperator(this.holder, this.operator)).to.eventually.be.true;
    });

    it('does not affect other controllers', async function () {
      await this.token.connect(this.holder).setOperator(this.operator, true);
      await expect(this.token.isOperator(this.holder, this.operator)).to.eventually.be.true;
      await expect(this.token.isOperator(this.other, this.operator)).to.eventually.be.false;
    });

    it('can unset the operator approval', async function () {
      await this.token.connect(this.holder).setOperator(this.operator, true);
      await expect(this.token.isOperator(this.holder, this.operator)).to.eventually.be.true;
      await expect(this.token.connect(this.holder).setOperator(this.operator, false))
        .to.emit(this.token, 'OperatorSet')
        .withArgs(this.holder, this.operator, false);
      await expect(this.token.isOperator(this.holder, this.operator)).to.eventually.be.false;
    });

    it('does not emit event when setting the same approval status', async function () {
      await expect(this.token.connect(this.holder).setOperator(this.operator, false)).to.not.emit(
        this.token,
        'OperatorSet',
      );
      await this.token.connect(this.holder).setOperator(this.operator, true);
      await expect(this.token.connect(this.holder).setOperator(this.operator, true)).to.not.emit(
        this.token,
        'OperatorSet',
      );
    });

    it('returns true', async function () {
      await expect(this.token.connect(this.holder).setOperator.staticCall(this.operator, true)).to.eventually.be.true;
    });
  });

  describe('internal functions', function () {
    describe('_setOperator', function () {
      it('sets operator and emits event', async function () {
        await expect(this.token.$_setOperator(this.holder, this.operator, true))
          .to.emit(this.token, 'OperatorSet')
          .withArgs(this.holder, this.operator, true);
        await expect(this.token.isOperator(this.holder, this.operator)).to.eventually.be.true;
      });

      it('does not emit event when status unchanged', async function () {
        await this.token.$_setOperator(this.holder, this.operator, true);
        await expect(this.token.$_setOperator(this.holder, this.operator, true)).to.not.emit(this.token, 'OperatorSet');
      });
    });

    describe('_checkOperatorOrController', function () {
      it('does not revert when controller equals operator', async function () {
        await this.token.$_checkOperatorOrController(this.holder, this.holder);
      });

      it('does not revert when operator is approved', async function () {
        await this.token.connect(this.holder).setOperator(this.operator, true);
        await this.token.$_checkOperatorOrController(this.holder, this.operator);
      });

      it('reverts when operator is not approved', async function () {
        await expect(this.token.$_checkOperatorOrController(this.holder, this.operator))
          .to.be.revertedWithCustomError(this.token, 'ERC7540InvalidOperator')
          .withArgs(this.holder, this.operator);
      });
    });
  });

  shouldSupportInterfaces(['ERC7540Operator']);
});
