// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (proxy/Clones.sol)

pragma solidity ^0.8.20;

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
            let ptr := mload(0x40)
            mstore(ptr, 0x3d602d80600a3d3981f3363d3d373d3d3d363d77000000000000000000000000)
            mstore(add(ptr, 0x14), shl(0x40, implementation))
            mstore(add(ptr, 0x2c), 0x5af43d82803e903d91602f57fd5bf30000000000000000000000000000000000)
            instance := create(0, ptr, 0x3b)
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
            let ptr := mload(0x40)
            mstore(ptr, 0x3d603180600a3d3981f3363d3d373d3d3d363d77000000000000000000000000)
            mstore(add(ptr, 0x14), shl(0x40, implementation))
            mstore(add(ptr, 0x2c), 0x5af43d82803e903d91602f57fd5bf30000000000000000000000000000000000)
            instance := create2(0, ptr, 0x3b, salt)
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
            mstore(ptr, 0x3d603180600a3d3981f3363d3d373d3d3d363d77000000000000000000000000) 
            mstore(add(ptr, 0x14), shl(0x40, implementation))                               
            mstore(add(ptr, 0x2c), 0x5af43d82803e903d91602f57fd5bf3ff00000000000000000000000000000000) 
            mstore(add(ptr, 0x3c), shl(0x40, deployer)) 
            mstore(add(ptr, 0x54), salt)               
            mstore(add(ptr, 0x74), keccak256(ptr, 0x3b)) 
            predicted := or(and(keccak256(add(ptr, 0x3b), 0x59), 0x00000000000000000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF), 0x0000000000000000656600000000000000000000000000000000000000000000)
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
