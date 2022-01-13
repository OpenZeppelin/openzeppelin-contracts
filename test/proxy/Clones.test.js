const { expectEvent, expectRevert } = require('@openzeppelin/test-helpers');

const shouldBehaveLikeClone = require('./Clones.behaviour');

const ClonesMock = artifacts.require('ClonesMock');

contract('Clones', function (accounts) {
  describe('clone', function () {
    shouldBehaveLikeClone(async (implementation, initData, opts = {}) => {
      const factory = await ClonesMock.new();
      const receipt = await factory.clone(implementation, initData, { value: opts.value });
      const address = receipt.logs.find(({ event }) => event === 'NewInstance').args.instance;
      return { address };
    });
  });

  describe('cloneDeterministic', function () {
    shouldBehaveLikeClone(async (implementation, initData, opts = {}) => {
      const salt = web3.utils.randomHex(32);
      const factory = await ClonesMock.new();
      const receipt = await factory.cloneDeterministic(implementation, salt, initData, { value: opts.value });
      const address = receipt.logs.find(({ event }) => event === 'NewInstance').args.instance;
      return { address };
    });

    it('address already used', async function () {
      const implementation = web3.utils.randomHex(20);
      const salt = web3.utils.randomHex(32);
      const factory = await ClonesMock.new();
      // deploy once
      expectEvent(
        await factory.cloneDeterministic(implementation, salt, '0x'),
        'NewInstance',
      );
      // deploy twice
      await expectRevert(
        factory.cloneDeterministic(implementation, salt, '0x'),
        'ERC1167: create2 failed',
      );
    });

    it('address prediction', async function () {
      const implementation = web3.utils.randomHex(20);
      const salt = web3.utils.randomHex(32);
      const factory = await ClonesMock.new();
      const predicted = await factory.predictDeterministicAddress(implementation, salt);
      expectEvent(
        await factory.cloneDeterministic(implementation, salt, '0x'),
        'NewInstance',
        { instance: predicted },
      );
    });
  });
});
