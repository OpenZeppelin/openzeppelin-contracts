pragma solidity ^0.4.23;

import "./ERC721Token.sol";


contract DefaultTokenURI is ERC721Token {
  string private tokenURI_ = "";

  constructor(string _tokenURI)
    public
  {
    require(bytes(tokenURI_).length > 0);
    tokenURI_ = _tokenURI;
  }

  /**
   * @dev Returns a default URI for every tokenId unless a specific URI is set
   * @param _tokenId uint256 ID of the token to query
   */
  function tokenURI(uint256 _tokenId)
    public
    view
    returns (string)
  {
    if (bytes(tokenURIs[_tokenId]).length != 0) {
      return super.tokenURI(_tokenId);
    }

    return tokenURI_;
  }
}
