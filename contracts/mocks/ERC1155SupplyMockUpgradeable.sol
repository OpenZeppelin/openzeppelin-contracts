// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./ERC1155MockUpgradeable.sol";
import "../token/ERC1155/extensions/ERC1155SupplyUpgradeable.sol";
import "../proxy/utils/Initializable.sol";

contract ERC1155SupplyMockUpgradeable is Initializable, ERC1155MockUpgradeable, ERC1155SupplyUpgradeable {
    function __ERC1155SupplyMock_init(string memory uri) internal onlyInitializing {
        __ERC1155_init_unchained(uri);
        __ERC1155Mock_init_unchained(uri);
    }

    function __ERC1155SupplyMock_init_unchained(string memory) internal onlyInitializing {}

    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual override(ERC1155Upgradeable, ERC1155SupplyUpgradeable) {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[50] private __gap;
}
