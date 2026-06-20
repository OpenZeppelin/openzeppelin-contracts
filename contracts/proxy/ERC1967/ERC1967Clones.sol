// SPDX-License-Identifier: MIT

pragma solidity ^0.8.26;

import {Create2} from "../../utils/Create2.sol";
import {Errors} from "../../utils/Errors.sol";
import {ERC1967Utils} from "./ERC1967Utils.sol";

/**
 * @dev https://eips.ethereum.org/EIPS/eip-1967[ERC-1967] is the standard for upgradeable proxies that
 * store the implementation address in a fixed storage slot. This library deploys minimal proxies that
 * mimic the behavior of {ERC1967Proxy} with a bytecode optimized for cheap deployment and usage. The
 * deployment emits {IERC1967-Upgraded} from the proxy address, so on-chain tooling and indexers can
 * track the new instance from the block it was created in.
 *
 * The library includes functions to deploy a proxy using either `create` (traditional deployment) or
 * `create2` (salted deterministic deployment). It also includes a function to predict the addresses of
 * proxies deployed using the deterministic method.
 *
 * IMPORTANT: Unlike {ERC1967Proxy}, this proxy does not run an initialization call at construction and
 * does not check that `implementation` has code. Calls forwarded to a non-contract `implementation`
 * succeed silently and return empty data, which an uninitialized clone cannot distinguish from a
 * legitimate response. Factories using this library are expected to invoke the initializer on the
 * returned address in the same transaction as the deployment.
 */
