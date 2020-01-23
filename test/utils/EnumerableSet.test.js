const { contract } = require('@openzeppelin/test-environment');
const { expect } = require('chai');

const EnumerableSetMock = contract.fromArtifact('EnumerableSetMock');

const a = '0x0000000000000000000000000000000000000001';
const b = '0x0000000000000000000000000000000000000002';
const c = '0x0000000000000000000000000000000000000003';

/** @test {EnumerableSet} contract */
describe('EnumerableSet', function () {
  beforeEach(async function () {
    this.set = await EnumerableSetMock.new();
  });

  it('contains can return false.', async function () {
    expect(await this.set.testContains(a)).to.equal(false);
  });

  it('adds a value.', async function () {
    const transaction = await this.set.testAdd(a);
    expect(transaction.logs[0].event).to.equal('TransactionResult');
    expect(transaction.logs[0].args.result).to.equal(true);
    expect(await this.set.testContains(a)).to.equal(true);
  });

  it('adds several values.', async function () {
    await this.set.testAdd(a);
    await this.set.testAdd(b);
    expect(await this.set.testContains(a)).to.equal(true);
    expect(await this.set.testContains(b)).to.equal(true);
    expect(await this.set.testContains(c)).to.equal(false);
  });

  it('adding same value twice returns false.', async function () {
    await this.set.testAdd(a);
    const transaction = (await this.set.testAdd(a));
    expect(transaction.logs[0].event).to.equal('TransactionResult');
    expect(transaction.logs[0].args.result).to.equal(false);
  });

  it('removes values.', async function () {
    await this.set.testAdd(a);
    const transaction = await this.set.testRemove(a);
    expect(transaction.logs[0].event).to.equal('TransactionResult');
    expect(transaction.logs[0].args.result).to.equal(true);
    expect(await this.set.testContains(a)).to.equal(false);
  });

  it('removing values that are not in the set returns false.', async function () {
    const transaction = await this.set.testRemove(a);
    expect(transaction.logs[0].event).to.equal('TransactionResult');
    expect(transaction.logs[0].args.result).to.equal(false);
  });

  it('enumerates values as an empty array', async function () {
    expect(await this.set.testEnumerate()).to.eql([]);
  });

  it('enumerates an array of values', async function () {
    await this.set.testAdd(a);
    await this.set.testAdd(b);
    await this.set.testAdd(c);
    const result = (await this.set.testEnumerate());
    expect(result.length).to.be.equal(3);
    expect(result[0]).to.be.equal(a);
    expect(result[1]).to.be.equal(b);
    expect(result[2]).to.be.equal(c);
  });
});
