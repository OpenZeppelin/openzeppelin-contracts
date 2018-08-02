const { expectThrow } = require('../helpers/expectThrow');
const { ethSendTransaction, ethGetBalance } = require('../helpers/web3');

const HasNoEtherTest = artifacts.require('HasNoEtherTest');
const ForceEther = artifacts.require('ForceEther');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('HasNoEther', function ([_, owner, anyone]) {
  const amount = web3.toWei('1', 'ether');

  beforeEach(async function () {
    this.hasNoEther = await HasNoEtherTest.new({ from: owner });
  });

  it('should not accept ether in constructor', async function () {
    await expectThrow(HasNoEtherTest.new({ value: amount }));
  });

  it('should not accept ether', async function () {
    await expectThrow(
      ethSendTransaction({
        from: owner,
        to: this.hasNoEther.address,
        value: amount,
      }),
    );
  });

  it('should allow owner to reclaim ether', async function () {
    const startBalance = await ethGetBalance(this.hasNoEther.address);
    assert.equal(startBalance, 0);

    // Force ether into it
    const forceEther = await ForceEther.new({ value: amount });
    await forceEther.destroyAndSend(this.hasNoEther.address);
    const forcedBalance = await ethGetBalance(this.hasNoEther.address);
    assert.equal(forcedBalance, amount);

    // Reclaim
    const ownerStartBalance = await ethGetBalance(owner);
    await this.hasNoEther.reclaimEther({ from: owner });
    const ownerFinalBalance = await ethGetBalance(owner);
    const finalBalance = await ethGetBalance(this.hasNoEther.address);
    assert.equal(finalBalance, 0);

    ownerFinalBalance.should.be.bignumber.gt(ownerStartBalance);
  });

  it('should allow only owner to reclaim ether', async function () {
    // Force ether into it
    const forceEther = await ForceEther.new({ value: amount });
    await forceEther.destroyAndSend(this.hasNoEther.address);
    const forcedBalance = await ethGetBalance(this.hasNoEther.address);
    assert.equal(forcedBalance, amount);

    // Reclaim
    await expectThrow(this.hasNoEther.reclaimEther({ from: anyone }));
  });
});
