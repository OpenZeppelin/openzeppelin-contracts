const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const slot = ethers.id('some.storage.slot');
const otherSlot = ethers.id('some.other.storage.slot');

async function fixture() {
  const storage = await ethers.deployContract('StorageSlotMock');
  const [, account] = await ethers.getSigners();
  return { storage, account };
}

describe('StorageSlot', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('boolean storage slot', function () {
    beforeEach(async function () {
      this.value = true;
    });

    it('set', async function () {
      await this.storage.setBoolean(slot, this.value);
    });

    describe('get', function () {
      beforeEach(async function () {
        await this.storage.setBoolean(slot, this.value);
      });

      it('from right slot', async function () {
        expect(await this.storage.getBoolean(slot)).to.be.equal(this.value);
      });

      it('from other slot', async function () {
        expect(await this.storage.getBoolean(otherSlot)).to.be.equal(false);
      });
    });
  });

  describe('address storage slot', function () {
    it('set', async function () {
      await this.storage.setAddress(slot, this.account);
    });

    describe('get', function () {
      beforeEach(async function () {
        await this.storage.setAddress(slot, this.account);
      });

      it('from right slot', async function () {
        expect(await this.storage.getAddressFromStorage(slot)).to.be.equal(this.account.address);
      });

      it('from other slot', async function () {
        expect(await this.storage.getAddressFromStorage(otherSlot)).to.be.equal(ethers.ZeroAddress);
      });
    });
  });

  describe('bytes32 storage slot', function () {
    before(async function () {
      this.value = ethers.id('some byte32 value');
    });

    it('set', async function () {
      await this.storage.setBytes32(slot, this.value);
    });

    describe('get', function () {
      beforeEach(async function () {
        await this.storage.setBytes32(slot, this.value);
      });

      it('from right slot', async function () {
        expect(await this.storage.getBytes32(slot)).to.be.equal(this.value);
      });

      it('from other slot', async function () {
        expect(await this.storage.getBytes32(otherSlot)).to.be.equal(ethers.ZeroHash);
      });
    });
  });

  describe('uint256 storage slot', function () {
    before(async function () {
      this.value = 1742n;
    });

    it('set', async function () {
      await this.storage.setUint256(slot, this.value);
    });

    describe('get', function () {
      beforeEach(async function () {
        await this.storage.setUint256(slot, this.value);
      });

      it('from right slot', async function () {
        expect(await this.storage.getUint256(slot)).to.be.equal(this.value);
      });

      it('from other slot', async function () {
        expect(await this.storage.getUint256(otherSlot)).to.be.equal(0n);
      });
    });
  });

  describe('string storage slot', function () {
    before(async function () {
      this.value = 'lorem ipsum';
    });

    it('set', async function () {
      await this.storage.setString(slot, this.value);
    });

    describe('get', function () {
      beforeEach(async function () {
        await this.storage.setString(slot, this.value);
      });

      it('from right slot', async function () {
        expect(await this.storage.getString(slot)).to.be.equal(this.value);
      });

      it('from other slot', async function () {
        expect(await this.storage.getString(otherSlot)).to.be.equal('');
      });
    });
  });

  describe('string storage pointer', function () {
    beforeEach(async function () {
      this.value = 'lorem ipsum';
    });

    it('set', async function () {
      await this.storage.setStringStorage(slot, this.value);
    });

    describe('get', function () {
      beforeEach(async function () {
        await this.storage.setStringStorage(slot, this.value);
      });

      it('from right slot', async function () {
        expect(await this.storage.stringMap(slot)).to.be.equal(this.value);
        expect(await this.storage.getStringStorage(slot)).to.be.equal(this.value);
      });

      it('from other slot', async function () {
        expect(await this.storage.stringMap(otherSlot)).to.be.equal('');
        expect(await this.storage.getStringStorage(otherSlot)).to.be.equal('');
      });
    });
  });

  describe('bytes storage slot', function () {
    beforeEach(async function () {
      this.value = web3.utils.randomHex(128);
    });

    it('set', async function () {
      await this.storage.setBytes(slot, this.value);
    });

    describe('get', function () {
      beforeEach(async function () {
        await this.storage.setBytes(slot, this.value);
      });

      it('from right slot', async function () {
        expect(await this.storage.getBytes(slot)).to.be.equal(this.value);
      });

      it('from other slot', async function () {
        expect(await this.storage.getBytes(otherSlot)).to.be.equal('0x');
      });
    });
  });

  describe('bytes storage pointer', function () {
    beforeEach(async function () {
      this.value = ethers.hexlify(ethers.randomBytes(128));
    });

    it('set', async function () {
      await this.storage.setBytesStorage(slot, this.value);
    });

    describe('get', function () {
      beforeEach(async function () {
        await this.storage.setBytesStorage(slot, this.value);
      });

      it('from right slot', async function () {
        expect(await this.storage.bytesMap(slot)).to.be.equal(this.value);
        expect(await this.storage.getBytesStorage(slot)).to.be.equal(this.value);
      });

      it('from other slot', async function () {
        expect(await this.storage.bytesMap(otherSlot)).to.be.equal('0x');
        expect(await this.storage.getBytesStorage(otherSlot)).to.be.equal('0x');
      });
    });
  });
});
