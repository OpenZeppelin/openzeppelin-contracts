const { ethers } = require('ethers');
const { capitalize } = require('../../helpers');
const format = require('../format-lines');
const { SUBBYTE_TYPES, BYTEMAP_TYPES } = require('./BitMaps.opts');

const typeList = [
  ' * * `BitMap`: 256 booleans per slot (1 bit each)',
  ...SUBBYTE_TYPES.map(({ bits, name }) => ` * * \`${capitalize(name)}\`: ${256n / bits} ${bits}-bit values per slot`),
  ...BYTEMAP_TYPES.map(({ bits }) => ` * * \`Uint${bits}Map\`: ${256n / bits} ${bits}-bit values per slot`),
].join('\n');

const header = `\
pragma solidity ^0.8.20;

/**
 * @dev Library for managing bytes-based mappings in a compact and efficient way, provided the keys are sequential.
 * Largely inspired by Uniswap's https://github.com/Uniswap/merkle-distributor/blob/master/contracts/MerkleDistributor.sol[merkle-distributor].
 *
 * The library provides several map types that pack multiple values into single 256-bit storage slots:
 *
${typeList}
 *
 * This approach provides significant gas savings compared to using individual storage slots for each value:
 *
 * * Setting a zero value to non-zero only once every N times (where N is the packing density)
 * * Accessing the same warm slot for every N _sequential_ indices
 */
library BitMaps {
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
    }`;

const subByteTemplates = opts => {
  const maxMask = ethers.toBeHex((1n << opts.bits) - 1n);
  const valueShift = Math.log2(Number(opts.bits));
  const bucketShift = Math.log2(Number(256n / opts.bits));
  const valueMask = ethers.toBeHex(256n / opts.bits - 1n);

  return `\

    struct ${capitalize(opts.name)} {
        mapping(uint256 bucket => uint256) _data;
    }

    /**
     * @dev Returns the ${opts.bits}-bit value at \`index\` in \`${opts.name}\`.
     */
    function get(${capitalize(opts.name)} storage ${opts.name}, uint256 index) internal view returns (uint8) {
        uint256 bucket = index >> ${bucketShift}; // ${256n / opts.bits} values per bucket (256/${opts.bits})
        uint256 shift = (index & ${valueMask}) << ${valueShift}; // i.e. (index % ${Number(valueMask) + 1}) * ${opts.bits} = position * ${opts.bits}
        return uint8((${opts.name}._data[bucket] >> shift) & ${maxMask});
    }

    /**
     * @dev Sets the ${opts.bits}-bit value at \`index\` in \`${opts.name}\`.
     * Values larger than ${(1n << opts.bits) - 1n} are truncated to ${opts.bits} bits (e.g., ${1n << opts.bits} becomes 0).
     */
    function set(${capitalize(opts.name)} storage ${opts.name}, uint256 index, uint8 value) internal {
        uint256 bucket = index >> ${bucketShift}; // ${256n / opts.bits} values per bucket (256/${opts.bits})
        uint256 shift = (index & ${valueMask}) << ${valueShift}; // i.e. (index % ${Number(valueMask) + 1}) * ${opts.bits} = position * ${opts.bits}
        uint256 mask = ${maxMask} << shift;
        ${opts.name}._data[bucket] = (${opts.name}._data[bucket] & ~mask) | (uint256(value) << shift); // set the ${opts.bits} bits
    }`;
};

const byteTemplates = opts => {
  const maxMask = ethers.toBeHex((1n << opts.bits) - 1n);
  const valueShift = Math.log2(Number(opts.bits));
  const bucketShift = Math.log2(Number(256n / opts.bits));
  const valueMask = ethers.toBeHex(256n / opts.bits - 1n);
  const name = `uint${opts.bits}Map`;

  return `\

    struct ${capitalize(name)} {
        mapping(uint256 bucket => uint256) _data;
    }

    /**
     * @dev Returns the ${opts.bits}-bit value at \`index\` in \`map\`.
     */
    function get(${capitalize(name)} storage map, uint256 index) internal view returns (uint${opts.bits}) {
        uint256 bucket = index >> ${bucketShift}; // ${256n / opts.bits} values per bucket (256/${opts.bits})
        uint256 shift = (index & ${valueMask}) << ${valueShift}; // i.e. (index % ${Number(valueMask) + 1}) * ${opts.bits} = position * ${opts.bits}
        return uint${opts.bits}(map._data[bucket] >> shift);
    }

    /**
     * @dev Sets the ${opts.bits}-bit value at \`index\` in \`map\`.
     *
     * NOTE: Assumes \`value\` fits in ${opts.bits} bits. Assembly-manipulated values may corrupt adjacent data.
     */
    function set(${capitalize(name)} storage map, uint256 index, uint${opts.bits} value) internal {
        uint256 bucket = index >> ${bucketShift}; // ${256n / opts.bits} values per bucket (256/${opts.bits})
        uint256 shift = (index & ${valueMask}) << ${valueShift}; // i.e. (index % ${Number(valueMask) + 1}) * ${opts.bits} = position * ${opts.bits}
        uint256 mask = ${maxMask} << shift;
        map._data[bucket] = (map._data[bucket] & ~mask) | (uint256(value) << shift); // set the ${opts.bits} bits
    }`;
};

// GENERATE
module.exports = format(
  header.trimEnd(),
  bitmapTemplate,
  ...SUBBYTE_TYPES.map(subByteTemplates),
  ...BYTEMAP_TYPES.map(byteTemplates),
  '}',
);
