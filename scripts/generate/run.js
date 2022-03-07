#!/usr/bin/env node

const fs = require('fs');

const {
  toInt,
  toUint,
  toIntDownCast,
  toUintDownCast,
} = require('./templates');

function genSafeCast (path) {
  const content = [];

  // Header
  content.push([
    '// SPDX-License-Identifier: MIT',
    'pragma solidity ^0.8.0;',
    '',
    '/**',
    ' * @dev Wrappers over Solidity\'s uintXX/intXX casting operators with added overflow',
    ' * checks.',
    ' *',
    ' * Downcasting from uint256/int256 in Solidity does not revert on overflow. This can',
    ' * easily result in undesired exploitation or bugs, since developers usually',
    ' * assume that overflows raise errors. `SafeCast` restores this intuition by',
    ' * reverting the transaction when such an operation overflows.',
    ' *',
    ' * Using this library instead of the unchecked operations eliminates an entire',
    ' * class of bugs, so it\'s recommended to use it always.',
    ' *',
    ' * Can be combined with {SafeMath} and {SignedSafeMath} to extend it to smaller types, by performing',
    ' * all math on `uint256` and `int256` and then downcasting.',
    ' */',
  ].join('\n'));

  // Library
  content.push('library SafeCast {');
  for (let size = 224; size > 0; size -= 8) {
    content.push(toUintDownCast(size));
    content.push('');
  }
  content.push(toUint(256));
  content.push('');
  for (let size = 224; size > 0; size -= 8) {
    content.push(toIntDownCast(size));
    content.push('');
  }
  content.push(toInt(256));
  content.push('}');

  fs.writeFileSync(path, content.join('\n'));
}

genSafeCast('./contracts/utils/math/SafeCast.sol');
