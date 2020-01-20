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
    expect(await this.set.testContains(a)).to.be.false;
  });

  it('adds an value.', async function () {
    await this.set.testAdd(a);
    expect(await this.set.testContains(a)).to.be.true;
  });

  it('adds several values.', async function () {
    await this.set.testAdd(a);
    await this.set.testAdd(b);
    expect(await this.set.testContains(a)).to.be.true;
    expect(await this.set.testContains(b)).to.be.true;
    expect(await this.set.testContains(c)).to.be.false;
  });

  it('removes values.', async function () {
    await this.set.testAdd(a);
    await this.set.testRemove(a);
    expect(await this.set.testContains(a)).to.be.false;
  });

  it('Retrieve an empty array', async function () {
    expect(await this.set.testEnumerate()).to.be.empty;
  });

  it('Retrieve an array of values', async function () {
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
