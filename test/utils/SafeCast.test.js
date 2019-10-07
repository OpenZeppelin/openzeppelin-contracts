const SafeCastMock = artifacts.require('SafeCastMock');
const { expectRevert } = require('openzeppelin-test-helpers');

contract('SafeCast', async (accounts) => {
  describe('toUint128()', () => {
    it('reverts on overflow (i.e. input >= 2^128)', async () => {
      const contract = await SafeCastMock.new();
      await expectRevert(
        contract.toUint128('340282366920938463463374607431768211456'),
        'SafeCast: value doesn\'t fit in 128 bits'
      );
      await expectRevert(
        contract.toUint128('999340282366920938463463374607431768211455'),
        'SafeCast: value doesn\'t fit in 128 bits'
      );
    });
    it('passes where appropriate (i.e. 0 <= input < 2^128)', async () => {
      const contract = await SafeCastMock.new();
      assert.equal(await contract.toUint128(0), 0);
      assert.equal(await contract.toUint128(1), 1);
      assert.equal(
        (await contract.toUint128('340282366920938463463374607431768211455')).toString(),
        '340282366920938463463374607431768211455'
      );
    });
  });
  describe('toUint64()', () => {
    it('reverts on overflow (i.e. input >= 2^64)', async () => {
      const contract = await SafeCastMock.new();
      await expectRevert(contract.toUint64('18446744073709551616'), 'SafeCast: value doesn\'t fit in 64 bits');
      await expectRevert(contract.toUint64('18446744073709551617'), 'SafeCast: value doesn\'t fit in 64 bits');
    });
    it('passes where appropriate (i.e. 0 <= input < 2^64)', async () => {
      const contract = await SafeCastMock.new();
      assert.equal(await contract.toUint64(0), 0);
      assert.equal(await contract.toUint64(1), 1);
      assert.equal((await contract.toUint64('18446744073709551615')).toString(), '18446744073709551615');
    });
  });
  describe('toUint32()', () => {
    it('reverts on overflow (i.e. input >= 2^32)', async () => {
      const contract = await SafeCastMock.new();
      await expectRevert(contract.toUint32('4294967296'), 'SafeCast: value doesn\'t fit in 32 bits');
      await expectRevert(contract.toUint32('4294967297'), 'SafeCast: value doesn\'t fit in 32 bits');
    });
    it('passes where appropriate (i.e. 0 <= input < 2^32)', async () => {
      const contract = await SafeCastMock.new();
      assert.equal(await contract.toUint32(0), 0);
      assert.equal(await contract.toUint32(1), 1);
      assert.equal(await contract.toUint32(4294967295), 4294967295);
    });
  });
  describe('toUint16()', () => {
    it('reverts on overflow (i.e. input >= 2^16)', async () => {
      const contract = await SafeCastMock.new();
      await expectRevert(contract.toUint16('65536'), 'SafeCast: value doesn\'t fit in 16 bits');
      await expectRevert(contract.toUint16('65537'), 'SafeCast: value doesn\'t fit in 16 bits');
    });

    it('passes where appropriate (i.e. 0 <= input < 2^16)', async () => {
      const contract = await SafeCastMock.new();
      assert.equal(await contract.toUint16(0), 0);
      assert.equal(await contract.toUint16(1), 1);
      assert.equal(await contract.toUint16(65535), 65535);
    });
  });
  describe('toUint8()', () => {
    it('reverts on overflow (i.e. input >= 2^8)', async () => {
      const contract = await SafeCastMock.new();
      await expectRevert(contract.toUint8(256), 'SafeCast: value doesn\'t fit in 8 bits');
      await expectRevert(contract.toUint8(257), 'SafeCast: value doesn\'t fit in 8 bits');
    });
    it('passes where appropriate (i.e. 0 <= input < 2^8)', async () => {
      const contract = await SafeCastMock.new();
      assert.equal(await contract.toUint8(0), 0);
      assert.equal(await contract.toUint8(1), 1);
      assert.equal(await contract.toUint8(255), 255);
    });
  });
});
