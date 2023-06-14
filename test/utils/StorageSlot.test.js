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

  describe('string storage slot', function () {
    beforeEach(async function () {
      this.value = 'lorem ipsum';
    });

    it('set', async function () {
      await this.store.setString(slot, this.value);
    });

    describe('get', function () {
      beforeEach(async function () {
        await this.store.setString(slot, this.value);
      });

      it('from right slot', async function () {
        expect(await this.store.getString(slot)).to.be.equal(this.value);
      });

      it('from other slot', async function () {
        expect(await this.store.getString(otherSlot)).to.be.equal('');
      });
    });
  });

  describe('string storage pointer', function () {
    beforeEach(async function () {
      this.value = 'lorem ipsum';
    });

    it('set', async function () {
      await this.store.setStringStorage(slot, this.value);
    });

    describe('get', function () {
      beforeEach(async function () {
        await this.store.setStringStorage(slot, this.value);
      });

      it('from right slot', async function () {
        expect(await this.store.stringMap(slot)).to.be.equal(this.value);
        expect(await this.store.getStringStorage(slot)).to.be.equal(this.value);
      });

      it('from other slot', async function () {
        expect(await this.store.stringMap(otherSlot)).to.be.equal('');
        expect(await this.store.getStringStorage(otherSlot)).to.be.equal('');
      });
    });
  });

  describe('bytes storage slot', function () {
    beforeEach(async function () {
      this.value = web3.utils.randomHex(128);
    });

    it('set', async function () {
      await this.store.setBytes(slot, this.value);
    });

    describe('get', function () {
      beforeEach(async function () {
        await this.store.setBytes(slot, this.value);
      });

      it('from right slot', async function () {
        expect(await this.store.getBytes(slot)).to.be.equal(this.value);
      });

      it('from other slot', async function () {
        expect(await this.store.getBytes(otherSlot)).to.be.equal(null);
      });
    });
  });

  describe('bytes storage pointer', function () {
    beforeEach(async function () {
      this.value = web3.utils.randomHex(128);
    });

    it('set', async function () {
      await this.store.setBytesStorage(slot, this.value);
    });

    describe('get', function () {
      beforeEach(async function () {
        await this.store.setBytesStorage(slot, this.value);
      });

      it('from right slot', async function () {
        expect(await this.store.bytesMap(slot)).to.be.equal(this.value);
        expect(await this.store.getBytesStorage(slot)).to.be.equal(this.value);
      });

      it('from other slot', async function () {
        expect(await this.store.bytesMap(otherSlot)).to.be.equal(null);
        expect(await this.store.getBytesStorage(otherSlot)).to.be.equal(null);
      });
    });
  });
});
