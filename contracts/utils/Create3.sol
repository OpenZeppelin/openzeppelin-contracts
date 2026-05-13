// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Create2} from "./Create2.sol";
import {Errors} from "./Errors.sol";
import {LowLevelCall} from "./LowLevelCall.sol";

/**
 * @dev Helper to deploy contracts using the `CREATE3` approach.
 * `CREATE3` combines both `CREATE2` and `CREATE` opcodes to deploy arbitrary bytecode at an address that only depends
 * on the provided salt and the address of the contract using this library. At a high level, it behaves like a `CREATE2`
 * operation that would not use the bytecodehash to generate the contract address.
 *
 * CREATE3 can be used to compute in advance the address where a smart contract will be deployed, even if the bytecode
 * is subject to change.
 *
 * NOTE: To get the same deployment address on multiple chains, the deployer contract must live at the same address on
 * each chain.
 *
 * See {Create2} for counterfactual deployments that include the bytecodehash in the computation of the address.
 */
library Create3 {
    /**
     * ===================================[ PROXY CODE ]===================================
     * Offset | Opcode      | Mnemonic         | Stack           | Memory
     * -------|-------------|------------------|-----------------|-------------------------
     * 0x00   | 36          | CALLDATASIZE     | cds             |
     * 0x01   | 5F          | PUSH0            | 0 cds           |
     * 0x02   | 5F          | PUSH0            | 0 0 cds         |
     * 0x03   | 37          | CALLDATACOPY     |                 | [0..cds): calldata
     * 0x04   | 36          | CALLDATASIZE     | cds             | [0..cds): calldata
     * 0x05   | 5F          | PUSH0            | 0 cds           | [0..cds): calldata
     * 0x06   | 34          | CALLVALUE        | value 0 cds     | [0..cds): calldata
     * 0x07   | f0          | CREATE           | addr            | [0..cds): calldata
     * 0x08   | 3D          | RETURNDATASIZE   | rds addr        |
     * 0x09   | 5F          | PUSH0            | 0 rds addr      |
     * 0x0A   | 5F          | PUSH0            | 0 0 rds addr    |
     * 0x0B   | 3E          | RETURNDATACOPY   | addr            | [0..rds): returndata
     * 0x0C   | 5F          | PUSH0            | 0 addr          | [0..rds): returndata
     * 0x0D   | 3D          | RETURNDATASIZE   | rds 0 addr      | [0..rds): returndata
     * 0x0E   | 91          | SWAP2            | addr 0 rds      | [0..rds): returndata
     * 0x0F   | 6013        | PUSH1 0x13       | 0x13 addr 0 rds | [0..rds): returndata
     * 0x11   | 57          | JUMPI            | 0 rds           | [0..rds): returndata
     * 0x12   | FD          | REVERT           |                 |
     * 0x13   | 5b          | JUMPDEST         | 0 rds           | [0..rds): returndata
     * 0x14   | f3          | RETURN           |                 |
     *
     * ================================[ DEPLOYMENT CODE ]=================================
     * Offset | Opcode      | Mnemonic         | Stack           | Memory
     * -------|-------------|------------------|-----------------|-------------------------
     * 0x00   | 74 bytecode | PUSH21 bytecode  | bytecode        |
     * 0x16   | 5F          | PUSH0            | 0 bytecode      |
     * 0x17   | 52          | MSTORE           |                 | [0x0B..0x20): bytecode
     * 0x18   | 6015        | PUSH1 0x15       | 0x15            | [0x0B..0x20): bytecode
     * 0x1A   | 600B        | PUSH1 0x0B       | 0x0B 0x15       | [0x0B..0x20): bytecode
     * 0x1C   | f3          | RETURN           |                 | [0x0B..0x20): bytecode
     */

    /// @dev The proxy initialization code.
    bytes29 private constant PROXY_INITCODE = 0x74365F5F37365F34f03D5F5F3E5F3D91601357FD5bf35F526015600Bf3;

    /// @dev Hash of the `PROXY_INITCODE`.
    /// Equivalent to `keccak256(hex"74365F5F37365F34f03D5F5F3E5F3D91601357FD5bf35F526015600Bf3")`.
    bytes32 internal constant PROXY_INITCODE_HASH = 0xd61bbde0460e6c48ddd99fb8b7e1ad36529d2ec79cbac1db0300b3d26ddcdc2a;

    /**
     * @dev There's no code to deploy.
     */
    error Create3EmptyBytecode();

    /**
     * @dev Deploys a contract using the `CREATE3` mechanism. The address where the contract
     * will be deployed can be known in advance via {computeAddress}, and only depends on the salt.
     * The bytecode that is deployed DOES NOT affect the location at which it is deployed.
     *
     * The bytecode for a contract can be obtained from Solidity with
     * `type(contractName).creationCode`.
     *
     * Requirements:
     *
     * - `bytecode` must not be empty.
     * - `salt` must not have been used already.
     * - the factory must have a balance of at least `amount`.
     * - if `amount` is non-zero, `bytecode` must have a `payable` constructor.
     */
    function deploy(uint256 amount, bytes32 salt, bytes memory bytecode) internal returns (address) {
        if (address(this).balance < amount) {
            revert Errors.InsufficientBalance(address(this).balance, amount);
        }
        if (bytecode.length == 0) {
            revert Create3EmptyBytecode();
        }
        // This fails if the salt was already used. Will never return address(0).
        address proxy = Create2.deploy(0, salt, abi.encodePacked(PROXY_INITCODE));
        // Perform the actual deployment (create on the proxy with nonce 1).
        bool success = LowLevelCall.callNoReturn(proxy, amount, bytecode);
        if (!success) {
            if (LowLevelCall.returnDataSize() == 0) {
                revert Errors.FailedDeployment();
            } else {
                LowLevelCall.bubbleRevert();
            }
        }

        return _computeCreateAddress(proxy);
    }

    /**
     * @dev Returns the address where a contract will be stored if deployed via {deploy}. Any change in the
     * `salt` will result in a new destination address.
     */
    function computeAddress(bytes32 salt) internal view returns (address) {
        return computeAddress(salt, address(this));
    }

    /**
     * @dev Returns the address where a contract will be stored if deployed via {deploy} from a contract located at
     * `deployer`. If `deployer` is this contract's address, returns the same value as {computeAddress}.
     */
    function computeAddress(bytes32 salt, address deployer) internal pure returns (address) {
        return _computeCreateAddress(Create2.computeAddress(salt, PROXY_INITCODE_HASH, deployer));
    }

    /// @dev Compute the address of the first contract that `creator` would deployed using CREATE (nonce 1).
    function _computeCreateAddress(address creator) private pure returns (address addr) {
        assembly ("memory-safe") {
            mstore(0x15, 0x01)
            mstore(0x14, creator)
            mstore(0x00, 0xd694)
            addr := and(keccak256(0x1e, 0x17), 0xffffffffffffffffffffffffffffffffffffffff)
        }
    }
}
