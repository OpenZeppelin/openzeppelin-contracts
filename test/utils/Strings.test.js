const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

async function fixture() {
  const mock = await ethers.deployContract('$Strings');
  return { mock };
}

describe('Strings', function () {
  before(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('toString', function () {
    const values = [
      0n,
      7n,
      10n,
      99n,
      100n,
      101n,
      123n,
      4132n,
      12345n,
      1234567n,
      1234567890n,
      123456789012345n,
      12345678901234567890n,
      123456789012345678901234567890n,
      1234567890123456789012345678901234567890n,
      12345678901234567890123456789012345678901234567890n,
      123456789012345678901234567890123456789012345678901234567890n,
      1234567890123456789012345678901234567890123456789012345678901234567890n,
    ];

    describe('uint256', function () {
      it('converts MAX_UINT256', async function () {
        const value = ethers.MaxUint256;
        expect(await this.mock.$toString(value)).to.equal(value.toString(10));
      });

      for (const value of values) {
        it(`converts ${value}`, async function () {
          expect(await this.mock.$toString(value)).to.equal(value);
        });
      }
    });

    describe('int256', function () {
      it('converts MAX_INT256', async function () {
        const value = ethers.MaxInt256;
        expect(await this.mock.$toStringSigned(value)).to.equal(value.toString(10));
      });

      it('converts MIN_INT256', async function () {
        const value = ethers.MinInt256;
        expect(await this.mock.$toStringSigned(value)).to.equal(value.toString(10));
      });

      for (const value of values) {
        it(`convert ${value}`, async function () {
          expect(await this.mock.$toStringSigned(value)).to.equal(value);
        });

        it(`convert negative ${value}`, async function () {
          const negated = -value;
          expect(await this.mock.$toStringSigned(negated)).to.equal(negated.toString(10));
        });
      }
    });
  });

  describe('toHexString', function () {
    it('converts 0', async function () {
      expect(await this.mock.getFunction('$toHexString(uint256)')(0n)).to.equal('0x00');
    });

    it('converts a positive number', async function () {
      expect(await this.mock.getFunction('$toHexString(uint256)')(0x4132n)).to.equal('0x4132');
    });

    it('converts MAX_UINT256', async function () {
      expect(await this.mock.getFunction('$toHexString(uint256)')(ethers.MaxUint256)).to.equal(
        `0x${ethers.MaxUint256.toString(16)}`,
      );
    });
  });

  describe('toHexString fixed', function () {
    it('converts a positive number (long)', async function () {
      expect(await this.mock.getFunction('$toHexString(uint256,uint256)')(0x4132n, 32n)).to.equal(
        '0x0000000000000000000000000000000000000000000000000000000000004132',
      );
    });

    it('converts a positive number (short)', async function () {
      const length = 1n;
      await expect(this.mock.getFunction('$toHexString(uint256,uint256)')(0x4132n, length))
        .to.be.revertedWithCustomError(this.mock, `StringsInsufficientHexLength`)
        .withArgs(0x4132, length);
    });

    it('converts MAX_UINT256', async function () {
      expect(await this.mock.getFunction('$toHexString(uint256,uint256)')(ethers.MaxUint256, 32n)).to.equal(
        `0x${ethers.MaxUint256.toString(16)}`,
      );
    });
  });

  describe('addresses', function () {
    const addresses = [
      '0xa9036907dccae6a1e0033479b12e837e5cf5a02f', // Random address
      '0x0000e0ca771e21bd00057f54a68c30d400000000', // Leading and trailing zeros
      // EIP-55 reference
      '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
      '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359',
      '0xdbF03B407c01E7cD3CBea99509d93f8DDDC8C6FB',
      '0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb',
      '0xfb6916095ca1df60bb79ce92ce3ea74c37c5d359',
      '0x52908400098527886E0F7030069857D2E4169EE7',
      '0x8617E340B3D01FA5F11F306F4090FD50E238070D',
      '0xde709f2102306220921060314715629080e2fb77',
      '0x27b1fdb04752bbc536007a920d24acb045561c26',
      '0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed',
      '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359',
      '0xdbF03B407c01E7cD3CBea99509d93f8DDDC8C6FB',
      '0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb',
    ];

    describe('toHexString', function () {
      for (const addr of addresses) {
        it(`converts ${addr}`, async function () {
          expect(await this.mock.getFunction('$toHexString(address)')(addr)).to.equal(addr.toLowerCase());
        });
      }
    });

    describe('toChecksumHexString', function () {
      for (const addr of addresses) {
        it(`converts ${addr}`, async function () {
          expect(await this.mock.getFunction('$toChecksumHexString(address)')(addr)).to.equal(
            ethers.getAddress(addr.toLowerCase()),
          );
        });
      }
    });
  });

  describe('equal', function () {
    it('compares two empty strings', async function () {
      expect(await this.mock.$equal('', '')).to.be.true;
    });

    it('compares two equal strings', async function () {
      expect(await this.mock.$equal('a', 'a')).to.be.true;
    });

    it('compares two different strings', async function () {
      expect(await this.mock.$equal('a', 'b')).to.be.false;
    });

    it('compares two different strings of different lengths', async function () {
      expect(await this.mock.$equal('a', 'aa')).to.be.false;
      expect(await this.mock.$equal('aa', 'a')).to.be.false;
    });

    it('compares two different large strings', async function () {
      const str1 = 'a'.repeat(201);
      const str2 = 'a'.repeat(200) + 'b';
      expect(await this.mock.$equal(str1, str2)).to.be.false;
    });

    it('compares two equal large strings', async function () {
      const str1 = 'a'.repeat(201);
      const str2 = 'a'.repeat(201);
      expect(await this.mock.$equal(str1, str2)).to.be.true;
    });
  });
});
