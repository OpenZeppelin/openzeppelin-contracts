// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/ERC721/extensions/draft-ERC721Votes.sol";

contract ERC721VotesMock is ERC721Votes {
<<<<<<< HEAD
<<<<<<< HEAD
    constructor(string memory name, string memory symbol) ERC721Votes(name, symbol) {}
=======

    constructor(string memory name, string memory symbol) ERC721Votes(name, symbol) { }
>>>>>>> Adding constructor
=======
    constructor(string memory name, string memory symbol) ERC721Votes(name, symbol) {}
>>>>>>> Adding method to return token voting power

    function mint(address account, uint256 tokenId) public {
        _mint(account, tokenId);
    }

    function burn(uint256 tokenId) public {
        _burn(tokenId);
    }

    function getChainId() external view returns (uint256) {
        return block.chainid;
    }

<<<<<<< HEAD
<<<<<<< HEAD
    function _maxSupply() internal pure override returns (uint224) {
=======
    function _maxSupply() internal pure override returns(uint224){
>>>>>>> Adding constructor
=======
    function _maxSupply() internal pure override returns (uint224) {
>>>>>>> Adding method to return token voting power
        return uint224(5);
    }
}
