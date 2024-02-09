const range = (start, stop = undefined, step = 1) => {
  if (!stop) {
    stop = start;
    start = 0;
  }
  return start < stop ? Array.from({ length: Math.ceil((stop - start) / step) }, (_, i) => start + i * step) : [];
};

const chunk = (array, size = 1) =>
  Array.from({ length: Math.ceil(array.length / size) }, (_, i) => array.slice(i * size, i * size + size));

const unique = (array, op = x => x) => array.filter((obj, i) => array.findIndex(entry => op(obj) === op(entry)) === i);

const zip = (...args) =>
  Array.from({ length: Math.max(...args.map(arg => arg.length)) }, (_, i) => args.map(arg => arg[i]));

const product = (...arrays) => arrays.reduce((a, b) => a.flatMap(ai => b.map(bi => [...ai, bi])), [[]]);

const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1);

module.exports = {
  chunk,
  range,
  unique,
  zip,
  product,
  capitalize,
};
