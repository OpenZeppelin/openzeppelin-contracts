const ECRecoveryMock = artifacts.require('ECRecoveryMock');
const ECRecoveryLib = artifacts.require('ECRecovery');

contract('ECRecovery', function (accounts) {
  let ecrecovery;
  const TEST_MESSAGE = 'OpenZeppelin';

  before(async function () {
    const ecRecoveryLib = await ECRecoveryLib.new();
    ECRecoveryMock.link('ECRecovery', ecRecoveryLib.address);
    ecrecovery = await ECRecoveryMock.new();
  });

  it('recover using web3.eth.sign()', async function () {
    // Create the signature using account[0]
    const signature = web3.eth.sign(accounts[0], web3.sha3(TEST_MESSAGE));

    // Recover the signer address from the generated message and signature.
    await ecrecovery.recover(web3.sha3(TEST_MESSAGE), signature);
    assert.equal(accounts[0], await ecrecovery.addrRecovered());
  });

  it('recover using web3.eth.sign() should return wrong signer', async function () {
    // Create the signature using account[0]
    const signature = web3.eth.sign(accounts[0], web3.sha3(TEST_MESSAGE));

    // Recover the signer address from the generated message and wrong signature.
    await ecrecovery.recover(web3.sha3('Test'), signature);
    assert.notEqual(accounts[0], await ecrecovery.addrRecovered());
  });

  it('recover should fail when a wrong hash is sent', async function () {
    // Create the signature using account[0]
    const signature = web3.eth.sign(accounts[0], web3.sha3(TEST_MESSAGE));

    // Recover the signer address from the generated message and wrong signature.
    await ecrecovery.recover(web3.sha3(TEST_MESSAGE).substring(2), signature);
    assert.equal('0x0000000000000000000000000000000000000000', await ecrecovery.addrRecovered());
  });
});
