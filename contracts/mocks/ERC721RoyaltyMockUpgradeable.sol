// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/ERC721/extensions/ERC721RoyaltyUpgradeable.sol";
import "../proxy/utils/Initializable.sol";

contract ERC721RoyaltyMockUpgradeable is Initializable, ERC721RoyaltyUpgradeable {
    function __ERC721RoyaltyMock_init(string memory name, string memory symbol) internal onlyInitializing {
        __Context_init_unchained();
        __ERC165_init_unchained();
        __ERC2981_init_unchained();
        __ERC721_init_unchained(name, symbol);
        __ERC721Royalty_init_unchained();
        __ERC721RoyaltyMock_init_unchained(name, symbol);
    }

    function __ERC721RoyaltyMock_init_unchained(string memory, string memory) internal onlyInitializing {}

    function setTokenRoyalty(
        uint256 tokenId,
        address recipient,
        uint96 fraction
    ) public {
        _setTokenRoyalty(tokenId, recipient, fraction);
    }

    function setDefaultRoyalty(address recipient, uint96 fraction) public {
        _setDefaultRoyalty(recipient, fraction);
    }

    function mint(address to, uint256 tokenId) public {
        _mint(to, tokenId);
    }

    function burn(uint256 tokenId) public {
        _burn(tokenId);
    }

    function deleteDefaultRoyalty() public {
        _deleteDefaultRoyalty();
    }
    uint256[50] private __gap;
}
