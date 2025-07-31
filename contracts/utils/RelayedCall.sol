// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

/**
 * @dev Library for performing external calls through dynamically deployed relay contracts that hide the original
 * caller's address.
 *
 * Some contracts need to make arbitrary external calls controlled by user input. When these contracts have special
 * permissions or hold valuable assets, making such calls directly can be risky because the target contract sees
 * the privileged contract as `msg.sender`. Using a relay contract isolates the original caller by changing the
 * `msg.sender` of the outgoing call to an unprivileged relay address.
 *
 * For example, this pattern is used in ERC-4337's EntryPoint which relies on a "senderCreator" helper
 * for account factory calls, and ERC-6942 for safe factory interactions.
 *
 * The library dynamically deploys minimal relay contracts using CREATE2 and routes calls through them, ensuring
 * that target contracts only see the relay (not the original caller) as msg.sender.
 */
library RelayedCall {
    function relayCall(address target, bytes memory data) internal returns (bool, bytes memory) {
        return relayCall(target, 0, data);
    }

    function relayCall(address target, uint256 value, bytes memory data) internal returns (bool, bytes memory) {
        return relayCall(target, value, data, bytes32(0));
    }

    function relayCall(address target, bytes memory data, bytes32 salt) internal returns (bool, bytes memory) {
        return relayCall(target, 0, data, salt);
    }

    function relayCall(
        address target,
        uint256 value,
        bytes memory data,
        bytes32 salt
    ) internal returns (bool, bytes memory) {
        return getRelayer(salt).call{value: value}(abi.encodePacked(target, data));
    }

    function getRelayer() internal returns (address) {
        return getRelayer(bytes32(0));
    }

    function getRelayer(bytes32 salt) internal returns (address relayer) {
        // [Relayer details]
        //
        // deployment prefix: 60475f8160095f39f3
        // deployed bytecode: 73<addr>331460133611166022575f5ffd5b6014360360145f375f5f601436035f345f3560601c5af13d5f5f3e5f3d91604557fd5bf3
        //
        // offset | bytecode    | opcode         | stack
        // -------|-------------|----------------|--------
        // 0x0000 | 73<factory> | push20 <addr>  | <factory>
        // 0x0015 | 33          | address        | <caller> <factory>
        // 0x0016 | 14          | eq             | access
        // 0x0017 | 6013        | push1 0x13     | 0x13 access
        // 0x0019 | 36          | calldatasize   | cds 0x13 access
        // 0x001a | 11          | gt             | (cds>0x13) access
        // 0x001b | 16          | and            | (cds>0x13 && access)
        // 0x001c | 6022        | push1 0x22     | 0x22 (cds>0x13 && access)
        // 0x001e | 57          | jumpi          |
        // 0x001f | 5f          | push0          | 0
        // 0x0020 | 5f          | push0          | 0 0
        // 0x0021 | fd          | revert         |
        // 0x0022 | 5b          | jumpdest       |
        // 0x0023 | 6014        | push1 0x14     | 0x14
        // 0x0025 | 36          | calldatasize   | cds 0x14
        // 0x0026 | 03          | sub            | (cds-0x14)
        // 0x0027 | 6014        | push1 0x14     | 0x14 (cds-0x14)
        // 0x0029 | 5f          | push0          | 0 0x14 (cds-0x14)
        // 0x002a | 37          | calldatacopy   |
        // 0x002b | 5f          | push0          | 0
        // 0x002c | 5f          | push0          | 0 0
        // 0x002d | 6014        | push1 0x14     | 0x14 0 0
        // 0x002f | 36          | calldatasize   | cds 0x14 0 0
        // 0x0030 | 03          | sub            | (cds-0x14) 0 0
        // 0x0031 | 5f          | push0          | 0 (cds-0x14) 0 0
        // 0x0032 | 34          | callvalue      | value 0 (cds-0x14) 0 0
        // 0x0033 | 5f          | push0          | 0 value 0 (cds-0x14) 0 0
        // 0x0034 | 35          | calldataload   | cd[0] value 0 (cds-0x14) 0 0
        // 0x0035 | 6060        | push1 0x60     | 0x60 cd[0] value 0 (cds-0x14) 0 0
        // 0x0037 | 1c          | shr            | target value 0 (cds-0x14) 0 0
        // 0x0038 | 5a          | gas            | gas target value 0 (cds-0x14) 0 0
        // 0x0039 | f1          | call           | suc
        // 0x003a | 3d          | returndatasize | rds suc
        // 0x003b | 5f          | push0          | 0 rds suc
        // 0x003c | 5f          | push0          | 0 0 rds suc
        // 0x003d | 3e          | returndatacopy | suc
        // 0x003e | 5f          | push0          | 0 suc
        // 0x003f | 3d          | returndatasize | rds 0 suc
        // 0x0040 | 91          | swap2          | suc 0 rds
        // 0x0041 | 6045        | push1 0x45     | 0x45 suc 0 rds
        // 0x0043 | 57          | jumpi          | 0 rds
        // 0x0044 | fd          | revert         |
        // 0x0045 | 5b          | jumpdest       | 0 rds
        // 0x0046 | f3          | return         |

        assembly ("memory-safe") {
            let fmp := mload(0x40)

            // build initcode at FMP
            mstore(add(fmp, 0x46), 0x60145f375f5f601436035f345f3560601c5af13d5f5f3e5f3d91604557fd5bf3)
            mstore(add(fmp, 0x26), 0x331460133611166022575f5ffd5b60143603)
            mstore(add(fmp, 0x14), address())
            mstore(add(fmp, 0), 0x60475f8160095f39f373)
            let initcodehash := keccak256(add(fmp, 0x16), 0x50)

            // compute create2 address
            mstore(0x40, initcodehash)
            mstore(0x20, salt)
            mstore(0x00, address())
            mstore8(0x0b, 0xff)
            relayer := and(keccak256(0x0b, 0x55), shr(96, not(0)))

            // is relayer not yet deployed, deploy it
            if iszero(extcodesize(relayer)) {
                if iszero(create2(0, add(fmp, 0x16), 0x50, salt)) {
                    returndatacopy(fmp, 0, returndatasize())
                    revert(fmp, returndatasize())
                }
            }

            // cleanup fmp space used as scratch
            mstore(0x40, fmp)
        }
    }
}
