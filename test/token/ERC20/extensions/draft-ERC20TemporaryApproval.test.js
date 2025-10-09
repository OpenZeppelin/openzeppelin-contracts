const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { max, min } = require('../../../helpers/math.js');

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

  describe('setting and spending temporary allowance', function () {
    beforeEach(async function () {
      await this.token.connect(this.holder).transfer(this.batch, initialSupply);
    });

    for (let {
      description,
      persistentAllowance,
      temporaryAllowance,
      amount,
      temporaryExpected,
      persistentExpected,
    } of [
      { description: 'can set temporary allowance', temporaryAllowance: 42n },
      {
        description: 'can set temporary allowance on top of persistent allowance',
        temporaryAllowance: 42n,
        persistentAllowance: 17n,
      },
      { description: 'support allowance overflow', temporaryAllowance: ethers.MaxUint256, persistentAllowance: 17n },
      { description: 'consuming temporary allowance alone', temporaryAllowance: 42n, amount: 2n },
      {
        description: 'fallback to persistent allowance if temporary allowance is not sufficient',
        temporaryAllowance: 42n,
        persistentAllowance: 17n,
        amount: 50n,
      },
      {
        description: 'do not reduce infinite temporary allowance #1',
        temporaryAllowance: ethers.MaxUint256,
        amount: 50n,
        temporaryExpected: ethers.MaxUint256,
      },
      {
        description: 'do not reduce infinite temporary allowance #2',
        temporaryAllowance: 17n,
        persistentAllowance: ethers.MaxUint256,
        amount: 50n,
        temporaryExpected: ethers.MaxUint256,
        persistentExpected: ethers.MaxUint256,
      },
    ]) {
      persistentAllowance ??= 0n;
      temporaryAllowance ??= 0n;
      amount ??= 0n;
      temporaryExpected ??= min(persistentAllowance + temporaryAllowance - amount, ethers.MaxUint256);
      persistentExpected ??= persistentAllowance - max(amount - temporaryAllowance, 0n);

      it(description, async function () {
        await expect(
          this.batch.execute(
            [
              persistentAllowance && {
                target: this.token,
                value: 0n,
                data: this.token.interface.encodeFunctionData('approve', [this.spender.target, persistentAllowance]),
              },
              temporaryAllowance && {
                target: this.token,
                value: 0n,
                data: this.token.interface.encodeFunctionData('temporaryApprove', [
                  this.spender.target,
                  temporaryAllowance,
                ]),
              },
              amount && {
                target: this.spender,
                value: 0n,
                data: this.spender.interface.encodeFunctionData('$functionCall', [
                  this.token.target,
                  this.token.interface.encodeFunctionData('transferFrom', [
                    this.batch.target,
                    this.recipient.address,
                    amount,
                  ]),
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
            ].filter(Boolean),
          ),
        )
          .to.emit(this.getter, 'ERC20Allowance')
          .withArgs(this.token, this.batch, this.spender, temporaryExpected);

        expect(await this.token.allowance(this.batch, this.spender)).to.equal(persistentExpected);
      });
    }

    it('reverts when the recipient is the zero address', async function () {
      await expect(this.token.connect(this.holder).temporaryApprove(ethers.ZeroAddress, 1n))
        .to.be.revertedWithCustomError(this.token, 'ERC20InvalidSpender')
        .withArgs(ethers.ZeroAddress);
    });

    it('reverts when the token owner is the zero address', async function () {
      await expect(this.token.$_temporaryApprove(ethers.ZeroAddress, this.recipient, 1n))
        .to.be.revertedWithCustomError(this.token, 'ERC20InvalidApprover')
        .withArgs(ethers.ZeroAddress);
    });
  });
});
