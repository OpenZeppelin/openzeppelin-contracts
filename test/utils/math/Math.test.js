const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { PANIC_CODES } = require('@nomicfoundation/hardhat-chai-matchers/panic');

const { Rounding } = require('../../helpers/enums');
const { min, max, modExp } = require('../../helpers/math');
const { generators } = require('../../helpers/random');
const { product, range } = require('../../helpers/iterate');

const RoundingDown = [Rounding.Floor, Rounding.Trunc];
const RoundingUp = [Rounding.Ceil, Rounding.Expand];

const bytes = (value, width = undefined) => ethers.Typed.bytes(ethers.toBeHex(value, width));
const uint256 = value => ethers.Typed.uint256(value);
bytes.zero = '0x';
uint256.zero = 0n;

const testCommutative = (fn, lhs, rhs, expected, ...extra) =>
  Promise.all([
    expect(fn(lhs, rhs, ...extra)).to.eventually.deep.equal(expected),
    expect(fn(rhs, lhs, ...extra)).to.eventually.deep.equal(expected),
  ]);

const splitHighLow = n => [n / (1n << 256n), n % (1n << 256n)];

async function fixture() {
  const mock = await ethers.deployContract('$Math');

  // disambiguation, we use the version with explicit rounding
  mock.$mulDiv = mock['$mulDiv(uint256,uint256,uint256,uint8)'];
  mock.$sqrt = mock['$sqrt(uint256,uint8)'];
  mock.$log2 = mock['$log2(uint256,uint8)'];
  mock.$log10 = mock['$log10(uint256,uint8)'];
  mock.$log256 = mock['$log256(uint256,uint8)'];

  return { mock };
}

