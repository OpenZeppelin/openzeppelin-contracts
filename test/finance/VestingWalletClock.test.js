import { network } from 'hardhat';
import { expect } from 'chai';
import { min } from '../helpers/math';
import { envSetup } from './VestingWallet.behavior';
import { shouldBehaveLikeERC6372 } from '../governance/utils/ERC6372.behavior';

const connection = await network.create();
const {
  ethers,
  helpers: { time },
  networkHelpers: { loadFixture },
} = connection;

for (const { Contract, cliffDuration } of [
  { Contract: '$VestingWalletBlockNumberMock', cliffDuration: 0n },
  { Contract: '$VestingWalletCliffBlockNumberMock', cliffDuration: 50n },
]) {
  async function fixture() {
    const amount = ethers.parseEther('100');
    const duration = 100n;
    const start = (await time.clock.blockNumber()) + 20n;
    const end = start + duration;
    const [sender, beneficiary] = await ethers.getSigners();
    const args = [beneficiary, start, duration];
    if (cliffDuration > 0n) args.push(cliffDuration);
    const mock = await ethers.deployContract(Contract, args);

    const token = await ethers.deployContract('$ERC20', ['Name', 'Symbol']);
    await token.$_mint(mock, amount);
    await sender.sendTransaction({ to: mock, value: amount });

    const env = await envSetup(connection, mock, beneficiary, token);
    const schedule = [start - 1n, start, start + 49n, start + 50n, end - 1n, end, end + 1n];
    const vestingFn = timepoint =>
      timepoint < start + cliffDuration ? 0n : min(amount, (amount * (timepoint - start)) / duration);

    return { mock, amount, end, env, schedule, vestingFn };
  }

  describe(Contract, function () {
    beforeEach(async function () {
      Object.assign(this, connection, await loadFixture(fixture));
    });

    shouldBehaveLikeERC6372('blockNumber');

    for (const asset of ['eth', 'token']) {
      describe(`${asset} vesting with an overridden clock`, function () {
        beforeEach(function () {
          Object.assign(this, this.env[asset]);
        });

        it('uses the clock for releasable amounts and keeps explicit timepoint queries', async function () {
          expect(await this.mock.vestedAmount(...this.args, this.end)).to.equal(this.amount);
          expect(await this.mock.releasable(...this.args)).to.equal(0n);

          for (const timepoint of this.schedule) {
            await time.increaseTo.blockNumber(timepoint);
            const vested = this.vestingFn(timepoint);

            expect(await this.mock.vestedAmount(...this.args, timepoint)).to.equal(vested);
            expect(await this.mock.releasable(...this.args)).to.equal(vested);
          }
        });

        it('uses the clock for releases and subtracts previously released amounts', async function () {
          let released = 0n;

          for (const timepoint of this.schedule) {
            if ((await time.clock.blockNumber()) < timepoint - 1n) {
              await time.increaseTo.blockNumber(timepoint - 1n);
            }
            const vested = this.vestingFn(timepoint);
            const tx = await this.mock.release(...this.args);

            expect(await time.clockFromReceipt.blockNumber(tx.wait())).to.equal(timepoint);
            await expect(tx)
              .to.emit(this.mock, this.releasedEvent)
              .withArgs(...this.args, vested - released);
            await this.checkRelease(tx, vested - released);
            expect(await this.mock.released(...this.args)).to.equal(vested);
            expect(await this.mock.releasable(...this.args)).to.equal(0n);
            released = vested;
          }
        });
      });
    }
  });
}