library ERC1967Clones {
    /// @dev Topic1 for the {IERC1967-Upgraded} event. Equal to `keccak256("Upgraded(address)")`.
    // solhint-disable-next-line private-vars-leading-underscore
    bytes32 internal constant UPGRADE_TOPIC1 = 0xbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b;

    /**
     * ========================================[ PROXY CODE ]========================================
     * Offset | Opcode      | Mnemonic         | Stack                      | Memory
     * -------|-------------|------------------|----------------------------|------------------------
     * 0x00   | 36          | CALLDATASIZE     | cds                        |
     * 0x01   | 5f          | PUSH0            | 0 cds                      |
     * 0x02   | 5f          | PUSH0            | 0 0 cds                    |
     * 0x03   | 37          | CALLDATACOPY     |                            | [0..cds): calldata
     * 0x04   | 5f          | PUSH0            | 0                          | [0..cds): calldata
     * 0x05   | 5f          | PUSH0            | 0 0                        | [0..cds): calldata
     * 0x06   | 36          | CALLDATASIZE     | cds 0 0                    | [0..cds): calldata
     * 0x07   | 5f          | PUSH0            | 0 cds 0 0                  | [0..cds): calldata
     * 0x08   | 7f<slot>    | PUSH32 slot      | slot 0 cds 0 0             | [0..cds): calldata
     * 0x29   | 54          | SLOAD            | addr 0 cds 0 0             | [0..cds): calldata
     * 0x2A   | 5a          | GAS              | gas addr 0 cds 0 0         | [0..cds): calldata
     * 0x2B   | f4          | DELEGATECALL     | success                    |
     * 0x2C   | 3d          | RETURNDATASIZE   | rds success                |
     * 0x2D   | 5f          | PUSH0            | 0 rds success              |
     * 0x2E   | 5f          | PUSH0            | 0 0 rds success            |
     * 0x2F   | 3e          | RETURNDATACOPY   | success                    | [0...rds): returndata
     * 0x30   | 5f          | PUSH0            | 0 success                  | [0...rds): returndata
     * 0x31   | 3d          | RETURNDATASIZE   | rds 0 success              | [0...rds): returndata
     * 0x32   | 91          | SWAP2            | success 0 rds              | [0...rds): returndata
     * 0x33   | 6037        | PUSH1 0x37       | 0x37 success 0 rds         | [0...rds): returndata
     * 0x35   | 57          | JUMPI            | 0 rds                      | [0...rds): returndata
     * 0x36   | fd          | REVERT           |                            |
     * 0x37   | 5b          | JUMPDEST         | 0 rds                      | [0...rds): returndata
     * 0x38   | f3          | RETURN           |                            |
     *
     * =====================================[ DEPLOYMENT CODE  ]=====================================
     * Offset | Opcode      | Mnemonic         | Stack                      | Memory
     * -------|-------------|------------------|----------------------------|------------------------
     * 0x00   | 6039        | PUSH1 0x39       | 0x39                       |
     * 0x02   | 5f          | PUSH0            | 0 0x39                     |
     * 0x03   | 81          | DUP2             | 0x39 0 0x39                |
     * 0x04   | 6047        | PUSH1 0x47       | 0x47 0x39 0 0x39           |
     * 0x06   | 5f          | PUSH0            | 0 0x47 0x39 0 0x39         |
     * 0x07   | 39          | CODECOPY         | 0 0x39                     | [0...0x39): proxycode
     * 0x08   | 73<impl>    | PUSH20 impl      | impl 0 0x39                | [0...0x39): proxycode
     * 0x1d   | 80          | DUP1             | impl impl 0 0x39           | [0...0x39): proxycode
     * 0x1e   | 7f<topic>   | PUSH32 topic     | topic impl impl 0 0x39     | [0...0x39): proxycode
     * 0x3f   | 5f          | PUSH0            | 0 topic impl impl 0 0x39   | [0...0x39): proxycode
     * 0x40   | 5f          | PUSH0            | 0 0 topic impl impl 0 0x39 | [0...0x39): proxycode
     * 0x41   | a2          | LOG2             | impl 0 0x39                | [0...0x39): proxycode
     * 0x42   | 6009        | PUSH1 0x09       | 0x09 impl 0 0x39           | [0...0x39): proxycode
     * 0x44   | 51          | MLOAD            | slot impl 0 0x39           | [0...0x39): proxycode
     * 0x45   | 55          | SSTORE           | 0 0x39                     | [0...0x39): proxycode
     * 0x46   | f3          | RETURN           |                            |
     *
     * NOTE:
     * - 0x39: length of the proxy code
     * - 0x47: length of the deployment code, since the proxy code is just after the deployment code, that is also the offset of the proxy code
     * - 0x09: position of the ERC1967 implementation slot in the proxy code.
     */

    /**
     * @dev Deploys and returns the address of a minimal ERC-1967 proxy that delegates to `implementation`.
     *
     * This function uses the create opcode, which should never revert.
     *
     * Emits an {IERC1967-Upgraded} event from the deployed proxy.
     *
     * WARNING: This function does not check if `implementation` has code, and the deployed proxy does not run
     * any initialization call at construction.
     */
    function clone(address implementation) internal returns (address) {
        return clone(implementation, 0);
    }

    /**
     * @dev Same as {xref-ERC1967Clones-clone-address-}[clone], but with a `value` parameter to send native
     * currency to the new contract.
     *
     * Emits an {IERC1967-Upgraded} event from the deployed proxy.
     *
     * WARNING: This function does not check if `implementation` has code, and the deployed proxy does not run
     * any initialization call at construction.
     *
     * NOTE: Using a non-zero value at creation will require the contract using this function (e.g. a factory)
     * to always have enough balance for new deployments. Consider exposing this function under a payable method.
     */
    function clone(address implementation, uint256 value) internal returns (address instance) {
        require(address(this).balance >= value, Errors.InsufficientBalance(address(this).balance, value));
        bytes32 implementationSlot = ERC1967Utils.IMPLEMENTATION_SLOT;
        bytes32 topic1 = UPGRADE_TOPIC1;
        assembly ("memory-safe") {
            // Set code in memory
            let ptr := mload(0x40)
            mstore(add(ptr, 0x77), 0x545af43d5f5f3e5f3d91603757fd5bf3)
            mstore(add(ptr, 0x67), implementationSlot)
            mstore(add(ptr, 0x47), 0x5f5fa260095155f3365f5f375f5f365f7f)
            mstore(add(ptr, 0x36), topic1)
            mstore(add(ptr, 0x16), 0x807f)
            mstore(add(ptr, 0x14), implementation)
            mstore(ptr, 0x60395f8160475f3973)

            // Call create
            instance := create(value, add(ptr, 0x17), 0x80)
        }

        // deployment code doesn't have a revert, so no need to handle returndata
        require(instance != address(0), Errors.FailedDeployment());
    }

    /**
     * @dev Deploys and returns the address of a minimal ERC-1967 proxy that delegates to `implementation`.
     *
     * This function uses the create2 opcode and a `salt` to deterministically deploy the clone. Using the
     * same `implementation` and `salt` multiple times will revert, since the clones cannot be deployed twice
     * at the same address.
     *
     * Emits an {IERC1967-Upgraded} event from the deployed proxy.
     *
     * WARNING: This function does not check if `implementation` has code, and the deployed proxy does not run
     * any initialization call at construction.
     */
    function cloneDeterministic(address implementation, bytes32 salt) internal returns (address) {
        return cloneDeterministic(implementation, salt, 0);
    }

    /**
     * @dev Same as {xref-ERC1967Clones-cloneDeterministic-address-bytes32-}[cloneDeterministic], but with a
     * `value` parameter to send native currency to the new contract.
     *
     * Emits an {IERC1967-Upgraded} event from the deployed proxy.
     *
     * WARNING: This function does not check if `implementation` has code, and the deployed proxy does not run
     * any initialization call at construction.
     *
     * NOTE: Using a non-zero value at creation will require the contract using this function (e.g. a factory)
     * to always have enough balance for new deployments. Consider exposing this function under a payable method.
     */
    function cloneDeterministic(
        address implementation,
        bytes32 salt,
        uint256 value
    ) internal returns (address instance) {
        require(address(this).balance >= value, Errors.InsufficientBalance(address(this).balance, value));
        bytes32 implementationSlot = ERC1967Utils.IMPLEMENTATION_SLOT;
        bytes32 topic1 = UPGRADE_TOPIC1;
        assembly ("memory-safe") {
            // Set code in memory
            let ptr := mload(0x40)
            mstore(add(ptr, 0x77), 0x545af43d5f5f3e5f3d91603757fd5bf3)
            mstore(add(ptr, 0x67), implementationSlot)
            mstore(add(ptr, 0x47), 0x5f5fa260095155f3365f5f375f5f365f7f)
            mstore(add(ptr, 0x36), topic1)
            mstore(add(ptr, 0x16), 0x807f)
            mstore(add(ptr, 0x14), implementation)
            mstore(ptr, 0x60395f8160475f3973)

            // Call create2
            instance := create2(value, add(ptr, 0x17), 0x80, salt)
        }
        require(instance != address(0), Errors.FailedDeployment());
    }

    /// @dev Computes the address of a clone deployed using {ERC1967Clones-cloneDeterministic}.
    function predictDeterministicAddress(address implementation, bytes32 salt) internal view returns (address) {
        return predictDeterministicAddress(implementation, salt, address(this));
    }

    /// @dev Computes the address of a clone deployed using {ERC1967Clones-cloneDeterministic}.
    function predictDeterministicAddress(
        address implementation,
        bytes32 salt,
        address deployer
    ) internal pure returns (address) {
        return Create2.computeAddress(salt, _getCloneHash(implementation), deployer);
    }

    function _getCloneHash(address implementation) private pure returns (bytes32 bytecodeHash) {
        bytes32 implementationSlot = ERC1967Utils.IMPLEMENTATION_SLOT;
        bytes32 topic1 = UPGRADE_TOPIC1;
        assembly ("memory-safe") {
            // Set code in memory
            let ptr := mload(0x40)
            mstore(add(ptr, 0x77), 0x545af43d5f5f3e5f3d91603757fd5bf3)
            mstore(add(ptr, 0x67), implementationSlot)
            mstore(add(ptr, 0x47), 0x5f5fa260095155f3365f5f375f5f365f7f)
            mstore(add(ptr, 0x36), topic1)
            mstore(add(ptr, 0x16), 0x807f)
            mstore(add(ptr, 0x14), implementation)
            mstore(ptr, 0x60395f8160475f3973)

            // Compute hash
            bytecodeHash := keccak256(add(ptr, 0x17), 0x80)
        }
    }
}
