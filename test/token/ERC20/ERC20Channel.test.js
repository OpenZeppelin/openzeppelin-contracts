import latestTime from '../../helpers/latestTime';
import { increaseTimeTo } from '../../helpers/increaseTime';
var ethUtils = require('ethereumjs-util');

var BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

import EVMRevert from '../../helpers/EVMRevert';

var StandardTokenMock = artifacts.require('StandardTokenMock.sol');
var ERC20Channels = artifacts.require('ERC20Channels.sol');
var ECRecovery = artifacts.require('ECRecovery.sol');

contract('ERC20Channels', function ([_, receiver, sender]) {
  var token;
  var tokenChannels;

  // This private keys should match the ones used by testrpc
  const privateKeys = {};
  privateKeys[receiver] = '0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501201';
  privateKeys[sender] = '0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501202';

  // Sign a message with a private key, it returns the signature in rpc format
  function signMsg (msg, pvKey) {
    const sig = ethUtils.ecsign(ethUtils.toBuffer(msg), ethUtils.toBuffer(pvKey));
    return ethUtils.toRpcSig(sig.v, sig.r, sig.s);
  }

  beforeEach(async function () {
    const ecrecovery = await ECRecovery.new();
    ERC20Channels.link('ECRecovery', ecrecovery.address);
    token = await StandardTokenMock.new(sender, 100);
    tokenChannels = await ERC20Channels.new(token.address, 60);
  });

  it.only('create channel', async function () {
    await token.approve(tokenChannels.address, 30, { from: sender });
    const nonce = 66;
    await tokenChannels.openChannel(receiver, 30, nonce, { from: sender });
    const channelInfo = await tokenChannels.getChannelInfo(sender, receiver, nonce);
    assert.equal(channelInfo[1], 30);
    assert.equal(channelInfo[2], 0);
    assert.equal(channelInfo[3], 0);
  });

  it.only('create channel and close it with a mutual agreement from sender', async function () {
    await token.approve(tokenChannels.address, 30, { from: sender });
    const nonce = 33;
    await tokenChannels.openChannel(receiver, 30, nonce, { from: sender });
    const hash = await tokenChannels.generateBalanceHash(receiver, nonce, 20);
    const senderSig = signMsg(hash, privateKeys[sender]);
    assert.equal(sender,
      await tokenChannels.getSignerOfBalanceHash(receiver, nonce, 20, senderSig)
    );
    const senderHash = await tokenChannels.generateKeccak256(senderSig);
    const closingSig = signMsg(senderHash, privateKeys[receiver]);
    await tokenChannels.cooperativeClose(nonce, 20, senderSig, closingSig, { from: receiver });
    (await token.balanceOf(sender)).should.be.bignumber
      .equal(80);
    (await token.balanceOf(receiver)).should.be.bignumber
      .equal(20);
  });

  it.only('create channel and close it with a mutual agreement from receiver', async function () {
    await token.approve(tokenChannels.address, 30, { from: sender });
    const nonce = 33;
    await tokenChannels.openChannel(receiver, 30, nonce, { from: sender });
    const hash = await tokenChannels.generateBalanceHash(receiver, nonce, 20);
    const senderSig = signMsg(hash, privateKeys[sender]);
    assert.equal(sender,
      await tokenChannels.getSignerOfBalanceHash(receiver, nonce, 20, senderSig)
    );
    const senderHash = await tokenChannels.generateKeccak256(senderSig);
    const closingSig = signMsg(senderHash, privateKeys[receiver]);
    await tokenChannels.cooperativeClose(nonce, 20, senderSig, closingSig, { from: sender });
    (await token.balanceOf(sender)).should.be.bignumber
      .equal(80);
    (await token.balanceOf(receiver)).should.be.bignumber
      .equal(20);
  });

  it.only('create channel and close it from sender with uncooperativeClose', async function () {
    await token.approve(tokenChannels.address, 30, { from: sender });
    const nonce = 33;
    await tokenChannels.openChannel(receiver, 30, nonce, { from: sender });
    const hash = await tokenChannels.generateBalanceHash(receiver, nonce, 10);
    const senderSig = signMsg(hash, privateKeys[sender]);
    assert.equal(sender,
      await tokenChannels.getSignerOfBalanceHash(receiver, nonce, 10, senderSig)
    );
    await tokenChannels.uncooperativeClose(receiver, nonce, 10, { from: sender });
    await tokenChannels.closeChannel(receiver, nonce, { from: sender })
      .should.be.rejectedWith(EVMRevert);
    await increaseTimeTo(latestTime() + 61);
    await tokenChannels.closeChannel(receiver, nonce, { from: sender });
    (await token.balanceOf(sender)).should.be.bignumber
      .equal(90);
    (await token.balanceOf(receiver)).should.be.bignumber
      .equal(10);
  });

  it.only('create channel and close it from receiver after sender challenge with different balance', async function () {
    await token.approve(tokenChannels.address, 30, { from: sender });
    const nonce = 33;
    await tokenChannels.openChannel(receiver, 30, nonce, { from: sender });
    const hash = await tokenChannels.generateBalanceHash(receiver, nonce, 20);
    const senderSig = signMsg(hash, privateKeys[sender]);
    assert.equal(sender,
      await tokenChannels.getSignerOfBalanceHash(receiver, nonce, 20, senderSig)
    );
    const senderHash = await tokenChannels.generateKeccak256(senderSig);
    const closingSig = signMsg(senderHash, privateKeys[receiver]);
    await tokenChannels.uncooperativeClose(receiver, nonce, 10, { from: sender });
    await increaseTimeTo(latestTime() + 10);
    await tokenChannels.cooperativeClose(nonce, 20, senderSig, closingSig, { from: receiver });
    (await token.balanceOf(sender)).should.be.bignumber
      .equal(80);
    (await token.balanceOf(receiver)).should.be.bignumber
      .equal(20);
  });
});
