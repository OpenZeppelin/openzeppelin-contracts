// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Address} from "./Address.sol";

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
 * This contract provides a `_relayedCall` that can be used to perform dangerous calls. These calls are relayed
 * through a minimal relayer. This relayer is deployed at construction and its address is stored in immutable storage.
 */
abstract contract RelayedCall {
    /// @custom:oz-upgrades-unsafe-allow state-variable-immutable
    /// TODO: should be internal, but hardhat-exposed doesn't expose that correctly in 0.3.19
    address public immutable _relayer = _deployRelayer();

    function _relayedCallStrict(address target, bytes memory data) internal returns (bytes memory) {
        return _relayedCallStrict(target, 0, data);
    }

    function _relayedCallStrict(address target, uint256 value, bytes memory data) internal returns (bytes memory) {
        (bool success, bytes memory returndata) = _relayedCall(target, value, data);
        return Address.verifyCallResult(success, returndata);
    }

    function _relayedCall(address target, bytes memory data) internal returns (bool, bytes memory) {
        return _relayedCall(target, 0, data);
    }

    function _relayedCall(address target, uint256 value, bytes memory data) internal returns (bool, bytes memory) {
        return _relayer.call{value: value}(abi.encodePacked(target, data));
    }

    function _deployRelayer() private returns (address addr) {
        // deployment prefix: 3d602f80600a3d3981f3
        // deployed bytecode: 60133611600a575f5ffd5b6014360360145f375f5f601436035f345f3560601c5af13d5f5f3e5f3d91602d57fd5bf3
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
        assembly ("memory-safe") {
            mstore(0x19, 0x1436035f345f3560601c5af13d5f5f3e5f3d91602d57fd5bf3)
            mstore(0x00, 0x3d602f80600a3d3981f360133611600a575f5ffd5b6014360360145f375f5f60)
            addr := create2(0, 0, 0x39, 0)
            if iszero(addr) {
                let ptr := mload(0x40)
                returndatacopy(ptr, 0, returndatasize())
                revert(ptr, returndatasize())
            }
        }
    }
}
