// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/ERC721/extensions/ERC721PausableUpgradeable.sol";
import "../proxy/utils/Initializable.sol";

/**
 * @title ERC721PausableMock
 * This mock just provides a public mint, burn and exists functions for testing purposes
 */
contract ERC721PausableMockUpgradeable is Initializable, ERC721PausableUpgradeable {
    function __ERC721PausableMock_init(string memory name, string memory symbol) internal onlyInitializing {
        __ERC721_init_unchained(name, symbol);
        __Pausable_init_unchained();
    }

    function __ERC721PausableMock_init_unchained(string memory, string memory) internal onlyInitializing {}

    function pause() external {
        _pause();
    }

    function unpause() external {
        _unpause();
    }

    function exists(uint256 tokenId) public view returns (bool) {
        return _exists(tokenId);
    }

    function mint(address to, uint256 tokenId) public {
        _mint(to, tokenId);
    }

    function safeMint(address to, uint256 tokenId) public {
        _safeMint(to, tokenId);
    }

    function safeMint(
        address to,
        uint256 tokenId,
        bytes memory _data
    ) public {
        _safeMint(to, tokenId, _data);
    }

    function burn(uint256 tokenId) public {
        _burn(tokenId);
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[50] private __gap;
}
