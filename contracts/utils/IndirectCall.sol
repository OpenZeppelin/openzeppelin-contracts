// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Address} from "./Address.sol";
import {Create2} from "./Create2.sol";

/**
 * @dev Helper contract for performing potentially dangerous calls through a relay the hide the address of the
 * original sender.
 *
 * Some contract are required to perform arbitrary action controlled by user input. This is dangerous if the contract
 * has special permissions, or holds assets. In such cases, using a relay contract can be useful to change the
 * msg.sender of the outgoing call. This pattern is used in the ERC-4337 entrypoint that relies on a helper called the
 * "senderCreator" when calling account factories. Similarly ERC-6942 does factory calls that could be dangerous if
 * performed directly.
 *
 * This contract provides a `indirectCall` that can be used to perform dangerous calls. These calls are indirect
 * through a minimal relayer.
 */
library IndirectCall {
    function indirectCall(address target, bytes memory data) internal returns (bool, bytes memory) {
        return indirectCall(target, 0, data);
    }

    function indirectCall(address target, uint256 value, bytes memory data) internal returns (bool, bytes memory) {
        return getRelayer(bytes32(0)).call{value: value}(abi.encodePacked(target, data));
    }

    function getRelayer() internal returns (address) {
        return getRelayer(bytes32(0));
    }

    function indirectCall(address target, bytes memory data, bytes32 salt) internal returns (bool, bytes memory) {
        return indirectCall(target, 0, data, salt);
    }

    function indirectCall(
        address target,
        uint256 value,
        bytes memory data,
        bytes32 salt
    ) internal returns (bool, bytes memory) {
        return getRelayer(salt).call{value: value}(abi.encodePacked(target, data));
    }

    function getRelayer(bytes32 salt) internal returns (address) {
        // [Relayer details]
        //
        // deployment prefix: 3d602f80600a3d3981f3
        // deployed bytecode: 60133611600a575f5ffd5b6014360360145f375f5f601436035f345f3560601c5af13d5f5f3e5f3d91602d57fd5bf3
        // bytecode hash: 7bc0ea09c689dc0a6de3865d8789dae51a081efcf6569589ddae4b677df5dd3f
        //
        // offset | bytecode | opcode         | stack
        // -------|----------|----------------|--------
        // 0x0000 | 6013     | push1 0x13     | 0x13
        // 0x0002 | 36       | calldatasize   | cds 0x13
        // 0x0003 | 11       | gt             | (cds>0x13)
        // 0x0004 | 600a     | push1 0x0a     | 0x0a (cds>0x13)
        // 0x0006 | 57       | jumpi          | 0x0a (cds>0x13)
        // 0x0007 | 5f       | push0          | 0
        // 0x0008 | 5f       | push0          | 0 0
        // 0x0009 | fd       | revert         |
        // 0x000a | 5b       | jumpdest       |
        // 0x000b | 6014     | push1 0x14     | 0x14
        // 0x000d | 36       | calldatasize   | cds 0x14
        // 0x000e | 03       | sub            | (cds-0x14)
        // 0x000f | 6014     | push1 0x14     | 0x14 (cds-0x14)
        // 0x0011 | 5f       | push0          | 0 0x14 (cds-0x14)
        // 0x0012 | 37       | calldatacopy   |
        // 0x0013 | 5f       | push0          | 0
        // 0x0014 | 5f       | push0          | 0 0
        // 0x0015 | 6014     | push1 0x14     | 0x14 0 0
        // 0x0017 | 36       | calldatasize   | cds 0x14 0 0
        // 0x0018 | 03       | sub            | (cds-0x14) 0 0
        // 0x0019 | 5f       | push0          | 0 (cds-0x14) 0 0
        // 0x001a | 34       | callvalue      | value 0 (cds-0x14) 0 0
        // 0x001b | 5f       | push0          | 0 value 0 (cds-0x14) 0 0
        // 0x001c | 35       | calldataload   | cd[0] value 0 (cds-0x14) 0 0
        // 0x001d | 6060     | push1 0x60     | 0x60 cd[0] value 0 (cds-0x14) 0 0
        // 0x001f | 1c       | shr            | target value 0 (cds-0x14) 0 0
        // 0x0020 | 5a       | gas            | gas target value 0 (cds-0x14) 0 0
        // 0x0021 | f1       | call           | suc
        // 0x0022 | 3d       | returndatasize | rds suc
        // 0x0023 | 5f       | push0          | 0 rds suc
        // 0x0024 | 5f       | push0          | 0 0 rds suc
        // 0x0025 | 3e       | returndatacopy | suc
        // 0x0026 | 5f       | push0          | 0 suc
        // 0x0027 | 3d       | returndatasize | rds 0 suc
        // 0x0028 | 91       | swap2          | suc 0 rds
        // 0x0029 | 602d     | push1 0x2d     | 0x2d suc 0 rds
        // 0x002b | 57       | jumpi          | 0 rds
        // 0x002c | fd       | revert         |
        // 0x002d | 5b       | jumpdest       | 0 rds
        // 0x002e | f3       | return         |

        // Create2 address computation, and deploy it if not yet available
        address relayer = Create2.computeAddress(
            salt,
            0x7bc0ea09c689dc0a6de3865d8789dae51a081efcf6569589ddae4b677df5dd3f
        );
        if (relayer.code.length == 0) {
            assembly ("memory-safe") {
                mstore(0x19, 0x1436035f345f3560601c5af13d5f5f3e5f3d91602d57fd5bf3)
                mstore(0x00, 0x3d602f80600a3d3981f360133611600a575f5ffd5b6014360360145f375f5f60)
                if iszero(create2(0, 0, 0x39, salt)) {
                    returndatacopy(0, 0, returndatasize())
                    revert(0, returndatasize())
                }
            }
        }
        return relayer;
    }
}
