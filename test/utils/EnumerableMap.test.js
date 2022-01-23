const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const zip = require('lodash.zip');

const EnumerableMapMock = artifacts.require('EnumerableMapMock');

contract('EnumerableMap', function (accounts) {
  const [ accountA, accountB, accountC ] = accounts;

  const keyA = new BN('7891');
  const keyB = new BN('451');
  const keyC = new BN('9592328');

  beforeEach(async function () {
    this.map = await EnumerableMapMock.new();
  });

  async function expectMembersMatch (map, keys, values) {
    expect(keys.length).to.equal(values.length);

    await Promise.all(keys.map(async key =>
      expect(await map.contains(key)).to.equal(true),
    ));

    expect(await map.length()).to.bignumber.equal(keys.length.toString());

    expect(await Promise.all(keys.map(key =>
      map.get(key),
    ))).to.have.same.members(values);

    // To compare key-value pairs, we zip keys and values, and convert BNs to
    // strings to workaround Chai limitations when dealing with nested arrays
    expect(await Promise.all([...Array(keys.length).keys()].map(async (index) => {
      const entry = await map.at(index);
      return [entry.key.toString(), entry.value];
    }))).to.have.same.deep.members(
      zip(keys.map(k => k.toString()), values),
    );
  }

  it('starts empty', async function () {
    expect(await this.map.contains(keyA)).to.equal(false);

    await expectMembersMatch(this.map, [], []);
  });

  describe('set', function () {
    it('adds a key', async function () {
      const receipt = await this.map.set(keyA, accountA);
      expectEvent(receipt, 'OperationResult', { result: true });

      await expectMembersMatch(this.map, [keyA], [accountA]);
    });

    it('adds several keys', async function () {
      await this.map.set(keyA, accountA);
      await this.map.set(keyB, accountB);

      await expectMembersMatch(this.map, [keyA, keyB], [accountA, accountB]);
      expect(await this.map.contains(keyC)).to.equal(false);
    });

    it('returns false when adding keys already in the set', async function () {
      await this.map.set(keyA, accountA);

      const receipt = (await this.map.set(keyA, accountA));
      expectEvent(receipt, 'OperationResult', { result: false });

      await expectMembersMatch(this.map, [keyA], [accountA]);
    });

    it('updates values for keys already in the set', async function () {
      await this.map.set(keyA, accountA);

      await this.map.set(keyA, accountB);

      await expectMembersMatch(this.map, [keyA], [accountB]);
    });
  });

  describe('remove', function () {
    it('removes added keys', async function () {
      await this.map.set(keyA, accountA);

      const receipt = await this.map.remove(keyA);
      expectEvent(receipt, 'OperationResult', { result: true });

      expect(await this.map.contains(keyA)).to.equal(false);
      await expectMembersMatch(this.map, [], []);
    });

    it('returns false when removing keys not in the set', async function () {
      const receipt = await this.map.remove(keyA);
      expectEvent(receipt, 'OperationResult', { result: false });

      expect(await this.map.contains(keyA)).to.equal(false);
    });

    it('adds and removes multiple keys', async function () {
      // []

      await this.map.set(keyA, accountA);
      await this.map.set(keyC, accountC);

      // [A, C]

      await this.map.remove(keyA);
      await this.map.remove(keyB);

      // [C]

      await this.map.set(keyB, accountB);

      // [C, B]

      await this.map.set(keyA, accountA);
      await this.map.remove(keyC);

      // [A, B]

      await this.map.set(keyA, accountA);
      await this.map.set(keyB, accountB);

      // [A, B]

      await this.map.set(keyC, accountC);
      await this.map.remove(keyA);

      // [B, C]

      await this.map.set(keyA, accountA);
      await this.map.remove(keyB);

      // [A, C]

      await expectMembersMatch(this.map, [keyA, keyC], [accountA, accountC]);

      expect(await this.map.contains(keyB)).to.equal(false);
    });
  });

  describe('read', function () {
    beforeEach(async function () {
      await this.map.set(keyA, accountA);
    });

    describe('get', function () {
      it('existing value', async function () {
        expect(await this.map.get(keyA)).to.be.equal(accountA);
      });
      it('missing value', async function () {
        await expectRevert(this.map.get(keyB), 'EnumerableMap: nonexistent key');
      });
    });

    describe('get with message', function () {
      it('existing value', async function () {
        expect(await this.map.getWithMessage(keyA, 'custom error string')).to.be.equal(accountA);
      });
      it('missing value', async function () {
        await expectRevert(this.map.getWithMessage(keyB, 'custom error string'), 'custom error string');
      });
    });

    describe('tryGet', function () {
      it('existing value', async function () {
        expect(await this.map.tryGet(keyA)).to.be.deep.equal({
          0: true,
          1: accountA,
        });
      });
      it('missing value', async function () {
        expect(await this.map.tryGet(keyB)).to.be.deep.equal({
          0: false,
          1: constants.ZERO_ADDRESS,
        });
      });
    });
  });
});
