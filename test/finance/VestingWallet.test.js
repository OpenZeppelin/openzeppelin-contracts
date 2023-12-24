const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { min } = require('../helpers/math');
const { bigint: time } = require('../helpers/time');

const { shouldBehaveLikeVesting } = require('./VestingWallet.behavior');

async function fixture() {
  const amount = ethers.parseEther('100');
  const duration = time.duration.years(4);
  const start = (await time.clock.timestamp()) + time.duration.hours(1);

  const [sender, beneficiary] = await ethers.getSigners();
  const mock = await ethers.deployContract('VestingWallet', [beneficiary, start, duration]);

  const token = await ethers.deployContract('$ERC20', ['Name', 'Symbol']);
  await token.$_mint(mock, amount);
  await sender.sendTransaction({ to: mock, value: amount });

  const pausableToken = await ethers.deployContract('$ERC20Pausable', ['Name', 'Symbol']);
  const beneficiaryMock = await ethers.deployContract('EtherReceiverMock');

  const env = {
    eth: {
      checkRelease: async (tx, amount) => {
        await expect(tx).to.emit(mock, 'EtherReleased').withArgs(amount);
        await expect(tx).to.changeEtherBalances([mock, beneficiary], [-amount, amount]);
      },
      setupFailure: async () => {
        await beneficiaryMock.setAcceptEther(false);
        await mock.connect(beneficiary).transferOwnership(beneficiaryMock);
        return { args: [], error: [mock, 'FailedInnerCall'] };
      },
      releasedEvent: 'EtherReleased',
      argsVerify: [],
      args: [],
    },
    token: {
      checkRelease: async (tx, amount) => {
        await expect(tx).to.emit(token, 'Transfer').withArgs(mock.target, beneficiary.address, amount);
        await expect(tx).to.changeTokenBalances(token, [mock, beneficiary], [-amount, amount]);
      },
      setupFailure: async () => {
        await pausableToken.$_pause();
        return {
          args: [ethers.Typed.address(pausableToken)],
          error: [pausableToken, 'EnforcedPause'],
        };
      },
      releasedEvent: 'ERC20Released',
      argsVerify: [token.target],
      args: [ethers.Typed.address(token.target)],
    },
  };

  const schedule = Array(64)
    .fill()
    .map((_, i) => (BigInt(i) * duration) / 60n + start);

  const vestingFn = timestamp => min(amount, (amount * (timestamp - start)) / duration);

  return { mock, duration, start, beneficiary, schedule, vestingFn, env };
}

describe('VestingWallet', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  it('rejects zero address for beneficiary', async function () {
    await expect(ethers.deployContract('VestingWallet', [ethers.ZeroAddress, this.start, this.duration]))
      .revertedWithCustomError(this.mock, 'OwnableInvalidOwner')
      .withArgs(ethers.ZeroAddress);
  });

  it('check vesting contract', async function () {
    expect(await this.mock.owner()).to.be.equal(this.beneficiary.address);
    expect(await this.mock.start()).to.be.equal(this.start);
    expect(await this.mock.duration()).to.be.equal(this.duration);
    expect(await this.mock.end()).to.be.equal(this.start + this.duration);
  });

  describe('vesting schedule', function () {
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
