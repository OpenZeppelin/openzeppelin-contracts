const { expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

function shouldBehaveLikeSet(values, methods, events) {
  const [valueA, valueB, valueC] = values;

  async function expectMembersMatch(set, values) {
    const contains = await Promise.all(values.map(value => methods.contains(set, value)));
    expect(contains.every(Boolean)).to.be.equal(true);

    const length = await methods.length(set);
    expect(length).to.bignumber.equal(values.length.toString());

    // To compare values we convert to strings to workaround Chai
    // limitations when dealing with nested arrays (required for BNs)
    const indexedValues = await Promise.all(
      Array(values.length)
        .fill()
        .map((_, index) => methods.at(set, index)),
    );
    expect(indexedValues.map(v => v.toString())).to.have.same.members(values.map(v => v.toString()));

    const returnedValues = await methods.values(set);
    expect(returnedValues.map(v => v.toString())).to.have.same.members(values.map(v => v.toString()));
  }

  it('starts empty', async function () {
    expect(await methods.contains(this.set, valueA)).to.equal(false);

    await expectMembersMatch(this.set, []);
  });

  describe('add', function () {
    it('adds a value', async function () {
      const receipt = await methods.add(this.set, valueA);
      expectEvent(receipt, events.addReturn, { ret0: true });

      await expectMembersMatch(this.set, [valueA]);
    });

    it('adds several values', async function () {
      await methods.add(this.set, valueA);
      await methods.add(this.set, valueB);

      await expectMembersMatch(this.set, [valueA, valueB]);
      expect(await methods.contains(this.set, valueC)).to.equal(false);
    });

    it('returns false when adding values already in the set', async function () {
      await methods.add(this.set, valueA);

      const receipt = await methods.add(this.set, valueA);
      expectEvent(receipt, events.addReturn, { ret0: false });

      await expectMembersMatch(this.set, [valueA]);
    });
  });

  describe('at', function () {
    it('reverts when retrieving non-existent elements', async function () {
      await expectRevert.unspecified(methods.at(this.set, 0));
    });
  });

  describe('remove', function () {
    it('removes added values', async function () {
      await methods.add(this.set, valueA);

      const receipt = await methods.remove(this.set, valueA);
      expectEvent(receipt, events.removeReturn, { ret0: true });

      expect(await methods.contains(this.set, valueA)).to.equal(false);
      await expectMembersMatch(this.set, []);
    });

    it('returns false when removing values not in the set', async function () {
      const receipt = await methods.remove(this.set, valueA);
      expectEvent(receipt, events.removeReturn, { ret0: false });

      expect(await methods.contains(this.set, valueA)).to.equal(false);
    });

    it('adds and removes multiple values', async function () {
      // []

      await methods.add(this.set, valueA);
      await methods.add(this.set, valueC);

      // [A, C]

      await methods.remove(this.set, valueA);
      await methods.remove(this.set, valueB);

      // [C]

      await methods.add(this.set, valueB);

      // [C, B]

      await methods.add(this.set, valueA);
      await methods.remove(this.set, valueC);

      // [A, B]

      await methods.add(this.set, valueA);
      await methods.add(this.set, valueB);

      // [A, B]

      await methods.add(this.set, valueC);
      await methods.remove(this.set, valueA);

      // [B, C]

      await methods.add(this.set, valueA);
      await methods.remove(this.set, valueB);

      // [A, C]

      await expectMembersMatch(this.set, [valueA, valueC]);

      expect(await methods.contains(this.set, valueB)).to.equal(false);
    });
  });
}

module.exports = {
  shouldBehaveLikeSet,
};
