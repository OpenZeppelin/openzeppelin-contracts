const format = require('../format-lines');
const { TYPES } = require('./BitMaps.opts');

const header = `\
pragma solidity ^0.8.20;

/**
 * @dev Library for managing bytes-based mappings in a compact and efficient way, provided the keys are sequential.
 * Largely inspired by Uniswap's https://github.com/Uniswap/merkle-distributor/blob/master/contracts/MerkleDistributor.sol[merkle-distributor].
 *
 * The library provides several map types that pack multiple values into single 256-bit storage slots:
 *
 * * \`BitMap\`: 256 booleans per slot (1 bit each)
${TYPES.map(({ bits, name }) => ` * * \`${name}\`: ${256n / bits} ${bits}-bit values per slot`).join('\n')}
 *
 * This approach provides significant gas savings compared to using individual storage slots for each value:
 *
 * * Setting a zero value to non-zero only once every N times (where N is the packing density)
 * * Accessing the same warm slot for every N _sequential_ indices
 */
`;

const bitmapTemplate = `\
struct BitMap {
    mapping(uint256 bucket => uint256) _data;
}

/**
 * @dev Returns whether the bit at \`index\` is set.
 */
function get(BitMap storage bitmap, uint256 index) internal view returns (bool) {
    uint256 bucket = index >> 8;
    uint256 mask = 1 << (index & 0xff);
    return bitmap._data[bucket] & mask != 0;
}

/**
 * @dev Sets the bit at \`index\` to the boolean \`value\`.
 */
function setTo(BitMap storage bitmap, uint256 index, bool value) internal {
    if (value) {
        set(bitmap, index);
    } else {
        unset(bitmap, index);
    }
}

/**
 * @dev Sets the bit at \`index\`.
 */
function set(BitMap storage bitmap, uint256 index) internal {
    uint256 bucket = index >> 8;
    uint256 mask = 1 << (index & 0xff);
    bitmap._data[bucket] |= mask;
}

/**
 * @dev Unsets the bit at \`index\`.
 */
function unset(BitMap storage bitmap, uint256 index) internal {
    uint256 bucket = index >> 8;
    uint256 mask = 1 << (index & 0xff);
    bitmap._data[bucket] &= ~mask;
}
`;

const byteTemplates = opts => `\
struct ${opts.name} {
    mapping(uint256 bucket => uint256) _data;
}

/**
 * @dev Returns the ${opts.bits}-bit value at \`index\` in \`map\`.
 */
function get(${opts.name} storage map, uint256 index) internal view returns (${opts.type}) {
    uint256 bucket = index >> ${8 - opts.width}; // ${256n / opts.bits} values per bucket (256/${opts.bits})
    uint256 shift = (index & ${opts.mask}) << ${opts.width}; // i.e. (index % ${Number(opts.mask) + 1}) * ${opts.bits} = position * ${opts.bits}
    return ${opts.type}(${opts.bits < 8 ? `(map._data[bucket] >> shift) & ${opts.max}` : `map._data[bucket] >> shift`});
}

/**
 * @dev Sets the ${opts.bits}-bit value at \`index\` in \`map\`.
 *
 * NOTE: Assumes \`value\` fits in ${opts.bits} bits. Assembly-manipulated values may corrupt adjacent data.
 */
function set(${opts.name} storage map, uint256 index, ${opts.type} value) internal {
    uint256 bucket = index >> ${8 - opts.width}; // ${256n / opts.bits} values per bucket (256/${opts.bits})
    uint256 shift = (index & ${opts.mask}) << ${opts.width}; // i.e. (index % ${Number(opts.mask) + 1}) * ${opts.bits} = position * ${opts.bits}
    uint256 mask = ${opts.max} << shift;
    map._data[bucket] = (map._data[bucket] & ~mask) | (uint256(value) << shift); // set the ${opts.bits} bits
}
`;

// GENERATE
module.exports = format(
  header.trimEnd(),
  `library BitMaps {`,
  format([].concat(bitmapTemplate, TYPES.map(byteTemplates))).trimEnd(),
  '}',
);
