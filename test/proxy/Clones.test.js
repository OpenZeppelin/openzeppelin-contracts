const { expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { computeCreate2Address } = require('../helpers/create2');
const { expect } = require('chai');

const shouldBehaveLikeClone = require('./Clones.behaviour');

const Clones = artifacts.require('$Clones');

contract('Clones', function (accounts) {
  const [deployer] = accounts;

  describe('clone', function () {
    shouldBehaveLikeClone(async (implementation, initData, opts = {}) => {
      const factory = await Clones.new();
      const receipt = await factory.$clone(implementation);
      const address = receipt.logs.find(({ event }) => event === 'return$clone').args.instance;
      await web3.eth.sendTransaction({ from: deployer, to: address, value: opts.value, data: initData });
      return { address };
    });
  });

  describe('cloneDeterministic', function () {
    shouldBehaveLikeClone(async (implementation, initData, opts = {}) => {
      const salt = web3.utils.randomHex(32);
      const factory = await Clones.new();
      const receipt = await factory.$cloneDeterministic(implementation, salt);
      const address = receipt.logs.find(({ event }) => event === 'return$cloneDeterministic').args.instance;
      await web3.eth.sendTransaction({ from: deployer, to: address, value: opts.value, data: initData });
      return { address };
    });

    it('address already used', async function () {
      const implementation = web3.utils.randomHex(20);
      const salt = web3.utils.randomHex(32);
      const factory = await Clones.new();
      // deploy once
      expectEvent(await factory.$cloneDeterministic(implementation, salt), 'return$cloneDeterministic');
      // deploy twice
      await expectRevert(factory.$cloneDeterministic(implementation, salt), 'ERC1167: create2 failed');
    });

    it('address prediction', async function () {
      const implementation = web3.utils.randomHex(20);
      const salt = web3.utils.randomHex(32);
      const factory = await Clones.new();
      const predicted = await factory.$predictDeterministicAddress(implementation, salt);

      const creationCode = [
        '0x3d602d80600a3d3981f3363d3d373d3d3d363d73',
        implementation.replace(/0x/, '').toLowerCase(),
        '5af43d82803e903d91602b57fd5bf3',
      ].join('');

      expect(computeCreate2Address(salt, creationCode, factory.address)).to.be.equal(predicted);

      expectEvent(await factory.$cloneDeterministic(implementation, salt), 'return$cloneDeterministic', {
        instance: predicted,
      });
    });
  });
});
