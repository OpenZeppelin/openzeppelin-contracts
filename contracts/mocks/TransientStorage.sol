// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {Multicall} from "../utils/Multicall.sol";
import {TransientStorage} from "../utils/TransientStorage.sol";

contract TransientStorageMock is Multicall {
    event ValueAddress(bytes32 slot, address value);
    event ValueBool(bytes32 slot, bool value);
    event ValueBytes32(bytes32 slot, bytes32 value);
    event ValueUint256(bytes32 slot, uint256 value);

    function loadAddress(bytes32 slot) public {
        emit ValueAddress(slot, TransientStorage.loadAddress(slot));
    }

    function loadBool(bytes32 slot) public {
        emit ValueBool(slot, TransientStorage.loadBool(slot));
    }

    function loadBytes32(bytes32 slot) public {
        emit ValueBytes32(slot, TransientStorage.loadBytes32(slot));
    }

    function loadUint256(bytes32 slot) public {
        emit ValueUint256(slot, TransientStorage.loadUint256(slot));
    }

    function store(bytes32 slot, address value) public {
        TransientStorage.store(slot, value);
    }

    function store(bytes32 slot, bool value) public {
        TransientStorage.store(slot, value);
    }

    function store(bytes32 slot, bytes32 value) public {
        TransientStorage.store(slot, value);
    }

    function store(bytes32 slot, uint256 value) public {
        TransientStorage.store(slot, value);
    }
}
