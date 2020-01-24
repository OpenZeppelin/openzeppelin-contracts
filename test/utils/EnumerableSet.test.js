const { accounts, contract } = require('@openzeppelin/test-environment');
const { expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const EnumerableSetMock = contract.fromArtifact('EnumerableSetMock');

describe('EnumerableSet', function () {
  const [ accountA, accountB, accountC ] = accounts;

  beforeEach(async function () {
    this.set = await EnumerableSetMock.new();
  });

  it('starts empty', async function () {
    expect(await this.set.contains(accountA)).to.equal(false);
    expect(await this.set.enumerate()).to.have.same.members([]);
  });

  it('adds a value', async function () {
    const receipt = await this.set.add(accountA);
    expectEvent(receipt, 'TransactionResult', { result: true });

    expect(await this.set.contains(accountA)).to.equal(true);
    expect(await this.set.enumerate()).to.have.same.members([ accountA ]);
  });

  it('adds several values', async function () {
    await this.set.add(accountA);
    await this.set.add(accountB);

    expect(await this.set.contains(accountA)).to.equal(true);
    expect(await this.set.contains(accountB)).to.equal(true);

    expect(await this.set.contains(accountC)).to.equal(false);

    expect(await this.set.enumerate()).to.have.same.members([ accountA, accountB ]);
  });

  it('returns false when adding elements already in the set', async function () {
    await this.set.add(accountA);

    const receipt = (await this.set.add(accountA));
    expectEvent(receipt, 'TransactionResult', { result: false });

    expect(await this.set.enumerate()).to.have.same.members([ accountA ]);
  });

  it('removes added values', async function () {
    await this.set.add(accountA);

    const receipt = await this.set.remove(accountA);
    expectEvent(receipt, 'TransactionResult', { result: true });

    expect(await this.set.contains(accountA)).to.equal(false);
    expect(await this.set.enumerate()).to.have.same.members([]);
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

    expect(await this.set.contains(accountA)).to.equal(true);
    expect(await this.set.contains(accountB)).to.equal(false);
    expect(await this.set.contains(accountC)).to.equal(true);

    expect(await this.set.enumerate()).to.have.same.members([ accountA, accountC ]);
  });
});
