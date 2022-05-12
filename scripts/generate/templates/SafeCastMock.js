const format = require('../format-lines');

const header = `\
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/math/SafeCast.sol";
`;

const toInt = length => `\
function toInt${length}(uint${length} a) public pure returns (int${length}) {
    return a.toInt${length}();
}
`;

const toUint = length => `\
function toUint${length}(int${length} a) public pure returns (uint${length}) {
    return a.toUint${length}();
}
`;

const toIntDownCast = length => `\
function toInt${length}(int256 a) public pure returns (int${length}) {
    return a.toInt${length}();
}
`;

const toUintDownCast = length => `\
function toUint${length}(uint256 a) public pure returns (uint${length}) {
    return a.toUint${length}();
}
`;

// GENERATE
const LENGTHS = Array(30).fill().map((_, i) => (i + 1) * 8).reverse(); // 224 → 8 (in steps of 8)

module.exports = format(
  header,
  'contract SafeCastMock {',
  [
    'using SafeCast for uint256;',
    'using SafeCast for int256;',
    '',
    toUint(256),
    ...LENGTHS.map(size => toUintDownCast(size)),
    toInt(256),
    ...LENGTHS.map(size => toIntDownCast(size)),
  ].map(fn => fn.split('\n')),
  '}',
);
