const { constants, BN } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const StorageSlotMock = artifacts.require('StorageSlotMock');

const slot = web3.utils.keccak256('some.storage.slot');
const otherSlot = web3.utils.keccak256('some.other.storage.slot');

contract('StorageSlot', function (accounts) {
  beforeEach(async function () {
    this.store = await StorageSlotMock.new();
  });

  describe('boolean storage slot', function () {
    beforeEach(async function () {
      this.value = true;
    });

    it('set', async function () {
      await this.store.setBoolean(slot, this.value);
    });

    describe('get', function () {
      beforeEach(async function () {
        await this.store.setBoolean(slot, this.value);
      });

      it('from right slot', async function () {
        expect(await this.store.getBoolean(slot)).to.be.equal(this.value);
      });

      it('from other slot', async function () {
        expect(await this.store.getBoolean(otherSlot)).to.be.equal(false);
      });
    });
  });

  describe('address storage slot', function () {
    beforeEach(async function () {
      this.value = accounts[1];
    });

    it('set', async function () {
      await this.store.setAddress(slot, this.value);
    });

    describe('get', function () {
      beforeEach(async function () {
        await this.store.setAddress(slot, this.value);
      });

      it('from right slot', async function () {
        expect(await this.store.getAddress(slot)).to.be.equal(this.value);
      });

      it('from other slot', async function () {
        expect(await this.store.getAddress(otherSlot)).to.be.equal(constants.ZERO_ADDRESS);
      });
    });
  });

  describe('bytes32 storage slot', function () {
    beforeEach(async function () {
      this.value = web3.utils.keccak256('some byte32 value');
    });

    it('set', async function () {
      await this.store.setBytes32(slot, this.value);
    });

    describe('get', function () {
      beforeEach(async function () {
        await this.store.setBytes32(slot, this.value);
      });

      it('from right slot', async function () {
        expect(await this.store.getBytes32(slot)).to.be.equal(this.value);
      });

      it('from other slot', async function () {
        expect(await this.store.getBytes32(otherSlot)).to.be.equal(constants.ZERO_BYTES32);
      });
    });
  });

  describe('uint256 storage slot', function () {
    beforeEach(async function () {
      this.value = new BN(1742);
    });

    it('set', async function () {
      await this.store.setUint256(slot, this.value);
    });

    describe('get', function () {
      beforeEach(async function () {
        await this.store.setUint256(slot, this.value);
      });

      it('from right slot', async function () {
        expect(await this.store.getUint256(slot)).to.be.bignumber.equal(this.value);
      });

      it('from other slot', async function () {
        expect(await this.store.getUint256(otherSlot)).to.be.bignumber.equal('0');
      });
    });
  });
});
