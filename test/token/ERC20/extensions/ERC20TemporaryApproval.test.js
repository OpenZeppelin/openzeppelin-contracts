const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { shouldBehaveLikeERC20 } = require('../ERC20.behavior.js');

const name = 'My Token';
const symbol = 'MTKN';
const initialSupply = 100n;

async function fixture() {
  // this.accounts is used by shouldBehaveLikeERC20
  const accounts = await ethers.getSigners();
  const [holder, recipient, other] = accounts;

  const token = await ethers.deployContract('$ERC20TemporaryApproval', [name, symbol]);
  await token.$_mint(holder, initialSupply);

  const spender = await ethers.deployContract('$Address');
  const batch = await ethers.deployContract('BatchCaller');
  const getter = await ethers.deployContract('ERC20GetterHelper');

  return { accounts, holder, recipient, other, token, spender, batch, getter };
}

describe('ERC20TemporaryApproval', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  shouldBehaveLikeERC20(initialSupply);

  describe('setting temporary allowance', function () {
    const persistentAmount = 42n;
    const temporaryAmount = 17n;

    it('can set temporary allowance', async function () {
      await expect(
        this.batch.execute([
          {
            target: this.token,
            value: 0n,
            data: this.token.interface.encodeFunctionData('temporaryApprove', [this.spender.target, temporaryAmount]),
          },
          {
            target: this.getter,
            value: 0n,
            data: this.getter.interface.encodeFunctionData('allowance', [
              this.token.target,
              this.batch.target,
              this.spender.target,
            ]),
          },
        ]),
      )
        .to.emit(this.getter, 'erc20allowance')
        .withArgs(this.token, this.batch, this.spender, temporaryAmount);

      expect(await this.token.allowance(this.batch, this.spender)).to.equal(0n);
    });

    it('can set temporary allowance on top of persistent allowance', async function () {
      await this.token.$_approve(this.batch, this.spender, persistentAmount);

      await expect(
        this.batch.execute([
          {
            target: this.token,
            value: 0n,
            data: this.token.interface.encodeFunctionData('temporaryApprove', [this.spender.target, temporaryAmount]),
          },
          {
            target: this.getter,
            value: 0n,
            data: this.getter.interface.encodeFunctionData('allowance', [
              this.token.target,
              this.batch.target,
              this.spender.target,
            ]),
          },
        ]),
      )
        .to.emit(this.getter, 'erc20allowance')
        .withArgs(this.token, this.batch, this.spender, persistentAmount + temporaryAmount);

      expect(await this.token.allowance(this.batch, this.spender)).to.equal(persistentAmount);
    });
  });

  describe('spending temporary allowance', function () {
    beforeEach(async function () {
      await this.token.connect(this.holder).transfer(this.batch, initialSupply);
    });

    it('consumming temporary allowance alone', async function () {
      await expect(
        this.batch.execute([
          {
            target: this.token,
            value: 0n,
            data: this.token.interface.encodeFunctionData('temporaryApprove', [this.spender.target, 10n]),
          },
          {
            target: this.spender,
            value: 0n,
            data: this.spender.interface.encodeFunctionData('$functionCall', [
              this.token.target,
              this.token.interface.encodeFunctionData('transferFrom', [this.batch.target, this.recipient.address, 2n]),
            ]),
          },
          {
            target: this.getter,
            value: 0n,
            data: this.getter.interface.encodeFunctionData('allowance', [
              this.token.target,
              this.batch.target,
              this.spender.target,
            ]),
          },
        ]),
      )
        .to.emit(this.getter, 'erc20allowance')
        .withArgs(this.token, this.batch, this.spender, 8n); // 10 - 2

      expect(await this.token.allowance(this.batch, this.spender)).to.equal(0n);
    });

    it('do not reduce infinite temporary allowance', async function () {
      await expect(
        this.batch.execute([
          {
            target: this.token,
            value: 0n,
            data: this.token.interface.encodeFunctionData('temporaryApprove', [this.spender.target, ethers.MaxUint256]),
          },
          {
            target: this.spender,
            value: 0n,
            data: this.spender.interface.encodeFunctionData('$functionCall', [
              this.token.target,
              this.token.interface.encodeFunctionData('transferFrom', [this.batch.target, this.recipient.address, 2n]),
            ]),
          },
          {
            target: this.getter,
            value: 0n,
            data: this.getter.interface.encodeFunctionData('allowance', [
              this.token.target,
              this.batch.target,
              this.spender.target,
            ]),
          },
        ]),
      )
        .to.emit(this.getter, 'erc20allowance')
        .withArgs(this.token, this.batch, this.spender, ethers.MaxUint256);

      expect(await this.token.allowance(this.batch, this.spender)).to.equal(0n);
    });

    it('fallback to persistent allowance if temporary allowance is not sufficient', async function () {
      await this.token.$_approve(this.batch, this.spender, 10n);

      await expect(
        this.batch.execute([
          {
            target: this.token,
            value: 0n,
            data: this.token.interface.encodeFunctionData('temporaryApprove', [this.spender.target, 1n]),
          },
          {
            target: this.spender,
            value: 0n,
            data: this.spender.interface.encodeFunctionData('$functionCall', [
              this.token.target,
              this.token.interface.encodeFunctionData('transferFrom', [this.batch.target, this.recipient.address, 2n]),
            ]),
          },
          {
            target: this.getter,
            value: 0n,
            data: this.getter.interface.encodeFunctionData('allowance', [
              this.token.target,
              this.batch.target,
              this.spender.target,
            ]),
          },
        ]),
      )
        .to.emit(this.getter, 'erc20allowance')
        .withArgs(this.token, this.batch, this.spender, 9n); // 10 + 1 - 2

      expect(await this.token.allowance(this.batch, this.spender)).to.equal(9n); // 10 - 1
    });
  });
});
