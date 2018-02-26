pragma solidity ^0.4.18;

import "./ERC721Token.sol";
import "./ERC721Metadata.sol";


/**
 * @title Full ERC721 Token with metadata
 * This implementation includes all the functionality of the ERC721 standard besides metadata functionality
 * @dev see https://github.com/ethereum/eips/issues/721 and https://github.com/ethereum/EIPs/pull/841
 */
contract ERC721TokenMetadata is ERC721Metadata, ERC721Token {
  // Tokens metadata
  mapping (uint256 => string) private _metadata;

  /**
  * @dev Constructor function
  */
  function ERC721TokenMetadata(string name, string symbol) ERC721Token(name, symbol) public {}

  /**
  * @dev Gets the metadata of the given token ID
  * @param _tokenId uint256 ID of the token to query the metadata of
  * @return string representing the metadata of the given token ID
  */
  function tokenMetadata(uint256 _tokenId) public view returns (string) {
    return _metadata[_tokenId];
  }

  /**
  * @dev Sets the metadata of the given token ID
  * @param _tokenId uint256 ID of the token to set the metadata of
  * @param _newMetadata string representing the new metadata to be set
  */
  function setTokenMetadata(uint256 _tokenId, string _newMetadata) public onlyOwnerOf(_tokenId) {
    _metadata[_tokenId] = _newMetadata;
    MetadataUpdated(msg.sender, _tokenId, _newMetadata);
  }
}
