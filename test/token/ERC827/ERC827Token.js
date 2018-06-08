
import EVMRevert from '../../helpers/EVMRevert';
var Message = artifacts.require('MessageHelper');
var ERC827TokenMock = artifacts.require('ERC827TokenMock');

var BigNumber = web3.BigNumber;
require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('ERC827 Token', function (accounts) {
  let token;

  beforeEach(async function () {
    token = await ERC827TokenMock.new(accounts[0], 100);
  });

  it('should return the correct totalSupply after construction', async function () {
    let totalSupply = await token.totalSupply();

    assert.equal(totalSupply, 100);
  });

  it('should return the correct allowance amount after approval', async function () {
    let token = await ERC827TokenMock.new(accounts[0], 100);
    await token.approve(accounts[1], 100);
    let allowance = await token.allowance(accounts[0], accounts[1]);

    assert.equal(allowance, 100);
  });

  it('should return correct balances after transfer', async function () {
    await token.transfer(accounts[1], 100);
    let balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0, 0);

    let balance1 = await token.balanceOf(accounts[1]);
    assert.equal(balance1, 100);
  });

  it('should throw an error when trying to transfer more than balance', async function () {
    await token.transfer(accounts[1], 101).should.be.rejectedWith(EVMRevert);
  });

  it('should return correct balances after transfering from another account', async function () {
    await token.approve(accounts[1], 100);
    await token.transferFrom(accounts[0], accounts[2], 100, { from: accounts[1] });

    let balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0, 0);

    let balance1 = await token.balanceOf(accounts[2]);
    assert.equal(balance1, 100);

    let balance2 = await token.balanceOf(accounts[1]);
    assert.equal(balance2, 0);
  });

  it('should throw an error when trying to transfer more than allowed', async function () {
    await token.approve(accounts[1], 99);
    await token.transferFrom(
      accounts[0], accounts[2], 100,
      { from: accounts[1] }
    ).should.be.rejectedWith(EVMRevert);
  });

  it('should throw an error when trying to transferFrom more than _from has', async function () {
    let balance0 = await token.balanceOf(accounts[0]);
    await token.approve(accounts[1], 99);
    await token.transferFrom(
      accounts[0], accounts[2], balance0 + 1,
      { from: accounts[1] }
    ).should.be.rejectedWith(EVMRevert);
  });

  describe('validating allowance updates to spender', function () {
    let preApproved;

    it('should start with zero', async function () {
      preApproved = await token.allowance(accounts[0], accounts[1]);
      assert.equal(preApproved, 0);
    });

    it('should increase by 50 then decrease by 10', async function () {
      await token.increaseApproval(accounts[1], 50);
      let postIncrease = await token.allowance(accounts[0], accounts[1]);
      preApproved.plus(50).should.be.bignumber.equal(postIncrease);
      await token.decreaseApproval(accounts[1], 10);
      let postDecrease = await token.allowance(accounts[0], accounts[1]);
      postIncrease.minus(10).should.be.bignumber.equal(postDecrease);
    });
  });

  it('should increase by 50 then set to 0 when decreasing by more than 50', async function () {
    await token.approve(accounts[1], 50);
    await token.decreaseApproval(accounts[1], 60);
    let postDecrease = await token.allowance(accounts[0], accounts[1]);
    postDecrease.should.be.bignumber.equal(0);
  });

  it('should throw an error when trying to transfer to 0x0', async function () {
    await token.transfer(0x0, 100).should.be.rejectedWith(EVMRevert);
  });

  it('should throw an error when trying to transferFrom to 0x0', async function () {
    await token.approve(accounts[1], 100);
    await token.transferFrom(accounts[0], 0x0, 100, { from: accounts[1] })
      .should.be.rejectedWith(EVMRevert);
  });

  describe('Test ERC827 methods', function () {
    it(
      'should allow payment through transfer'
      , async function () {
        const message = await Message.new();

        const extraData = message.contract.buyMessage.getData(
          web3.toHex(123456), 666, 'Transfer Done'
        );

        const transaction = await token.transferAndCall(
          message.contract.address, 100, extraData, { from: accounts[0], value: 1000 }
        );

        assert.equal(2, transaction.receipt.logs.length);

        new BigNumber(100).should.be.bignumber.equal(
          await token.balanceOf(message.contract.address)
        );
        new BigNumber(1000).should.be.bignumber.equal(
          await web3.eth.getBalance(message.contract.address)
        );
      });

    it(
      'should allow payment through approve'
      , async function () {
        const message = await Message.new();

        const extraData = message.contract.buyMessage.getData(
          web3.toHex(123456), 666, 'Transfer Done'
        );

        const transaction = await token.approveAndCall(
          message.contract.address, 100, extraData, { from: accounts[0], value: 1000 }
        );

        assert.equal(2, transaction.receipt.logs.length);

        new BigNumber(100).should.be.bignumber.equal(
          await token.allowance(accounts[0], message.contract.address)
        );
        new BigNumber(1000).should.be.bignumber.equal(
          await web3.eth.getBalance(message.contract.address)
        );
      });

    it(
      'should allow payment through increaseApproval'
      , async function () {
        const message = await Message.new();

        const extraData = message.contract.buyMessage.getData(
          web3.toHex(123456), 666, 'Transfer Done'
        );

        await token.approve(message.contract.address, 10);
        new BigNumber(10).should.be.bignumber.equal(
          await token.allowance(accounts[0], message.contract.address)
        );

        const transaction = await token.increaseApprovalAndCall(
          message.contract.address, 50, extraData, { from: accounts[0], value: 1000 }
        );

        assert.equal(2, transaction.receipt.logs.length);

        new BigNumber(60).should.be.bignumber.equal(
          await token.allowance(accounts[0], message.contract.address)
        );
        new BigNumber(1000).should.be.bignumber.equal(
          await web3.eth.getBalance(message.contract.address)
        );
      });

    it(
      'should allow payment through decreaseApproval'
      , async function () {
        const message = await Message.new();

        await token.approve(message.contract.address, 100);

        new BigNumber(100).should.be.bignumber.equal(
          await token.allowance(accounts[0], message.contract.address)
        );

        const extraData = message.contract.buyMessage.getData(
          web3.toHex(123456), 666, 'Transfer Done'
        );

        const transaction = await token.decreaseApprovalAndCall(
          message.contract.address, 60, extraData, { from: accounts[0], value: 1000 }
        );

        assert.equal(2, transaction.receipt.logs.length);

        new BigNumber(40).should.be.bignumber.equal(
          await token.allowance(accounts[0], message.contract.address)
        );
        new BigNumber(1000).should.be.bignumber.equal(
          await web3.eth.getBalance(message.contract.address)
        );
      });

    it(
      'should allow payment through transferFrom'
      , async function () {
        const message = await Message.new();

        const extraData = message.contract.buyMessage.getData(
          web3.toHex(123456), 666, 'Transfer Done'
        );

        await token.approve(accounts[1], 100, { from: accounts[0] });

        new BigNumber(100).should.be.bignumber.equal(
          await token.allowance(accounts[0], accounts[1])
        );

        const transaction = await token.transferFromAndCall(
          accounts[0], message.contract.address, 100, extraData, { from: accounts[1], value: 1000 }
        );

        assert.equal(2, transaction.receipt.logs.length);

        new BigNumber(100).should.be.bignumber.equal(
          await token.balanceOf(message.contract.address)
        );
        new BigNumber(1000).should.be.bignumber.equal(
          await web3.eth.getBalance(message.contract.address)
        );
      });

    it('should revert funds of failure inside approve (with data)', async function () {
      const message = await Message.new();

      const extraData = message.contract.showMessage.getData(
        web3.toHex(123456), 666, 'Transfer Done'
      );

      await token.approveAndCall(
        message.contract.address, 10, extraData, { from: accounts[0], value: 1000 }
      ).should.be.rejectedWith(EVMRevert);

      // approval should not have gone through so allowance is still 0
      new BigNumber(0).should.be.bignumber
        .equal(await token.allowance(accounts[1], message.contract.address));
      new BigNumber(0).should.be.bignumber
        .equal(await web3.eth.getBalance(message.contract.address));
    });

    it('should revert funds of failure inside transfer (with data)', async function () {
      const message = await Message.new();

      const extraData = message.contract.showMessage.getData(
        web3.toHex(123456), 666, 'Transfer Done'
      );

      await token.transferAndCall(
        message.contract.address, 10, extraData, { from: accounts[0], value: 1000 }
      ).should.be.rejectedWith(EVMRevert);

      // transfer should not have gone through, so balance is still 0
      new BigNumber(0).should.be.bignumber
        .equal(await token.balanceOf(message.contract.address));
      new BigNumber(0).should.be.bignumber
        .equal(await web3.eth.getBalance(message.contract.address));
    });

    it('should revert funds of failure inside transferFrom (with data)', async function () {
      const message = await Message.new();

      const extraData = message.contract.showMessage.getData(
        web3.toHex(123456), 666, 'Transfer Done'
      );

      await token.approve(accounts[1], 10, { from: accounts[2] });

      await token.transferFromAndCall(
        accounts[2], message.contract.address, 10, extraData, { from: accounts[2], value: 1000 }
      ).should.be.rejectedWith(EVMRevert);

      // transferFrom should have failed so balance is still 0 but allowance is 10
      new BigNumber(10).should.be.bignumber
        .equal(await token.allowance(accounts[2], accounts[1]));
      new BigNumber(0).should.be.bignumber
        .equal(await token.balanceOf(message.contract.address));
      new BigNumber(0).should.be.bignumber
        .equal(await web3.eth.getBalance(message.contract.address));
    });

    it(
      'should return correct balances after transfer (with data) and show the event on receiver contract'
      , async function () {
        const message = await Message.new();

        const extraData = message.contract.showMessage.getData(
          web3.toHex(123456), 666, 'Transfer Done'
        );

        const transaction = await token.transferAndCall(message.contract.address, 100, extraData);

        assert.equal(2, transaction.receipt.logs.length);

        new BigNumber(100).should.be.bignumber.equal(
          await token.balanceOf(message.contract.address)
        );
      });

    it(
      'should return correct allowance after approve (with data) and show the event on receiver contract'
      , async function () {
        const message = await Message.new();

        const extraData = message.contract.showMessage.getData(
          web3.toHex(123456), 666, 'Transfer Done'
        );

        const transaction = await token.approveAndCall(message.contract.address, 100, extraData);

        assert.equal(2, transaction.receipt.logs.length);

        new BigNumber(100).should.be.bignumber.equal(
          await token.allowance(accounts[0], message.contract.address)
        );
      });

    it(
      'should return correct allowance after increaseApproval (with data) and show the event on receiver contract'
      , async function () {
        const message = await Message.new();

        const extraData = message.contract.showMessage.getData(
          web3.toHex(123456), 666, 'Transfer Done'
        );

        await token.approve(message.contract.address, 10);
        new BigNumber(10).should.be.bignumber.equal(
          await token.allowance(accounts[0], message.contract.address)
        );

        const transaction = await token.increaseApprovalAndCall(message.contract.address, 50, extraData);

        assert.equal(2, transaction.receipt.logs.length);

        new BigNumber(60).should.be.bignumber.equal(
          await token.allowance(accounts[0], message.contract.address)
        );
      });

    it(
      'should return correct allowance after decreaseApproval (with data) and show the event on receiver contract'
      , async function () {
        const message = await Message.new();

        await token.approve(message.contract.address, 100);

        new BigNumber(100).should.be.bignumber.equal(
          await token.allowance(accounts[0], message.contract.address)
        );

        const extraData = message.contract.showMessage.getData(
          web3.toHex(123456), 666, 'Transfer Done'
        );

        const transaction = await token.decreaseApprovalAndCall(message.contract.address, 60, extraData);

        assert.equal(2, transaction.receipt.logs.length);

        new BigNumber(40).should.be.bignumber.equal(
          await token.allowance(accounts[0], message.contract.address)
        );
      });

    it(
      'should return correct balances after transferFrom (with data) and show the event on receiver contract'
      , async function () {
        const message = await Message.new();

        const extraData = message.contract.showMessage.getData(
          web3.toHex(123456), 666, 'Transfer Done'
        );

        await token.approve(accounts[1], 100, { from: accounts[0] });

        new BigNumber(100).should.be.bignumber.equal(
          await token.allowance(accounts[0], accounts[1])
        );

        const transaction = await token.transferFromAndCall(accounts[0], message.contract.address, 100, extraData, {
          from: accounts[1],
        });

        assert.equal(2, transaction.receipt.logs.length);

        new BigNumber(100).should.be.bignumber.equal(
          await token.balanceOf(message.contract.address)
        );
      });

    it('should fail inside approve (with data)', async function () {
      const message = await Message.new();

      const extraData = message.contract.fail.getData();

      await token.approveAndCall(message.contract.address, 10, extraData)
        .should.be.rejectedWith(EVMRevert);

      // approval should not have gone through so allowance is still 0
      new BigNumber(0).should.be.bignumber
        .equal(await token.allowance(accounts[1], message.contract.address));
    });

    it('should fail inside transfer (with data)', async function () {
      const message = await Message.new();

      const extraData = message.contract.fail.getData();

      await token.transferAndCall(message.contract.address, 10, extraData)
        .should.be.rejectedWith(EVMRevert);

      // transfer should not have gone through, so balance is still 0
      new BigNumber(0).should.be.bignumber
        .equal(await token.balanceOf(message.contract.address));
    });

    it('should fail inside transferFrom (with data)', async function () {
      const message = await Message.new();

      const extraData = message.contract.fail.getData();

      await token.approve(accounts[1], 10, { from: accounts[2] });
      await token.transferFromAndCall(accounts[2], message.contract.address, 10, extraData, { from: accounts[1] })
        .should.be.rejectedWith(EVMRevert);

      // transferFrom should have failed so balance is still 0 but allowance is 10
      new BigNumber(10).should.be.bignumber
        .equal(await token.allowance(accounts[2], accounts[1]));
      new BigNumber(0).should.be.bignumber
        .equal(await token.balanceOf(message.contract.address));
    });

    it('should fail approve (with data) when using token contract address as receiver', async function () {
      const message = await Message.new();

      const extraData = message.contract.showMessage.getData(
        web3.toHex(123456), 666, 'Transfer Done'
      );

      await token.approveAndCall(token.contract.address, 100, extraData, { from: accounts[0] })
        .should.be.rejectedWith(EVMRevert);
    });

    it('should fail transfer (with data) when using token contract address as receiver', async function () {
      const message = await Message.new();

      const extraData = message.contract.showMessage.getData(
        web3.toHex(123456), 666, 'Transfer Done'
      );

      await token.transferAndCall(token.contract.address, 100, extraData)
        .should.be.rejectedWith(EVMRevert);
    });

    it('should fail transferFrom (with data) when using token contract address as receiver', async function () {
      const message = await Message.new();

      const extraData = message.contract.showMessage.getData(
        web3.toHex(123456), 666, 'Transfer Done'
      );

      await token.approve(accounts[1], 1, { from: accounts[0] });

      await token.transferFromAndCall(accounts[0], token.contract.address, 1, extraData, { from: accounts[1] })
        .should.be.rejectedWith(EVMRevert);
    });
  });
});
