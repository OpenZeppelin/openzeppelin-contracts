// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../token/ERC721/extensions/ERC721VotesNF.sol";

contract ERC721VotesNFMock is ERC721VotesNF {
    constructor(string memory name, string memory symbol) ERC721(name, symbol) EIP712(name, "1") {}

    /**
     * @dev Calculate the voting power of each token
     * token weight exected to remain consistent and immutable.
     */
    function powerOfToken(uint256 tokenId) public pure override returns (uint256) {
        if (tokenId <= 1000) return tokenId * 2;
        return tokenId / 2;
    }

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
}
