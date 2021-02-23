// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

library UUPS {
    // bytes32 private constant _UUPS_SLOT = keccak256("PROXIABLE");
    bytes32 private constant _UUPS_SLOT = 0xc5f16f0fcc639fa48a6947836d9850f504798523bf8c9a3a87d5876cf622bcf7;

    struct UUPSStore {
        address implementation;
    }

    function instance() internal pure returns (UUPSStore storage uups) {
        bytes32 position = _UUPS_SLOT;
        assembly {
            uups.slot := position
        }
    }

    function uuid() internal pure returns (bytes32) {
        return _UUPS_SLOT;
    }
}
