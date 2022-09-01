const { expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const zip = require('lodash.zip');

function shouldBehaveLikeMap (
  keys,
  values,
  zeroValue,
  {
    fnSet,
    fnGet,
    fnGetWithMessage,
    fnTryGet,
    fnRemove,
    fnLength,
    fnAt,
    fnContains,
    evSet,
    evRemove,
    argsPrefix,
  },
) {
  const [ keyA, keyB, keyC ] = keys;
  const [ valueA, valueB, valueC ] = values;

  async function expectMembersMatch (map, keys, values) {
    expect(keys.length).to.equal(values.length);

    await Promise.all(keys.map(async key =>
      expect(await fnContains(map, key)).to.equal(true),
    ));

    expect(await fnLength(map)).to.bignumber.equal(keys.length.toString());

    expect(
      (await Promise.all(keys.map(key => fnGet(map, key)))).map(k => k.toString()),
    ).to.have.same.members(
      values.map(value => value.toString()),
    );

    // To compare key-value pairs, we zip keys and values, and convert BNs to
    // strings to workaround Chai limitations when dealing with nested arrays
    expect(await Promise.all([...Array(keys.length).keys()].map(async (index) => {
      const entry = await fnAt(map, index);
      return [ entry[0].toString(), entry[1].toString() ];
    }))).to.have.same.deep.members(
      zip(keys.map(k => k.toString()), values.map(v => v.toString())),
    );
  }

  it('starts empty', async function () {
    expect(await fnContains(this.map, keyA)).to.equal(false);

    await expectMembersMatch(this.map, [], []);
  });

  describe('set', function () {
    it('adds a key', async function () {
      const receipt = await fnSet(this.map, keyA, valueA);
      expectEvent(receipt, evSet, { arg0: true });

      await expectMembersMatch(this.map, [keyA], [valueA]);
    });

    it('adds several keys', async function () {
      await fnSet(this.map, keyA, valueA);
      await fnSet(this.map, keyB, valueB);

      await expectMembersMatch(this.map, [keyA, keyB], [valueA, valueB]);
      expect(await fnContains(this.map, keyC)).to.equal(false);
    });

    it('returns false when adding keys already in the set', async function () {
      await fnSet(this.map, keyA, valueA);

      const receipt = await fnSet(this.map, keyA, valueA);
      expectEvent(receipt, evSet, { arg0: false });

      await expectMembersMatch(this.map, [keyA], [valueA]);
    });

    it('updates values for keys already in the set', async function () {
      await fnSet(this.map, keyA, valueA);
      await fnSet(this.map, keyA, valueB);

      await expectMembersMatch(this.map, [keyA], [valueB]);
    });
  });

  describe('remove', function () {
    it('removes added keys', async function () {
      await fnSet(this.map, keyA, valueA);

      const receipt = await fnRemove(this.map, keyA);
      expectEvent(receipt, evRemove, { arg0: true });

      expect(await fnContains(this.map, keyA)).to.equal(false);
      await expectMembersMatch(this.map, [], []);
    });

    it('returns false when removing keys not in the set', async function () {
      const receipt = await fnRemove(this.map, keyA);
      expectEvent(receipt, evRemove, { arg0: false });

      expect(await fnContains(this.map, keyA)).to.equal(false);
    });

    it('adds and removes multiple keys', async function () {
      // []

      await fnSet(this.map, keyA, valueA);
      await fnSet(this.map, keyC, valueC);

      // [A, C]

      await fnRemove(this.map, keyA);
      await fnRemove(this.map, keyB);

      // [C]

      await fnSet(this.map, keyB, valueB);

      // [C, B]

      await fnSet(this.map, keyA, valueA);
      await fnRemove(this.map, keyC);

      // [A, B]

      await fnSet(this.map, keyA, valueA);
      await fnSet(this.map, keyB, valueB);

      // [A, B]

      await fnSet(this.map, keyC, valueC);
      await fnRemove(this.map, keyA);

      // [B, C]

      await fnSet(this.map, keyA, valueA);
      await fnRemove(this.map, keyB);

      // [A, C]

      await expectMembersMatch(this.map, [keyA, keyC], [valueA, valueC]);

      expect(await fnContains(this.map, keyA)).to.equal(true);
      expect(await fnContains(this.map, keyB)).to.equal(false);
      expect(await fnContains(this.map, keyC)).to.equal(true);
    });
  });

  describe('read', function () {
    beforeEach(async function () {
      await fnSet(this.map, keyA, valueA);
    });

    describe('get', function () {
      it('existing value', async function () {
        expect(
          await fnGet(this.map, keyA).then(r => r.toString()),
        ).to.be.equal(valueA.toString());
      });
      it('missing value', async function () {
        await expectRevert(
          fnGet(this.map, keyB),
          'EnumerableMap: nonexistent key',
        );
      });
    });

    describe('get with message', function () {
      it('existing value', async function () {
        expect(
          await fnGetWithMessage(this.map, keyA, 'custom error string').then(r => r.toString()),
        ).to.be.equal(valueA.toString());
      });
      it('missing value', async function () {
        await expectRevert(
          fnGetWithMessage(this.map, keyB, 'custom error string'),
          'custom error string',
        );
      });
    });

    describe('tryGet', function () {
      it('existing value', async function () {
        const result = await fnTryGet(this.map, keyA);
        expect(result['0']).to.be.equal(true);
        expect(result['1'].toString()).to.be.equal(valueA.toString());
      });
      it('missing value', async function () {
        const result = await fnTryGet(this.map, keyB);
        expect(result['0']).to.be.equal(false);
        expect(result['1'].toString()).to.be.equal(zeroValue.toString());
      });
    });
  });
}

module.exports = {
  shouldBehaveLikeMap,
};
