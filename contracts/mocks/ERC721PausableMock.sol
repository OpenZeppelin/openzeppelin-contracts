pragma solidity ^0.5.2;

import "../token/ERC721/ERC721Pausable.sol";
import "./PauserRoleMock.sol";

/**
 * @title ERC721PausableMock
 * This mock just provides a public mint, burn and exists functions for testing purposes
 */
contract ERC721PausableMock is ERC721Pausable, PauserRoleMock {
    constructor() public {
        ERC721.initialize();
        ERC721Pausable.initialize(_msgSender());
    }

    function mint(address to, uint256 tokenId) public {
        super._mint(to, tokenId);
    }

    function burn(uint256 tokenId) public {
        super._burn(tokenId);
    }

    function exists(uint256 tokenId) public view returns (bool) {
        return super._exists(tokenId);
    }
}
