import latestTime from '../../helpers/latestTime';
import { increaseTimeTo, duration } from '../../helpers/increaseTime';
import EVMRevert from '../../helpers/EVMRevert';
import { getRandomAccounts } from '../../helpers/accounts';
var ethUtils = require('ethereumjs-util');

var BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

var StandardTokenMock = artifacts.require('StandardTokenMock.sol');
var ERC20Channel = artifacts.require('ERC20Channel.sol');
var ECRecovery = artifacts.require('ECRecovery.sol');

contract('ERC20Channel', function () {
  var token;
  var tokenChannel;

  // Get random signer and receiver accounts to be used in the tests
  const randomAccounts = getRandomAccounts(3);
  const receiver = randomAccounts[0].address;
  const sender = randomAccounts[1].address;
  const otherAccount = randomAccounts[2].address;
  const receiverPrivateKey = randomAccounts[0].key;
  const senderPrivateKey = randomAccounts[1].key;
  const otherAccountPrivateKey = randomAccounts[2].key;

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
    const channelInfo = await tokenChannel.getInfo();

    // Check channel info
    assert.equal(parseInt(channelInfo[0]), 60);
    assert.equal(parseInt(channelInfo[1]), 0);
    assert.equal(parseInt(channelInfo[2]), 0);
    assert.equal(parseInt(channelInfo[3]), sender);
    assert.equal(parseInt(channelInfo[4]), receiver);
  });

  [['sender', sender], ['receiver', receiver]].forEach(function (closeFrom) {
    it(`create channel and close it with a mutual agreement from ${closeFrom[0]}`, async function () {
      tokenChannel = await ERC20Channel.new(token.address, receiver, duration.days(1), { from: sender });
      await token.transfer(tokenChannel.address, 30, { from: sender });
      const hash = await tokenChannel.generateBalanceHash(20);
      const senderSig = signMsg(hash, senderPrivateKey);
      assert.equal(sender,
        await tokenChannel.getSignerOfBalanceHash(20, senderSig)
      );
      const senderHash = await tokenChannel.generateKeccak256(senderSig);
      const closingSig = signMsg(senderHash, receiverPrivateKey);
      const channelInfo = await tokenChannel.getInfo();
      assert.equal(parseInt(channelInfo[0]), 30);
      assert.equal(parseInt(channelInfo[1]), 0);
      assert.equal(parseInt(channelInfo[2]), 0);
      await tokenChannel.cooperativeClose(20, senderSig, closingSig, { from: closeFrom[1] });

      // Tranfer approved balance from token channel
      await token.transferFrom(tokenChannel.address, sender, 10, { from: sender });
      await token.transferFrom(tokenChannel.address, receiver, 20, { from: receiver });

      // Check sender and receiver balance
      (await token.balanceOf(sender)).should.be.bignumber
        .equal(80);
      (await token.balanceOf(receiver)).should.be.bignumber
        .equal(20);
    });
  });

  it('tryes to force the close of the channel with wrong value and signatures', async function () {
    tokenChannel = await ERC20Channel.new(token.address, receiver, duration.days(1), { from: sender });
    await token.transfer(tokenChannel.address, 30, { from: sender });

    // Try to close with higher balance and fail
    let hash = await tokenChannel.generateBalanceHash(20);
    let senderSig = signMsg(hash, senderPrivateKey);
    assert.equal(sender,
      await tokenChannel.getSignerOfBalanceHash(20, senderSig)
    );
    let senderHash = await tokenChannel.generateKeccak256(senderSig);
    let closingSig = signMsg(senderHash, receiverPrivateKey);
    await tokenChannel.cooperativeClose(21, senderSig, closingSig, { from: sender })
      .should.be.rejectedWith(EVMRevert);

    // Try to close with invalid sender signature
    hash = await tokenChannel.generateBalanceHash(20);
    senderSig = signMsg(hash, otherAccountPrivateKey);
    assert.equal(otherAccount,
      await tokenChannel.getSignerOfBalanceHash(20, senderSig)
    );
    senderHash = await tokenChannel.generateKeccak256(senderSig);
    closingSig = signMsg(senderHash, receiverPrivateKey);
    await tokenChannel.cooperativeClose(20, senderSig, closingSig, { from: sender })
      .should.be.rejectedWith(EVMRevert);

    // Try to close with invalid receiver signature
    hash = await tokenChannel.generateBalanceHash(20);
    senderSig = signMsg(hash, senderPrivateKey);
    assert.equal(sender,
      await tokenChannel.getSignerOfBalanceHash(20, senderSig)
    );
    senderHash = await tokenChannel.generateKeccak256(senderSig);
    closingSig = signMsg(senderHash, otherAccountPrivateKey);
    await tokenChannel.cooperativeClose(20, senderSig, closingSig, { from: sender })
      .should.be.rejectedWith(EVMRevert);

    // Check sender and receiver balance
    (await token.balanceOf(sender)).should.be.bignumber
      .equal(70);
    (await token.balanceOf(receiver)).should.be.bignumber
      .equal(0);
  });

  it('create channel and close it from sender with uncooperativeClose', async function () {
    tokenChannel = await ERC20Channel.new(token.address, receiver, duration.days(1), { from: sender });
    await token.transfer(tokenChannel.address, 30, { from: sender });
    await tokenChannel.uncooperativeClose(10, { from: sender });
    const channelInfo = await tokenChannel.getInfo();
    assert.equal(parseInt(channelInfo[0]), 30);
    assert.equal(parseInt(channelInfo[1]), latestTime() + duration.days(1));
    assert.equal(parseInt(channelInfo[2]), 10);
    await tokenChannel.closeChannel({ from: sender })
      .should.be.rejectedWith(EVMRevert);
    await increaseTimeTo(latestTime() + duration.days(2));
    await tokenChannel.closeChannel({ from: sender });

    // Tranfer approved balance from token channel
    await token.transferFrom(tokenChannel.address, sender, 20, { from: sender });
    await token.transferFrom(tokenChannel.address, receiver, 10, { from: receiver });

    // Check sender and receiver balance
    (await token.balanceOf(sender)).should.be.bignumber
      .equal(90);
    (await token.balanceOf(receiver)).should.be.bignumber
      .equal(10);
  });

  it('create channel and close it from receiver after sender challenge with different balance', async function () {
    tokenChannel = await ERC20Channel.new(token.address, receiver, duration.days(1), { from: sender });
    await token.transfer(tokenChannel.address, 30, { from: sender });
    const hash = await tokenChannel.generateBalanceHash(20);
    const senderSig = signMsg(hash, senderPrivateKey);
    assert.equal(sender,
      await tokenChannel.getSignerOfBalanceHash(20, senderSig)
    );
    const senderHash = await tokenChannel.generateKeccak256(senderSig);
    const closingSig = signMsg(senderHash, receiverPrivateKey);
    await tokenChannel.uncooperativeClose(10, { from: sender });
    await increaseTimeTo(latestTime() + 10);
    await tokenChannel.cooperativeClose(20, senderSig, closingSig, { from: receiver });

    // Check sender and receiver allowance after close
    (await token.allowance(tokenChannel.address, sender)).should.be.bignumber
      .equal(10);
    (await token.allowance(tokenChannel.address, receiver)).should.be.bignumber
      .equal(20);

    // Tranfer approved balance from token channel
    await token.transferFrom(tokenChannel.address, sender, 10, { from: sender });
    await token.transferFrom(tokenChannel.address, receiver, 20, { from: receiver });

    // Check sender and receiver balance
    (await token.balanceOf(sender)).should.be.bignumber
      .equal(80);
    (await token.balanceOf(receiver)).should.be.bignumber
      .equal(20);

    // Check that contract is destroyed
    assert.equal('0x0', await web3.eth.getCode(tokenChannel.contract.address));
  });
});
