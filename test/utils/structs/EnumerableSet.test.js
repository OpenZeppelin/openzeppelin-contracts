const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { mapValues } = require('../../helpers/iterate');

const { shouldBehaveLikeSet } = require('./EnumerableSet.behavior');

const getMethods = (set, fnSigs) => {
  return mapValues(
    fnSigs,
    fnSig =>
      (...args) =>
        set.getFunction(fnSig)(0, ...args),
  );
};

describe('EnumerableSet', function () {
  // Bytes32Set
  describe('EnumerableBytes32Set', function () {
    const fixture = async () => {
      const set = await ethers.deployContract('$EnumerableSet');

      const [valueA, valueB, valueC] = [0xdeadbeef, 0x0123456789, 0x42424242].map(v =>
        ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [v]),
      );

      const methods = getMethods(set, {
        add: '$add(uint256,bytes32)',
        remove: '$remove(uint256,bytes32)',
        contains: '$contains(uint256,bytes32)',
        length: `$length_EnumerableSet_Bytes32Set(uint256)`,
        at: `$at_EnumerableSet_Bytes32Set(uint256,uint256)`,
        values: `$values_EnumerableSet_Bytes32Set(uint256)`,
      });

      return { set, valueA, valueB, valueC, methods };
    };

    beforeEach(async function () {
      Object.assign(this, await loadFixture(fixture));
    });

    shouldBehaveLikeSet({
      addReturn: `return$add_EnumerableSet_Bytes32Set_bytes32`,
      removeReturn: `return$remove_EnumerableSet_Bytes32Set_bytes32`,
    });
  });

  // AddressSet
  describe('EnumerableAddressSet', function () {
    const fixture = async () => {
      const set = await ethers.deployContract('$EnumerableSet');

      const [valueA, valueB, valueC] = (await ethers.getSigners()).map(signer => signer.address);

      const methods = getMethods(set, {
        add: '$add(uint256,address)',
        remove: '$remove(uint256,address)',
        contains: '$contains(uint256,address)',
        length: `$length_EnumerableSet_AddressSet(uint256)`,
        at: `$at_EnumerableSet_AddressSet(uint256,uint256)`,
        values: `$values_EnumerableSet_AddressSet(uint256)`,
      });

      return { set, valueA, valueB, valueC, methods };
    };

    beforeEach(async function () {
      Object.assign(this, await loadFixture(fixture));
    });

    shouldBehaveLikeSet({
      addReturn: `return$add_EnumerableSet_AddressSet_address`,
      removeReturn: `return$remove_EnumerableSet_AddressSet_address`,
    });
  });

  // UintSet
  describe('EnumerableUintSet', function () {
    const fixture = async () => {
      const set = await ethers.deployContract('$EnumerableSet');

      const [valueA, valueB, valueC] = [1234n, 5678n, 9101112n];

      const methods = getMethods(set, {
        add: '$add(uint256,uint256)',
        remove: '$remove(uint256,uint256)',
        contains: '$contains(uint256,uint256)',
        length: `$length_EnumerableSet_UintSet(uint256)`,
        at: `$at_EnumerableSet_UintSet(uint256,uint256)`,
        values: `$values_EnumerableSet_UintSet(uint256)`,
      });

      return { set, valueA, valueB, valueC, methods };
    };

    beforeEach(async function () {
      Object.assign(this, await loadFixture(fixture));
    });

    shouldBehaveLikeSet({
      addReturn: `return$add_EnumerableSet_UintSet_uint256`,
      removeReturn: `return$remove_EnumerableSet_UintSet_uint256`,
    });
  });
});
