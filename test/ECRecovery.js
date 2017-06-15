var ECRecovery = artifacts.require("../contracts/ECRecovery.sol");

contract('ECRecovery', function(accounts) {

  let ecrecovery;

  before(async function() {
    ecrecovery = await ECRecovery.new();
  });

  it.only("recover v0", async function() {
    let signer = '0x2cc1166f6212628a0deef2b33befb2187d35b86c';
    let message = '0x7dbaf558b0a1a5dc7a67202117ab143c1d8605a983e4a743bc06fcc03162dc0d'; // web3.sha3('OpenZeppelin')
    let signature = '0x5d99b6f7f6d1f73d1a26497f2b1c89b24c0993913f86e9a2d02cd69887d9c94f3c880358579d811b21dd1b7fd9bb01c1d81d10e69f0384e675c32b39643be89200';
    assert.equal(signer, await ecrecovery.recover(message, signature));
  });

  it.only("recover v1", async function() {
    let signer = '0x1e318623ab09fe6de3c9b8672098464aeda9100e';
    let message = '0x7dbaf558b0a1a5dc7a67202117ab143c1d8605a983e4a743bc06fcc03162dc0d'; // web3.sha3('OpenZeppelin')
    let signature = '0x331fe75a821c982f9127538858900d87d3ec1f9f737338ad67cad133fa48feff48e6fa0c18abc62e42820f05943e47af3e9fbe306ce74d64094bdf1691ee53e001';
    assert.equal(signer, await ecrecovery.recover(message, signature));
  });

  it.only("safeRecover v0", async function() {
    let signer = '0x58d5f9f841bcf9e502b438cc81d1ea3ba3f8f7f3';
    let message = '0x7dbaf558b0a1a5dc7a67202117ab143c1d8605a983e4a743bc06fcc03162dc0d'; // web3.sha3('OpenZeppelin')
    let signature = '3690f285f30200dfacd35b9ee9af4beaf2c2f4b7880d93dd9bdf776e8fdbec6a095d00c80e20e95a68c8effc038707dd740aabf94a6ca37c09733874f772d6e000';
    let v = (signature.substring(128,130) == '01') ? 28 : 27;
    let r = '0x'+signature.substring(0,64);
    let s = '0x'+signature.substring(64,128);
    let result = await ecrecovery.safeRecover(message, v, r, s);
    assert.equal(signer, result[1]);
    assert.equal(true, result[0]);
  });

  it.only("safeRecover v1", async function() {
    let signer = '0x0b8124c2429c44e8ca31e7db6f85845abf146415';
    let message = '0x7dbaf558b0a1a5dc7a67202117ab143c1d8605a983e4a743bc06fcc03162dc0d'; // web3.sha3('OpenZeppelin')
    let signature = '7696f87b3f14e2f1c408c552c0005479bfe35df3a9efb493a2ad2bdf25d95c8c605b6f83699faca9bcbc3c665b434ed8d9c717aa71a1916f054fc41671dd38ad01';
    let v = (signature.substring(128,130) == '01') ? 28 : 27;
    let r = '0x'+signature.substring(0,64);
    let s = '0x'+signature.substring(64,128);
    let result = await ecrecovery.safeRecover(message, v, r, s);
    assert.equal(signer, result[1]);
    assert.equal(true, result[0]);
  });

});
