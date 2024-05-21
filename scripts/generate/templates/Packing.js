const { capitalize } = require('../../helpers');
const format = require('../format-lines');
const { BYTES_PACK_SIZES } = require('./Packing.opts');

const header = `\
pragma solidity ^0.8.20;
`;

const natspec = (fromBytesSize, toUintType, packSize) => `\
/**
 * @dev Helper library packing and unpacking multiple values into bytes${fromBytesSize}.
 *
 * Example usage:
 *
 * \`\`\`solidity
 * contract Example {
 *     // Add the library methods
 *     using PackingBytes${fromBytesSize} for *;
 *
 *     function foo(bytes${fromBytesSize} value) internal {
 *        // Convert any bytes${fromBytesSize} into a packed ${toUintType}x${packSize}
 *        Packing.${capitalize(toUintType)}x${packSize} my${capitalize(toUintType)}x${packSize} = value.as${capitalize(
   toUintType,
 )}x${packSize}();
 *        
 *        // Access values through index
 *        ${toUintType} b = my${capitalize(toUintType)}x${packSize}.at(1);
 * 
 *        // Convert back to bytes${fromBytesSize}
 *        bytes${fromBytesSize} newValue = my${capitalize(toUintType)}x${packSize}.asBytes32();
 *     }
 * }
 * \`\`\`
 */`;

const argTypes = (toUintType, packSize) => new Array(packSize).fill().map((_, i) => `${toUintType} arg${i}`);

const returnTypes = (toUintType, packSize) => new Array(packSize).fill().map(() => toUintType);

const returnSplit = packSize => new Array(packSize).fill().map((_, i) => `at(self, ${i})`);

const wrapArgShift = (fromBytesSize, packSize, i, array) =>
  i < array.length - 1 ? `<< ${(array.length - 1 - i) * (fromBytesSize / packSize) * 8}` : '';

const wrapArgs = (fromBytesSize, packSize) =>
  new Array(packSize)
    .fill()
    .map(
      (_, i, array) =>
        `bytes${fromBytesSize}(uint${fromBytesSize * 8}(arg${i}))` + wrapArgShift(fromBytesSize, packSize, i, array),
    )
    .join(' | ');

const template = (fromBytesSize, toUintType, packSize) => `\
type ${capitalize(toUintType)}x${packSize} is bytes${fromBytesSize};

/// @dev Cast a bytes${fromBytesSize} into a ${capitalize(toUintType)}x${packSize}
function as${capitalize(toUintType)}x${packSize}(bytes${fromBytesSize} self) internal pure returns (${capitalize(
  toUintType,
)}x${packSize}) {
    return ${capitalize(toUintType)}x${packSize}.wrap(self);
}

/// @dev Cast a ${capitalize(toUintType)}x${packSize} into a bytes${fromBytesSize}
function asBytes${fromBytesSize}(${capitalize(
  toUintType,
)}x${packSize} self) internal pure returns (bytes${fromBytesSize}) {
    return ${capitalize(toUintType)}x${packSize}.unwrap(self);
}

/// @dev Get the Nth element of a ${capitalize(toUintType)}x${packSize} counting from higher to lower bytes
/// 
/// NOTE: Returns 0 if pos is out of bounds.
function at(${capitalize(toUintType)}x${packSize} self, uint8 pos) internal pure returns (${toUintType}) {
    return ${toUintType}(bytes${fromBytesSize / packSize}(bytes32(
        ${capitalize(toUintType)}x${packSize}.unwrap(self)) << (pos * ${(fromBytesSize / packSize) * 8})) 
    );
}

/// @dev Pack ${packSize} ${toUintType} into a ${capitalize(toUintType)}x${packSize}
function pack(${argTypes(toUintType, packSize)}) internal pure returns (${capitalize(toUintType)}x${packSize}) {
    return ${capitalize(toUintType)}x${packSize}.wrap(${wrapArgs(fromBytesSize, packSize)});
}

/// @dev Split a ${capitalize(toUintType)}x${packSize} into ${packSize} ${toUintType}
function split(${capitalize(toUintType)}x${packSize} self) internal pure returns (${returnTypes(
  toUintType,
  packSize,
)}) {
    return (${returnSplit(packSize)});
}
`;

// GENERATE
module.exports = format(
  header.trimEnd(),
  Object.entries(BYTES_PACK_SIZES).map(([fromBytesSize, opts]) => {
    const entries = Object.entries(opts);
    return [
      natspec(fromBytesSize, entries[0][0], entries[0][1]),
      `library PackingBytes${fromBytesSize} {`,
      ...entries.map(([toUintType, packSize]) => [template(fromBytesSize, toUintType, packSize)]),
      '}',
    ];
  }),
);
