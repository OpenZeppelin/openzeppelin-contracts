const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { mapValues } = require('../../helpers/iterate');
const { randomArray, generators } = require('../../helpers/random');

const { shouldBehaveLikeSet } = require('./EnumerableSet.behavior');

const getMethods = (mock, fnSigs) => {
  return mapValues(
    fnSigs,
    fnSig =>
      (...args) =>
        mock.getFunction(fnSig)(0, ...args),
  );
};

describe('EnumerableSet', function () {
  // Bytes32Set
  describe('EnumerableBytes32Set', function () {
    const fixture = async () => {
      const mock = await ethers.deployContract('$EnumerableSet');

      const [valueA, valueB, valueC] = randomArray(generators.bytes32);

      const methods = getMethods(mock, {
        add: '$add(uint256,bytes32)',
        remove: '$remove(uint256,bytes32)',
        contains: '$contains(uint256,bytes32)',
        length: `$length_EnumerableSet_Bytes32Set(uint256)`,
        at: `$at_EnumerableSet_Bytes32Set(uint256,uint256)`,
        values: `$values_EnumerableSet_Bytes32Set(uint256)`,
      });

      return { mock, valueA, valueB, valueC, methods };
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
      const mock = await ethers.deployContract('$EnumerableSet');

      const [valueA, valueB, valueC] = randomArray(generators.address);

      const methods = getMethods(mock, {
        add: '$add(uint256,address)',
        remove: '$remove(uint256,address)',
        contains: '$contains(uint256,address)',
        length: `$length_EnumerableSet_AddressSet(uint256)`,
        at: `$at_EnumerableSet_AddressSet(uint256,uint256)`,
        values: `$values_EnumerableSet_AddressSet(uint256)`,
      });

      return { mock, valueA, valueB, valueC, methods };
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
      const mock = await ethers.deployContract('$EnumerableSet');

      const [valueA, valueB, valueC] = randomArray(generators.uint256);

      const methods = getMethods(mock, {
        add: '$add(uint256,uint256)',
        remove: '$remove(uint256,uint256)',
        contains: '$contains(uint256,uint256)',
        length: `$length_EnumerableSet_UintSet(uint256)`,
        at: `$at_EnumerableSet_UintSet(uint256,uint256)`,
        values: `$values_EnumerableSet_UintSet(uint256)`,
      });

      return { mock, valueA, valueB, valueC, methods };
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
