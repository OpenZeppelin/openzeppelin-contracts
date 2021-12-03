const { expectRevert } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const CheckpointsImpl = artifacts.require('CheckpointsImpl');

contract('Checkpoints', function (accounts) {
  beforeEach(async function () {
    this.checkpoint = await CheckpointsImpl.new();
    this.tx1 = await this.checkpoint.push(1);
    this.tx2 = await this.checkpoint.push(2);
    this.tx3 = await this.checkpoint.push(3);
  });

  it('calls latest', async function () {
    expect(await this.checkpoint.latest()).to.be.bignumber.equal('3');
  });

  it('calls getAtBlock', async function () {
    expect(await this.checkpoint.getAtBlock(this.tx1.receipt.blockNumber - 1)).to.be.bignumber.equal('0');
    expect(await this.checkpoint.getAtBlock(this.tx2.receipt.blockNumber - 1)).to.be.bignumber.equal('1');
    expect(await this.checkpoint.getAtBlock(this.tx3.receipt.blockNumber - 1)).to.be.bignumber.equal('2');
  });

  it('reverts if block number >= current block', async function () {
    await expectRevert(
      this.checkpoint.getAtBlock(this.tx3.receipt.blockNumber + 1),
      'block not yet mined',
    );
  });
});
