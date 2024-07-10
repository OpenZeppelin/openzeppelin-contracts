// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (proxy/Clones.sol)

pragma solidity ^0.8.20;

import {Errors} from "../utils/Errors.sol";

/**
 * @dev https://eips.ethereum.org/EIPS/eip-1167[ERC-1167] is a standard for
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
    error ImmutableArgsTooLarge();

    /**
     * @dev Deploys and returns the address of a clone that mimics the behaviour of `implementation`.
     *
     * This function uses the create opcode, which should never revert.
     */
    function clone(address implementation) internal returns (address instance) {
        return clone(implementation, 0);
    }

    /**
     * @dev Same as {xref-Clones-clone-address-}[clone], but with a `value` parameter to send native currency
     * to the new contract.
     *
     * NOTE: Using a non-zero value at creation will require the contract using this function (e.g. a factory)
     * to always have enough balance for new deployments. Consider exposing this function under a payable method.
     */
    function clone(address implementation, uint256 value) internal returns (address instance) {
        if (address(this).balance < value) {
            revert Errors.InsufficientBalance(address(this).balance, value);
        }
        /// @solidity memory-safe-assembly
        assembly {
            // Cleans the upper 96 bits of the `implementation` word, then packs the first 3 bytes
            // of the `implementation` address with the bytecode before the address.
            mstore(0x00, or(shr(0xe8, shl(0x60, implementation)), 0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000))
            // Packs the remaining 17 bytes of `implementation` with the bytecode after the address.
            mstore(0x20, or(shl(0x78, implementation), 0x5af43d82803e903d91602b57fd5bf3))
            instance := create(value, 0x09, 0x37)
        }
        if (instance == address(0)) {
            revert Errors.FailedDeployment();
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
        return cloneDeterministic(implementation, salt, 0);
    }

    /**
     * @dev Same as {xref-Clones-cloneDeterministic-address-bytes32-}[cloneDeterministic], but with
     * a `value` parameter to send native currency to the new contract.
     *
     * NOTE: Using a non-zero value at creation will require the contract using this function (e.g. a factory)
     * to always have enough balance for new deployments. Consider exposing this function under a payable method.
     */
    function cloneDeterministic(
        address implementation,
        bytes32 salt,
        uint256 value
    ) internal returns (address instance) {
        if (address(this).balance < value) {
            revert Errors.InsufficientBalance(address(this).balance, value);
        }
        /// @solidity memory-safe-assembly
        assembly {
            // Cleans the upper 96 bits of the `implementation` word, then packs the first 3 bytes
            // of the `implementation` address with the bytecode before the address.
            mstore(0x00, or(shr(0xe8, shl(0x60, implementation)), 0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000))
            // Packs the remaining 17 bytes of `implementation` with the bytecode after the address.
            mstore(0x20, or(shl(0x78, implementation), 0x5af43d82803e903d91602b57fd5bf3))
            instance := create2(value, 0x09, 0x37, salt)
        }
        if (instance == address(0)) {
            revert Errors.FailedDeployment();
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
            mstore(add(ptr, 0x38), deployer)
            mstore(add(ptr, 0x24), 0x5af43d82803e903d91602b57fd5bf3ff)
            mstore(add(ptr, 0x14), implementation)
            mstore(ptr, 0x3d602d80600a3d3981f3363d3d373d3d3d363d73)
            mstore(add(ptr, 0x58), salt)
            mstore(add(ptr, 0x78), keccak256(add(ptr, 0x0c), 0x37))
            predicted := and(keccak256(add(ptr, 0x43), 0x55), 0xffffffffffffffffffffffffffffffffffffffff)
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

    function cloneWithImmutableArgs(address implementation, bytes memory args) internal returns (address instance) {
        return cloneWithImmutableArgs(implementation, args, 0);
    }

    function cloneWithImmutableArgs(
        address implementation,
        bytes memory args,
        uint256 value
    ) internal returns (address instance) {
        if (address(this).balance < value) {
            revert Errors.InsufficientBalance(address(this).balance, value);
        }

        uint256 extraLength = args.length;
        uint256 codeLength = 0x2d + extraLength;
        uint256 initLength = 0x38 + extraLength;
        if (codeLength > 0xffff) revert ImmutableArgsTooLarge();

        /// @solidity memory-safe-assembly
        assembly {
            // [ptr + 0x43] ......................................................................................................................................<ARGS> // args
            // [ptr + 0x23] ......................................................................00000000000000000000000000000000005af43d82803e903d91602b57fd5bf3...... // suffix
            // [ptr + 0x14] ........................................000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.................................... // implementation
            // [ptr + 0x00] 00000000000000000000003d61000080600a3d3981f3363d3d373d3d3d363d73............................................................................ // prefix
            // [ptr + 0x0d] ..........................XX................................................................................................................ // length (part 1)
            // [ptr + 0x0e] ............................XX.............................................................................................................. // length (part 2)
            let ptr := mload(0x40)
            mcopy(add(ptr, 0x43), add(args, 0x20), extraLength)
            mstore(add(ptr, 0x23), 0x5af43d82803e903d91602b57fd5bf3)
            mstore(add(ptr, 0x14), implementation)
            mstore(add(ptr, 0x00), 0x3d61000080600b3d3981f3363d3d373d3d3d363d73)
            mstore8(add(ptr, 0x0d), shr(8, codeLength))
            mstore8(add(ptr, 0x0e), shr(0, codeLength))
            instance := create(value, add(ptr, 0x0b), initLength)
        }

        if (instance == address(0)) {
            revert Errors.FailedDeployment();
        }
    }

    function cloneWithImmutableArgsDeterministic(
        address implementation,
        bytes memory args,
        bytes32 salt
    ) internal returns (address instance) {
        return cloneWithImmutableArgsDeterministic(implementation, args, salt, 0);
    }

    function cloneWithImmutableArgsDeterministic(
        address implementation,
        bytes memory args,
        bytes32 salt,
        uint256 value
    ) internal returns (address instance) {
        if (address(this).balance < value) {
            revert Errors.InsufficientBalance(address(this).balance, value);
        }

        uint256 extraLength = args.length;
        uint256 codeLength = 0x2d + extraLength;
        uint256 initLength = 0x38 + extraLength;
        if (codeLength > 0xffff) revert ImmutableArgsTooLarge();

        /// @solidity memory-safe-assembly
        assembly {
            // [ptr + 0x43] ......................................................................................................................................<ARGS> // args
            // [ptr + 0x23] ......................................................................00000000000000000000000000000000005af43d82803e903d91602b57fd5bf3...... // suffix
            // [ptr + 0x14] ........................................000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.................................... // implementation
            // [ptr + 0x00] 00000000000000000000003d61000080600a3d3981f3363d3d373d3d3d363d73............................................................................ // prefix
            // [ptr + 0x0d] ..........................XX................................................................................................................ // length (part 1)
            // [ptr + 0x0e] ............................XX.............................................................................................................. // length (part 2)
            let ptr := mload(0x40)
            mcopy(add(ptr, 0x43), add(args, 0x20), extraLength)
            mstore(add(ptr, 0x23), 0x5af43d82803e903d91602b57fd5bf3)
            mstore(add(ptr, 0x14), implementation)
            mstore(add(ptr, 0x00), 0x3d61000080600b3d3981f3363d3d373d3d3d363d73)
            mstore8(add(ptr, 0x0d), shr(8, codeLength))
            mstore8(add(ptr, 0x0e), shr(0, codeLength))
            instance := create2(value, add(ptr, 0x0b), initLength, salt)
        }
        if (instance == address(0)) {
            revert Errors.FailedDeployment();
        }
    }

    function predictWithImmutableArgsDeterministicAddress(
        address implementation,
        bytes memory args,
        bytes32 salt,
        address deployer
    ) internal pure returns (address predicted) {
        uint256 extraLength = args.length;
        uint256 codeLength = 0x2d + extraLength;
        uint256 initLength = 0x38 + extraLength;
        if (codeLength > 0xffff) revert ImmutableArgsTooLarge();

        /// @solidity memory-safe-assembly
        assembly {
            let ptr := mload(0x40)
            mstore(add(ptr, add(0x58, extraLength)), salt)
            mstore(add(ptr, add(0x38, extraLength)), deployer)
            mstore8(add(ptr, add(0x43, extraLength)), 0xff)
            mcopy(add(ptr, 0x43), add(args, 0x20), extraLength)
            mstore(add(ptr, 0x23), 0x5af43d82803e903d91602b57fd5bf3)
            mstore(add(ptr, 0x14), implementation)
            mstore(add(ptr, 0x00), 0x3d61000080600b3d3981f3363d3d373d3d3d363d73)
            mstore8(add(ptr, 0x0d), shr(8, codeLength))
            mstore8(add(ptr, 0x0e), shr(0, codeLength))
            mstore(add(ptr, add(0x78, extraLength)), keccak256(add(ptr, 0x0b), initLength))
            predicted := and(
                keccak256(add(ptr, add(0x43, extraLength)), 0x55),
                0xffffffffffffffffffffffffffffffffffffffff
            )
        }
    }

    function predictWithImmutableArgsDeterministicAddress(
        address implementation,
        bytes memory args,
        bytes32 salt
    ) internal view returns (address predicted) {
        return predictWithImmutableArgsDeterministicAddress(implementation, args, salt, address(this));
    }

    function fetchCloneArgs(address instance) internal view returns (bytes memory result) {
        uint256 argsLength = instance.code.length - 0x2d; // revert if length is too short
        assembly {
            // reserve space
            result := mload(0x40)
            mstore(0x40, add(result, add(0x20, argsLength)))
            // load
            mstore(result, argsLength)
            extcodecopy(instance, add(result, 0x20), 0x2d, argsLength)
        }
    }
}
