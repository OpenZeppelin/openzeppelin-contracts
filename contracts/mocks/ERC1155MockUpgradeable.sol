// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/ERC1155/ERC1155Upgradeable.sol";
import "../proxy/utils/Initializable.sol";

/**
 * @title ERC1155Mock
 * This mock just publicizes internal functions for testing purposes
 */
contract ERC1155MockUpgradeable is Initializable, ERC1155Upgradeable {
    function __ERC1155Mock_init(string memory uri) internal onlyInitializing {
        __ERC1155_init_unchained(uri);
    }

    function __ERC1155Mock_init_unchained(string memory) internal onlyInitializing {}

    function setURI(string memory newuri) public {
        _setURI(newuri);
    }

    function mint(
        address to,
        uint256 id,
        uint256 value,
        bytes memory data
    ) public {
        _mint(to, id, value, data);
    }

    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory values,
        bytes memory data
    ) public {
        _mintBatch(to, ids, values, data);
    }

    function burn(
        address owner,
        uint256 id,
        uint256 value
    ) public {
        _burn(owner, id, value);
    }

    function burnBatch(
        address owner,
        uint256[] memory ids,
        uint256[] memory values
    ) public {
        _burnBatch(owner, ids, values);
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[50] private __gap;
}
