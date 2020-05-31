const { accounts, contract } = require('@openzeppelin/test-environment');
const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const EnumerableAddressSetMock = contract.fromArtifact('EnumerableAddressSetMock');
const EnumerableUintSetMock = contract.fromArtifact('EnumerableUintSetMock');

describe('EnumerableSet', function () {
  // AddressSet
  describe('EnumerableAddressSet', function () {
    const [ accountA, accountB, accountC ] = accounts;

    beforeEach(async function () {
      this.set = await EnumerableAddressSetMock.new();
    });

    async function expectMembersMatch (set, values) {
      await Promise.all(values.map(async account =>
        expect(await set.contains(account)).to.equal(true)
      ));

      expect(await set.length()).to.bignumber.equal(values.length.toString());

      expect(await Promise.all([...Array(values.length).keys()].map(index =>
        set.at(index)
      ))).to.have.same.members(values);
    }

    it('starts empty', async function () {
      expect(await this.set.contains(accountA)).to.equal(false);

      await expectMembersMatch(this.set, []);
    });

    it('adds a value', async function () {
      const receipt = await this.set.add(accountA);
      expectEvent(receipt, 'OperationResult', { result: true });

      await expectMembersMatch(this.set, [accountA]);
    });

    it('adds several values', async function () {
      await this.set.add(accountA);
      await this.set.add(accountB);

      await expectMembersMatch(this.set, [accountA, accountB]);
      expect(await this.set.contains(accountC)).to.equal(false);
    });

    it('returns false when adding values already in the set', async function () {
      await this.set.add(accountA);

      const receipt = (await this.set.add(accountA));
      expectEvent(receipt, 'OperationResult', { result: false });

      await expectMembersMatch(this.set, [accountA]);
    });

    it('reverts when retrieving non-existent elements', async function () {
      await expectRevert(this.set.at(0), 'EnumerableSet: index out of bounds');
    });

    it('removes added values', async function () {
      await this.set.add(accountA);

      const receipt = await this.set.remove(accountA);
      expectEvent(receipt, 'OperationResult', { result: true });

      expect(await this.set.contains(accountA)).to.equal(false);
      await expectMembersMatch(this.set, []);
    });

    it('returns false when removing values not in the set', async function () {
      const receipt = await this.set.remove(accountA);
      expectEvent(receipt, 'OperationResult', { result: false });

      expect(await this.set.contains(accountA)).to.equal(false);
    });

    it('adds and removes multiple values', async function () {
      // []

      await this.set.add(accountA);
      await this.set.add(accountC);

      // [A, C]

      await this.set.remove(accountA);
      await this.set.remove(accountB);

      // [C]

      await this.set.add(accountB);

      // [C, B]

      await this.set.add(accountA);
      await this.set.remove(accountC);

      // [A, B]

      await this.set.add(accountA);
      await this.set.add(accountB);

      // [A, B]

      await this.set.add(accountC);
      await this.set.remove(accountA);

      // [B, C]

      await this.set.add(accountA);
      await this.set.remove(accountB);

      // [A, C]

      await expectMembersMatch(this.set, [accountA, accountC]);

      expect(await this.set.contains(accountB)).to.equal(false);
    });
  });

  // UintSet
  describe('EnumerableUintSet', function () {
    const uintA = new BN('1234');
    const uintB = new BN('5678');
    const uintC = new BN('9101112');

    beforeEach(async function () {
      this.set = await EnumerableUintSetMock.new();
    });

    async function expectMembersMatch (set, values) {
      await Promise.all(values.map(async uint =>
        expect(await set.contains(uint)).to.equal(true)
      ));

      expect(await set.length()).to.bignumber.equal(values.length.toString());

      // To compare values we convert BNs to strings to workaround Chai
      // limitations when dealing with nested arrays
      expect(await Promise.all([...Array(values.length).keys()].map(async (index) => {
        const entry = await set.at(index);
        return entry.toString();
      }))).to.have.same.members(values.map(v => v.toString()));
    }

    it('starts empty', async function () {
      expect(await this.set.contains(uintA)).to.equal(false);

      await expectMembersMatch(this.set, []);
    });

    it('adds a value', async function () {
      const receipt = await this.set.add(uintA);
      expectEvent(receipt, 'OperationResult', { result: true });

      await expectMembersMatch(this.set, [uintA]);
    });

    it('adds several values', async function () {
      await this.set.add(uintA);
      await this.set.add(uintB);

      await expectMembersMatch(this.set, [uintA, uintB]);
      expect(await this.set.contains(uintC)).to.equal(false);
    });

    it('returns false when adding values already in the set', async function () {
      await this.set.add(uintA);

      const receipt = (await this.set.add(uintA));
      expectEvent(receipt, 'OperationResult', { result: false });

      await expectMembersMatch(this.set, [uintA]);
    });

    it('reverts when retrieving non-existent elements', async function () {
      await expectRevert(this.set.at(0), 'EnumerableSet: index out of bounds');
    });

    it('removes added values', async function () {
      await this.set.add(uintA);

      const receipt = await this.set.remove(uintA);
      expectEvent(receipt, 'OperationResult', { result: true });

      expect(await this.set.contains(uintA)).to.equal(false);
      await expectMembersMatch(this.set, []);
    });

    it('returns false when removing values not in the set', async function () {
      const receipt = await this.set.remove(uintA);
      expectEvent(receipt, 'OperationResult', { result: false });

      expect(await this.set.contains(uintA)).to.equal(false);
    });

    it('adds and removes multiple values', async function () {
      // []

      await this.set.add(uintA);
      await this.set.add(uintC);

      // [A, C]

      await this.set.remove(uintA);
      await this.set.remove(uintB);

      // [C]

      await this.set.add(uintB);

      // [C, B]

      await this.set.add(uintA);
      await this.set.remove(uintC);

      // [A, B]

      await this.set.add(uintA);
      await this.set.add(uintB);

      // [A, B]

      await this.set.add(uintC);
      await this.set.remove(uintA);

      // [B, C]

      await this.set.add(uintA);
      await this.set.remove(uintB);

      // [A, C]

      await expectMembersMatch(this.set, [uintA, uintC]);

      expect(await this.set.contains(uintB)).to.equal(false);
    });
  });
});
