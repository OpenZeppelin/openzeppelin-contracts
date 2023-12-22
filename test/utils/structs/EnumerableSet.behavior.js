const { expect } = require('chai');
const { PANIC_CODES } = require('@nomicfoundation/hardhat-chai-matchers/panic');

function shouldBehaveLikeSet() {
  async function expectMembersMatch(methods, values) {
    expect(await methods.length()).to.equal(values.length);
    for (const value of values) expect(await methods.contains(value)).to.be.true;

    expect(await Promise.all(values.map((_, index) => methods.at(index)))).to.have.deep.members(values);
    expect([...(await methods.values())]).to.have.deep.members(values);
  }

  it('starts empty', async function () {
    expect(await this.methods.contains(this.valueA)).to.be.false;

    await expectMembersMatch(this.methods, []);
  });

  describe('add', function () {
    it('adds a value', async function () {
      await expect(this.methods.add(this.valueA)).to.emit(this.mock, this.events.addReturn).withArgs(true);

      await expectMembersMatch(this.methods, [this.valueA]);
    });

    it('adds several values', async function () {
      await this.methods.add(this.valueA);
      await this.methods.add(this.valueB);

      await expectMembersMatch(this.methods, [this.valueA, this.valueB]);
      expect(await this.methods.contains(this.valueC)).to.be.false;
    });

    it('returns false when adding values already in the set', async function () {
      await this.methods.add(this.valueA);

      await expect(this.methods.add(this.valueA)).to.emit(this.mock, this.events.addReturn).withArgs(false);

      await expectMembersMatch(this.methods, [this.valueA]);
    });
  });

  describe('at', function () {
    it('reverts when retrieving non-existent elements', async function () {
      await expect(this.methods.at(0)).to.be.revertedWithPanic(PANIC_CODES.ARRAY_ACCESS_OUT_OF_BOUNDS);
    });

    it('retrieves existing element', async function () {
      await this.methods.add(this.valueA);
      expect(await this.methods.at(0)).to.equal(this.valueA);
    });
  });

  describe('remove', function () {
    it('removes added values', async function () {
      await this.methods.add(this.valueA);

      await expect(this.methods.remove(this.valueA)).to.emit(this.mock, this.events.removeReturn).withArgs(true);

      expect(await this.methods.contains(this.valueA)).to.be.false;
      await expectMembersMatch(this.methods, []);
    });

    it('returns false when removing values not in the set', async function () {
      await expect(this.methods.remove(this.valueA)).to.emit(this.mock, this.events.removeReturn).withArgs(false);

      expect(await this.methods.contains(this.valueA)).to.be.false;
    });

    it('adds and removes multiple values', async function () {
      // []

      await this.methods.add(this.valueA);
      await this.methods.add(this.valueC);

      // [A, C]

      await this.methods.remove(this.valueA);
      await this.methods.remove(this.valueB);

      // [C]

      await this.methods.add(this.valueB);

      // [C, B]

      await this.methods.add(this.valueA);
      await this.methods.remove(this.valueC);

      // [A, B]

      await this.methods.add(this.valueA);
      await this.methods.add(this.valueB);

      // [A, B]

      await this.methods.add(this.valueC);
      await this.methods.remove(this.valueA);

      // [B, C]

      await this.methods.add(this.valueA);
      await this.methods.remove(this.valueB);

      // [A, C]

      await expectMembersMatch(this.methods, [this.valueA, this.valueC]);

      expect(await this.methods.contains(this.valueB)).to.be.false;
    });
  });
}

module.exports = {
  shouldBehaveLikeSet,
};
