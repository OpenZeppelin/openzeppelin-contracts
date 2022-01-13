// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
import "../../proxy/utils/Initializable.sol";

contract ERC165MissingDataUpgradeable is Initializable {
    function __ERC165MissingData_init() internal onlyInitializing {
        __ERC165MissingData_init_unchained();
    }

    function __ERC165MissingData_init_unchained() internal onlyInitializing {
    }
    function supportsInterface(bytes4 interfaceId) public view {} // missing return
    uint256[50] private __gap;
}
