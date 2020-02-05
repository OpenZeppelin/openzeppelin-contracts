pragma solidity ^0.6.0;

import "../token/ERC721/ERC721Burnable.sol";

contract ERC721BurnableMock is ERC721Burnable {
    function mint(address to, uint256 tokenId) public {
        _mint(to, tokenId);
    }
}
