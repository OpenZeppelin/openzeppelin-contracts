const { BN, expectRevert, time } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const ERC20Mock = artifacts.require('ERC20Mock');
const TokenTimelock = artifacts.require('TokenTimelock');

contract('TokenTimelock', function (accounts) {
  const [ beneficiary ] = accounts;

  const name = 'My Token';
  const symbol = 'MTKN';

  const amount = new BN(100);

  context('with token', function () {
    beforeEach(async function () {
      this.token = await ERC20Mock.new(name, symbol, beneficiary, 0); // We're not using the preminted tokens
    });

    it('rejects a release time in the past', async function () {
      const pastReleaseTime = (await time.latest()).sub(time.duration.years(1));
      await expectRevert(
        TokenTimelock.new(this.token.address, beneficiary, pastReleaseTime),
        'TokenTimelock: release time is before current time',
      );
    });

    context('once deployed', function () {
      beforeEach(async function () {
        this.releaseTime = (await time.latest()).add(time.duration.years(1));
        this.timelock = await TokenTimelock.new(this.token.address, beneficiary, this.releaseTime);
        await this.token.mint(this.timelock.address, amount);
      });

      it('can get state', async function () {
        expect(await this.timelock.token()).to.equal(this.token.address);
        expect(await this.timelock.beneficiary()).to.equal(beneficiary);
        expect(await this.timelock.releaseTime()).to.be.bignumber.equal(this.releaseTime);
      });

      it('cannot be released before time limit', async function () {
        await expectRevert(this.timelock.release(), 'TokenTimelock: current time is before release time');
      });

      it('cannot be released just before time limit', async function () {
        await time.increaseTo(this.releaseTime.sub(time.duration.seconds(3)));
        await expectRevert(this.timelock.release(), 'TokenTimelock: current time is before release time');
      });

      it('can be released just after limit', async function () {
        await time.increaseTo(this.releaseTime.add(time.duration.seconds(1)));
        await this.timelock.release();
        expect(await this.token.balanceOf(beneficiary)).to.be.bignumber.equal(amount);
      });

      it('can be released after time limit', async function () {
        await time.increaseTo(this.releaseTime.add(time.duration.years(1)));
        await this.timelock.release();
        expect(await this.token.balanceOf(beneficiary)).to.be.bignumber.equal(amount);
      });

      it('cannot be released twice', async function () {
        await time.increaseTo(this.releaseTime.add(time.duration.years(1)));
        await this.timelock.release();
        await expectRevert(this.timelock.release(), 'TokenTimelock: no tokens to release');
        expect(await this.token.balanceOf(beneficiary)).to.be.bignumber.equal(amount);
      });
    });
  });
});
