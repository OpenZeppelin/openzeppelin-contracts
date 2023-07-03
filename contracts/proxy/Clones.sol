// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.9.0) (proxy/Clones.sol)

pragma solidity ^0.8.19;

/**
 * @dev https://eips.ethereum.org/EIPS/eip-1167[EIP 1167] is a standard for
 * deploying minimal proxy contracts, also known as "clones".
 *
 * > To simply and cheaply clone contract functionality in an immutable way, this standard specifies
 * > a minimal bytecode implementation that delegates all calls to a known, fixed address.
 *
 * The library includes functions to deploy a proxy using either `create` (traditional deployment) or `create2`
 * (salted deterministic deployment). It also includes functions to predict the addresses of clones deployed using the
 * deterministic method.
 *
 * Bytecode implementation is a bit different from EIP 1167, due to optimizations suggested by 0age in
 * https://medium.com/coinmonks/the-more-minimal-proxy-5756ae08ee48[The More-Minimal Proxy].
 * 
 * _Available since v3.4._
 */
library Clones {
    /**
     * @dev A clone instance deployment failed.
     */
    error ERC1167FailedCreateClone();

    /**
     * @dev Deploys and returns the address of a clone that mimics the behaviour of `implementation`.
     *
     * This function uses the create opcode, which should never revert.
     */
    function clone(address implementation) internal returns (address instance) {
        /// @solidity memory-safe-assembly
        assembly {
            // Packs the first 1 byte of the `implementation` address with the bytecode before the address.
            mstore(0x00, or(byte(12, implementation), 0x3d602c80600a3d3981f33d3d3d3d363d3d37363d7300))
            // Packs the remaining 19 bytes of `implementation` with the bytecode after the address.
            mstore(0x20, or(shl(0x68, implementation), 0x5af43d3d93803e602a57fd5bf3))
            instance := create(0, 0x0a, 0x36)
        }
        if (instance == address(0)) {
            revert ERC1167FailedCreateClone();
        }
    }

    /**
     * @dev Deploys and returns the address of a clone that mimics the behaviour of `implementation`.
     *
     * This function uses the create2 opcode and a `salt` to deterministically deploy
     * the clone. Using the same `implementation` and `salt` multiple time will revert, since
     * the clones cannot be deployed twice at the same address.
     */
    function cloneDeterministic(address implementation, bytes32 salt) internal returns (address instance) {
        /// @solidity memory-safe-assembly
        assembly {
            // Packs the first 1 byte of the `implementation` address with the bytecode before the address.
            mstore(0x00, or(byte(12, implementation), 0x3d602c80600a3d3981f33d3d3d3d363d3d37363d7300))
            // Packs the remaining 19 bytes of `implementation` with the bytecode after the address.
            mstore(0x20, or(shl(0x68, implementation), 0x5af43d3d93803e602a57fd5bf3))
            instance := create2(0, 0x0a, 0x36, salt)
        }
        if (instance == address(0)) {
            revert ERC1167FailedCreateClone();
        }
    }

    /**
     * @dev Computes the address of a clone deployed using {Clones-cloneDeterministic}.
     */
    function predictDeterministicAddress(
        address implementation,
        bytes32 salt,
        address deployer
    ) internal pure returns (address predicted) {
        /// @solidity memory-safe-assembly
        assembly {
            let ptr := mload(0x40)
            mstore(add(ptr, 0x36), deployer)
            mstore(add(ptr, 0x22), 0x5af43d3d93803e602a57fd5bf3ff)
            mstore(add(ptr, 0x14), implementation)
            mstore(ptr, 0x3d602c80600a3d3981f33d3d3d3d363d3d37363d73)
            mstore(add(ptr, 0x56), salt)
            mstore(add(ptr, 0x76), keccak256(add(ptr, 0x0b), 0x36))
            predicted := keccak256(add(ptr, 0x41), 0x55)
        }
    }

    /**
     * @dev Computes the address of a clone deployed using {Clones-cloneDeterministic}.
     */
    function predictDeterministicAddress(
        address implementation,
        bytes32 salt
    ) internal view returns (address predicted) {
        return predictDeterministicAddress(implementation, salt, address(this));
    }
}
