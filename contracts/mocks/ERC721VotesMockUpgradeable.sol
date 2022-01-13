// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/ERC721/extensions/draft-ERC721VotesUpgradeable.sol";
import "../proxy/utils/Initializable.sol";

contract ERC721VotesMockUpgradeable is Initializable, ERC721VotesUpgradeable {
    function __ERC721VotesMock_init(string memory name, string memory symbol) internal onlyInitializing {
        __Context_init_unchained();
        __ERC165_init_unchained();
        __ERC721_init_unchained(name, symbol);
        __EIP712_init_unchained(name, "1");
        __Votes_init_unchained();
        __ERC721Votes_init_unchained();
        __ERC721VotesMock_init_unchained(name, symbol);
    }

    function __ERC721VotesMock_init_unchained(string memory, string memory) internal onlyInitializing {}

    function getTotalSupply() public view returns (uint256) {
        return _getTotalSupply();
    }

    function mint(address account, uint256 tokenId) public {
        _mint(account, tokenId);
    }

    function burn(uint256 tokenId) public {
        _burn(tokenId);
    }

    function getChainId() external view returns (uint256) {
        return block.chainid;
    }
    uint256[50] private __gap;
}
