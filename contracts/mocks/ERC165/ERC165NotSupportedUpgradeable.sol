// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
import "../../proxy/utils/Initializable.sol";

contract ERC165NotSupportedUpgradeable is Initializable {    function __ERC165NotSupported_init() internal onlyInitializing {
        __ERC165NotSupported_init_unchained();
    }

    function __ERC165NotSupported_init_unchained() internal onlyInitializing {
    }
    uint256[50] private __gap;
}
