import { network } from 'hardhat';
import { expect } from 'chai';
import { min } from '../helpers/math';
import { envSetup, shouldBehaveLikeVesting } from './VestingWallet.behavior';
import { shouldBehaveLikeERC6372 } from '../governance/utils/ERC6372.behavior';

const connection = await network.create();
const {
  ethers,
  helpers: { time },
  networkHelpers: { loadFixture },
} = connection;

for (const { clock, contractName, withCliff } of [
  { clock: 'timestamp', contractName: 'VestingWallet' },
  { clock: 'timestamp', contractName: '$VestingWalletCliff', withCliff: true },
  { clock: 'blockNumber', contractName: '$VestingWalletBlockNumberMock' },
  { clock: 'blockNumber', contractName: '$VestingWalletCliffBlockNumberMock', withCliff: true },
]) {
  async function fixture() {
    const amount = ethers.parseEther('100');
    const duration = 10_000n;
    const start = (await time.clock[clock]()) + 100n;
    const cliffDuration = withCliff ? 2_500n : undefined;
    const cliff = withCliff ? start + cliffDuration : undefined;

    const [sender, beneficiary] = await ethers.getSigners();
    const mock = await ethers.deployContract(
      contractName,
      [beneficiary, start, duration, cliffDuration].filter(Boolean),
    );

    const token = await ethers.deployContract('$ERC20', ['Name', 'Symbol']);
    await token.$_mint(mock, amount);
    await sender.sendTransaction({ to: mock, value: amount });

    const env = await envSetup(connection, mock, beneficiary, token);

    const schedule = Array.from({ length: 64 }, (_, i) => (BigInt(i) * duration) / 60n + start);
    const vestingFn = timestamp =>
      min(amount, withCliff && timestamp < cliff ? 0n : (amount * (timestamp - start)) / duration);

    return { mock, duration, start, beneficiary, cliff, cliffDuration, schedule, vestingFn, env };
  }

  describe(contractName, function () {
    beforeEach(async function () {
      Object.assign(this, connection, await loadFixture(fixture));
    });

    if (withCliff) {
      it('rejects a larger cliff than vesting duration', async function () {
        await expect(
          ethers.deployContract(contractName, [this.beneficiary, this.start, this.duration, this.duration + 1n]),
        )
          .revertedWithCustomError(this.mock, 'InvalidCliffDuration')
          .withArgs(this.duration + 1n, this.duration);
      });
    }

    it('rejects zero address for beneficiary', async function () {
      await expect(
        ethers.deployContract(
          contractName,
          [ethers.ZeroAddress, this.start, this.duration, this.cliffDuration].filter(Boolean),
        ),
      )
        .revertedWithCustomError(this.mock, 'OwnableInvalidOwner')
        .withArgs(ethers.ZeroAddress);
    });

    it('check vesting contract', async function () {
      expect(await this.mock.owner()).to.equal(this.beneficiary);
      expect(await this.mock.start()).to.equal(this.start);
      expect(await this.mock.duration()).to.equal(this.duration);
      expect(await this.mock.end()).to.equal(this.start + this.duration);
      if (withCliff) {
        expect(await this.mock.cliff()).to.equal(this.cliff);
      }
    });

    describe('ERC-6372 clock', function () {
      shouldBehaveLikeERC6372(clock);
    });

    describe('vesting schedule', function () {
      describe('Eth vesting', function () {
        beforeEach(async function () {
          Object.assign(this, this.env.eth);
        });

        shouldBehaveLikeVesting(clock);
      });

      describe('ERC20 vesting', function () {
        beforeEach(async function () {
          Object.assign(this, this.env.token);
        });

        shouldBehaveLikeVesting(clock);
      });
    });
  });
}
