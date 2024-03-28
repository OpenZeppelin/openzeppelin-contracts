const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { generators } = require('../helpers/random');

const slot = ethers.id('some.storage.slot');
const otherSlot = ethers.id('some.other.storage.slot');

const TYPES = [
  { name: 'Boolean', type: 'bool', value: true, isValueType: true, zero: false },
  { name: 'Address', type: 'address', value: generators.address(), isValueType: true, zero: generators.address.zero },
  { name: 'Bytes32', type: 'bytes32', value: generators.bytes32(), isValueType: true, zero: generators.bytes32.zero },
  { name: 'Uint256', type: 'uint256', value: generators.uint256(), isValueType: true, zero: generators.uint256.zero },
  { name: 'Int256', type: 'int256', value: generators.int256(), isValueType: true, zero: generators.int256.zero },
  { name: 'Bytes', type: 'bytes', value: generators.hexBytes(128), isValueType: false, zero: generators.hexBytes.zero },
  { name: 'String', type: 'string', value: 'lorem ipsum', isValueType: false, zero: '' },
];

async function fixture() {
  return { mock: await ethers.deployContract('StorageSlotMock') };
}

describe('StorageSlot', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  for (const { name, type, value, zero } of TYPES) {
    describe(`${type} storage slot`, function () {
      it('set', async function () {
        await this.mock.getFunction(`set${name}Slot`)(slot, value);
      });

      describe('get', function () {
        beforeEach(async function () {
          await this.mock.getFunction(`set${name}Slot`)(slot, value);
        });

        it('from right slot', async function () {
          expect(await this.mock.getFunction(`get${name}Slot`)(slot)).to.equal(value);
        });

        it('from other slot', async function () {
          expect(await this.mock.getFunction(`get${name}Slot`)(otherSlot)).to.equal(zero);
        });
      });
    });
  }

  for (const { name, type, value, zero } of TYPES.filter(type => !type.isValueType)) {
    describe(`${type} storage pointer`, function () {
      it('set', async function () {
        await this.mock.getFunction(`set${name}Storage`)(slot, value);
      });

      describe('get', function () {
        beforeEach(async function () {
          await this.mock.getFunction(`set${name}Storage`)(slot, value);
        });

        it('from right slot', async function () {
          expect(await this.mock.getFunction(`${type}Map`)(slot)).to.equal(value);
          expect(await this.mock.getFunction(`get${name}Storage`)(slot)).to.equal(value);
        });

        it('from other slot', async function () {
          expect(await this.mock.getFunction(`${type}Map`)(otherSlot)).to.equal(zero);
          expect(await this.mock.getFunction(`get${name}Storage`)(otherSlot)).to.equal(zero);
        });
      });
    });
  }

  for (const { name, type, value, zero } of TYPES.filter(type => type.isValueType)) {
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
