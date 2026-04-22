import { ethers } from 'ethers';
import { expect } from 'chai';

export async function envSetup(connection, mock, beneficiary, token) {
  return {
    eth: {
      checkRelease: async (tx, amount) => {
        await expect(tx).to.changeEtherBalances(connection.ethers, [mock, beneficiary], [-amount, amount]);
      },
      setupFailure: async () => {
        const beneficiaryMock = await connection.ethers.deployContract('EtherReceiverMock');
        await beneficiaryMock.setAcceptEther(false);
        await mock.connect(beneficiary).transferOwnership(beneficiaryMock);
        return { args: [], error: [mock, 'FailedCall'] };
      },
      releasedEvent: 'EtherReleased',
      args: [],
    },
    token: {
      checkRelease: async (tx, amount) => {
        await expect(tx).to.emit(token, 'Transfer').withArgs(mock, beneficiary, amount);
        await expect(tx).to.changeTokenBalances(connection.ethers, token, [mock, beneficiary], [-amount, amount]);
      },
      setupFailure: async () => {
        const pausableToken = await connection.ethers.deployContract('$ERC20Pausable', ['Name', 'Symbol']);
        await pausableToken.$_pause();
        return {
          args: [ethers.Typed.address(pausableToken)],
          error: [pausableToken, 'EnforcedPause'],
        };
      },
      releasedEvent: 'ERC20Released',
      args: [ethers.Typed.address(token)],
    },
  };
}

export function shouldBehaveLikeVesting() {
  it('check vesting schedule', async function () {
    for (const timestamp of this.schedule) {
      await this.helpers.time.increaseTo.timestamp(timestamp);
      const vesting = this.vestingFn(timestamp);

      expect(await this.mock.vestedAmount(...this.args, timestamp)).to.equal(vesting);
      expect(await this.mock.releasable(...this.args)).to.equal(vesting);
    }
  });

  it('execute vesting schedule', async function () {
    let released = 0n;
    {
      const tx = await this.mock.release(...this.args);
      await expect(tx)
        .to.emit(this.mock, this.releasedEvent)
        .withArgs(...this.args, 0);

      await this.checkRelease(tx, 0n);
    }

    for (const timestamp of this.schedule) {
      await this.helpers.time.increaseTo.timestamp(timestamp, false);
      const vested = this.vestingFn(timestamp);

      const tx = await this.mock.release(...this.args);
      await expect(tx).to.emit(this.mock, this.releasedEvent);

      await this.checkRelease(tx, vested - released);
      released = vested;
    }
  });

  it('should revert on transaction failure', async function () {
    const { args, error } = await this.setupFailure();

    for (const timestamp of this.schedule) {
      await this.helpers.time.increaseTo.timestamp(timestamp);

      await expect(this.mock.release(...args)).to.be.revertedWithCustomError(...error);
    }
  });
}
