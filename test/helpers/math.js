// Array of number or bigint
const max = (...values) => values.slice(1).reduce((x, y) => (x > y ? x : y), values.at(0));
const min = (...values) => values.slice(1).reduce((x, y) => (x < y ? x : y), values.at(0));
const sum = (...values) => values.slice(1).reduce((x, y) => x + y, values.at(0));

module.exports = {
  min,
  max,
  sum,
};
