const { BN, time } = require('@openzeppelin/test-helpers');
const ERC20SnapshotMock = artifacts.require('ERC20SnapshotEveryBlockMock');

const { expect } = require('chai');

function send (method, params = []) {
  return new Promise(resolve => web3.currentProvider.send({ jsonrpc: '2.0', method, params }, resolve));
}

contract('ERC20SnapshotEveryBlock', function (accounts) {
  const [ initialHolder, recipient, other ] = accounts;

  const initialSupply = new BN(100);

  const name = 'My Token';
  const symbol = 'MTKN';

  beforeEach(async function () {
    time.advanceBlock();
    this.token = await ERC20SnapshotMock.new(name, symbol, initialHolder, initialSupply);
  });

  describe('totalSupplyAt', function () {
    context('with initial snapshot', function () {
      context('with no supply changes after the snapshot', function () {
        it('returns the current total supply', async function () {
          const blockNumber = await web3.eth.getBlockNumber();
          expect(await this.token.totalSupply()).to.be.bignumber.equal(initialSupply);
          expect(await this.token.totalSupplyAt(0)).to.be.bignumber.equal('0');
          expect(await this.token.totalSupplyAt(blockNumber - 1)).to.be.bignumber.equal('0');
          expect(await this.token.totalSupplyAt(blockNumber)).to.be.bignumber.equal(initialSupply);
        });
      });

      context('with supply changes', function () {
        beforeEach(async function () {
          this.blockNumberBefore = await web3.eth.getBlockNumber();
          await this.token.mint(other, new BN('50'));
          await this.token.burn(initialHolder, new BN('20'));
          this.blockNumberAfter = await web3.eth.getBlockNumber();
        });

        it('returns the total supply before the changes', async function () {
          expect(await this.token.totalSupplyAt(this.blockNumberBefore)).to.be.bignumber.equal(initialSupply);
        });

        it('snapshots return the supply after the changes', async function () {
          expect(await this.token.totalSupplyAt(this.blockNumberAfter)).to.be.bignumber.equal(
            await this.token.totalSupply(),
          );
        });
      });
    });
  });

  describe('balanceOfAt', function () {
    context('with initial snapshot', function () {
      context('with no balance changes after the snapshot', function () {
        it('returns the current balance for all accounts', async function () {
          const blockNumber = await web3.eth.getBlockNumber();
          expect(await this.token.balanceOf(initialHolder)).to.be.bignumber.equal(initialSupply);
          expect(await this.token.balanceOfAt(initialHolder, 0)).to.be.bignumber.equal('0');
          expect(await this.token.balanceOfAt(initialHolder, blockNumber - 1)).to.be.bignumber.equal('0');
          expect(await this.token.balanceOfAt(initialHolder, blockNumber)).to.be.bignumber.equal(initialSupply);
        });
      });

      context('with balance changes', function () {
        beforeEach(async function () {
          this.blockNumberBefore = await web3.eth.getBlockNumber();
          await this.token.transfer(recipient, new BN('10'), { from: initialHolder });
          await this.token.mint(other, new BN('50'));
          await this.token.burn(initialHolder, new BN('20'));
          this.blockNumberAfter = await web3.eth.getBlockNumber();
        });

        it('returns the balances before the changes', async function () {
          expect(await this.token.balanceOfAt(initialHolder, this.blockNumberBefore))
            .to.be.bignumber.equal(initialSupply);
          expect(await this.token.balanceOfAt(recipient, this.blockNumberBefore))
            .to.be.bignumber.equal('0');
          expect(await this.token.balanceOfAt(other, this.blockNumberBefore))
            .to.be.bignumber.equal('0');
        });

        it('snapshots return the balances after the changes', async function () {
          expect(await this.token.balanceOfAt(initialHolder, this.blockNumberAfter))
            .to.be.bignumber.equal(await this.token.balanceOf(initialHolder));
          expect(await this.token.balanceOfAt(recipient, this.blockNumberAfter))
            .to.be.bignumber.equal(await this.token.balanceOf(recipient));
          expect(await this.token.balanceOfAt(other, this.blockNumberAfter))
            .to.be.bignumber.equal(await this.token.balanceOf(other));
        });
      });

      context('with multiple transfers in the same block', function () {
        beforeEach(async function () {
          this.blockNumberBefore = await web3.eth.getBlockNumber();

          await send('evm_setAutomine', [false]);
          const txs = Promise.all([
            this.token.transfer(recipient, new BN('10'), { from: initialHolder }),
            this.token.mint(other, new BN('50')),
            this.token.burn(initialHolder, new BN('20')),
          ]);

          await send('evm_setIntervalMining', [1000]);
          await txs;
          await send('evm_setAutomine', [true]);
          await send('evm_setIntervalMining', [false]);

          this.blockNumberAfter = await web3.eth.getBlockNumber();
          expect(this.blockNumberAfter).to.be.equal(this.blockNumberBefore + 1);
        });

        it('returns the balances before the changes', async function () {
          expect(await this.token.balanceOfAt(initialHolder, this.blockNumberBefore))
            .to.be.bignumber.equal(initialSupply);
          expect(await this.token.balanceOfAt(recipient, this.blockNumberBefore))
            .to.be.bignumber.equal('0');
          expect(await this.token.balanceOfAt(other, this.blockNumberBefore))
            .to.be.bignumber.equal('0');
        });

        it('snapshots return the balances after the changes', async function () {
          expect(await this.token.balanceOfAt(initialHolder, this.blockNumberAfter))
            .to.be.bignumber.equal(await this.token.balanceOf(initialHolder));
          expect(await this.token.balanceOfAt(recipient, this.blockNumberAfter))
            .to.be.bignumber.equal(await this.token.balanceOf(recipient));
          expect(await this.token.balanceOfAt(other, this.blockNumberAfter))
            .to.be.bignumber.equal(await this.token.balanceOf(other));
        });
      });
    });
  });
});
