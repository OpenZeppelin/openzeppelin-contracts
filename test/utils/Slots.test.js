const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { generators } = require('../helpers/random');
const { TYPES } = require('../../scripts/generate/templates/Slots.opts');

const slot = ethers.id('some.storage.slot');
const otherSlot = ethers.id('some.other.storage.slot');

async function fixture() {
  return { mock: await ethers.deployContract('SlotsMock') };
}

describe('Slots', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  for (const { type, value, zero } of [
    { type: 'bool', value: true, zero: false },
    { type: 'address', value: generators.address(), zero: ethers.ZeroAddress },
    { type: 'bytes32', value: generators.bytes32(), zero: ethers.ZeroHash },
    { type: 'uint256', value: generators.uint256(), zero: 0n },
  ]) {
    describe(type, function () {
      const { udvt } = TYPES.find(t => t.type === type);
      const load = `tload${udvt}(bytes32)`;
      const store = `tstore(bytes32,${type})`;
      const event = `${udvt}Value`;

      it('load', async function () {
        await expect(this.mock[load](slot)).to.emit(this.mock, event).withArgs(slot, zero);
      });

      it('store and load (2tx)', async function () {
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
