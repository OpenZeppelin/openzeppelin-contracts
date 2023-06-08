const { BN, expectRevert } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const ERC20Pausable = artifacts.require('$ERC20Pausable');

contract('ERC20Pausable', function (accounts) {
  const [holder, recipient, anotherAccount] = accounts;

  const initialSupply = new BN(100);

  const name = 'My Token';
  const symbol = 'MTKN';

  beforeEach(async function () {
    this.token = await ERC20Pausable.new(name, symbol);
    await this.token.$_mint(holder, initialSupply);
  });

  describe('pausable token', function () {
    describe('transfer', function () {
      it('allows to transfer when unpaused', async function () {
        await this.token.transfer(recipient, initialSupply, { from: holder });

        expect(await this.token.balanceOf(holder)).to.be.bignumber.equal('0');
        expect(await this.token.balanceOf(recipient)).to.be.bignumber.equal(initialSupply);
      });

      it('allows to transfer when paused and then unpaused', async function () {
        await this.token.$_pause();
        await this.token.$_unpause();

        await this.token.transfer(recipient, initialSupply, { from: holder });

        expect(await this.token.balanceOf(holder)).to.be.bignumber.equal('0');
        expect(await this.token.balanceOf(recipient)).to.be.bignumber.equal(initialSupply);
      });

      it('reverts when trying to transfer when paused', async function () {
        await this.token.$_pause();

        await expectRevert(
          this.token.transfer(recipient, initialSupply, { from: holder }),
          'ERC20Pausable: token transfer while paused',
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
        await this.token.$_pause();
        await this.token.$_unpause();

        await this.token.transferFrom(holder, recipient, allowance, { from: anotherAccount });

        expect(await this.token.balanceOf(recipient)).to.be.bignumber.equal(allowance);
        expect(await this.token.balanceOf(holder)).to.be.bignumber.equal(initialSupply.sub(allowance));
      });

      it('reverts when trying to transfer from when paused', async function () {
        await this.token.$_pause();

        await expectRevert(
          this.token.transferFrom(holder, recipient, allowance, { from: anotherAccount }),
          'ERC20Pausable: token transfer while paused',
        );
      });
    });

    describe('mint', function () {
      const amount = new BN('42');

      it('allows to mint when unpaused', async function () {
        await this.token.$_mint(recipient, amount);

        expect(await this.token.balanceOf(recipient)).to.be.bignumber.equal(amount);
      });

      it('allows to mint when paused and then unpaused', async function () {
        await this.token.$_pause();
        await this.token.$_unpause();

        await this.token.$_mint(recipient, amount);

        expect(await this.token.balanceOf(recipient)).to.be.bignumber.equal(amount);
      });

      it('reverts when trying to mint when paused', async function () {
        await this.token.$_pause();

        await expectRevert(this.token.$_mint(recipient, amount), 'ERC20Pausable: token transfer while paused');
      });
    });

    describe('burn', function () {
      const amount = new BN('42');

      it('allows to burn when unpaused', async function () {
        await this.token.$_burn(holder, amount);

        expect(await this.token.balanceOf(holder)).to.be.bignumber.equal(initialSupply.sub(amount));
      });

      it('allows to burn when paused and then unpaused', async function () {
        await this.token.$_pause();
        await this.token.$_unpause();

        await this.token.$_burn(holder, amount);

        expect(await this.token.balanceOf(holder)).to.be.bignumber.equal(initialSupply.sub(amount));
      });

      it('reverts when trying to burn when paused', async function () {
        await this.token.$_pause();

        await expectRevert(this.token.$_burn(holder, amount), 'ERC20Pausable: token transfer while paused');
      });
    });
  });
});
