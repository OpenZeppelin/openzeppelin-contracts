const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { mapValues } = require('../../helpers/iterate');
const { generators } = require('../../helpers/random');
const { TYPES } = require('../../../scripts/generate/templates/EnumerableSet.opts');

const { shouldBehaveLikeSet } = require('./EnumerableSet.behavior');

const getMethods = (mock, fnSigs) => {
  return mapValues(
    fnSigs,
    fnSig =>
      (...args) =>
        mock.getFunction(fnSig)(0, ...args),
  );
};

async function fixture() {
  const mock = await ethers.deployContract('$EnumerableSet');

  const env = Object.fromEntries(
    TYPES.map(({ name, type, base, size }) => [
      type,
      {
        values: Array.from(
          { length: 3 },
          size ? () => Array.from({ length: size }, generators[base]) : generators[type],
        ),
        methods: getMethods(mock, {
          add: `$add(uint256,${type})`,
          remove: `$remove(uint256,${type})`,
          clear: `$clear_EnumerableSet_${name}(uint256)`,
          contains: `$contains(uint256,${type})`,
          length: `$length_EnumerableSet_${name}(uint256)`,
          at: `$at_EnumerableSet_${name}(uint256,uint256)`,
          values: `$values_EnumerableSet_${name}(uint256)`,
        }),
        events: {
          addReturn: `return$add_EnumerableSet_${name}_${type.replace(/[[\]]/g, '_')}`,
          removeReturn: `return$remove_EnumerableSet_${name}_${type.replace(/[[\]]/g, '_')}`,
        },
      },
    ]),
  );

  return { mock, env };
}

describe('EnumerableSet', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  for (const { type } of TYPES) {
    describe(type, function () {
      beforeEach(function () {
        Object.assign(this, this.env[type]);
        [this.valueA, this.valueB, this.valueC] = this.values;
      });

      shouldBehaveLikeSet();
    });
  }
});
