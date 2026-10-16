import { network } from 'hardhat';
import { expect } from 'chai';
import * as random from '../helpers/random';

const {
  ethers,
  networkHelpers: { loadFixture },
} = await network.create();

const slot = ethers.id('some.storage.slot');
const otherSlot = ethers.id('some.other.storage.slot');

// Non-value types are not supported by the `TransientSlot` library.
const TYPES = [
  { name: 'Boolean', type: 'bool', value: true, zero: false },
  { name: 'Address', type: 'address', value: random.address(), zero: random.address.zero },
  { name: 'Bytes32', type: 'bytes32', value: random.bytes32(), zero: random.bytes32.zero },
  { name: 'Uint256', type: 'uint256', value: random.uint256(), zero: random.uint256.zero },
  { name: 'Int256', type: 'int256', value: random.int256(), zero: random.int256.zero },
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

    describe(`${type} reserved slot`, function () {
      const load = `tloadReserved${name}`;
      const store = `tstoreReserved(${type})`;
      const event = `Reserved${name}Value`;

      it('load', async function () {
        await expect(this.mock[load]()).to.emit(this.mock, event).withArgs(zero);
      });

      it('store and load (2 txs)', async function () {
        await this.mock[store](value);
        await expect(this.mock[load]()).to.emit(this.mock, event).withArgs(zero);
      });

      it('store and load (batched)', async function () {
        await expect(
          this.mock.multicall([
            this.mock.interface.encodeFunctionData(store, [value]),
            this.mock.interface.encodeFunctionData(load, []),
          ]),
        )
          .to.emit(this.mock, event)
          .withArgs(value);

        await expect(this.mock[load]()).to.emit(this.mock, event).withArgs(zero);
      });
    });
  }

  describe('reserved slots', function () {
    it('each reservation gets its own slot', async function () {
      const txPromise = this.mock.multicall([
        ...TYPES.map(({ type, value }) => this.mock.interface.encodeFunctionData(`tstoreReserved(${type})`, [value])),
        ...TYPES.map(({ name }) => this.mock.interface.encodeFunctionData(`tloadReserved${name}`, [])),
      ]);
      for (const { name, value } of TYPES) {
        await expect(txPromise).to.emit(this.mock, `Reserved${name}Value`).withArgs(value);
      }
    });

    it('storing does not write to the reserved persistent slots', async function () {
      await this.mock.multicall(
        TYPES.map(({ type, value }) => this.mock.interface.encodeFunctionData(`tstoreReserved(${type})`, [value])),
      );

      // The reservations are the mock's only state variables, so they occupy slots 0 to TYPES.length - 1.
      for (let i = 0; i < TYPES.length; ++i) {
        await expect(ethers.provider.getStorage(this.mock, i)).to.eventually.equal(ethers.ZeroHash);
      }
    });
  });
});
