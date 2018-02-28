import latestTime from '../../helpers/latestTime';
import { increaseTimeTo, duration } from '../../helpers/increaseTime';
var ethUtils = require('ethereumjs-util');

var BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

import EVMRevert from '../../helpers/EVMRevert';

var StandardTokenMock = artifacts.require('StandardTokenMock.sol');
var ERC20Channel = artifacts.require('ERC20Channel.sol');
var ECRecovery = artifacts.require('ECRecovery.sol');

contract('ERC20Channel', function ([_, receiver, sender]) {
  var token;
  var tokenChannel;

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
    ERC20Channel.link('ECRecovery', ecrecovery.address);
    token = await StandardTokenMock.new(sender, 100);

  });

  it('create channel', async function () {
    tokenChannel = await ERC20Channel.new(token.address, receiver, duration.days(1), { from: sender });
    await token.transfer(tokenChannel.address, 60, { from: sender });
    const channelInfo = await tokenChannel.getChannelInfo();
    assert.equal(channelInfo[0], 60);
    assert.equal(channelInfo[1], 0);
    assert.equal(channelInfo[2], 0);
  });

  it('create channel and close it with a mutual agreement from sender', async function () {
    tokenChannel = await ERC20Channel.new(token.address, receiver, duration.days(1), { from: sender });
    await token.transfer(tokenChannel.address, 30, { from: sender });
    const hash = await tokenChannel.generateBalanceHash(20);
    const senderSig = signMsg(hash, privateKeys[sender]);
    assert.equal(sender,
      await tokenChannel.getSignerOfBalanceHash(20, senderSig)
    );
    const senderHash = await tokenChannel.generateKeccak256(senderSig);
    const closingSig = signMsg(senderHash, privateKeys[receiver]);
    await tokenChannel.cooperativeClose(20, senderSig, closingSig, { from: receiver });
    (await token.balanceOf(sender)).should.be.bignumber
      .equal(80);
    (await token.balanceOf(receiver)).should.be.bignumber
      .equal(20);
  });

  it('create channel and close it with a mutual agreement from receiver', async function () {
    tokenChannel = await ERC20Channel.new(token.address, receiver, duration.days(1), { from: sender });
    await token.transfer(tokenChannel.address, 30, { from: sender });
    const hash = await tokenChannel.generateBalanceHash(20);
    const senderSig = signMsg(hash, privateKeys[sender]);
    assert.equal(sender,
      await tokenChannel.getSignerOfBalanceHash(20, senderSig)
    );
    const senderHash = await tokenChannel.generateKeccak256(senderSig);
    const closingSig = signMsg(senderHash, privateKeys[receiver]);
    await tokenChannel.cooperativeClose(20, senderSig, closingSig, { from: sender });
    (await token.balanceOf(sender)).should.be.bignumber
      .equal(80);
    (await token.balanceOf(receiver)).should.be.bignumber
      .equal(20);
  });

  it('create channel and close it from sender with uncooperativeClose', async function () {
    tokenChannel = await ERC20Channel.new(token.address, receiver, duration.days(1), { from: sender });
    await token.transfer(tokenChannel.address, 30, { from: sender });
    const hash = await tokenChannel.generateBalanceHash(10);
    const senderSig = signMsg(hash, privateKeys[sender]);
    assert.equal(sender,
      await tokenChannel.getSignerOfBalanceHash(10, senderSig)
    );
    await tokenChannel.uncooperativeClose(10, { from: sender });
    await tokenChannel.closeChannel({ from: sender })
      .should.be.rejectedWith(EVMRevert);
    await increaseTimeTo(latestTime() + duration.days(2));
    await tokenChannel.closeChannel({ from: sender });
    (await token.balanceOf(sender)).should.be.bignumber
      .equal(90);
    (await token.balanceOf(receiver)).should.be.bignumber
      .equal(10);
  });

  it('create channel and close it from receiver after sender challenge with different balance', async function () {
    tokenChannel = await ERC20Channel.new(token.address, receiver, duration.days(1), { from: sender });
    await token.transfer(tokenChannel.address, 30, { from: sender });
    const hash = await tokenChannel.generateBalanceHash(20);
    const senderSig = signMsg(hash, privateKeys[sender]);
    assert.equal(sender,
      await tokenChannel.getSignerOfBalanceHash(20, senderSig)
    );
    const senderHash = await tokenChannel.generateKeccak256(senderSig);
    const closingSig = signMsg(senderHash, privateKeys[receiver]);
    await tokenChannel.uncooperativeClose(10, { from: sender });
    await increaseTimeTo(latestTime() + 10);
    await tokenChannel.cooperativeClose(20, senderSig, closingSig, { from: receiver });
    (await token.balanceOf(sender)).should.be.bignumber
      .equal(80);
    (await token.balanceOf(receiver)).should.be.bignumber
      .equal(20);
  });

});
