import { network } from 'hardhat';
import { mapValues } from '../../helpers/iterate';
import * as random from '../../helpers/random';
import { SET_TYPES } from '../../../scripts/generate/templates/Enumerable.opts';
import { shouldBehaveLikeSet } from './EnumerableSet.behavior';

const {
  ethers,
  networkHelpers: { loadFixture },
} = await network.create();

const getMethods = (mock, fnSigs) =>
  mapValues(
    fnSigs,
    fnSig =>
      (...args) =>
        mock.getFunction(fnSig)(0, ...args),
  );

// Chai matchers expect hexadecimal data when dealing with bytes
const randomOf = type => random[type === 'bytes' ? 'hexBytes' : type];

async function fixture() {
  const mock = await ethers.deployContract('$EnumerableSet');

  const env = Object.fromEntries(
    SET_TYPES.map(({ name, value }) => [
      name,
      {
        value,
        values: Array.from(
          { length: 3 },
          value.size ? () => Array.from({ length: value.size }, randomOf(value.base)) : randomOf(value.type),
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
