const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { generators } = require('../helpers/random');

const slot = ethers.id('some.storage.slot');
const otherSlot = ethers.id('some.other.storage.slot');

async function fixture() {
  const [account] = await ethers.getSigners();
  const mock = await ethers.deployContract('StorageSlotMock');
  return { mock, account };
}

describe('StorageSlot', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  for (const { type, value, zero } of [
    { type: 'Boolean', value: true, zero: false },
    { type: 'Address', value: generators.address(), zero: ethers.ZeroAddress },
    { type: 'Bytes32', value: generators.bytes32(), zero: ethers.ZeroHash },
    { type: 'String', value: 'lorem ipsum', zero: '' },
    { type: 'Bytes', value: generators.hexBytes(128), zero: '0x' },
  ]) {
    describe(`${type} storage slot`, function () {
      it('set', async function () {
        await this.mock.getFunction(`set${type}Slot`)(slot, value);
      });

      describe('get', function () {
        beforeEach(async function () {
          await this.mock.getFunction(`set${type}Slot`)(slot, value);
        });

        it('from right slot', async function () {
          expect(await this.mock.getFunction(`get${type}Slot`)(slot)).to.equal(value);
        });

        it('from other slot', async function () {
          expect(await this.mock.getFunction(`get${type}Slot`)(otherSlot)).to.equal(zero);
        });
      });
    });
  }

  for (const { type, value, zero } of [
    { type: 'String', value: 'lorem ipsum', zero: '' },
    { type: 'Bytes', value: generators.hexBytes(128), zero: '0x' },
  ]) {
    describe(`${type} storage pointer`, function () {
      it('set', async function () {
        await this.mock.getFunction(`set${type}Storage`)(slot, value);
      });

      describe('get', function () {
        beforeEach(async function () {
          await this.mock.getFunction(`set${type}Storage`)(slot, value);
        });

        it('from right slot', async function () {
          expect(await this.mock.getFunction(`${type.toLowerCase()}Map`)(slot)).to.equal(value);
          expect(await this.mock.getFunction(`get${type}Storage`)(slot)).to.equal(value);
        });

        it('from other slot', async function () {
          expect(await this.mock.getFunction(`${type.toLowerCase()}Map`)(otherSlot)).to.equal(zero);
          expect(await this.mock.getFunction(`get${type}Storage`)(otherSlot)).to.equal(zero);
        });
      });
    });
  }
});
