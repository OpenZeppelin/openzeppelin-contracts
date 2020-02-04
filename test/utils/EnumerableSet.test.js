const { accounts, contract } = require('@openzeppelin/test-environment');
const { expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const EnumerableSetMock = contract.fromArtifact('EnumerableSetMock');

describe('EnumerableSet', function () {
  const [ accountA, accountB, accountC ] = accounts;

  beforeEach(async function () {
    this.set = await EnumerableSetMock.new();
  });

  async function expectMembersMatch (set, members) {
    await Promise.all(members.map(async account =>
      expect(await set.contains(account)).to.equal(true)
    ));

    expect(await set.enumerate()).to.have.same.members(members);

    expect(await set.length()).to.bignumber.equal(members.length.toString());

    expect(await Promise.all([...Array(members.length).keys()].map(index =>
      set.get(index)
    ))).to.have.same.members(members);
  }

  it('starts empty', async function () {
    expect(await this.set.contains(accountA)).to.equal(false);

    await expectMembersMatch(this.set, []);
  });

  it('adds a value', async function () {
    const receipt = await this.set.add(accountA);
    expectEvent(receipt, 'TransactionResult', { result: true });

    await expectMembersMatch(this.set, [accountA]);
  });

  it('adds several values', async function () {
    await this.set.add(accountA);
    await this.set.add(accountB);

    await expectMembersMatch(this.set, [accountA, accountB]);
    expect(await this.set.contains(accountC)).to.equal(false);
  });

  it('returns false when adding elements already in the set', async function () {
    await this.set.add(accountA);

    const receipt = (await this.set.add(accountA));
    expectEvent(receipt, 'TransactionResult', { result: false });

    await expectMembersMatch(this.set, [accountA]);
  });

  it('removes added values', async function () {
    await this.set.add(accountA);

    const receipt = await this.set.remove(accountA);
    expectEvent(receipt, 'TransactionResult', { result: true });

    expect(await this.set.contains(accountA)).to.equal(false);
    await expectMembersMatch(this.set, []);
  });

  it('returns false when removing elements not in the set', async function () {
    const receipt = await this.set.remove(accountA);
    expectEvent(receipt, 'TransactionResult', { result: false });

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
