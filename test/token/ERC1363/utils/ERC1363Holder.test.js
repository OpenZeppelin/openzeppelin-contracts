const { BN } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const ERC1363Holder = artifacts.require('ERC1363Holder');
const ERC1363 = artifacts.require('ERC1363Mock');

contract('ERC1363Holder', function (accounts) {
  const [ owner, spender ] = accounts;

  const data = '0x42';

  const name = 'ERC1363 TEST';
  const symbol = '1363T';

  const balance = new BN(100);

  beforeEach(async function () {
    this.token = await ERC1363.new(name, symbol, owner, balance);
    this.holder = await ERC1363Holder.new();
  });

  describe('via transferFromAndCall', function () {
    const amount = new BN(1);

    beforeEach(async function () {
      await this.token.approve(spender, amount, { from: owner });
    });

    const transferFromAndCallWithData = function (from, to, value, opts) {
      return this.token.methods['transferFromAndCall(address,address,uint256,bytes)'](
        from, to, value, data, opts,
      );
    };

    const transferFromAndCallWithoutData = function (from, to, value, opts) {
      return this.token.methods['transferFromAndCall(address,address,uint256)'](from, to, value, opts);
    };

    const shouldTransferFromSafely = function (transferFun, data) {
      it('receives ERC1363 tokens', async function () {
        await transferFun.call(this, owner, this.holder.address, amount, { from: spender });

        expect(await this.token.balanceOf(this.holder.address)).to.be.bignumber.equal(amount);
      });
    };

    describe('with data', function () {
      shouldTransferFromSafely(transferFromAndCallWithData, data);
    });

    describe('without data', function () {
      shouldTransferFromSafely(transferFromAndCallWithoutData, null);
    });
  });

  describe('via transferAndCall', function () {
    const amount = new BN(1);

    const transferAndCallWithData = function (to, value, opts) {
      return this.token.methods['transferAndCall(address,uint256,bytes)'](to, value, data, opts);
    };

    const transferAndCallWithoutData = function (to, value, opts) {
      return this.token.methods['transferAndCall(address,uint256)'](to, value, opts);
    };

    const shouldTransferSafely = function (transferFun, data) {
      it('receives ERC1363 tokens', async function () {
        await transferFun.call(this, this.holder.address, amount, { from: owner });

        expect(await this.token.balanceOf(this.holder.address)).to.be.bignumber.equal(amount);
      });
    };

    describe('with data', function () {
      shouldTransferSafely(transferAndCallWithData, data);
    });

    describe('without data', function () {
      shouldTransferSafely(transferAndCallWithoutData, null);
    });
  });

  describe('via approveAndCall', function () {
    const amount = new BN(1);

    const approveAndCallWithData = function (spender, value, opts) {
      return this.token.methods['approveAndCall(address,uint256,bytes)'](spender, value, data, opts);
    };

    const approveAndCallWithoutData = function (spender, value, opts) {
      return this.token.methods['approveAndCall(address,uint256)'](spender, value, opts);
    };

    const shouldApproveSafely = function (approveFun, data) {
      it('has allowance for ERC1363 tokens', async function () {
        await approveFun.call(this, this.holder.address, amount, { from: owner });

        expect(await this.token.allowance(owner, this.holder.address)).to.be.bignumber.equal(amount);
      });
    };

    describe('with data', function () {
      shouldApproveSafely(approveAndCallWithData, data);
    });

    describe('without data', function () {
      shouldApproveSafely(approveAndCallWithoutData, null);
    });
  });
});
