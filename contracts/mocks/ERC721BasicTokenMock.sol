pragma solidity ^0.4.24;

import "../token/ERC721/ERC721BasicToken.sol";


/**
 * @title ERC721BasicTokenMock
 * This mock just provides a public mint and burn functions for testing purposes
 */
contract ERC721BasicTokenMock is ERC721BasicToken {
  function mint(address _to, uint256 _tokenId) public {
    require(_to != address(0));
    require(!exists(_tokenId));

    tokenOwner[_tokenId] = _to;
    ownedTokensCount[_to] = ownedTokensCount[_to].add(1);
    emit Transfer(address(0), _to, _tokenId);
  }

  function burn(uint256 _tokenId) public {
    address _owner = ownerOf(_tokenId);
    require(_owner != address(0));

    if (tokenApprovals[_tokenId] != address(0)) {
      tokenApprovals[_tokenId] = address(0);
    }

    tokenOwner[_tokenId] = address(0);
    ownedTokensCount[_owner] = ownedTokensCount[_owner].sub(1);
    emit Transfer(_owner, address(0), _tokenId);
  }
}
