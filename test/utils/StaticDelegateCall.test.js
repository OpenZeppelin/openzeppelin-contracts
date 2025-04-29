const { expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const StaticDelegateCallImplementationMock = artifacts.require('StaticDelegateCallImplementationMock');
const StaticDelegateCallMock = artifacts.require('StaticDelegateCallMock');

contract('StaticDelegateCall', function () {
  beforeEach(async function () {
    this.implementation = await StaticDelegateCallImplementationMock.new();
    this.mock = await StaticDelegateCallMock.new('5', this.implementation.address);
  });

  describe('proxied implementation', function () {
    it('processes input', async function () {
      expect(await this.mock.process('2')).to.be.bignumber.equal('7');
    });
    it('reverts on out of bounds parameter', async function () {
      await expectRevert(this.mock.process('10'), 'Implementation reverted');
    });
  });

  describe('delegateCallAndRevert', function () {
    it('reverts on invalid caller', async function () {
      await expectRevert(
        this.mock.delegateCallAndRevert(
          this.implementation.address,
          this.implementation.contract.methods.process('2').encodeABI(),
        ),
        'StaticDelegateCall: caller must be self',
      );
    });
  });
});
