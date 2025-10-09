const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { generators } = require('../helpers/random');

const slot = ethers.id('some.storage.slot');
const otherSlot = ethers.id('some.other.storage.slot');

// Non-value types are not supported by the `TransientSlot` library.
const TYPES = [
  { name: 'Boolean', type: 'bool', value: true, zero: false },
  { name: 'Address', type: 'address', value: generators.address(), zero: generators.address.zero },
  { name: 'Bytes32', type: 'bytes32', value: generators.bytes32(), zero: generators.bytes32.zero },
  { name: 'Uint256', type: 'uint256', value: generators.uint256(), zero: generators.uint256.zero },
  { name: 'Int256', type: 'int256', value: generators.int256(), zero: generators.int256.zero },
];

async function fixture() {
  return { mock: await ethers.deployContract('TransientSlotMock') };
}

describe('TransientSlot', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  for (const { name, type, value, zero } of TYPES) {
    describe(`${type} transient slot`, function () {
      const load = `tload${name}(bytes32)`;
      const store = `tstore(bytes32,${type})`;
      const event = `${name}Value`;

      it('load', async function () {
        await expect(this.mock[load](slot)).to.emit(this.mock, event).withArgs(slot, zero);
      });

      it('store and load (2 txs)', async function () {
        await this.mock[store](slot, value);
        await expect(this.mock[load](slot)).to.emit(this.mock, event).withArgs(slot, zero);
      });

      it('store and load (batched)', async function () {
        await expect(
          this.mock.multicall([
            this.mock.interface.encodeFunctionData(store, [slot, value]),
            this.mock.interface.encodeFunctionData(load, [slot]),
            this.mock.interface.encodeFunctionData(load, [otherSlot]),
          ]),
        )
          .to.emit(this.mock, event)
          .withArgs(slot, value)
          .to.emit(this.mock, event)
          .withArgs(otherSlot, zero);

        await expect(this.mock[load](slot)).to.emit(this.mock, event).withArgs(slot, zero);
      });
    });
  }
});
