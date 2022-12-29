const { expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

function shouldBehaveLikeSet (
  values,
  {
    fnAdd,
    fnRemove,
    fnLength,
    fnAt,
    fnValues,
    fnContains,
    evAdd,
    evRemove,
  },
) {
  const [ valueA, valueB, valueC ] = values;

  async function expectMembersMatch (set, values) {
    const contains = await Promise.all(values.map(value => fnContains(set, value)));
    expect(contains.every(Boolean)).to.be.equal(true);

    const length = await fnLength(set);
    expect(length).to.bignumber.equal(values.length.toString());

    // To compare values we convert to strings to workaround Chai
    // limitations when dealing with nested arrays (required for BNs)
    const indexedValues = await Promise.all(Array(values.length).fill().map((_, index) => fnAt(set, index)));
    expect(
      indexedValues.map(v => v.toString()),
    ).to.have.same.members(
      values.map(v => v.toString()),
    );

    const returnedValues = await fnValues(set);
    expect(
      returnedValues.map(v => v.toString()),
    ).to.have.same.members(
      values.map(v => v.toString()),
    );
  }

  it('starts empty', async function () {
    expect(await fnContains(this.set, valueA)).to.equal(false);

    await expectMembersMatch(this.set, []);
  });

  describe('add', function () {
    it('adds a value', async function () {
      const receipt = await fnAdd(this.set, valueA);
      expectEvent(receipt, evAdd, { arg0: true });

      await expectMembersMatch(this.set, [valueA]);
    });

    it('adds several values', async function () {
      await fnAdd(this.set, valueA);
      await fnAdd(this.set, valueB);

      await expectMembersMatch(this.set, [valueA, valueB]);
      expect(await fnContains(this.set, valueC)).to.equal(false);
    });

    it('returns false when adding values already in the set', async function () {
      await fnAdd(this.set, valueA);

      const receipt = await fnAdd(this.set, valueA);
      expectEvent(receipt, evAdd, { arg0: false });

      await expectMembersMatch(this.set, [valueA]);
    });
  });

  describe('at', function () {
    it('reverts when retrieving non-existent elements', async function () {
      await expectRevert.unspecified(fnAt(this.set, 0));
    });
  });

  describe('remove', function () {
    it('removes added values', async function () {
      await fnAdd(this.set, valueA);

      const receipt = await fnRemove(this.set, valueA);
      expectEvent(receipt, evRemove, { arg0: true });

      expect(await fnContains(this.set, valueA)).to.equal(false);
      await expectMembersMatch(this.set, []);
    });

    it('returns false when removing values not in the set', async function () {
      const receipt = await fnRemove(this.set, valueA);
      expectEvent(receipt, evRemove, { arg0: false });

      expect(await fnContains(this.set, valueA)).to.equal(false);
    });

    it('adds and removes multiple values', async function () {
      // []

      await fnAdd(this.set, valueA);
      await fnAdd(this.set, valueC);

      // [A, C]

      await fnRemove(this.set, valueA);
      await fnRemove(this.set, valueB);

      // [C]

      await fnAdd(this.set, valueB);

      // [C, B]

      await fnAdd(this.set, valueA);
      await fnRemove(this.set, valueC);

      // [A, B]

      await fnAdd(this.set, valueA);
      await fnAdd(this.set, valueB);

      // [A, B]

      await fnAdd(this.set, valueC);
      await fnRemove(this.set, valueA);

      // [B, C]

      await fnAdd(this.set, valueA);
      await fnRemove(this.set, valueB);

      // [A, C]

      await expectMembersMatch(this.set, [valueA, valueC]);

      expect(await fnContains(this.set, valueB)).to.equal(false);
    });
  });
}

module.exports = {
  shouldBehaveLikeSet,
};
