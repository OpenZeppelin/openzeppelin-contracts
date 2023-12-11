// Map values in an object
const mapValues = (obj, fn) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fn(v)]));

// Cartesian product of a list of arrays
const product = (...arrays) => arrays.reduce((a, b) => a.flatMap(ai => b.map(bi => [...ai, bi])), [[]]);
const unique = (...array) => array.filter((obj, i) => array.indexOf(obj) === i);
const zip = (...args) =>
  Array(Math.max(...args.map(array => array.length)))
    .fill()
    .map((_, i) => args.map(array => array[i]));

module.exports = {
  mapValues,
  product,
  unique,
  zip,
};
