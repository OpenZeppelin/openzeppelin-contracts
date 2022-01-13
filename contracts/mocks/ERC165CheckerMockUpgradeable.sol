// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/introspection/ERC165CheckerUpgradeable.sol";
import "../proxy/utils/Initializable.sol";

contract ERC165CheckerMockUpgradeable is Initializable {
    function __ERC165CheckerMock_init() internal onlyInitializing {
        __ERC165CheckerMock_init_unchained();
    }

    function __ERC165CheckerMock_init_unchained() internal onlyInitializing {
    }
    using ERC165CheckerUpgradeable for address;

    function supportsERC165(address account) public view returns (bool) {
        return account.supportsERC165();
    }

    function supportsInterface(address account, bytes4 interfaceId) public view returns (bool) {
        return account.supportsInterface(interfaceId);
    }

    function supportsAllInterfaces(address account, bytes4[] memory interfaceIds) public view returns (bool) {
        return account.supportsAllInterfaces(interfaceIds);
    }

    function getSupportedInterfaces(address account, bytes4[] memory interfaceIds) public view returns (bool[] memory) {
        return account.getSupportedInterfaces(interfaceIds);
    }
    uint256[50] private __gap;
}
