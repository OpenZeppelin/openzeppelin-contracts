const { BN, time, expectRevert } = require('@openzeppelin/test-helpers');
const ERC20SnapshotMock = artifacts.require('ERC20SnapshotEveryBlockMock');

const { expect } = require('chai');

function send (method, params = []) {
  return new Promise(resolve => web3.currentProvider.send({ jsonrpc: '2.0', method, params }, resolve));
}

async function batchInBlock (txs) {
  const before = await web3.eth.getBlockNumber();

  await send('evm_setAutomine', [false]);
  const promises = Promise.all(txs.map(fn => fn()));
  await send('evm_setIntervalMining', [1000]);
  const receipts = await promises;
  await send('evm_setAutomine', [true]);
  await send('evm_setIntervalMining', [false]);

  expect(await web3.eth.getBlockNumber()).to.be.equal(before + 1);

  return receipts;
}

contract('ERC20SnapshotEveryBlock', function (accounts) {
  const [ initialHolder, recipient, other ] = accounts;

  const initialSupply = new BN(100);

  const name = 'My Token';
  const symbol = 'MTKN';

  beforeEach(async function () {
    time.advanceBlock();
    this.token = await ERC20SnapshotMock.new(name, symbol, initialHolder, initialSupply);
    this.initialBlock = await web3.eth.getBlockNumber();
  });

  describe('totalSupplyAt', function () {
    it('reverts with a snapshot id of 0', async function () {
      await expectRevert(this.token.totalSupplyAt(0), 'ERC20Snapshot: id is 0');
    });

    context('with no supply changes after the snapshot', function () {
      it('snapshot before initial supply', async function () {
        expect(await this.token.totalSupplyAt(this.initialBlock)).to.be.bignumber.equal('0');
      });

      it('snapshot after initial supply', async function () {
        await time.advanceBlock();
        expect(await this.token.totalSupplyAt(this.initialBlock + 1)).to.be.bignumber.equal(initialSupply);
      });
    });

    context('with supply changes', function () {
      beforeEach(async function () {
        await batchInBlock([
          () => this.token.mint(other, new BN('50')),
          () => this.token.burn(initialHolder, new BN('20')),
        ]);
        this.operationBlockNumber = await web3.eth.getBlockNumber();
      });

      it('returns the total supply before the changes', async function () {
        expect(await this.token.totalSupplyAt(this.operationBlockNumber))
          .to.be.bignumber.equal(initialSupply);
      });

      it('snapshots return the supply after the changes', async function () {
        await time.advanceBlock();
        expect(await this.token.totalSupplyAt(this.operationBlockNumber + 1))
          .to.be.bignumber.equal(initialSupply.addn(50).subn(20));
      });
    });

    describe('with multiple operations over multiple blocks', function () {
      beforeEach(async function () {
        this.snapshots = [ this.initialBlock ];
        await this.token.mint(other, new BN('50'));
        this.snapshots.push(await web3.eth.getBlockNumber());
        await this.token.transfer(recipient, new BN('10'), { from: initialHolder });
        this.snapshots.push(await web3.eth.getBlockNumber());
        await this.token.burn(initialHolder, new BN('20'));
        this.snapshots.push(await web3.eth.getBlockNumber());
        await time.advanceBlock();
        this.snapshots.push(await web3.eth.getBlockNumber());
      });

      it('check snapshots', async function () {
        expect(await this.token.totalSupplyAt(this.snapshots[0]))
          .to.be.bignumber.equal('0');
        // initial mint
        expect(await this.token.totalSupplyAt(this.snapshots[1]))
          .to.be.bignumber.equal(initialSupply);
        // mint 50
        expect(await this.token.totalSupplyAt(this.snapshots[2]))
          .to.be.bignumber.equal(initialSupply.addn(50));
        // transfer: no change
        expect(await this.token.totalSupplyAt(this.snapshots[3]))
          .to.be.bignumber.equal(initialSupply.addn(50));
        // burn 20
        expect(await this.token.totalSupplyAt(this.snapshots[4]))
          .to.be.bignumber.equal(initialSupply.addn(50).subn(20));
      });
    });
  });

  describe('balanceOfAt', function () {
    it('reverts with a snapshot id of 0', async function () {
      await expectRevert(this.token.balanceOfAt(initialHolder, 0), 'ERC20Snapshot: id is 0');
    });

    context('with no supply changes after the snapshot', function () {
      it('snapshot before initial supply', async function () {
        expect(await this.token.balanceOfAt(initialHolder, this.initialBlock))
          .to.be.bignumber.equal('0');
      });

      it('snapshot after initial supply', async function () {
        await time.advanceBlock();
        expect(await this.token.balanceOfAt(initialHolder, this.initialBlock + 1))
          .to.be.bignumber.equal(initialSupply);
      });
    });

    context('with balance changes', function () {
      beforeEach(async function () {
        await batchInBlock([
          () => this.token.transfer(recipient, new BN('10'), { from: initialHolder }),
          () => this.token.mint(other, new BN('50')),
          () => this.token.burn(initialHolder, new BN('20')),
        ]);
        this.operationBlockNumber = await web3.eth.getBlockNumber();
      });

      it('returns the balances before the changes', async function () {
        expect(await this.token.balanceOfAt(initialHolder, this.operationBlockNumber))
          .to.be.bignumber.equal(initialSupply);
        expect(await this.token.balanceOfAt(recipient, this.operationBlockNumber))
          .to.be.bignumber.equal('0');
        expect(await this.token.balanceOfAt(other, this.operationBlockNumber))
          .to.be.bignumber.equal('0');
      });

      it('snapshots return the balances after the changes', async function () {
        await time.advanceBlock();
        expect(await this.token.balanceOfAt(initialHolder, this.operationBlockNumber + 1))
          .to.be.bignumber.equal(initialSupply.subn(10).subn(20));
        expect(await this.token.balanceOfAt(recipient, this.operationBlockNumber + 1))
          .to.be.bignumber.equal('10');
        expect(await this.token.balanceOfAt(other, this.operationBlockNumber + 1))
          .to.be.bignumber.equal('50');
      });
    });

    describe('with multiple operations over multiple blocks', function () {
      beforeEach(async function () {
        this.snapshots = [ this.initialBlock ];
        await this.token.mint(other, new BN('50'));
        this.snapshots.push(await web3.eth.getBlockNumber());
        await this.token.transfer(recipient, new BN('10'), { from: initialHolder });
        this.snapshots.push(await web3.eth.getBlockNumber());
        await this.token.burn(initialHolder, new BN('20'));
        this.snapshots.push(await web3.eth.getBlockNumber());
        await time.advanceBlock();
        this.snapshots.push(await web3.eth.getBlockNumber());
      });

      it('check snapshots', async function () {
        expect(await this.token.balanceOfAt(initialHolder, this.snapshots[0]))
          .to.be.bignumber.equal('0');
        expect(await this.token.balanceOfAt(recipient, this.snapshots[0]))
          .to.be.bignumber.equal('0');
        expect(await this.token.balanceOfAt(other, this.snapshots[0]))
          .to.be.bignumber.equal('0');
        // initial mint
        expect(await this.token.balanceOfAt(initialHolder, this.snapshots[1]))
          .to.be.bignumber.equal(initialSupply);
        expect(await this.token.balanceOfAt(recipient, this.snapshots[1]))
          .to.be.bignumber.equal('0');
        expect(await this.token.balanceOfAt(other, this.snapshots[1]))
          .to.be.bignumber.equal('0');
        // mint 50
        expect(await this.token.balanceOfAt(initialHolder, this.snapshots[2]))
          .to.be.bignumber.equal(initialSupply);
        expect(await this.token.balanceOfAt(recipient, this.snapshots[2]))
          .to.be.bignumber.equal('0');
        expect(await this.token.balanceOfAt(other, this.snapshots[2]))
          .to.be.bignumber.equal('50');
        // transfer
        expect(await this.token.balanceOfAt(initialHolder, this.snapshots[3]))
          .to.be.bignumber.equal(initialSupply.subn(10));
        expect(await this.token.balanceOfAt(recipient, this.snapshots[3]))
          .to.be.bignumber.equal('10');
        expect(await this.token.balanceOfAt(other, this.snapshots[3]))
          .to.be.bignumber.equal('50');
        // burn 20
        expect(await this.token.balanceOfAt(initialHolder, this.snapshots[4]))
          .to.be.bignumber.equal(initialSupply.subn(10).subn(20));
        expect(await this.token.balanceOfAt(recipient, this.snapshots[4]))
          .to.be.bignumber.equal('10');
        expect(await this.token.balanceOfAt(other, this.snapshots[4]))
          .to.be.bignumber.equal('50');
      });
    });
  });
});
