// Array of number or bigint
const max = (...values) => values.slice(1).reduce((x, y) => (x > y ? x : y), values.at(0));
const min = (...values) => values.slice(1).reduce((x, y) => (x < y ? x : y), values.at(0));
const sum = (...values) => values.slice(1).reduce((x, y) => x + y, values.at(0));

// Computes modexp without BigInt overflow for large numbers
function modExp(b, e, m) {
  let result = 1n;

  // If e is a power of two, modexp can be calculated as:
  // for (let result = b, i = 0; i < log2(e); i++) result = modexp(result, 2, m)
  //
  // Given any natural number can be written in terms of powers of 2 (i.e. binary)
  // then modexp can be calculated for any e, by multiplying b**i for all i where
  // binary(e)[i] is 1 (i.e. a power of two).
  for (let base = b % m; e > 0n; base = base ** 2n % m) {
    // Least significant bit is 1
    if (e % 2n == 1n) {
      result = (result * base) % m;
    }

    e /= 2n; // Binary pop
  }

  return result;
}

module.exports = {
  min,
  max,
  sum,
  modExp,
};
