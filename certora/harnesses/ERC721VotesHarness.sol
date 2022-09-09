pragma solidity ^0.8.0;

import "../munged/token/ERC721/extensions/draft-ERC721Votes.sol";

contract ERC721VotesHarness is ERC721Votes {
    constructor(string memory name, string memory symbol) ERC721(name, symbol) EIP712(name, symbol) {}

    function delegateBySig(
        address delegatee,
        uint256 nonce,
        uint256 expiry,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public virtual override {
        assert(true);
    }

    function mint(address account, uint256 tokenID) public {
        _mint(account, tokenID);
    }

    function burn(uint256 tokenID) public {
        _burn(tokenID);
    }
}
