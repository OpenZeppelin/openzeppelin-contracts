const { ethers } = require('hardhat');
const { expect } = require('chai');

const zip = (array1, array2) => array1.map((item, index) => [item, array2[index]]);

function shouldBehaveLikeMap() {
  async function expectMembersMatch(methods, keys, values) {
    expect(keys.length).to.equal(values.length);
    expect(await methods.length()).to.equal(keys.length);
    expect([...(await methods.keys())]).to.have.members(keys);

    for (const [key, value] of zip(keys, values)) {
      expect(await methods.contains(key)).to.be.true;
      expect(await methods.get(key)).to.equal(value);
    }

    expect(await Promise.all(keys.map((_, index) => methods.at(index)))).to.have.deep.members(zip(keys, values));
  }

  it('starts empty', async function () {
    expect(await this.methods.contains(this.keyA)).to.be.false;

    await expectMembersMatch(this.methods, [], []);
  });

  describe('set', function () {
    it('adds a key', async function () {
      await expect(this.methods.set(this.keyA, this.valueA)).to.emit(this.mock, this.events.setReturn).withArgs(true);

      await expectMembersMatch(this.methods, [this.keyA], [this.valueA]);
    });

    it('adds several keys', async function () {
      await this.methods.set(this.keyA, this.valueA);
      await this.methods.set(this.keyB, this.valueB);

      await expectMembersMatch(this.methods, [this.keyA, this.keyB], [this.valueA, this.valueB]);
      expect(await this.methods.contains(this.keyC)).to.be.false;
    });

    it('returns false when adding keys already in the set', async function () {
      await this.methods.set(this.keyA, this.valueA);

      await expect(this.methods.set(this.keyA, this.valueA)).to.emit(this.mock, this.events.setReturn).withArgs(false);

      await expectMembersMatch(this.methods, [this.keyA], [this.valueA]);
    });

    it('updates values for keys already in the set', async function () {
      await this.methods.set(this.keyA, this.valueA);
      await this.methods.set(this.keyA, this.valueB);

      await expectMembersMatch(this.methods, [this.keyA], [this.valueB]);
    });
  });

  describe('remove', function () {
    it('removes added keys', async function () {
      await this.methods.set(this.keyA, this.valueA);

      await expect(this.methods.remove(this.keyA)).to.emit(this.mock, this.events.removeReturn).withArgs(true);

      expect(await this.methods.contains(this.keyA)).to.be.false;
      await expectMembersMatch(this.methods, [], []);
    });

    it('returns false when removing keys not in the set', async function () {
      await expect(await this.methods.remove(this.keyA))
        .to.emit(this.mock, this.events.removeReturn)
        .withArgs(false);

      expect(await this.methods.contains(this.keyA)).to.be.false;
    });

    it('adds and removes multiple keys', async function () {
      // []

      await this.methods.set(this.keyA, this.valueA);
      await this.methods.set(this.keyC, this.valueC);

      // [A, C]

      await this.methods.remove(this.keyA);
      await this.methods.remove(this.keyB);

      // [C]

      await this.methods.set(this.keyB, this.valueB);

      // [C, B]

      await this.methods.set(this.keyA, this.valueA);
      await this.methods.remove(this.keyC);

      // [A, B]

      await this.methods.set(this.keyA, this.valueA);
      await this.methods.set(this.keyB, this.valueB);

      // [A, B]

      await this.methods.set(this.keyC, this.valueC);
      await this.methods.remove(this.keyA);

      // [B, C]

      await this.methods.set(this.keyA, this.valueA);
      await this.methods.remove(this.keyB);

      // [A, C]

      await expectMembersMatch(this.methods, [this.keyA, this.keyC], [this.valueA, this.valueC]);

      expect(await this.methods.contains(this.keyA)).to.be.true;
      expect(await this.methods.contains(this.keyB)).to.be.false;
      expect(await this.methods.contains(this.keyC)).to.be.true;
    });
  });

  describe('clear', function () {
    it('clears a single entry', async function () {
      await this.methods.set(this.keyA, this.valueA);

      await this.methods.clear();

      expect(await this.methods.contains(this.keyA)).to.be.false;
      await expectMembersMatch(this.methods, [], []);
    });

    it('clears multiple entries', async function () {
      await this.methods.set(this.keyA, this.valueA);
      await this.methods.set(this.keyB, this.valueB);
      await this.methods.set(this.keyC, this.valueC);

      await this.methods.clear();

      expect(await this.methods.contains(this.keyA)).to.be.false;
      expect(await this.methods.contains(this.keyB)).to.be.false;
      expect(await this.methods.contains(this.keyC)).to.be.false;
      await expectMembersMatch(this.methods, [], []);
    });

    it('does not revert on empty map', async function () {
      await this.methods.clear();
    });

    it('clear then add entry', async function () {
      await this.methods.set(this.keyA, this.valueA);
      await this.methods.set(this.keyB, this.valueB);
      await this.methods.set(this.keyC, this.valueC);

      await this.methods.clear();

      await this.methods.set(this.keyA, this.valueA);

      expect(await this.methods.contains(this.keyA)).to.be.true;
      expect(await this.methods.contains(this.keyB)).to.be.false;
      expect(await this.methods.contains(this.keyC)).to.be.false;
      await expectMembersMatch(this.methods, [this.keyA], [this.valueA]);
    });
  });

  describe('read', function () {
    beforeEach(async function () {
      await this.methods.set(this.keyA, this.valueA);
    });

    describe('get', function () {
      it('existing value', async function () {
        expect(await this.methods.get(this.keyA)).to.equal(this.valueA);
      });

      it('missing value', async function () {
        await expect(this.methods.get(this.keyB))
          .to.be.revertedWithCustomError(this.mock, this.error ?? 'EnumerableMapNonexistentKey')
          .withArgs(
            this.key?.memory || this.value?.memory
              ? this.keyB
              : ethers.AbiCoder.defaultAbiCoder().encode([this.keyType], [this.keyB]),
          );
      });
    });

    describe('tryGet', function () {
      it('existing value', async function () {
        expect(await this.methods.tryGet(this.keyA)).to.have.ordered.members([true, this.valueA]);
      });

      it('missing value', async function () {
        expect(await this.methods.tryGet(this.keyB)).to.have.ordered.members([false, this.zeroValue]);
      });
    });
  });
}

module.exports = {
  shouldBehaveLikeMap,
};
