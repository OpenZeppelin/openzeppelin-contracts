import { expect } from 'chai';
import { PANIC_CODES } from '@nomicfoundation/hardhat-ethers-chai-matchers/panic';

export function shouldBehaveLikeSet() {
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
      expect(await this.methods.at(0)).to.deep.equal(this.valueA);
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

  describe('removeAt', function () {
    it('reverts when removing from an empty set', async function () {
      await expect(this.methods.removeAt(0)).to.be.revertedWithPanic(PANIC_CODES.ARRAY_ACCESS_OUT_OF_BOUNDS);
    });

    it('reverts when the index is out of bounds', async function () {
      await this.methods.add(this.valueA);

      await expect(this.methods.removeAt(1)).to.be.revertedWithPanic(PANIC_CODES.ARRAY_ACCESS_OUT_OF_BOUNDS);
    });

    it('reverts when the index would overflow', async function () {
      await this.methods.add(this.valueA);

      await expect(this.methods.removeAt(2n ** 256n - 1n)).to.be.revertedWithPanic(
        PANIC_CODES.ARRAY_ACCESS_OUT_OF_BOUNDS,
      );
    });

    it('removes the only value', async function () {
      await this.methods.add(this.valueA);

      expect(await this.methods.removeAt.staticCall(0)).to.deep.equal(this.valueA);
      await this.methods.removeAt(0);

      expect(await this.methods.contains(this.valueA)).to.be.false;
      await expectMembersMatch(this.methods, []);
    });

    it('removes the last value without reordering the rest', async function () {
      await this.methods.add(this.valueA);
      await this.methods.add(this.valueB);
      await this.methods.add(this.valueC);

      expect(await this.methods.removeAt.staticCall(2)).to.deep.equal(this.valueC);
      await this.methods.removeAt(2);

      await expectMembersMatch(this.methods, [this.valueA, this.valueB]);
      expect(await this.methods.at(0)).to.deep.equal(this.valueA);
      expect(await this.methods.at(1)).to.deep.equal(this.valueB);
    });

    it('removes a non-last value using swap-and-pop', async function () {
      await this.methods.add(this.valueA);
      await this.methods.add(this.valueB);
      await this.methods.add(this.valueC);

      expect(await this.methods.removeAt.staticCall(0)).to.deep.equal(this.valueA);
      await this.methods.removeAt(0);

      expect(await this.methods.contains(this.valueA)).to.be.false;
      await expectMembersMatch(this.methods, [this.valueC, this.valueB]);
      expect(await this.methods.at(0)).to.deep.equal(this.valueC);
      expect(await this.methods.at(1)).to.deep.equal(this.valueB);
    });

    it('tracks the position of the value moved by swap-and-pop', async function () {
      await this.methods.add(this.valueA);
      await this.methods.add(this.valueB);
      await this.methods.add(this.valueC);

      // removes A, moving C from index 2 to index 0
      await this.methods.removeAt(0);

      // C must still be removable by value, which only works if its tracked position was updated
      await expect(this.methods.remove(this.valueC)).to.emit(this.mock, this.events.removeReturn).withArgs(true);

      await expectMembersMatch(this.methods, [this.valueB]);
    });

    it('can remove every remaining value by index', async function () {
      await this.methods.add(this.valueA);
      await this.methods.add(this.valueB);
      await this.methods.add(this.valueC);

      await this.methods.removeAt(1);
      await this.methods.removeAt(1);
      await this.methods.removeAt(0);

      await expectMembersMatch(this.methods, []);
    });
  });

  describe('clear', function () {
    it('clears a single value', async function () {
      await this.methods.add(this.valueA);

      await this.methods.clear();

      expect(await this.methods.contains(this.valueA)).to.be.false;
      await expectMembersMatch(this.methods, []);
    });

    it('clears multiple values', async function () {
      await this.methods.add(this.valueA);
      await this.methods.add(this.valueB);
      await this.methods.add(this.valueC);

      await this.methods.clear();

      expect(await this.methods.contains(this.valueA)).to.be.false;
      expect(await this.methods.contains(this.valueB)).to.be.false;
      expect(await this.methods.contains(this.valueC)).to.be.false;
      await expectMembersMatch(this.methods, []);
    });

    it('does not revert on empty set', async function () {
      await this.methods.clear();
    });

    it('clear then add value', async function () {
      await this.methods.add(this.valueA);
      await this.methods.add(this.valueB);
      await this.methods.add(this.valueC);

      await this.methods.clear();

      await this.methods.add(this.valueA);

      expect(await this.methods.contains(this.valueA)).to.be.true;
      expect(await this.methods.contains(this.valueB)).to.be.false;
      expect(await this.methods.contains(this.valueC)).to.be.false;
      await expectMembersMatch(this.methods, [this.valueA]);
    });
  });

  it('values (full & paginated)', async function () {
    const values = [this.valueA, this.valueB, this.valueC];
    await this.methods.add(this.valueA);
    await this.methods.add(this.valueB);
    await this.methods.add(this.valueC);

    // get all values
    expect([...(await this.methods.values())]).to.deep.equal(values);

    // try pagination
    for (const begin of [0, 1, 2, 3, 4])
      for (const end of [0, 1, 2, 3, 4]) {
        expect([...(await this.methods.valuesPage(begin, end))]).to.deep.equal(values.slice(begin, end));
      }
  });
}
