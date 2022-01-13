// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/structs/BitMapsUpgradeable.sol";
import "../proxy/utils/Initializable.sol";

contract BitMapMockUpgradeable is Initializable {
    function __BitMapMock_init() internal onlyInitializing {
        __BitMapMock_init_unchained();
    }

    function __BitMapMock_init_unchained() internal onlyInitializing {
    }
    using BitMapsUpgradeable for BitMapsUpgradeable.BitMap;

    BitMapsUpgradeable.BitMap private _bitmap;

    function get(uint256 index) public view returns (bool) {
        return _bitmap.get(index);
    }

    function setTo(uint256 index, bool value) public {
        _bitmap.setTo(index, value);
    }

    function set(uint256 index) public {
        _bitmap.set(index);
    }

    function unset(uint256 index) public {
        _bitmap.unset(index);
    }
    uint256[49] private __gap;
}