describe('Math', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('add512', function () {
    it('adds correctly without reverting', async function () {
      const values = [0n, 1n, 17n, 42n, ethers.MaxUint256 - 1n, ethers.MaxUint256];
      for (const [a, b] of product(values, values)) {
        await expect(this.mock.$add512(a, b)).to.eventually.deep.equal(splitHighLow(a + b));
      }
    });
  });

  describe('mul512', function () {
    it('multiplies correctly without reverting', async function () {
      const values = [0n, 1n, 17n, 42n, ethers.MaxUint256 - 1n, ethers.MaxUint256];
      for (const [a, b] of product(values, values)) {
        await expect(this.mock.$mul512(a, b)).to.eventually.deep.equal(splitHighLow(a * b));
      }
    });
  });

  describe('tryAdd', function () {
    it('adds correctly', async function () {
      const a = 5678n;
      const b = 1234n;
      await testCommutative(this.mock.$tryAdd, a, b, [true, a + b]);
    });

    it('reverts on addition overflow', async function () {
      const a = ethers.MaxUint256;
      const b = 1n;
      await testCommutative(this.mock.$tryAdd, a, b, [false, 0n]);
    });
  });

  describe('trySub', function () {
    it('subtracts correctly', async function () {
      const a = 5678n;
      const b = 1234n;
      await expect(this.mock.$trySub(a, b)).to.eventually.deep.equal([true, a - b]);
    });

    it('reverts if subtraction result would be negative', async function () {
      const a = 1234n;
      const b = 5678n;
      await expect(this.mock.$trySub(a, b)).to.eventually.deep.equal([false, 0n]);
    });
  });

  describe('tryMul', function () {
    it('multiplies correctly', async function () {
      const a = 1234n;
      const b = 5678n;
      await testCommutative(this.mock.$tryMul, a, b, [true, a * b]);
    });

    it('multiplies by zero correctly', async function () {
      const a = 0n;
      const b = 5678n;
      await testCommutative(this.mock.$tryMul, a, b, [true, a * b]);
    });

    it('reverts on multiplication overflow', async function () {
      const a = ethers.MaxUint256;
      const b = 2n;
      await testCommutative(this.mock.$tryMul, a, b, [false, 0n]);
    });
  });

  describe('tryDiv', function () {
    it('divides correctly', async function () {
      const a = 5678n;
      const b = 5678n;
      await expect(this.mock.$tryDiv(a, b)).to.eventually.deep.equal([true, a / b]);
    });

    it('divides zero correctly', async function () {
      const a = 0n;
      const b = 5678n;
      await expect(this.mock.$tryDiv(a, b)).to.eventually.deep.equal([true, a / b]);
    });

    it('returns complete number result on non-even division', async function () {
      const a = 7000n;
      const b = 5678n;
      await expect(this.mock.$tryDiv(a, b)).to.eventually.deep.equal([true, a / b]);
    });

    it('reverts on division by zero', async function () {
      const a = 5678n;
      const b = 0n;
      await expect(this.mock.$tryDiv(a, b)).to.eventually.deep.equal([false, 0n]);
    });
  });

  describe('tryMod', function () {
    describe('modulos correctly', function () {
      it('when the dividend is smaller than the divisor', async function () {
        const a = 284n;
        const b = 5678n;
        await expect(this.mock.$tryMod(a, b)).to.eventually.deep.equal([true, a % b]);
      });

      it('when the dividend is equal to the divisor', async function () {
        const a = 5678n;
        const b = 5678n;
        await expect(this.mock.$tryMod(a, b)).to.eventually.deep.equal([true, a % b]);
      });

      it('when the dividend is larger than the divisor', async function () {
        const a = 7000n;
        const b = 5678n;
        await expect(this.mock.$tryMod(a, b)).to.eventually.deep.equal([true, a % b]);
      });

      it('when the dividend is a multiple of the divisor', async function () {
        const a = 17034n; // 17034 == 5678 * 3
        const b = 5678n;
        await expect(this.mock.$tryMod(a, b)).to.eventually.deep.equal([true, a % b]);
      });
    });

    it('reverts with a 0 divisor', async function () {
      const a = 5678n;
      const b = 0n;
      await expect(this.mock.$tryMod(a, b)).to.eventually.deep.equal([false, 0n]);
    });
  });

  describe('saturatingAdd', function () {
    it('adds correctly', async function () {
      const a = 5678n;
      const b = 1234n;
      await testCommutative(this.mock.$saturatingAdd, a, b, a + b);
      await testCommutative(this.mock.$saturatingAdd, a, 0n, a);
      await testCommutative(this.mock.$saturatingAdd, ethers.MaxUint256, 0n, ethers.MaxUint256);
    });

    it('bounds on addition overflow', async function () {
      await testCommutative(this.mock.$saturatingAdd, ethers.MaxUint256, 1n, ethers.MaxUint256);
      await expect(this.mock.$saturatingAdd(ethers.MaxUint256, ethers.MaxUint256)).to.eventually.equal(
        ethers.MaxUint256,
      );
    });
  });

  describe('saturatingSub', function () {
    it('subtracts correctly', async function () {
      const a = 5678n;
      const b = 1234n;
      await expect(this.mock.$saturatingSub(a, b)).to.eventually.equal(a - b);
      await expect(this.mock.$saturatingSub(a, a)).to.eventually.equal(0n);
      await expect(this.mock.$saturatingSub(a, 0n)).to.eventually.equal(a);
      await expect(this.mock.$saturatingSub(0n, a)).to.eventually.equal(0n);
      await expect(this.mock.$saturatingSub(ethers.MaxUint256, 1n)).to.eventually.equal(ethers.MaxUint256 - 1n);
    });

    it('bounds on subtraction overflow', async function () {
      await expect(this.mock.$saturatingSub(0n, 1n)).to.eventually.equal(0n);
      await expect(this.mock.$saturatingSub(1n, 2n)).to.eventually.equal(0n);
      await expect(this.mock.$saturatingSub(1n, ethers.MaxUint256)).to.eventually.equal(0n);
      await expect(this.mock.$saturatingSub(ethers.MaxUint256 - 1n, ethers.MaxUint256)).to.eventually.equal(0n);
    });
  });

  describe('saturatingMul', function () {
    it('multiplies correctly', async function () {
      const a = 1234n;
      const b = 5678n;
      await testCommutative(this.mock.$saturatingMul, a, b, a * b);
    });

    it('multiplies by zero correctly', async function () {
      const a = 0n;
      const b = 5678n;
      await testCommutative(this.mock.$saturatingMul, a, b, 0n);
    });

    it('bounds on multiplication overflow', async function () {
      const a = ethers.MaxUint256;
      const b = 2n;
      await testCommutative(this.mock.$saturatingMul, a, b, ethers.MaxUint256);
    });
  });

  describe('max', function () {
    it('is correctly detected in both position', async function () {
      await testCommutative(this.mock.$max, 1234n, 5678n, max(1234n, 5678n));
    });
  });

  describe('min', function () {
    it('is correctly detected in both position', async function () {
      await testCommutative(this.mock.$min, 1234n, 5678n, min(1234n, 5678n));
    });
  });

  describe('average', function () {
    it('is correctly calculated with two odd numbers', async function () {
      const a = 57417n;
      const b = 95431n;
      await expect(this.mock.$average(a, b)).to.eventually.equal((a + b) / 2n);
    });

    it('is correctly calculated with two even numbers', async function () {
      const a = 42304n;
      const b = 84346n;
      await expect(this.mock.$average(a, b)).to.eventually.equal((a + b) / 2n);
    });

    it('is correctly calculated with one even and one odd number', async function () {
      const a = 57417n;
      const b = 84346n;
      await expect(this.mock.$average(a, b)).to.eventually.equal((a + b) / 2n);
    });

    it('is correctly calculated with two max uint256 numbers', async function () {
      const a = ethers.MaxUint256;
      await expect(this.mock.$average(a, a)).to.eventually.equal(a);
    });
  });

  describe('ceilDiv', function () {
    it('reverts on zero division', async function () {
      const a = 2n;
      const b = 0n;
      // It's unspecified because it's a low level 0 division error
      await expect(this.mock.$ceilDiv(a, b)).to.be.revertedWithPanic(PANIC_CODES.DIVISION_BY_ZERO);
    });

    it('does not round up a zero result', async function () {
      const a = 0n;
      const b = 2n;
      const r = 0n;
      await expect(this.mock.$ceilDiv(a, b)).to.eventually.equal(r);
    });

    it('does not round up on exact division', async function () {
      const a = 10n;
      const b = 5n;
      const r = 2n;
      await expect(this.mock.$ceilDiv(a, b)).to.eventually.equal(r);
    });

    it('rounds up on division with remainders', async function () {
      const a = 42n;
      const b = 13n;
      const r = 4n;
      await expect(this.mock.$ceilDiv(a, b)).to.eventually.equal(r);
    });

    it('does not overflow', async function () {
      const a = ethers.MaxUint256;
      const b = 2n;
      const r = 1n << 255n;
      await expect(this.mock.$ceilDiv(a, b)).to.eventually.equal(r);
    });

    it('correctly computes max uint256 divided by 1', async function () {
      const a = ethers.MaxUint256;
      const b = 1n;
      const r = ethers.MaxUint256;
      await expect(this.mock.$ceilDiv(a, b)).to.eventually.equal(r);
    });
  });

  describe('mulDiv', function () {
    it('divide by 0', async function () {
      const a = 1n;
      const b = 1n;
      const c = 0n;
      await expect(this.mock.$mulDiv(a, b, c, Rounding.Floor)).to.be.revertedWithPanic(PANIC_CODES.DIVISION_BY_ZERO);
    });

    it('reverts with result higher than 2 ^ 256', async function () {
      const a = 5n;
      const b = ethers.MaxUint256;
      const c = 2n;
      await expect(this.mock.$mulDiv(a, b, c, Rounding.Floor)).to.be.revertedWithPanic(
        PANIC_CODES.ARITHMETIC_UNDER_OR_OVERFLOW,
      );
    });

    describe('does round down', function () {
      it('small values', async function () {
        for (const rounding of RoundingDown) {
          await expect(this.mock.$mulDiv(3n, 4n, 5n, rounding)).to.eventually.equal(2n);
          await expect(this.mock.$mulDiv(3n, 5n, 5n, rounding)).to.eventually.equal(3n);
        }
      });

      it('large values', async function () {
        for (const rounding of RoundingDown) {
          await expect(this.mock.$mulDiv(42n, ethers.MaxUint256 - 1n, ethers.MaxUint256, rounding)).to.eventually.equal(
            41n,
          );

          await expect(this.mock.$mulDiv(17n, ethers.MaxUint256, ethers.MaxUint256, rounding)).to.eventually.equal(17n);

          await expect(
            this.mock.$mulDiv(ethers.MaxUint256 - 1n, ethers.MaxUint256 - 1n, ethers.MaxUint256, rounding),
          ).to.eventually.equal(ethers.MaxUint256 - 2n);

          await expect(
            this.mock.$mulDiv(ethers.MaxUint256, ethers.MaxUint256 - 1n, ethers.MaxUint256, rounding),
          ).to.eventually.equal(ethers.MaxUint256 - 1n);

          await expect(
            this.mock.$mulDiv(ethers.MaxUint256, ethers.MaxUint256, ethers.MaxUint256, rounding),
          ).to.eventually.equal(ethers.MaxUint256);
        }
      });
    });

    describe('does round up', function () {
      it('small values', async function () {
        for (const rounding of RoundingUp) {
          await expect(this.mock.$mulDiv(3n, 4n, 5n, rounding)).to.eventually.equal(3n);
          await expect(this.mock.$mulDiv(3n, 5n, 5n, rounding)).to.eventually.equal(3n);
        }
      });

      it('large values', async function () {
        for (const rounding of RoundingUp) {
          await expect(this.mock.$mulDiv(42n, ethers.MaxUint256 - 1n, ethers.MaxUint256, rounding)).to.eventually.equal(
            42n,
          );

          await expect(this.mock.$mulDiv(17n, ethers.MaxUint256, ethers.MaxUint256, rounding)).to.eventually.equal(17n);

          await expect(
            this.mock.$mulDiv(ethers.MaxUint256 - 1n, ethers.MaxUint256 - 1n, ethers.MaxUint256, rounding),
          ).to.eventually.equal(ethers.MaxUint256 - 1n);

          await expect(
            this.mock.$mulDiv(ethers.MaxUint256, ethers.MaxUint256 - 1n, ethers.MaxUint256, rounding),
          ).to.eventually.equal(ethers.MaxUint256 - 1n);

          await expect(
            this.mock.$mulDiv(ethers.MaxUint256, ethers.MaxUint256, ethers.MaxUint256, rounding),
          ).to.eventually.equal(ethers.MaxUint256);
        }
      });
    });
  });

  describe('mulShr', function () {
    it('reverts with result higher than 2 ^ 256', async function () {
      const a = 5n;
      const b = ethers.MaxUint256;
      const c = 1n;
      await expect(this.mock.$mulShr(a, b, c, Rounding.Floor)).to.be.revertedWithPanic(
        PANIC_CODES.ARITHMETIC_UNDER_OR_OVERFLOW,
      );
    });

    describe('does round down', function () {
      it('small values', async function () {
        for (const rounding of RoundingDown) {
          await expect(this.mock.$mulShr(3n, 5n, 1n, rounding)).to.eventually.equal(7n);
          await expect(this.mock.$mulShr(3n, 5n, 2n, rounding)).to.eventually.equal(3n);
        }
      });

      it('large values', async function () {
        for (const rounding of RoundingDown) {
          await expect(this.mock.$mulShr(42n, ethers.MaxUint256, 255n, rounding)).to.eventually.equal(83n);

          await expect(this.mock.$mulShr(17n, ethers.MaxUint256, 255n, rounding)).to.eventually.equal(33n);

          await expect(this.mock.$mulShr(ethers.MaxUint256, ethers.MaxInt256 + 1n, 255n, rounding)).to.eventually.equal(
            ethers.MaxUint256,
          );

          await expect(this.mock.$mulShr(ethers.MaxUint256, ethers.MaxInt256, 255n, rounding)).to.eventually.equal(
            ethers.MaxUint256 - 2n,
          );
        }
      });
    });

    describe('does round up', function () {
      it('small values', async function () {
        for (const rounding of RoundingUp) {
          await expect(this.mock.$mulShr(3n, 5n, 1n, rounding)).to.eventually.equal(8n);
          await expect(this.mock.$mulShr(3n, 5n, 2n, rounding)).to.eventually.equal(4n);
        }
      });

      it('large values', async function () {
        for (const rounding of RoundingUp) {
          await expect(this.mock.$mulShr(42n, ethers.MaxUint256, 255n, rounding)).to.eventually.equal(84n);

          await expect(this.mock.$mulShr(17n, ethers.MaxUint256, 255n, rounding)).to.eventually.equal(34n);

          await expect(this.mock.$mulShr(ethers.MaxUint256, ethers.MaxInt256 + 1n, 255n, rounding)).to.eventually.equal(
            ethers.MaxUint256,
          );

          await expect(this.mock.$mulShr(ethers.MaxUint256, ethers.MaxInt256, 255n, rounding)).to.eventually.equal(
            ethers.MaxUint256 - 1n,
          );
        }
      });
    });
  });

  describe('invMod', function () {
    for (const factors of [
      [0n],
      [1n],
      [2n],
      [17n],
      [65537n],
      [0xffffffff00000001000000000000000000000000ffffffffffffffffffffffffn],
      [3n, 5n],
      [3n, 7n],
      [47n, 53n],
    ]) {
      const p = factors.reduce((acc, f) => acc * f, 1n);

      describe(`using p=${p} which is ${p > 1 && factors.length > 1 ? 'not ' : ''}a prime`, function () {
        it('trying to inverse 0 returns 0', async function () {
          await expect(this.mock.$invMod(0, p)).to.eventually.equal(0n);
          await expect(this.mock.$invMod(p, p)).to.eventually.equal(0n); // p is 0 mod p
        });

        if (p != 0) {
          for (const value of Array.from({ length: 16 }, generators.uint256)) {
            const isInversible = factors.every(f => value % f);
            it(`trying to inverse ${value}`, async function () {
              const result = await this.mock.$invMod(value, p);
              if (isInversible) {
                expect((value * result) % p).to.equal(1n);
              } else {
                expect(result).to.equal(0n);
              }
            });
          }
        }
      });
    }
  });

  describe('modExp', function () {
    for (const [name, type] of Object.entries({ uint256, bytes })) {
      describe(`with ${name} inputs`, function () {
        it('is correctly calculating modulus', async function () {
          const b = 3n;
          const e = 200n;
          const m = 50n;

          await expect(this.mock.$modExp(type(b), type(e), type(m))).to.eventually.equal(type(b ** e % m).value);
        });

        it('is correctly reverting when modulus is zero', async function () {
          const b = 3n;
          const e = 200n;
          const m = 0n;

          await expect(this.mock.$modExp(type(b), type(e), type(m))).to.be.revertedWithPanic(
            PANIC_CODES.DIVISION_BY_ZERO,
          );
        });
      });
    }

    describe('with large bytes inputs', function () {
      for (const [[b, log2b], [e, log2e], [m, log2m]] of product(
        range(320, 512, 64).map(e => [2n ** BigInt(e) + 1n, e]),
        range(320, 512, 64).map(e => [2n ** BigInt(e) + 1n, e]),
        range(320, 512, 64).map(e => [2n ** BigInt(e) + 1n, e]),
      )) {
        it(`calculates b ** e % m (b=2**${log2b}+1) (e=2**${log2e}+1) (m=2**${log2m}+1)`, async function () {
          const mLength = ethers.dataLength(ethers.toBeHex(m));

          await expect(this.mock.$modExp(bytes(b), bytes(e), bytes(m))).to.eventually.equal(
            bytes(modExp(b, e, m), mLength).value,
          );
        });
      }
    });
  });

  describe('tryModExp', function () {
    for (const [name, type] of Object.entries({ uint256, bytes })) {
      describe(`with ${name} inputs`, function () {
        it('is correctly calculating modulus', async function () {
          const b = 3n;
          const e = 200n;
          const m = 50n;

          await expect(this.mock.$tryModExp(type(b), type(e), type(m))).to.eventually.deep.equal([
            true,
            type(b ** e % m).value,
          ]);
        });

        it('is correctly reverting when modulus is zero', async function () {
          const b = 3n;
          const e = 200n;
          const m = 0n;

          await expect(this.mock.$tryModExp(type(b), type(e), type(m))).to.eventually.deep.equal([false, type.zero]);
        });
      });
    }

    describe('with large bytes inputs', function () {
      for (const [[b, log2b], [e, log2e], [m, log2m]] of product(
        range(320, 513, 64).map(e => [2n ** BigInt(e) + 1n, e]),
        range(320, 513, 64).map(e => [2n ** BigInt(e) + 1n, e]),
        range(320, 513, 64).map(e => [2n ** BigInt(e) + 1n, e]),
      )) {
        it(`calculates b ** e % m (b=2**${log2b}+1) (e=2**${log2e}+1) (m=2**${log2m}+1)`, async function () {
          const mLength = ethers.dataLength(ethers.toBeHex(m));

          await expect(this.mock.$tryModExp(bytes(b), bytes(e), bytes(m))).to.eventually.deep.equal([
            true,
            bytes(modExp(b, e, m), mLength).value,
          ]);
        });
      }
    });
  });

  describe('sqrt', function () {
    it('rounds down', async function () {
      for (const rounding of RoundingDown) {
        await expect(this.mock.$sqrt(0n, rounding)).to.eventually.equal(0n);
        await expect(this.mock.$sqrt(1n, rounding)).to.eventually.equal(1n);
        await expect(this.mock.$sqrt(2n, rounding)).to.eventually.equal(1n);
        await expect(this.mock.$sqrt(3n, rounding)).to.eventually.equal(1n);
        await expect(this.mock.$sqrt(4n, rounding)).to.eventually.equal(2n);
        await expect(this.mock.$sqrt(144n, rounding)).to.eventually.equal(12n);
        await expect(this.mock.$sqrt(999999n, rounding)).to.eventually.equal(999n);
        await expect(this.mock.$sqrt(1000000n, rounding)).to.eventually.equal(1000n);
        await expect(this.mock.$sqrt(1000001n, rounding)).to.eventually.equal(1000n);
        await expect(this.mock.$sqrt(1002000n, rounding)).to.eventually.equal(1000n);
        await expect(this.mock.$sqrt(1002001n, rounding)).to.eventually.equal(1001n);
        await expect(this.mock.$sqrt(ethers.MaxUint256, rounding)).to.eventually.equal(
          340282366920938463463374607431768211455n,
        );
      }
    });

    it('rounds up', async function () {
      for (const rounding of RoundingUp) {
        await expect(this.mock.$sqrt(0n, rounding)).to.eventually.equal(0n);
        await expect(this.mock.$sqrt(1n, rounding)).to.eventually.equal(1n);
        await expect(this.mock.$sqrt(2n, rounding)).to.eventually.equal(2n);
        await expect(this.mock.$sqrt(3n, rounding)).to.eventually.equal(2n);
        await expect(this.mock.$sqrt(4n, rounding)).to.eventually.equal(2n);
        await expect(this.mock.$sqrt(144n, rounding)).to.eventually.equal(12n);
        await expect(this.mock.$sqrt(999999n, rounding)).to.eventually.equal(1000n);
        await expect(this.mock.$sqrt(1000000n, rounding)).to.eventually.equal(1000n);
        await expect(this.mock.$sqrt(1000001n, rounding)).to.eventually.equal(1001n);
        await expect(this.mock.$sqrt(1002000n, rounding)).to.eventually.equal(1001n);
        await expect(this.mock.$sqrt(1002001n, rounding)).to.eventually.equal(1001n);
        await expect(this.mock.$sqrt(ethers.MaxUint256, rounding)).to.eventually.equal(
          340282366920938463463374607431768211456n,
        );
      }
    });
  });

  describe('log', function () {
    describe('log2', function () {
      it('rounds down', async function () {
        for (const rounding of RoundingDown) {
          await expect(this.mock.$log2(0n, rounding)).to.eventually.equal(0n);
          await expect(this.mock.$log2(1n, rounding)).to.eventually.equal(0n);
          await expect(this.mock.$log2(2n, rounding)).to.eventually.equal(1n);
          await expect(this.mock.$log2(3n, rounding)).to.eventually.equal(1n);
          await expect(this.mock.$log2(4n, rounding)).to.eventually.equal(2n);
          await expect(this.mock.$log2(5n, rounding)).to.eventually.equal(2n);
          await expect(this.mock.$log2(6n, rounding)).to.eventually.equal(2n);
          await expect(this.mock.$log2(7n, rounding)).to.eventually.equal(2n);
          await expect(this.mock.$log2(8n, rounding)).to.eventually.equal(3n);
          await expect(this.mock.$log2(9n, rounding)).to.eventually.equal(3n);
          await expect(this.mock.$log2(ethers.MaxUint256, rounding)).to.eventually.equal(255n);
        }
      });

      it('rounds up', async function () {
        for (const rounding of RoundingUp) {
          await expect(this.mock.$log2(0n, rounding)).to.eventually.equal(0n);
          await expect(this.mock.$log2(1n, rounding)).to.eventually.equal(0n);
          await expect(this.mock.$log2(2n, rounding)).to.eventually.equal(1n);
          await expect(this.mock.$log2(3n, rounding)).to.eventually.equal(2n);
          await expect(this.mock.$log2(4n, rounding)).to.eventually.equal(2n);
          await expect(this.mock.$log2(5n, rounding)).to.eventually.equal(3n);
          await expect(this.mock.$log2(6n, rounding)).to.eventually.equal(3n);
          await expect(this.mock.$log2(7n, rounding)).to.eventually.equal(3n);
          await expect(this.mock.$log2(8n, rounding)).to.eventually.equal(3n);
          await expect(this.mock.$log2(9n, rounding)).to.eventually.equal(4n);
          await expect(this.mock.$log2(ethers.MaxUint256, rounding)).to.eventually.equal(256n);
        }
      });
    });

    describe('log10', function () {
      it('rounds down', async function () {
        for (const rounding of RoundingDown) {
          await expect(this.mock.$log10(0n, rounding)).to.eventually.equal(0n);
          await expect(this.mock.$log10(1n, rounding)).to.eventually.equal(0n);
          await expect(this.mock.$log10(2n, rounding)).to.eventually.equal(0n);
          await expect(this.mock.$log10(9n, rounding)).to.eventually.equal(0n);
          await expect(this.mock.$log10(10n, rounding)).to.eventually.equal(1n);
          await expect(this.mock.$log10(11n, rounding)).to.eventually.equal(1n);
          await expect(this.mock.$log10(99n, rounding)).to.eventually.equal(1n);
          await expect(this.mock.$log10(100n, rounding)).to.eventually.equal(2n);
          await expect(this.mock.$log10(101n, rounding)).to.eventually.equal(2n);
          await expect(this.mock.$log10(999n, rounding)).to.eventually.equal(2n);
          await expect(this.mock.$log10(1000n, rounding)).to.eventually.equal(3n);
          await expect(this.mock.$log10(1001n, rounding)).to.eventually.equal(3n);
          await expect(this.mock.$log10(ethers.MaxUint256, rounding)).to.eventually.equal(77n);
        }
      });

      it('rounds up', async function () {
        for (const rounding of RoundingUp) {
          await expect(this.mock.$log10(0n, rounding)).to.eventually.equal(0n);
          await expect(this.mock.$log10(1n, rounding)).to.eventually.equal(0n);
          await expect(this.mock.$log10(2n, rounding)).to.eventually.equal(1n);
          await expect(this.mock.$log10(9n, rounding)).to.eventually.equal(1n);
          await expect(this.mock.$log10(10n, rounding)).to.eventually.equal(1n);
          await expect(this.mock.$log10(11n, rounding)).to.eventually.equal(2n);
          await expect(this.mock.$log10(99n, rounding)).to.eventually.equal(2n);
          await expect(this.mock.$log10(100n, rounding)).to.eventually.equal(2n);
          await expect(this.mock.$log10(101n, rounding)).to.eventually.equal(3n);
          await expect(this.mock.$log10(999n, rounding)).to.eventually.equal(3n);
          await expect(this.mock.$log10(1000n, rounding)).to.eventually.equal(3n);
          await expect(this.mock.$log10(1001n, rounding)).to.eventually.equal(4n);
          await expect(this.mock.$log10(ethers.MaxUint256, rounding)).to.eventually.equal(78n);
        }
      });
    });

    describe('log256', function () {
      it('rounds down', async function () {
        for (const rounding of RoundingDown) {
          await expect(this.mock.$log256(0n, rounding)).to.eventually.equal(0n);
          await expect(this.mock.$log256(1n, rounding)).to.eventually.equal(0n);
          await expect(this.mock.$log256(2n, rounding)).to.eventually.equal(0n);
          await expect(this.mock.$log256(255n, rounding)).to.eventually.equal(0n);
          await expect(this.mock.$log256(256n, rounding)).to.eventually.equal(1n);
          await expect(this.mock.$log256(257n, rounding)).to.eventually.equal(1n);
          await expect(this.mock.$log256(65535n, rounding)).to.eventually.equal(1n);
          await expect(this.mock.$log256(65536n, rounding)).to.eventually.equal(2n);
          await expect(this.mock.$log256(65537n, rounding)).to.eventually.equal(2n);
          await expect(this.mock.$log256(ethers.MaxUint256, rounding)).to.eventually.equal(31n);
        }
      });

      it('rounds up', async function () {
        for (const rounding of RoundingUp) {
          await expect(this.mock.$log256(0n, rounding)).to.eventually.equal(0n);
          await expect(this.mock.$log256(1n, rounding)).to.eventually.equal(0n);
          await expect(this.mock.$log256(2n, rounding)).to.eventually.equal(1n);
          await expect(this.mock.$log256(255n, rounding)).to.eventually.equal(1n);
          await expect(this.mock.$log256(256n, rounding)).to.eventually.equal(1n);
          await expect(this.mock.$log256(257n, rounding)).to.eventually.equal(2n);
          await expect(this.mock.$log256(65535n, rounding)).to.eventually.equal(2n);
          await expect(this.mock.$log256(65536n, rounding)).to.eventually.equal(2n);
          await expect(this.mock.$log256(65537n, rounding)).to.eventually.equal(3n);
          await expect(this.mock.$log256(ethers.MaxUint256, rounding)).to.eventually.equal(32n);
        }
      });
    });
  });
});
