import latestTime from './helpers/latestTime';
import { increaseTimeTo } from './helpers/increaseTime';
var ethUtils = require('ethereumjs-util');

var BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

const assertRevert = require('./helpers/assertRevert');

var StandardTokenMock = artifacts.require('./mocks/StandardTokenMock.sol');
var ERC20Channels = artifacts.require('./token/ERC20Channels.sol');
var ECRecovery = artifacts.require('./ECRecovery.sol');

contract('ERC20Channels', function (accounts) {
  var token;
  var tokenChannels;

  // This private keys should match the ones used by testrpc
  const privateKeys = {};
  privateKeys[accounts[0]] = '0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501200';
  privateKeys[accounts[1]] = '0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501201';
  privateKeys[accounts[2]] = '0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501202';
  privateKeys[accounts[3]] = '0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501203';

  // Sign a message with a private key, it returns the signature in rpc format
  function signMsg (msg, pvKey) {
    const sig = ethUtils.ecsign(ethUtils.toBuffer(msg), ethUtils.toBuffer(pvKey));
    return ethUtils.toRpcSig(sig.v, sig.r, sig.s);
  }

  beforeEach(async function () {
    const ecrecovery = await ECRecovery.new();
    ERC20Channels.link('ECRecovery', ecrecovery.address);
    token = await StandardTokenMock.new(accounts[2], 100);
    tokenChannels = await ERC20Channels.new(token.address, 60);
  });

  it('create channel', async function () {
    await token.approve(tokenChannels.address, 30, { from: accounts[2] });
    const nonce = 66;
    await tokenChannels.openChannel(accounts[1], 30, nonce, { from: accounts[2] });
    const channelInfo = await tokenChannels.getChannelInfo(accounts[2], accounts[1], nonce);
    assert.equal(channelInfo[1], 30);
    assert.equal(channelInfo[2], 0);
    assert.equal(channelInfo[3], 0);
  });

  it('create channel and close it with a mutual agreement from sender', async function () {
    await token.approve(tokenChannels.address, 30, { from: accounts[2] });
    const nonce = 33;
    await tokenChannels.openChannel(accounts[1], 30, nonce, { from: accounts[2] });
    const hash = await tokenChannels.generateBalanceHash(accounts[1], nonce, 20);
    const senderSig = signMsg(hash, privateKeys[accounts[2]]);
    assert.equal(accounts[2],
      await tokenChannels.getSignerOfBalanceHash(accounts[1], nonce, 20, senderSig)
    );
    const senderHash = await tokenChannels.generateKeccak256(senderSig);
    const closingSig = signMsg(senderHash, privateKeys[accounts[1]]);
    await tokenChannels.cooperativeClose(accounts[1], nonce, 20, senderSig, closingSig, { from: accounts[1] });
    (await token.balanceOf(accounts[2])).should.be.bignumber
      .equal(80);
    (await token.balanceOf(accounts[1])).should.be.bignumber
      .equal(20);
  });

  it('create channel and close it with a mutual agreement from receiver', async function () {
    await token.approve(tokenChannels.address, 30, { from: accounts[2] });
    const nonce = 33;
    await tokenChannels.openChannel(accounts[1], 30, nonce, { from: accounts[2] });
    const hash = await tokenChannels.generateBalanceHash(accounts[1], nonce, 20);
    const senderSig = signMsg(hash, privateKeys[accounts[2]]);
    assert.equal(accounts[2],
      await tokenChannels.getSignerOfBalanceHash(accounts[1], nonce, 20, senderSig)
    );
    const senderHash = await tokenChannels.generateKeccak256(senderSig);
    const closingSig = signMsg(senderHash, privateKeys[accounts[1]]);
    await tokenChannels.cooperativeClose(accounts[1], nonce, 20, senderSig, closingSig, { from: accounts[2] });
    (await token.balanceOf(accounts[2])).should.be.bignumber
      .equal(80);
    (await token.balanceOf(accounts[1])).should.be.bignumber
      .equal(20);
  });

  it('create channel and close it from sender with uncooperativeClose', async function () {
    await token.approve(tokenChannels.address, 30, { from: accounts[2] });
    const nonce = 33;
    await tokenChannels.openChannel(accounts[1], 30, nonce, { from: accounts[2] });
    const hash = await tokenChannels.generateBalanceHash(accounts[1], nonce, 10);
    const senderSig = signMsg(hash, privateKeys[accounts[2]]);
    assert.equal(accounts[2],
      await tokenChannels.getSignerOfBalanceHash(accounts[1], nonce, 10, senderSig)
    );
    await tokenChannels.uncooperativeClose(accounts[1], nonce, 10, { from: accounts[2] });
    try {
      await tokenChannels.closeChannel(accounts[1], nonce, { from: accounts[2] });
      assert.fail('should have thrown before');
    } catch (error) {
      assertRevert(error);
    }
    await increaseTimeTo(latestTime() + 61);
    await tokenChannels.closeChannel(accounts[1], nonce, { from: accounts[2] });
    (await token.balanceOf(accounts[2])).should.be.bignumber
      .equal(90);
    (await token.balanceOf(accounts[1])).should.be.bignumber
      .equal(10);
  });

  it('create channel and close it from receiver after sender chanllenge with different balance', async function () {
    await token.approve(tokenChannels.address, 30, { from: accounts[2] });
    const nonce = 33;
    await tokenChannels.openChannel(accounts[1], 30, nonce, { from: accounts[2] });
    const hash = await tokenChannels.generateBalanceHash(accounts[1], nonce, 20);
    const senderSig = signMsg(hash, privateKeys[accounts[2]]);
    assert.equal(accounts[2],
      await tokenChannels.getSignerOfBalanceHash(accounts[1], nonce, 20, senderSig)
    );
    const senderHash = await tokenChannels.generateKeccak256(senderSig);
    const closingSig = signMsg(senderHash, privateKeys[accounts[1]]);
    await tokenChannels.uncooperativeClose(accounts[1], nonce, 10, { from: accounts[2] });
    await increaseTimeTo(latestTime() + 10);
    await tokenChannels.cooperativeClose(accounts[1], nonce, 20, senderSig, closingSig, { from: accounts[1] });
    (await token.balanceOf(accounts[2])).should.be.bignumber
      .equal(80);
    (await token.balanceOf(accounts[1])).should.be.bignumber
      .equal(20);
  });
});
