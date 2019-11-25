const { accounts, contract } = require('@openzeppelin/test-environment');

const { BN, constants, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;

const { expect } = require('chai');

const ERC20Mintable = contract.fromArtifact('ERC20Mintable');
const TokenVesting = contract.fromArtifact('TokenVesting');

describe('TokenVesting', function () {
  const [ owner, beneficiary ] = accounts;

  const amount = new BN('1000');

  beforeEach(async function () {
    // +1 minute so it starts after contract instantiation
    this.start = (await time.latest()).add(time.duration.minutes(1));
    this.cliffDuration = time.duration.years(1);
    this.duration = time.duration.years(2);
  });

  it('reverts with a duration shorter than the cliff', async function () {
    const cliffDuration = this.duration;
    const duration = this.cliffDuration;

    expect(cliffDuration).to.be.bignumber.that.is.at.least(duration);

    await expectRevert(
      TokenVesting.new(beneficiary, this.start, cliffDuration, duration, true, { from: owner }),
      'TokenVesting: cliff is longer than duration'
    );
  });

  it('reverts with a null beneficiary', async function () {
    await expectRevert(
      TokenVesting.new(ZERO_ADDRESS, this.start, this.cliffDuration, this.duration, true, { from: owner }),
      'TokenVesting: beneficiary is the zero address'
    );
  });

  it('reverts with a null duration', async function () {
    // cliffDuration should also be 0, since the duration must be larger than the cliff
    await expectRevert(
      TokenVesting.new(beneficiary, this.start, 0, 0, true, { from: owner }), 'TokenVesting: duration is 0'
    );
  });

  it('reverts if the end time is in the past', async function () {
    const now = await time.latest();

    this.start = now.sub(this.duration).sub(time.duration.minutes(1));
    await expectRevert(
      TokenVesting.new(beneficiary, this.start, this.cliffDuration, this.duration, true, { from: owner }),
      'TokenVesting: final time is before current time'
    );
  });

  context('once deployed', function () {
    beforeEach(async function () {
      this.vesting = await TokenVesting.new(
        beneficiary, this.start, this.cliffDuration, this.duration, true, { from: owner });

      this.token = await ERC20Mintable.new({ from: owner });
      await this.token.mint(this.vesting.address, amount, { from: owner });
    });

    it('can get state', async function () {
      expect(await this.vesting.beneficiary()).to.equal(beneficiary);
      expect(await this.vesting.cliff()).to.be.bignumber.equal(this.start.add(this.cliffDuration));
      expect(await this.vesting.start()).to.be.bignumber.equal(this.start);
      expect(await this.vesting.duration()).to.be.bignumber.equal(this.duration);
      expect(await this.vesting.revocable()).to.be.equal(true);
    });

    it('cannot be released before cliff', async function () {
      await expectRevert(this.vesting.release(this.token.address),
        'TokenVesting: no tokens are due'
      );
    });

    it('can be released after cliff', async function () {
      await time.increaseTo(this.start.add(this.cliffDuration).add(time.duration.weeks(1)));
      const { logs } = await this.vesting.release(this.token.address);
      expectEvent.inLogs(logs, 'TokensReleased', {
        token: this.token.address,
        amount: await this.token.balanceOf(beneficiary),
      });
    });

    it('should release proper amount after cliff', async function () {
      await time.increaseTo(this.start.add(this.cliffDuration));

      await this.vesting.release(this.token.address);
      const releaseTime = await time.latest();

      const releasedAmount = amount.mul(releaseTime.sub(this.start)).div(this.duration);
      expect(await this.token.balanceOf(beneficiary)).to.be.bignumber.equal(releasedAmount);
      expect(await this.vesting.released(this.token.address)).to.be.bignumber.equal(releasedAmount);
    });

    it('should linearly release tokens during vesting period', async function () {
      const vestingPeriod = this.duration.sub(this.cliffDuration);
      const checkpoints = 4;

      for (let i = 1; i <= checkpoints; i++) {
        const now = this.start.add(this.cliffDuration).add((vestingPeriod.muln(i).divn(checkpoints)));
        await time.increaseTo(now);

        await this.vesting.release(this.token.address);
        const expectedVesting = amount.mul(now.sub(this.start)).div(this.duration);
        expect(await this.token.balanceOf(beneficiary)).to.be.bignumber.equal(expectedVesting);
        expect(await this.vesting.released(this.token.address)).to.be.bignumber.equal(expectedVesting);
      }
    });

    it('should have released all after end', async function () {
      await time.increaseTo(this.start.add(this.duration));
      await this.vesting.release(this.token.address);
      expect(await this.token.balanceOf(beneficiary)).to.be.bignumber.equal(amount);
      expect(await this.vesting.released(this.token.address)).to.be.bignumber.equal(amount);
    });

    it('should be revoked by owner if revocable is set', async function () {
      const { logs } = await this.vesting.revoke(this.token.address, { from: owner });
      expectEvent.inLogs(logs, 'TokenVestingRevoked', { token: this.token.address });
      expect(await this.vesting.revoked(this.token.address)).to.equal(true);
    });

    it('should fail to be revoked by owner if revocable not set', async function () {
      const vesting = await TokenVesting.new(
        beneficiary, this.start, this.cliffDuration, this.duration, false, { from: owner }
      );

      await expectRevert(vesting.revoke(this.token.address, { from: owner }),
        'TokenVesting: cannot revoke'
      );
    });

    it('should return the non-vested tokens when revoked by owner', async function () {
      await time.increaseTo(this.start.add(this.cliffDuration).add(time.duration.weeks(12)));

      const vested = vestedAmount(amount, await time.latest(), this.start, this.cliffDuration, this.duration);

      await this.vesting.revoke(this.token.address, { from: owner });

      expect(await this.token.balanceOf(owner)).to.be.bignumber.equal(amount.sub(vested));
    });

    it('should keep the vested tokens when revoked by owner', async function () {
      await time.increaseTo(this.start.add(this.cliffDuration).add(time.duration.weeks(12)));

      const vestedPre = vestedAmount(amount, await time.latest(), this.start, this.cliffDuration, this.duration);

      await this.vesting.revoke(this.token.address, { from: owner });

      const vestedPost = vestedAmount(amount, await time.latest(), this.start, this.cliffDuration, this.duration);

      expect(vestedPre).to.be.bignumber.equal(vestedPost);
    });

    it('should fail to be revoked a second time', async function () {
      await this.vesting.revoke(this.token.address, { from: owner });
      await expectRevert(this.vesting.revoke(this.token.address, { from: owner }),
        'TokenVesting: token already revoked'
      );
    });

    function vestedAmount (total, now, start, cliffDuration, duration) {
      return (now.lt(start.add(cliffDuration))) ? new BN(0) : total.mul((now.sub(start))).div(duration);
    }
  });
});
