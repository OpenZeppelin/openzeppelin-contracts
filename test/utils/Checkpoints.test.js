const { expectRevert, time } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const CheckpointsImpl = artifacts.require('CheckpointsImpl');

contract('Checkpoints', function (accounts) {
  beforeEach(async function () {
    this.checkpoint = await CheckpointsImpl.new();
  });

  describe('without checkpoints', function () {
    it('returns zero as latest value', async function () {
      expect(await this.checkpoint.latest()).to.be.bignumber.equal('0');
    });

    it('returns zero as past value', async function () {
      await time.advanceBlock();
      expect(await this.checkpoint.getAtBlock(await web3.eth.getBlockNumber() - 1)).to.be.bignumber.equal('0');
    });
  });

  describe('with checkpoints', function () {
    beforeEach('pushing checkpoints', async function () {
      this.tx1 = await this.checkpoint.push(1);
      this.tx2 = await this.checkpoint.push(2);
      await time.advanceBlock();
      this.tx3 = await this.checkpoint.push(3);
      await time.advanceBlock();
      await time.advanceBlock();
    });

    it('returns latest value', async function () {
      expect(await this.checkpoint.latest()).to.be.bignumber.equal('3');
    });

    it('returns past values', async function () {
      expect(await this.checkpoint.getAtBlock(this.tx1.receipt.blockNumber - 1)).to.be.bignumber.equal('0');
      expect(await this.checkpoint.getAtBlock(this.tx1.receipt.blockNumber)).to.be.bignumber.equal('1');
      expect(await this.checkpoint.getAtBlock(this.tx2.receipt.blockNumber)).to.be.bignumber.equal('2');
      // Block with no new checkpoints
      expect(await this.checkpoint.getAtBlock(this.tx2.receipt.blockNumber + 1)).to.be.bignumber.equal('2');
      expect(await this.checkpoint.getAtBlock(this.tx3.receipt.blockNumber)).to.be.bignumber.equal('3');
      expect(await this.checkpoint.getAtBlock(this.tx3.receipt.blockNumber + 1)).to.be.bignumber.equal('3');
    });

    it('reverts if block number >= current block', async function () {
      await expectRevert(
        this.checkpoint.getAtBlock(await web3.eth.getBlockNumber()),
        'Checkpoints: block not yet mined',
      );

      await expectRevert(
        this.checkpoint.getAtBlock(await web3.eth.getBlockNumber() + 1),
        'Checkpoints: block not yet mined',
      );
    });
  });
});
