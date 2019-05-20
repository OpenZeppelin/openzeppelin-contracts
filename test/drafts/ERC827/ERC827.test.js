
const { BN, expectEvent, shouldFail } = require('openzeppelin-test-helpers');
const MessageHelper = artifacts.require('MessageHelper');
const ERC827TokenMock = artifacts.require('ERC827TokenMock');
const {
  shouldBehaveLikeERC20,
} = require('../../token/ERC20/ERC20.behavior');

contract('ERC827 Token', function ([_, initialHolder, recipient, anotherAccount]) {
  let message;

  const initialSupply = new BN(100);
  const extraData = web3.eth.abi.encodeFunctionCall({
    name: 'showMessage',
    type: 'function',
    inputs: [
      { type: 'bytes32', name: 'b32' },
      { type: 'uint256', name: 'number' },
      { type: 'string', name: 'text' },
    ],
  }, ['0x1234', 666, 'Transfer Done']);
  const extraDataFail = web3.eth.abi.encodeFunctionCall(
    { name: 'fail', type: 'function', inputs: [] }, []
  );

  beforeEach(async function () {
    this.token = await ERC827TokenMock.new(initialHolder, initialSupply);
    message = await MessageHelper.new();
  });

  const checkSuccessEvent = async function (txHash) {
    await expectEvent.inTransaction(txHash, MessageHelper, 'Show', {
      'b32': web3.utils.padRight('0x1234', 64),
      'number': '666',
      'text': 'Transfer Done',
    });
  };

  shouldBehaveLikeERC20('ERC20', initialSupply, initialHolder, recipient, anotherAccount);

  it(
    'should allow payment through transfer'
    , async function () {
      await this.token.transferAndCall(
        message.address, 100, extraData, { from: initialHolder, value: 1000 }
      );

      (await this.token.balanceOf(message.address))
        .should.be.bignumber.equal(new BN(100));
      (await web3.eth.getBalance(message.address)).should.be.equal('1000');
    });

  it(
    'should allow payment through approve'
    , async function () {
      await this.token.approveAndCall(
        message.address, 100, extraData, { from: initialHolder, value: 1000 }
      );

      (await this.token.allowance(initialHolder, message.address))
        .should.be.bignumber.equal(new BN(100));
      (await web3.eth.getBalance(message.address)).should.be.equal('1000');
    });

  it(
    'should allow payment through transferFrom'
    , async function () {
      await this.token.approve(recipient, 100, { from: initialHolder });

      await this.token.transferFromAndCall(
        initialHolder, message.address, 100, extraData, { from: recipient, value: 1000 }
      );

      (await this.token.balanceOf(message.address))
        .should.be.bignumber.equal(new BN(100));
      (await web3.eth.getBalance(message.address)).should.be.equal('1000');
    });

  it('should revert funds of failure inside approve', async function () {
    await shouldFail.reverting(this.token.approveAndCall(
      message.address, 10, extraDataFail, { from: initialHolder, value: 1000 }
    ));

    (await this.token.allowance(initialHolder, message.address))
      .should.be.bignumber.equal(new BN(0));
    (await web3.eth.getBalance(message.address)).should.be.equal('0');
  });

  it('should revert funds of failure inside transfer', async function () {
    await shouldFail.reverting(this.token.transferAndCall(
      message.address, 10, extraDataFail, { from: initialHolder, value: 1000 }
    ));

    (await this.token.allowance(initialHolder, message.address))
      .should.be.bignumber.equal(new BN(0));
    (await web3.eth.getBalance(message.address)).should.be.equal('0');
  });

  it('should revert funds of failure inside transferFrom', async function () {
    await this.token.approve(anotherAccount, 10, { from: initialHolder });
    await shouldFail.reverting(this.token.transferFromAndCall(
      initialHolder, message.address, 10, extraDataFail, { from: anotherAccount, value: 1000 }
    ));

    (await this.token.allowance(initialHolder, anotherAccount))
      .should.be.bignumber.equal(new BN(10));
    (await this.token.balanceOf(message.address))
      .should.be.bignumber.equal(new BN(0));
    (await web3.eth.getBalance(message.address)).should.be.equal('0');
  });

  it(
    'should return correct balances after transfer and show the event on receiver contract'
    , async function () {
      const { receipt } = await this.token.transferAndCall(message.address, 100, extraData, { from: initialHolder });
      await checkSuccessEvent(receipt.transactionHash);
      (await this.token.balanceOf(message.address))
        .should.be.bignumber.equal(new BN(100));
    });

  it(
    'should return correct allowance after approve and show the event on receiver contract'
    , async function () {
      const { receipt } = await this.token.approveAndCall(message.address, 100, extraData, { from: initialHolder });
      await checkSuccessEvent(receipt.transactionHash);
      (await this.token.allowance(initialHolder, message.address))
        .should.be.bignumber.equal(new BN(100));
    });

  it(
    'should return correct balances after transferFrom and show the event on receiver contract'
    , async function () {
      await this.token.approve(recipient, 100, { from: initialHolder });
      const { receipt } = await this.token.transferFromAndCall(
        initialHolder, message.address, 100, extraData, { from: recipient }
      );
      await checkSuccessEvent(receipt.transactionHash);
      (await this.token.balanceOf(message.address))
        .should.be.bignumber.equal(new BN(100));
    });

  it('should fail inside approve', async function () {
    await shouldFail.reverting.withMessage(
      this.token.approveAndCall(message.address, 10, extraDataFail, { from: initialHolder }),
      'Call to external contract failed'
    );
    (await this.token.allowance(initialHolder, message.address))
      .should.be.bignumber.equal(new BN(0));
  });

  it('should fail inside transfer', async function () {
    await shouldFail.reverting.withMessage(
      this.token.transferAndCall(message.address, 10, extraDataFail, { from: initialHolder }),
      'Call to external contract failed'
    );
    (await this.token.balanceOf(message.address))
      .should.be.bignumber.equal(new BN(0));
  });

  it('should fail inside transferFrom', async function () {
    await this.token.approve(recipient, 10, { from: initialHolder });
    await shouldFail.reverting.withMessage(
      this.token.transferFromAndCall(initialHolder, message.address, 10, extraDataFail, { from: recipient }),
      'Call to external contract failed'
    );
    (await this.token.allowance(initialHolder, recipient))
      .should.be.bignumber.equal(new BN(10));
    (await this.token.balanceOf(message.address))
      .should.be.bignumber.equal(new BN(0));
  });

  it('should fail approve when using token contract address as receiver', async function () {
    await shouldFail.reverting.withMessage(
      this.token.approveAndCall(this.token.address, 100, extraDataFail, { from: initialHolder }),
      'Call to external contract failed'
    );
  });

  it('should fail transfer when using token contract address as receiver', async function () {
    await shouldFail.reverting.withMessage(
      this.token.transferAndCall(this.token.address, 100, extraData, { from: initialHolder }),
      'Call to external contract failed'
    );
  });

  it('should fail transferFrom when using token contract address as receiver', async function () {
    await this.token.approve(recipient, 10, { from: initialHolder });
    await shouldFail.reverting.withMessage(
      this.token.transferFromAndCall(initialHolder, this.token.address, 10, extraData, { from: recipient }),
      'Call to external contract failed'
    );
  });
});
