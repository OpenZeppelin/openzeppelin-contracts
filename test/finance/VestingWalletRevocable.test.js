const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { min } = require('../helpers/math');
const time = require('../helpers/time');
const { envSetup, shouldBehaveLikeVesting } = require('./VestingWallet.behavior');

async function fixture() {
  const amount = ethers.parseEther('100');
  const duration = time.duration.years(4);
  const start = (await time.clock.timestamp()) + time.duration.hours(1);

  const [sender, beneficiary] = await ethers.getSigners();

  const mock = await ethers.deployContract('$VestingWalletRevocable', [beneficiary, start, duration]);

  const token = await ethers.deployContract('$ERC20', ['Name', 'Symbol']);
  await token.$_mint(mock, amount);
  await sender.sendTransaction({ to: mock, value: amount });

  const env = await envSetup(mock, beneficiary, token);

  const schedule = Array.from({ length: 64 }, (_, i) => (BigInt(i) * duration) / 60n + start);
  const vestingFn = timestamp => min(amount, (amount * (timestamp - start)) / duration);

  return { mock, duration, start, beneficiary, token, env, schedule, vestingFn };
}

describe('VestingWalletRevocable', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('inherits VestingWallet', function () {
    it('sets beneficiary as owner', async function () {
      expect(await this.mock.owner()).to.equal(this.beneficiary.address);
    });

    it('sets start, duration, and end', async function () {
      expect(await this.mock.start()).to.equal(this.start);
      expect(await this.mock.duration()).to.equal(this.duration);
      expect(await this.mock.end()).to.equal(this.start + this.duration);
    });

    describe('Eth vesting', function () {
      beforeEach(async function () {
        Object.assign(this, this.env.eth);
      });

      shouldBehaveLikeVesting();
    });

    describe('ERC20 vesting', function () {
      beforeEach(async function () {
        Object.assign(this, this.env.token);
      });

      shouldBehaveLikeVesting();
    });
  });
});
