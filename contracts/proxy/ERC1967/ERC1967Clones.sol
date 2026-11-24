// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.7.0) (proxy/ERC1967/ERC1967Clones.sol)

pragma solidity ^0.8.26;

import {IERC1967} from "../../interfaces/IERC1967.sol";
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
    // Bytecode compiled from contracts/proxy/ERC1967/ERC1967Clones.yul. The initcode is followed by the ABI-encoded
    // implementation address, which the constructor stores in the ERC-1967 implementation slot.
    // deployment code: 0x603a8060595f396020609382398051807f<slot>557f<topic>5f80a25ff3fe
    // deployed code:   0x365f80375f8036817f<slot>545af43d5f803e6036573d5ffd5b3d5ff3

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
        bytes32 topic1 = IERC1967.Upgraded.selector;
        assembly ("memory-safe") {
            // Set code in memory (initcode at ptr + 0x0f, followed by the ABI-encoded implementation)
            let ptr := mload(0x40)
            mstore(add(ptr, 0xa2), implementation)
            mstore(add(ptr, 0x82), 0x545af43d5f803e6036573d5ffd5b3d5ff3)
            mstore(add(ptr, 0x71), implementationSlot)
            mstore(add(ptr, 0x51), 0x5f80a25ff3fe365f80375f8036817f)
            mstore(add(ptr, 0x42), topic1)
            mstore(add(ptr, 0x22), 0x557f)
            mstore(add(ptr, 0x20), implementationSlot)
            mstore(ptr, 0x603a8060595f396020609382398051807f)

            // Call create
            instance := create(value, add(ptr, 0x0f), 0xb3)
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
        bytes32 topic1 = IERC1967.Upgraded.selector;
        assembly ("memory-safe") {
            // Set code in memory (initcode at ptr + 0x0f, followed by the ABI-encoded implementation)
            let ptr := mload(0x40)
            mstore(add(ptr, 0xa2), implementation)
            mstore(add(ptr, 0x82), 0x545af43d5f803e6036573d5ffd5b3d5ff3)
            mstore(add(ptr, 0x71), implementationSlot)
            mstore(add(ptr, 0x51), 0x5f80a25ff3fe365f80375f8036817f)
            mstore(add(ptr, 0x42), topic1)
            mstore(add(ptr, 0x22), 0x557f)
            mstore(add(ptr, 0x20), implementationSlot)
            mstore(ptr, 0x603a8060595f396020609382398051807f)

            // Call create2
            instance := create2(value, add(ptr, 0x0f), 0xb3, salt)
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
        bytes32 topic1 = IERC1967.Upgraded.selector;
        assembly ("memory-safe") {
            // Set code in memory (initcode at ptr + 0x0f, followed by the ABI-encoded implementation)
            let ptr := mload(0x40)
            mstore(add(ptr, 0xa2), implementation)
            mstore(add(ptr, 0x82), 0x545af43d5f803e6036573d5ffd5b3d5ff3)
            mstore(add(ptr, 0x71), implementationSlot)
            mstore(add(ptr, 0x51), 0x5f80a25ff3fe365f80375f8036817f)
            mstore(add(ptr, 0x42), topic1)
            mstore(add(ptr, 0x22), 0x557f)
            mstore(add(ptr, 0x20), implementationSlot)
            mstore(ptr, 0x603a8060595f396020609382398051807f)

            // Compute hash
            bytecodeHash := keccak256(add(ptr, 0x0f), 0xb3)
        }
    }
}
