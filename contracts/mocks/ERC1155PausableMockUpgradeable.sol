// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./ERC1155MockUpgradeable.sol";
import "../token/ERC1155/extensions/ERC1155PausableUpgradeable.sol";
import "../proxy/utils/Initializable.sol";

contract ERC1155PausableMockUpgradeable is Initializable, ERC1155MockUpgradeable, ERC1155PausableUpgradeable {
    function __ERC1155PausableMock_init(string memory uri) internal onlyInitializing {
        __ERC1155_init_unchained(uri);
        __ERC1155Mock_init_unchained(uri);
        __Pausable_init_unchained();
    }

    function __ERC1155PausableMock_init_unchained(string memory) internal onlyInitializing {}

    function pause() external {
        _pause();
    }

    function unpause() external {
        _unpause();
    }

    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual override(ERC1155Upgradeable, ERC1155PausableUpgradeable) {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[50] private __gap;
}
