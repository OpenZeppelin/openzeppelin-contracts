const { expectRevert, time } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const CheckpointsImpl = artifacts.require('CheckpointsImpl');

contract('Checkpoints', function (accounts) {
  beforeEach(async function () {
    this.checkpoint = await CheckpointsImpl.new();
  });

  it('calls latest without checkpoints', async function () {
    expect(await this.checkpoint.latest()).to.be.bignumber.equal('0');
  });

  describe('with checkpoints', function () {
    beforeEach(async function () {
      this.tx1 = await this.checkpoint.push(1);
      this.tx2 = await this.checkpoint.push(2);
      await time.advanceBlock();
      this.tx3 = await this.checkpoint.push(3);
    });

    it('calls latest', async function () {
      expect(await this.checkpoint.latest()).to.be.bignumber.equal('3');
    });

    it('calls getAtBlock', async function () {
      expect(await this.checkpoint.getAtBlock(this.tx1.receipt.blockNumber - 1)).to.be.bignumber.equal('0');
      expect(await this.checkpoint.getAtBlock(this.tx2.receipt.blockNumber - 1)).to.be.bignumber.equal('1');
      // Block with no new checkpoints
      expect(await this.checkpoint.getAtBlock(this.tx2.receipt.blockNumber + 1)).to.be.bignumber.equal('2');
      expect(await this.checkpoint.getAtBlock(this.tx3.receipt.blockNumber - 1)).to.be.bignumber.equal('2');
      await time.advanceBlock();
      await time.advanceBlock();
      expect(await this.checkpoint.getAtBlock(this.tx3.receipt.blockNumber + 1)).to.be.bignumber.equal('3');
    });

    it('reverts if block number >= current block', async function () {
      await expectRevert(
        this.checkpoint.getAtBlock(this.tx3.receipt.blockNumber + 1),
        'Checkpoints: block not yet mined',
      );

      await expectRevert(
        this.checkpoint.getAtBlock(this.tx3.receipt.blockNumber),
        'Checkpoints: block not yet mined',
      );
    });
  });
});
