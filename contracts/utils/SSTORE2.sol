// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Create2} from "./Create2.sol";
import {Errors} from "./Errors.sol";
import {Math} from "./math/Math.sol";

/**
 * @dev Library for cheap reads and writes of immutable data using contract bytecode as a storage medium.
 *
 * Instead of writing data to storage slots using `SSTORE`, this library deploys the data as the runtime
 * bytecode of a new "pointer" contract (using `CREATE` or `CREATE2`) and reads it back using `EXTCODECOPY`.
 * For payloads larger than a few words, this is significantly cheaper than `SSTORE`/`SLOAD`: writing costs
 * roughly 200 gas per byte (vs ~625 gas per byte for storage), and reading large payloads avoids per-slot
 * `SLOAD` costs entirely.
 *
 * The deployed runtime code is the concatenation of a single `STOP` (`0x00`) opcode and the stored data.
 * The `STOP` prefix guarantees the pointer contract cannot be executed, so the stored data can never be
 * interpreted as code even if the pointer is called.
 *
 * Data written through this library is immutable and write-once: it cannot be updated or deleted. To
 * "update", write a new pointer and replace the stored pointer address.
 *
 * This pattern was popularized by 0xSequence's https://github.com/0xsequence/sstore2[SSTORE2] and is also
 * implemented in https://github.com/transmissions11/solmate[Solmate] and
 * https://github.com/Vectorized/solady[Solady] in a slightly different manner.
 */
