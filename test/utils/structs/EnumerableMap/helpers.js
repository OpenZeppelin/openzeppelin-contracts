const zip = require('lodash.zip');

const toStringArray = (array) => array.map((i) => i.toString());

async function expectMembersMatch (map, keys, values) {
  const stringKeys = toStringArray(keys);
  const stringValues = toStringArray(values);

  expect(keys.length).to.equal(values.length);

  await Promise.all(keys.map(async (key) => expect(await map.contains(key)).to.equal(true)));

  expect(await map.length()).to.bignumber.equal(keys.length.toString());

  expect(toStringArray(await Promise.all(keys.map((key) => map.get(key))))).to.have.same.members(stringValues);

  // to compare key-value pairs, we zip keys and values
  // we also stringify pairs because this helper is used for multiple types of maps
  expect(
    await Promise.all(
      [...Array(keys.length).keys()].map(async (index) => {
        const { key, value } = await map.at(index);
        return [key.toString(), value.toString()];
      }),
    ),
  ).to.have.same.deep.members(zip(stringKeys, stringValues));
}

module.exports = {
  expectMembersMatch,
};
