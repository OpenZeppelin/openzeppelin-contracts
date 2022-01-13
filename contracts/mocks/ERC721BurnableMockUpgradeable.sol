// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/ERC721/extensions/ERC721BurnableUpgradeable.sol";
import "../proxy/utils/Initializable.sol";

contract ERC721BurnableMockUpgradeable is Initializable, ERC721BurnableUpgradeable {
    function __ERC721BurnableMock_init(string memory name, string memory symbol) internal onlyInitializing {
        __Context_init_unchained();
        __ERC165_init_unchained();
        __ERC721_init_unchained(name, symbol);
        __ERC721Burnable_init_unchained();
        __ERC721BurnableMock_init_unchained(name, symbol);
    }

    function __ERC721BurnableMock_init_unchained(string memory, string memory) internal onlyInitializing {}

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
    uint256[50] private __gap;
}