library SSTORE2 {
    /**
     * ================================[ POINTER CREATION CODE ]================================
     * The creation code is the 10-byte header below, followed by the 1-byte `STOP` prefix and
     * the data itself. It returns `[0x0A..0x0A + rsize)` of the creation code as runtime code,
     * where `rsize = data.length + 1` accounts for the `STOP` prefix.
     *
     * Offset | Opcode     | Mnemonic       | Stack              | Memory
     * -------|------------|----------------|--------------------|---------------------------
     * 0x00   | 61 rsize   | PUSH2 rsize    | rsize              |
     * 0x03   | 80         | DUP1           | rsize rsize        |
     * 0x04   | 600A       | PUSH1 0x0A     | 0x0A rsize rsize   |
     * 0x06   | 3D         | RETURNDATASIZE | 0 0x0A rsize rsize |
     * 0x07   | 39         | CODECOPY       | rsize              | [0..rsize): runtime code
     * 0x08   | 3D         | RETURNDATASIZE | 0 rsize            | [0..rsize): runtime code
     * 0x09   | F3         | RETURN         |                    | [0..rsize): runtime code
     * 0x0A   | 00         | STOP           |                    |
     * 0x0B   | data       |                |                    |
     *
     * Result: STOP + data deployed
     */
    /// @dev The creation code header, with the `PUSH2` immediate left as a placeholder.
    uint256 private constant CREATION_CODE_TEMPLATE = 0x61000080600A3D393DF300;

    /// @dev Maximum length of the data that can be written with this library. This is the maximum contract
    /// size allowed by https://eips.ethereum.org/EIPS/eip-170[EIP-170] (24576 or 0x6000 bytes) minus 1 byte for the
    /// `STOP` opcode that prefixes the data in the pointer's runtime code.
    uint256 internal constant MAX_DATA_LENGTH = 0x5FFF;

    /// @dev The data is longer than `MAX_DATA_LENGTH` and cannot be written to a single pointer.
    error SSTORE2DataTooLarge(uint256 length);

    /**
     * @dev Writes `data` as the runtime code of a new pointer contract deployed with `CREATE`, and returns
     * the pointer's address. The data can be recovered using {read}.
     *
     * Requirements:
     *
     * - `data` must not be longer than `MAX_DATA_LENGTH`.
     */
    function write(bytes memory data) internal returns (address pointer) {
        uint256 length = data.length;
        bytes32 header = _creationCodeHeader(length);
        assembly ("memory-safe") {
            // Temporarily replace the length word of `data` with the creation code header, so that
            // [data+0x15, data+0x20+length) holds the full creation code (header + STOP + data).
            mstore(data, header)
            // 0x15 is 0x20 - template.length
            // 0x0B is template.length
            pointer := create(0, add(data, 0x15), add(length, 0x0B))
            // Restore the length word.
            mstore(data, length)
        }
        if (pointer == address(0)) {
            revert Errors.FailedDeployment();
        }
    }

    /**
     * @dev Same as {write}, but the pointer contract is deployed with `CREATE2` using `salt`. The pointer's
     * address can be known in advance via {computeAddress}, and is a function of both `salt` and `data`.
     *
     * Requirements:
     *
     * - `data` must not be longer than `MAX_DATA_LENGTH`.
     * - the combination of `salt` and `data` must not have been used already.
     *
     * NOTE: reusing a `salt` and `data` combination reverts with {Errors-FailedDeployment}, but only after
     * the address collision consumes nearly all of the available gas (all but 1/64th, per EIP-150 rules).
     * Consider checking `computeAddress(salt, data).code.length` beforehand if collisions are expected.
     */
    function writeDeterministic(bytes memory data, bytes32 salt) internal returns (address pointer) {
        uint256 length = data.length;
        bytes32 header = _creationCodeHeader(length);
        assembly ("memory-safe") {
            // See {write} for details on this memory manipulation.
            mstore(data, header)
            pointer := create2(0, add(data, 0x15), add(length, 0x0B), salt)
            mstore(data, length)
        }
        if (pointer == address(0)) {
            revert Errors.FailedDeployment();
        }
    }

    /**
     * @dev Returns the address where `data` will be stored if written via {writeDeterministic} with `salt`.
     */
    function computeAddress(bytes32 salt, bytes memory data) internal view returns (address) {
        return Create2.computeAddress(salt, initCodeHash(data));
    }

    /**
     * @dev Returns the address where `data` will be stored if written via {writeDeterministic} with `salt`
     * by a contract located at `deployer`. If `deployer` is this contract's address, returns the same value
     * as {computeAddress}.
     */
    function computeAddress(bytes32 salt, bytes memory data, address deployer) internal pure returns (address) {
        return Create2.computeAddress(salt, initCodeHash(data), deployer);
    }

    /**
     * @dev Returns the hash of the creation code of the pointer contract that stores `data`. This is the
     * `bytecodeHash` involved in the `CREATE2` address derivation of {writeDeterministic}.
     *
     * Requirements:
     *
     * - `data` must not be longer than `MAX_DATA_LENGTH`.
     */
    function initCodeHash(bytes memory data) internal pure returns (bytes32 hash) {
        uint256 length = data.length;
        bytes32 header = _creationCodeHeader(length);
        assembly ("memory-safe") {
            // See {write} for details on this memory manipulation.
            mstore(data, header)
            hash := keccak256(add(data, 0x15), add(length, 0x0B))
            mstore(data, length)
        }
    }

    /**
     * @dev Reads the entirety of the data stored at `pointer`.
     *
     * If `pointer` was not created by this library, this function returns the pointer's runtime code
     * stripped of its first byte, or an empty buffer if the pointer has no code.
     */
    function read(address pointer) internal view returns (bytes memory) {
        return read(pointer, 0, type(uint256).max);
    }

    /**
     * @dev Reads the data stored at `pointer`, from `start` (included) to the end of the data.
     *
     * NOTE: replicates the (clamping) behavior of {Bytes-slice}: `start` is truncated to the length
     * of the data.
     */
    function read(address pointer, uint256 start) internal view returns (bytes memory) {
        return read(pointer, start, type(uint256).max);
    }

    /**
     * @dev Reads the data stored at `pointer`, from `start` (included) to `end` (excluded).
     *
     * NOTE: replicates the (clamping) behavior of {Bytes-slice}: `end` is truncated to the length of the
     * data, and `start` is truncated to `end`.
     */
    function read(address pointer, uint256 start, uint256 end) internal view returns (bytes memory result) {
        // sanitize: the pointer's code is the data prefixed with a single STOP byte.
        end = Math.min(end, Math.saturatingSub(pointer.code.length, 1));
        start = Math.min(start, end);

        // allocate (zero-initialized) and copy
        uint256 length = end - start;
        result = new bytes(length);
        assembly ("memory-safe") {
            extcodecopy(pointer, add(result, 0x20), add(start, 1), length)
        }
    }

    /**
     * @dev Returns the creation code header for a data buffer of `length` bytes: the `CREATION_CODE_TEMPLATE`
     * with the runtime code size (`length + 1`) inlined in the `PUSH2` immediate, right-aligned in a word.
     *
     * Reverts with {SSTORE2DataTooLarge} if `length` is larger than `MAX_DATA_LENGTH`.
     */
    function _creationCodeHeader(uint256 length) private pure returns (bytes32) {
        if (length > MAX_DATA_LENGTH) {
            revert SSTORE2DataTooLarge(length);
        }
        unchecked {
            // Cannot overflow: `length` is at most `MAX_DATA_LENGTH`.
            return bytes32(CREATION_CODE_TEMPLATE | ((length + 1) << 64));
        }
    }
}
