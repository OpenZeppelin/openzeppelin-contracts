const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { expectMembersMatch } = require('./helpers');

const AddressToUintMapMock = artifacts.require('AddressToUintMapMock');

contract('AddressToUintMap', function (accounts) {
  const [accountA, accountB, accountC] = accounts;

  const valueA = new BN('7891');
  const valueB = new BN('451');
  const valueC = new BN('9592328');

  beforeEach(async function () {
    this.map = await AddressToUintMapMock.new();
  });

  it('starts empty', async function () {
    expect(await this.map.contains(accountA)).to.equal(false);

    await expectMembersMatch(this.map, [], []);
  });

  describe('set', function () {
    it('adds a key', async function () {
      const receipt = await this.map.set(accountA, valueA);

      expectEvent(receipt, 'OperationResult', { result: true });

      await expectMembersMatch(this.map, [accountA], [valueA]);
    });

    it('adds several keys', async function () {
      await this.map.set(accountA, valueA);
      await this.map.set(accountB, valueB);

      await expectMembersMatch(this.map, [accountA, accountB], [valueA, valueB]);

      expect(await this.map.contains(accountC)).to.equal(false);
    });

    it('returns false when adding keys already in the set', async function () {
      await this.map.set(accountA, valueA);

      const receipt = await this.map.set(accountA, valueA);

      expectEvent(receipt, 'OperationResult', { result: false });

      await expectMembersMatch(this.map, [accountA], [valueA]);
    });

    it('updates values for keys already in the set', async function () {
      await this.map.set(accountA, valueA);
      await this.map.set(accountA, valueB);

      await expectMembersMatch(this.map, [accountA], [valueB]);
    });
  });

  describe('remove', function () {
    it('removes added keys', async function () {
      await this.map.set(accountA, valueA);

      const receipt = await this.map.remove(accountA);

      expectEvent(receipt, 'OperationResult', { result: true });

      expect(await this.map.contains(accountA)).to.equal(false);

      await expectMembersMatch(this.map, [], []);
    });

    it('returns false when removing keys not in the set', async function () {
      const receipt = await this.map.remove(accountA);

      expectEvent(receipt, 'OperationResult', { result: false });

      expect(await this.map.contains(accountA)).to.equal(false);
    });

    it('adds and removes multiple keys', async function () {
      // []

      await this.map.set(accountA, valueA);
      await this.map.set(accountC, valueC);

      // [A, C]

      await this.map.remove(accountA);
      await this.map.remove(accountB);

      // [C]

      await this.map.set(accountB, valueB);

      // [C, B]

      await this.map.set(accountA, valueA);
      await this.map.remove(accountC);

      // [A, B]

      await this.map.set(accountA, valueA);
      await this.map.set(accountB, valueB);

      // [A, B]

      await this.map.set(accountC, valueC);
      await this.map.remove(accountA);

      // [B, C]

      await this.map.set(accountA, valueA);
      await this.map.remove(accountB);

      // [A, C]

      await expectMembersMatch(this.map, [accountA, accountC], [valueA, valueC]);

      expect(await this.map.contains(accountB)).to.equal(false);
    });
  });

  describe('read', function () {
    beforeEach(async function () {
      await this.map.set(accountA, valueA);
    });

    describe('get', function () {
      it('existing value', async function () {
        expect(await this.map.get(accountA)).to.bignumber.equal(valueA);
      });

      it('missing value', async function () {
        await expectRevert(this.map.get(accountB), 'EnumerableMap: nonexistent key');
      });
    });

    describe('tryGet', function () {
      const stringifyTryGetValue = ({ 0: result, 1: value }) => ({ 0: result, 1: value.toString() });

      it('existing value', async function () {
        const actual = stringifyTryGetValue(await this.map.tryGet(accountA));
        const expected = stringifyTryGetValue({ 0: true, 1: valueA });

        expect(actual).to.deep.equal(expected);
      });

      it('missing value', async function () {
        const actual = stringifyTryGetValue(await this.map.tryGet(accountB));
        const expected = stringifyTryGetValue({ 0: false, 1: new BN('0') });

        expect(actual).to.deep.equal(expected);
      });
    });
  });
});
