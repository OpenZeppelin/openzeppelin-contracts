const { expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const zip = require('lodash.zip');

function shouldBehaveLikeMap(keys, values, zeroValue, methods, events) {
  const [keyA, keyB, keyC] = keys;
  const [valueA, valueB, valueC] = values;

  async function expectMembersMatch(map, keys, values) {
    expect(keys.length).to.equal(values.length);

    await Promise.all(keys.map(async key => expect(await methods.contains(map, key)).to.equal(true)));

    expect(await methods.length(map)).to.bignumber.equal(keys.length.toString());

    expect((await Promise.all(keys.map(key => methods.get(map, key)))).map(k => k.toString())).to.have.same.members(
      values.map(value => value.toString()),
    );

    // To compare key-value pairs, we zip keys and values, and convert BNs to
    // strings to workaround Chai limitations when dealing with nested arrays
    expect(
      await Promise.all(
        [...Array(keys.length).keys()].map(async index => {
          const entry = await methods.at(map, index);
          return [entry[0].toString(), entry[1].toString()];
        }),
      ),
    ).to.have.same.deep.members(
      zip(
        keys.map(k => k.toString()),
        values.map(v => v.toString()),
      ),
    );

    // This also checks that both arrays have the same length
    expect((await methods.keys(map)).map(k => k.toString())).to.have.same.members(keys.map(key => key.toString()));
  }

  it('starts empty', async function () {
    expect(await methods.contains(this.map, keyA)).to.equal(false);

    await expectMembersMatch(this.map, [], []);
  });

  describe('set', function () {
    it('adds a key', async function () {
      const receipt = await methods.set(this.map, keyA, valueA);
      expectEvent(receipt, events.setReturn, { ret0: true });

      await expectMembersMatch(this.map, [keyA], [valueA]);
    });

    it('adds several keys', async function () {
      await methods.set(this.map, keyA, valueA);
      await methods.set(this.map, keyB, valueB);

      await expectMembersMatch(this.map, [keyA, keyB], [valueA, valueB]);
      expect(await methods.contains(this.map, keyC)).to.equal(false);
    });

    it('returns false when adding keys already in the set', async function () {
      await methods.set(this.map, keyA, valueA);

      const receipt = await methods.set(this.map, keyA, valueA);
      expectEvent(receipt, events.setReturn, { ret0: false });

      await expectMembersMatch(this.map, [keyA], [valueA]);
    });

    it('updates values for keys already in the set', async function () {
      await methods.set(this.map, keyA, valueA);
      await methods.set(this.map, keyA, valueB);

      await expectMembersMatch(this.map, [keyA], [valueB]);
    });
  });

  describe('remove', function () {
    it('removes added keys', async function () {
      await methods.set(this.map, keyA, valueA);

      const receipt = await methods.remove(this.map, keyA);
      expectEvent(receipt, events.removeReturn, { ret0: true });

      expect(await methods.contains(this.map, keyA)).to.equal(false);
      await expectMembersMatch(this.map, [], []);
    });

    it('returns false when removing keys not in the set', async function () {
      const receipt = await methods.remove(this.map, keyA);
      expectEvent(receipt, events.removeReturn, { ret0: false });

      expect(await methods.contains(this.map, keyA)).to.equal(false);
    });

    it('adds and removes multiple keys', async function () {
      // []

      await methods.set(this.map, keyA, valueA);
      await methods.set(this.map, keyC, valueC);

      // [A, C]

      await methods.remove(this.map, keyA);
      await methods.remove(this.map, keyB);

      // [C]

      await methods.set(this.map, keyB, valueB);

      // [C, B]

      await methods.set(this.map, keyA, valueA);
      await methods.remove(this.map, keyC);

      // [A, B]

      await methods.set(this.map, keyA, valueA);
      await methods.set(this.map, keyB, valueB);

      // [A, B]

      await methods.set(this.map, keyC, valueC);
      await methods.remove(this.map, keyA);

      // [B, C]

      await methods.set(this.map, keyA, valueA);
      await methods.remove(this.map, keyB);

      // [A, C]

      await expectMembersMatch(this.map, [keyA, keyC], [valueA, valueC]);

      expect(await methods.contains(this.map, keyA)).to.equal(true);
      expect(await methods.contains(this.map, keyB)).to.equal(false);
      expect(await methods.contains(this.map, keyC)).to.equal(true);
    });
  });

  describe('read', function () {
    beforeEach(async function () {
      await methods.set(this.map, keyA, valueA);
    });

    describe('get', function () {
      it('existing value', async function () {
        expect(await methods.get(this.map, keyA).then(r => r.toString())).to.be.equal(valueA.toString());
      });
      it('missing value', async function () {
        await expectRevert(methods.get(this.map, keyB), 'EnumerableMap: nonexistent key');
      });
    });

    describe('get with message', function () {
      it('existing value', async function () {
        expect(await methods.getWithMessage(this.map, keyA, 'custom error string').then(r => r.toString())).to.be.equal(
          valueA.toString(),
        );
      });
      it('missing value', async function () {
        await expectRevert(methods.getWithMessage(this.map, keyB, 'custom error string'), 'custom error string');
      });
    });

    describe('tryGet', function () {
      it('existing value', async function () {
        const result = await methods.tryGet(this.map, keyA);
        expect(result['0']).to.be.equal(true);
        expect(result['1'].toString()).to.be.equal(valueA.toString());
      });
      it('missing value', async function () {
        const result = await methods.tryGet(this.map, keyB);
        expect(result['0']).to.be.equal(false);
        expect(result['1'].toString()).to.be.equal(zeroValue.toString());
      });
    });
  });
}

module.exports = {
  shouldBehaveLikeMap,
};
