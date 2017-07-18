var ECRecovery = artifacts.require("../contracts/ECRecovery.sol");
var utils = require('ethereumjs-util');
var hashMessage = require('./helpers/hashMessage.js');

contract('ECRecovery', function(accounts) {

  let ecrecovery;

  before(async function() {
    ecrecovery = await ECRecovery.new();
  });

  it("recover v0", async function() {
    // Signature generated outside testrpc with method web3.eth.sign(signer, message)
    let signer = '0x2cc1166f6212628a0deef2b33befb2187d35b86c';
    let message = '0x7dbaf558b0a1a5dc7a67202117ab143c1d8605a983e4a743bc06fcc03162dc0d'; // web3.sha3('OpenZeppelin')
    let signature = '0x5d99b6f7f6d1f73d1a26497f2b1c89b24c0993913f86e9a2d02cd69887d9c94f3c880358579d811b21dd1b7fd9bb01c1d81d10e69f0384e675c32b39643be89200';
    assert.equal(signer, await ecrecovery.recover(message, signature));
  });

  it("recover v1", async function() {
    // Signature generated outside testrpc with method web3.eth.sign(signer, message)
    let signer = '0x1e318623ab09fe6de3c9b8672098464aeda9100e';
    let message = '0x7dbaf558b0a1a5dc7a67202117ab143c1d8605a983e4a743bc06fcc03162dc0d'; // web3.sha3('OpenZeppelin')
    let signature = '0x331fe75a821c982f9127538858900d87d3ec1f9f737338ad67cad133fa48feff48e6fa0c18abc62e42820f05943e47af3e9fbe306ce74d64094bdf1691ee53e001';
    assert.equal(signer, await ecrecovery.recover(message, signature));
  });

  it("recover using web3.eth.sign()", async function() {
    // Create the signature using account[0]
    const signature = web3.eth.sign(web3.eth.accounts[0], web3.sha3('OpenZeppelin'));

    // Recover the signer address form the generated message and signature.
    assert.equal(web3.eth.accounts[0], await ecrecovery.recover(hashMessage('OpenZeppelin'), signature));
  });

  it("recover using web3.eth.sign() should return wrong signer", async function() {
    // Create the signature using account[0]
    const signature = web3.eth.sign(web3.eth.accounts[0], web3.sha3('OpenZeppelin'));

    // Recover the signer address form the generated message and wrong signature.
    assert.notEqual(web3.eth.accounts[0], await ecrecovery.recover(hashMessage('Test'), signature));
  });

  it("recover should fail when a wrong hash is sent", async function() {
    // Create the signature using account[0]
    let signature = web3.eth.sign(web3.eth.accounts[0], web3.sha3('OpenZeppelin'));

    // Recover the signer address form the generated message and wrong signature.
    assert.equal('0x0000000000000000000000000000000000000000',
      await ecrecovery.recover(hashMessage('OpenZeppelin').substring(2), signature)
    );
  });

});
