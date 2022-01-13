// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/ERC1155/extensions/ERC1155BurnableUpgradeable.sol";
import "../proxy/utils/Initializable.sol";

contract ERC1155BurnableMockUpgradeable is Initializable, ERC1155BurnableUpgradeable {
    function __ERC1155BurnableMock_init(string memory uri) internal onlyInitializing {
        __Context_init_unchained();
        __ERC165_init_unchained();
        __ERC1155_init_unchained(uri);
        __ERC1155Burnable_init_unchained();
        __ERC1155BurnableMock_init_unchained(uri);
    }

    function __ERC1155BurnableMock_init_unchained(string memory) internal onlyInitializing {}

    function mint(
        address to,
        uint256 id,
        uint256 value,
        bytes memory data
    ) public {
        _mint(to, id, value, data);
    }
    uint256[50] private __gap;
}
