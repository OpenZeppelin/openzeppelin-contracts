const { accounts, contract } = require('@openzeppelin/test-environment');

const { BN, expectRevert } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const ERC20PausableMock = contract.fromArtifact('ERC20PausableMock');

describe('ERC20Pausable', function () {
  const [ holder, recipient, anotherAccount ] = accounts;

  const initialSupply = new BN(100);

  beforeEach(async function () {
    this.token = await ERC20PausableMock.new(holder, initialSupply);
  });

  describe('pausable token', function () {
    describe('transfer', function () {
      it('allows to transfer when unpaused', async function () {
        await this.token.transfer(recipient, initialSupply, { from: holder });

        expect(await this.token.balanceOf(holder)).to.be.bignumber.equal('0');
        expect(await this.token.balanceOf(recipient)).to.be.bignumber.equal(initialSupply);
      });

      it('allows to transfer when paused and then unpaused', async function () {
        await this.token.pause();
        await this.token.unpause();

        await this.token.transfer(recipient, initialSupply, { from: holder });

        expect(await this.token.balanceOf(holder)).to.be.bignumber.equal('0');
        expect(await this.token.balanceOf(recipient)).to.be.bignumber.equal(initialSupply);
      });

      it('reverts when trying to transfer when paused', async function () {
        await this.token.pause();

        await expectRevert(this.token.transfer(recipient, initialSupply, { from: holder }),
          'ERC20Pausable: token transfer while paused'
        );
      });
    });

    describe('approve', function () {
      const allowance = new BN(40);

      it('allows to approve when unpaused', async function () {
        await this.token.approve(anotherAccount, allowance, { from: holder });

        expect(await this.token.allowance(holder, anotherAccount)).to.be.bignumber.equal(allowance);
      });

      it('allows to approve when paused and then unpaused', async function () {
        await this.token.pause();
        await this.token.unpause();

        await this.token.approve(anotherAccount, allowance, { from: holder });

        expect(await this.token.allowance(holder, anotherAccount)).to.be.bignumber.equal(allowance);
      });

      it('reverts when trying to approve when paused', async function () {
        await this.token.pause();

        await expectRevert(this.token.approve(anotherAccount, allowance, { from: holder }),
          'ERC20Pausable: token approval while paused'
        );
      });
    });

    describe('transfer from', function () {
      const allowance = new BN(40);

      beforeEach(async function () {
        await this.token.approve(anotherAccount, allowance, { from: holder });
      });

      it('allows to transfer from when unpaused', async function () {
        await this.token.transferFrom(holder, recipient, allowance, { from: anotherAccount });

        expect(await this.token.balanceOf(recipient)).to.be.bignumber.equal(allowance);
        expect(await this.token.balanceOf(holder)).to.be.bignumber.equal(initialSupply.sub(allowance));
      });

      it('allows to transfer when paused and then unpaused', async function () {
        await this.token.pause();
        await this.token.unpause();

        await this.token.transferFrom(holder, recipient, allowance, { from: anotherAccount });

        expect(await this.token.balanceOf(recipient)).to.be.bignumber.equal(allowance);
        expect(await this.token.balanceOf(holder)).to.be.bignumber.equal(initialSupply.sub(allowance));
      });

      it('reverts when trying to transfer from when paused', async function () {
        await this.token.pause();

        await expectRevert(this.token.transferFrom(
          holder, recipient, allowance, { from: anotherAccount }), 'ERC20Pausable: token transfer while paused'
        );
      });
    });

    describe('decrease approval', function () {
      const allowance = new BN(40);
      const decrement = new BN(10);

      beforeEach(async function () {
        await this.token.approve(anotherAccount, allowance, { from: holder });
      });

      it('allows to decrease approval when unpaused', async function () {
        await this.token.decreaseAllowance(anotherAccount, decrement, { from: holder });

        expect(await this.token.allowance(holder, anotherAccount)).to.be.bignumber.equal(allowance.sub(decrement));
      });

      it('allows to decrease approval when paused and then unpaused', async function () {
        await this.token.pause();
        await this.token.unpause();

        await this.token.decreaseAllowance(anotherAccount, decrement, { from: holder });

        expect(await this.token.allowance(holder, anotherAccount)).to.be.bignumber.equal(allowance.sub(decrement));
      });

      it('reverts when trying to transfer when paused', async function () {
        await this.token.pause();

        await expectRevert(this.token.decreaseAllowance(
          anotherAccount, decrement, { from: holder }), 'ERC20Pausable: token approval while paused'
        );
      });
    });

    describe('increase approval', function () {
      const allowance = new BN(40);
      const increment = new BN(30);

      beforeEach(async function () {
        await this.token.approve(anotherAccount, allowance, { from: holder });
      });

      it('allows to increase approval when unpaused', async function () {
        await this.token.increaseAllowance(anotherAccount, increment, { from: holder });

        expect(await this.token.allowance(holder, anotherAccount)).to.be.bignumber.equal(allowance.add(increment));
      });

      it('allows to increase approval when paused and then unpaused', async function () {
        await this.token.pause();
        await this.token.unpause();

        await this.token.increaseAllowance(anotherAccount, increment, { from: holder });

        expect(await this.token.allowance(holder, anotherAccount)).to.be.bignumber.equal(allowance.add(increment));
      });

      it('reverts when trying to increase approval when paused', async function () {
        await this.token.pause();

        await expectRevert(this.token.increaseAllowance(
          anotherAccount, increment, { from: holder }), 'ERC20Pausable: token approval while paused'
        );
      });
    });
  });
});
