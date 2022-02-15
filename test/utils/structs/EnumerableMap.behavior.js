const { expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const zip = require('lodash.zip');

function shouldBehaveLikeMap (keys, values, zeroValue) {
  const [keyA, keyB, keyC] = keys;
  const [valueA, valueB, valueC] = values;

  async function expectMembersMatch (map, keys, values) {
    expect(keys.length).to.equal(values.length);

    await Promise.all(keys.map(async key =>
      expect(await map.contains(key)).to.equal(true),
    ));

    expect(await map.length()).to.bignumber.equal(keys.length.toString());

    expect(
      (await Promise.all(keys.map(key => map.get(key)))).map(k => k.toString()),
    ).to.have.same.members(
      values.map(value => value.toString()),
    );

    // To compare key-value pairs, we zip keys and values, and convert BNs to
    // strings to workaround Chai limitations when dealing with nested arrays
    expect(await Promise.all([...Array(keys.length).keys()].map(async (index) => {
      const entry = await map.at(index);
      return [entry.key.toString(), entry.value.toString()];
    }))).to.have.same.deep.members(
      zip(keys.map(k => k.toString()), values.map(v => v.toString())),
    );
  }

  it('starts empty', async function () {
    expect(await this.map.contains(keyA)).to.equal(false);

    await expectMembersMatch(this.map, [], []);
  });

  describe('set', function () {
    it('adds a key', async function () {
      const receipt = await this.map.set(keyA, valueA);
      expectEvent(receipt, 'OperationResult', { result: true });

      await expectMembersMatch(this.map, [keyA], [valueA]);
    });

    it('adds several keys', async function () {
      await this.map.set(keyA, valueA);
      await this.map.set(keyB, valueB);

      await expectMembersMatch(this.map, [keyA, keyB], [valueA, valueB]);
      expect(await this.map.contains(keyC)).to.equal(false);
    });

    it('returns false when adding keys already in the set', async function () {
      await this.map.set(keyA, valueA);

      const receipt = (await this.map.set(keyA, valueA));
      expectEvent(receipt, 'OperationResult', { result: false });

      await expectMembersMatch(this.map, [keyA], [valueA]);
    });

    it('updates values for keys already in the set', async function () {
      await this.map.set(keyA, valueA);

      await this.map.set(keyA, valueB);

      await expectMembersMatch(this.map, [keyA], [valueB]);
    });
  });

  describe('remove', function () {
    it('removes added keys', async function () {
      await this.map.set(keyA, valueA);

      const receipt = await this.map.remove(keyA);
      expectEvent(receipt, 'OperationResult', { result: true });

      expect(await this.map.contains(keyA)).to.equal(false);
      await expectMembersMatch(this.map, [], []);
    });

    it('returns false when removing keys not in the set', async function () {
      const receipt = await this.map.remove(keyA);
      expectEvent(receipt, 'OperationResult', { result: false });

      expect(await this.map.contains(keyA)).to.equal(false);
    });

    it('adds and removes multiple keys', async function () {
      // []

      await this.map.set(keyA, valueA);
      await this.map.set(keyC, valueC);

      // [A, C]

      await this.map.remove(keyA);
      await this.map.remove(keyB);

      // [C]

      await this.map.set(keyB, valueB);

      // [C, B]

      await this.map.set(keyA, valueA);
      await this.map.remove(keyC);

      // [A, B]

      await this.map.set(keyA, valueA);
      await this.map.set(keyB, valueB);

      // [A, B]

      await this.map.set(keyC, valueC);
      await this.map.remove(keyA);

      // [B, C]

      await this.map.set(keyA, valueA);
      await this.map.remove(keyB);

      // [A, C]

      await expectMembersMatch(this.map, [keyA, keyC], [valueA, valueC]);

      expect(await this.map.contains(keyB)).to.equal(false);
    });
  });

  describe('read', function () {
    beforeEach(async function () {
      await this.map.set(keyA, valueA);
    });

    describe('get', function () {
      it('existing value', async function () {
        expect(
          (await this.map.get(keyA)).toString(),
        ).to.be.equal(valueA.toString());
      });
      it('missing value', async function () {
        await expectRevert(this.map.get(keyB), 'EnumerableMap: nonexistent key');
      });
    });

    describe('get with message', function () {
      it('existing value', async function () {
        expect(
          (await this.map.getWithMessage(keyA, 'custom error string'))
            .toString(),
        ).to.be.equal(valueA.toString());
      });
      it('missing value', async function () {
        await expectRevert(this.map.getWithMessage(keyB, 'custom error string'), 'custom error string');
      });
    });

    describe('tryGet', function () {
      it('existing value', async function () {
        const result = await this.map.tryGet(keyA);
        expect(result['0']).to.be.equal(true);
        expect(result['1'].toString()).to.be.equal(valueA.toString());
      });
      it('missing value', async function () {
        const result = await this.map.tryGet(keyB);
        expect(result['0']).to.be.equal(false);
        expect(result['1'].toString()).to.be.equal(zeroValue.toString());
      });
    });
  });
}

module.exports = {
  shouldBehaveLikeMap,
};
