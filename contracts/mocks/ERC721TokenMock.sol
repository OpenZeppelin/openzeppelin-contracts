pragma solidity ^0.4.24;

import "../token/ERC721/ERC721Token.sol";


/**
 * @title ERC721TokenMock
 * This mock just provides a public mint and burn functions for testing purposes,
 * and a public setter for metadata URI
 */
contract ERC721TokenMock is ERC721Token {
  constructor(string name, string symbol) public
    ERC721Token(name, symbol)
  { }

  function mint(address _to, uint256 _tokenId) public {
    require(_to != address(0));
    require(!exists(_tokenId));

    tokenOwner[_tokenId] = _to;
    ownedTokensCount[_to] = ownedTokensCount[_to].add(1);

    ownedTokensIndex[_tokenId] = ownedTokens[_to].length;
    ownedTokens[_to].push(_tokenId);

    allTokensIndex[_tokenId] = allTokens.length;
    allTokens.push(_tokenId);

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

    uint256 removeOwnedTokenIndex = ownedTokensIndex[_tokenId];
    uint256 lastOwnedTokenIndex = ownedTokens[_owner].length.sub(1);
    uint256 lastOwnedToken = ownedTokens[_owner][lastOwnedTokenIndex];

    ownedTokens[_owner][removeOwnedTokenIndex] = lastOwnedToken;
    ownedTokens[_owner].length--;
    ownedTokensIndex[_tokenId] = 0;
    ownedTokensIndex[lastOwnedToken] = removeOwnedTokenIndex;

    if (bytes(tokenURIs[_tokenId]).length != 0) {
      delete tokenURIs[_tokenId];
    }

    uint256 removeAllTokenIndex = allTokensIndex[_tokenId];
    uint256 lastAllTokenIndex = allTokens.length.sub(1);
    uint256 lastAllToken = allTokens[lastAllTokenIndex];

    allTokens[removeAllTokenIndex] = lastAllToken;
    allTokens.length--;
    allTokensIndex[_tokenId] = 0;
    allTokensIndex[lastAllToken] = removeAllTokenIndex;

    emit Transfer(_owner, address(0), _tokenId);
  }

  function setTokenURI(uint256 _tokenId, string _uri) public {
    super._setTokenURI(_tokenId, _uri);
  }
}
