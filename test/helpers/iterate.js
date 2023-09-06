// Map values in an object
const mapValues = (obj, fn) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fn(v)]));

// Array of number or bigint
const max = (...values) => values.slice(1).reduce((x, y) => (x > y ? x : y), values[0]);
const min = (...values) => values.slice(1).reduce((x, y) => (x < y ? x : y), values[0]);

// Cartesian product of a list of arrays
const product = (...arrays) => arrays.reduce((a, b) => a.flatMap(ai => b.map(bi => [...ai, bi])), [[]]);

module.exports = {
  mapValues,
  max,
  min,
  product,
};
