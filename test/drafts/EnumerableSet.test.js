const { contract } = require('@openzeppelin/test-environment');

const { expect } = require('chai');

const EnumerableSetMock = contract.fromArtifact('EnumerableSetMock');

const a = '0x0000000000000000000000000000000000000001';
const b = '0x0000000000000000000000000000000000000002';
const c = '0x0000000000000000000000000000000000000003';

/** @test {EnumerableSet} contract */
describe('EnumerableSet', function () {
  beforeEach(async function () {
    this.enumerableSet = await EnumerableSetMock.new();
  });

  it('contains can return false.', async function () {
    expect(await this.enumerableSet.testContains(a)).to.be.false;
  });

  it('adds an value.', async function () {
    await this.enumerableSet.testAdd(a);
    expect(await this.enumerableSet.testContains(a)).to.be.true;
  });

  it('adds several values.', async function () {
    await this.enumerableSet.testAdd(a);
    await this.enumerableSet.testAdd(b);
    expect(await this.enumerableSet.testContains(a)).to.be.true;
    expect(await this.enumerableSet.testContains(b)).to.be.true;
    expect(await this.enumerableSet.testContains(c)).to.be.false;
  });

  it('removes values.', async function () {
    await this.enumerableSet.testAdd(a);
    await this.enumerableSet.testRemove(a);
    expect(await this.enumerableSet.testContains(a)).to.be.false;
  });

  it('Retrieve an empty array', async function () {
    expect(await this.enumerableSet.testEnumerate()).to.be.empty;
  });

  it('Retrieve an array of values', async function () {
    await this.enumerableSet.testAdd(a);
    await this.enumerableSet.testAdd(b);
    await this.enumerableSet.testAdd(c);
    const result = (await this.enumerableSet.testEnumerate());
    expect(result.length).to.be.equal(3);
    expect(result[0]).to.be.equal(a);
    expect(result[1]).to.be.equal(b);
    expect(result[2]).to.be.equal(c);
  });
});
