const { expectThrow } = require('../helpers/expectThrow');
const { ethSendTransaction, ethGetBalance } = require('../helpers/web3');

const HasNoEtherTest = artifacts.require('HasNoEtherTest');
const ForceEther = artifacts.require('ForceEther');

contract('HasNoEther', function (accounts) {
  const amount = web3.toWei('1', 'ether');

  it('should be constructible', async function () {
    await HasNoEtherTest.new();
  });

  it('should not accept ether in constructor', async function () {
    await expectThrow(HasNoEtherTest.new({ value: amount }));
  });

  it('should not accept ether', async function () {
    const hasNoEther = await HasNoEtherTest.new();

    await expectThrow(
      ethSendTransaction({
        from: accounts[1],
        to: hasNoEther.address,
        value: amount,
      }),
    );
  });

  it('should allow owner to reclaim ether', async function () {
    // Create contract
    const hasNoEther = await HasNoEtherTest.new();
    const startBalance = await ethGetBalance(hasNoEther.address);
    assert.equal(startBalance, 0);

    // Force ether into it
    const forceEther = await ForceEther.new({ value: amount });
    await forceEther.destroyAndSend(hasNoEther.address);
    const forcedBalance = await ethGetBalance(hasNoEther.address);
    assert.equal(forcedBalance, amount);

    // Reclaim
    const ownerStartBalance = await ethGetBalance(accounts[0]);
    await hasNoEther.reclaimEther();
    const ownerFinalBalance = await ethGetBalance(accounts[0]);
    const finalBalance = await ethGetBalance(hasNoEther.address);
    assert.equal(finalBalance, 0);
    assert.isTrue(ownerFinalBalance.greaterThan(ownerStartBalance));
  });

  it('should allow only owner to reclaim ether', async function () {
    // Create contract
    const hasNoEther = await HasNoEtherTest.new({ from: accounts[0] });

    // Force ether into it
    const forceEther = await ForceEther.new({ value: amount });
    await forceEther.destroyAndSend(hasNoEther.address);
    const forcedBalance = await ethGetBalance(hasNoEther.address);
    assert.equal(forcedBalance, amount);

    // Reclaim
    await expectThrow(hasNoEther.reclaimEther({ from: accounts[1] }));
  });
});
