const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { mapValues } = require('../../helpers/iterate');
const { generators } = require('../../helpers/random');
const { SET_TYPES } = require('../../../scripts/generate/templates/Enumerable.opts');

const { shouldBehaveLikeSet } = require('./EnumerableSet.behavior');

const getMethods = (mock, fnSigs) =>
  mapValues(
    fnSigs,
    fnSig =>
      (...args) =>
        mock.getFunction(fnSig)(0, ...args),
  );

async function fixture() {
  const mock = await ethers.deployContract('$EnumerableSet');

  const env = Object.fromEntries(
    SET_TYPES.map(({ name, value }) => [
      name,
      {
        value,
        values: Array.from(
          { length: 3 },
          value.size ? () => Array.from({ length: value.size }, generators[value.base]) : generators[value.type],
        ),
        methods: getMethods(mock, {
          add: `$add(uint256,${value.type})`,
          remove: `$remove(uint256,${value.type})`,
          contains: `$contains(uint256,${value.type})`,
          clear: `$clear_EnumerableSet_${name}(uint256)`,
          length: `$length_EnumerableSet_${name}(uint256)`,
          at: `$at_EnumerableSet_${name}(uint256,uint256)`,
          values: `$values_EnumerableSet_${name}(uint256)`,
          valuesPage: `$values_EnumerableSet_${name}(uint256,uint256,uint256)`,
        }),
        events: {
          addReturn: `return$add_EnumerableSet_${name}_${value.type.replace(/[[\]]/g, '_')}`,
          removeReturn: `return$remove_EnumerableSet_${name}_${value.type.replace(/[[\]]/g, '_')}`,
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

  for (const { name, value } of SET_TYPES) {
    describe(`${name} (enumerable set of ${value.type})`, function () {
      beforeEach(function () {
        Object.assign(this, this.env[name]);
        [this.valueA, this.valueB, this.valueC] = this.values;
      });

      shouldBehaveLikeSet();
    });
  }
});
