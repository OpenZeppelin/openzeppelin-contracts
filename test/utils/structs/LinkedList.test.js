const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

async function fixture() {
  const mock = await ethers.deployContract('$LinkedList');
  return { mock };
}

describe('LinkedList', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  it('starts empty', async function () {
    expect(await this.mock.$size(0)).to.equal(0n);
  });

  describe('add', function () {
    beforeEach(async function () {
      const vals = ['0x02'].map(a => ethers.zeroPadValue(a, 32));
      await this.mock.$push(0, ethers.zeroPadValue(vals[0], 32));
      this.values = vals;
    });

    it('via insert with next', async function () {
      const val = ethers.zeroPadValue('0x01', 32);
      await this.mock['$insert(uint256,bytes32,bytes32)'](0, ethers.ZeroHash, val);
      await expect(this.mock.$values(0)).to.eventually.deep.equal(this.values.concat([val]));
    });

    it('via insert with index', async function () {
      const val = ethers.zeroPadValue('0x01', 32);
      await this.mock['$insert(uint256,uint256,bytes32)'](0, 0, val);
      await expect(this.mock.$values(0)).to.eventually.deep.equal(this.values.concat([val]));
    });

    it('via push', async function () {
      const val = ethers.zeroPadValue('0x01', 32);
      await this.mock.$push(0, val);
      await expect(this.mock.$values(0)).to.eventually.deep.equal(this.values.concat([val]));
    });
  });

  describe('remove', function () {
    beforeEach(async function () {
      const vals = ['0x01', '0x02', '0x03'].map(a => ethers.zeroPadValue(a, 32));
      this.values = vals;

      for (const val of vals) {
        await this.mock.$push(0, val);
      }
    });

    it('last element via pop', async function () {
      await expect(this.mock.$pop(0)).to.emit(this.mock, 'return$pop').withArgs(this.values.pop());
      await expect(this.mock.$values(0)).to.eventually.deep.equal(this.values);
    });

    it('first element via index', async function () {
      await expect(this.mock.$removeAt(0, 0)).to.emit(this.mock, 'return$removeAt').withArgs(true, this.values.shift());
      await expect(this.mock.$values(0)).to.eventually.deep.equal(this.values);
    });

    it('second element via next', async function () {
      await expect(this.mock.$removeEfficient(0, this.values[2]))
        .to.emit(this.mock, 'return$removeEfficient')
        .withArgs(true);
      await expect(this.mock.$values(0)).to.eventually.deep.equal([this.values[0], this.values[2]]);
    });

    it('via value', async function () {
      await expect(this.mock.$remove(0, this.values[1])).to.emit(this.mock, 'return$remove').withArgs(true);
      await expect(this.mock.$values(0)).to.eventually.deep.equal(this.values.toSpliced(1, 1));
    });

    it('non-existent element', async function () {
      await expect(this.mock.$removeAt(0, 3)).to.emit(this.mock, 'return$removeAt').withArgs(false, ethers.ZeroHash);
    });
  });

  it('contains', async function () {
    const vals = ['0x01', '0x02', '0x03'].map(a => ethers.zeroPadValue(a, 32));
    for (const val of vals) {
      await expect(this.mock.$contains(0, val)).to.eventually.be.false;
      await this.mock.$push(0, val);
    }

    for (const val of vals) {
      await expect(this.mock.$contains(0, val)).to.eventually.be.true;
    }
  });

  describe('clear', function () {
    it('empty linked list', async function () {
      await this.mock.$clear(0);
      expect(await this.mock.$size(0)).to.equal(0n);
    });

    it('non-empty linked list', async function () {
      const vals = ['0x01', '0x02', '0x03'].map(a => ethers.zeroPadValue(a, 32));
      for (let i = 0; i < vals.length; i++) {
        await this.mock.$push(0, vals[i]);
        await expect(this.mock.$size(0)).to.eventually.equal(i + 1);
      }

      await this.mock.$clear(0);
      expect(await this.mock.$size(0)).to.equal(0n);
    });
  });

  describe('introspection', function () {
    it('via peek', async function () {
      await this.mock.$push(0, ethers.zeroPadValue('0x01', 32));
      await this.mock.$push(0, ethers.zeroPadValue('0x02', 32));

      await expect(this.mock.$peek(0)).to.eventually.equal(ethers.zeroPadValue('0x02', 32));
    });

    it('via values', async function () {
      const vals = ['0x01', '0x02', '0x03'].map(a => ethers.zeroPadValue(a, 32));
      for (const val of vals) {
        await this.mock.$push(0, val);
      }

      await expect(this.mock.$values(0)).to.eventually.deep.equal(vals);
    });
  });
});
