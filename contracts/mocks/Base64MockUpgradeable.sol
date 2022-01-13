// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/Base64Upgradeable.sol";
import "../proxy/utils/Initializable.sol";

contract Base64MockUpgradeable is Initializable {
    function __Base64Mock_init() internal onlyInitializing {
        __Base64Mock_init_unchained();
    }

    function __Base64Mock_init_unchained() internal onlyInitializing {
    }
    function encode(bytes memory value) external pure returns (string memory) {
        return Base64Upgradeable.encode(value);
    }
    uint256[50] private __gap;
}
