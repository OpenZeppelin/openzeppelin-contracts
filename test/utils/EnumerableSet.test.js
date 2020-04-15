const { accounts, contract } = require('@openzeppelin/test-environment');
const { expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const EnumerableSetMock = contract.fromArtifact('EnumerableSetMock');

describe('EnumerableSet', function () {
  const [ accountA, accountB, accountC ] = accounts;

  beforeEach(async function () {
    this.set = await EnumerableSetMock.new();
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
