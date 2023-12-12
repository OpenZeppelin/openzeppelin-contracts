// Map values in an object
const mapValues = (obj, fn) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fn(v)]));

// Cartesian product of a list of arrays
const product = (...arrays) => arrays.reduce((a, b) => a.flatMap(ai => b.map(bi => [...ai, bi])), [[]]);

module.exports = {
  mapValues,
  product,
};
