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
        // deployment prefix: 3d602480600a3d3981f3
        // deployed bytecode: 6014360360145f375f5f601436035f345f3560601c5af13d5f5f3e5f3d91602257fd5bf3
        //
        // offset | bytecode | opcode         | stack
        // -------|----------|----------------|--------
        // 0x0000 | 6014     | push1 0x14     | 0x14
        // 0x0002 | 36       | calldatasize   | cds 0x14
        // 0x0003 | 03       | sub            | (cds-0x14)
        // 0x0004 | 6014     | push1 0x14     | 0x14 (cds-0x14)
        // 0x0006 | 5f       | push0          | 0 0x14 (cds-0x14)
        // 0x0007 | 37       | calldatacopy   |
        // 0x0008 | 5f       | push0          | 0
        // 0x0009 | 5f       | push0          | 0 0
        // 0x000a | 6014     | push1 0x14     | 0x14 0 0
        // 0x000c | 36       | calldatasize   | cds 0x14 0 0
        // 0x000d | 03       | sub            | (cds-0x14) 0 0
        // 0x000e | 5f       | push0          | 0 (cds-0x14) 0 0
        // 0x000f | 34       | callvalue      | value 0 (cds-0x14) 0 0
        // 0x0010 | 5f       | push0          | 0 value 0 (cds-0x14) 0 0
        // 0x0011 | 35       | calldataload   | cd[0] value 0 (cds-0x14) 0 0
        // 0x0012 | 6060     | push1 0x60     | 0x60 cd[0] value 0 (cds-0x14) 0 0
        // 0x0014 | 1c       | shr            | target value 0 (cds-0x14) 0 0
        // 0x0015 | 5a       | gas            | gas 0xbebe value 0 (cds-0x14) 0 0
        // 0x0016 | f1       | call           | suc
        // 0x0017 | 3d       | returndatasize | rds suc
        // 0x0018 | 5f       | push0          | 0 rds suc
        // 0x0019 | 5f       | push0          | 0 0 rds suc
        // 0x001a | 3e       | returndatacopy | suc
        // 0x001b | 5f       | push0          | 0 suc
        // 0x001c | 3d       | returndatasize | rds 0 suc
        // 0x001d | 91       | swap2          | suc 0 rds
        // 0x001e | 6022     | push1 0x22     | 0x22 suc 0 rds
        // 0x0020 | 57       | jumpi          | 0 rds
        // 0x0021 | fd       | revert         |
        // 0x0022 | 5b       | jumpdest       | 0 rds
        // 0x0023 | f3       | return         |
        assembly ("memory-safe") {
            mstore(0x0e, 0xf13d5f5f3e5f3d91602257fd5bf3)
            mstore(0x00, 0x3d602480600a3d3981f36014360360145f375f5f601436035f345f3560601c5a)
            addr := create2(0, 0, 0x2f, 0)
            if iszero(addr) {
                let ptr := mload(0x40)
                returndatacopy(ptr, 0, returndatasize())
                revert(ptr, returndatasize())
            }
        }
    }
}
