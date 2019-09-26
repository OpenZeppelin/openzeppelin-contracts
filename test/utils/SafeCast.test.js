const SafeCastMock = artifacts.require('SafeCastMock');
const { expectRevert } = require('openzeppelin-test-helpers');

contract('SafeCast', async (accounts) => {
  describe('castU128()', () => {
    it('reverts on overflow (i.e. input >= 2^128)', async () => {
      const contract = await SafeCastMock.new();
      await expectRevert(
        contract.castU128('340282366920938463463374607431768211456'),
        'SafeCast: downcast overflow'
      );
      await expectRevert(
        contract.castU128('999340282366920938463463374607431768211455'),
        'SafeCast: downcast overflow'
      );
    });
    it('passes where appropriate (i.e. 0 <= input < 2^128)', async () => {
      const contract = await SafeCastMock.new();
      assert.equal(await contract.castU128(0), 0);
      assert.equal(await contract.castU128(1), 1);
      assert.equal(
        (await contract.castU128('340282366920938463463374607431768211455')).toString(),
        '340282366920938463463374607431768211455'
      );
    });
  });
  describe('castU64()', () => {
    it('reverts on overflow (i.e. input >= 2^64)', async () => {
      const contract = await SafeCastMock.new();
      await expectRevert(contract.castU64('18446744073709551616'), 'SafeCast: downcast overflow');
      await expectRevert(contract.castU64('18446744073709551617'), 'SafeCast: downcast overflow');
    });
    it('passes where appropriate (i.e. 0 <= input < 2^64)', async () => {
      const contract = await SafeCastMock.new();
      assert.equal(await contract.castU64(0), 0);
      assert.equal(await contract.castU64(1), 1);
      assert.equal((await contract.castU64('18446744073709551615')).toString(), '18446744073709551615');
    });
  });
  describe('castU32()', () => {
    it('reverts on overflow (i.e. input >= 2^32)', async () => {
      const contract = await SafeCastMock.new();
      await expectRevert(contract.castU32('4294967296'), 'SafeCast: downcast overflow');
      await expectRevert(contract.castU32('4294967297'), 'SafeCast: downcast overflow');
    });
    it('passes where appropriate (i.e. 0 <= input < 2^32)', async () => {
      const contract = await SafeCastMock.new();
      assert.equal(await contract.castU32(0), 0);
      assert.equal(await contract.castU32(1), 1);
      assert.equal(await contract.castU32(4294967295), 4294967295);
    });
  });
  describe('castU16()', () => {
    it('reverts on overflow (i.e. input >= 2^16)', async () => {
      const contract = await SafeCastMock.new();
      await expectRevert(contract.castU16('65536'), 'SafeCast: downcast overflow');
      await expectRevert(contract.castU16('65537'), 'SafeCast: downcast overflow');
    });

    it('passes where appropriate (i.e. 0 <= input < 2^16)', async () => {
      const contract = await SafeCastMock.new();
      assert.equal(await contract.castU16(0), 0);
      assert.equal(await contract.castU16(1), 1);
      assert.equal(await contract.castU16(65535), 65535);
    });
  });
  describe('castU8()', () => {
    it('reverts on overflow (i.e. input >= 2^8)', async () => {
      const contract = await SafeCastMock.new();
      await expectRevert(contract.castU8(256), 'SafeCast: downcast overflow');
      await expectRevert(contract.castU8(257), 'SafeCast: downcast overflow');
    });
    it('passes where appropriate (i.e. 0 <= input < 2^8)', async () => {
      const contract = await SafeCastMock.new();
      assert.equal(await contract.castU8(0), 0);
      assert.equal(await contract.castU8(1), 1);
      assert.equal(await contract.castU8(255), 255);
    });
  });
});
